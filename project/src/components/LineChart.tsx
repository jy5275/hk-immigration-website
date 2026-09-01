import { useEffect, useState } from 'react';
import type { ChartData, ChartDataset, ChartOptions, TooltipItem } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { ImmigrationData } from '../types';
import { allCategories, allControlPoints, ControlPointId, DirectionId, GroupMetricId } from '../types/consts';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: ImmigrationData[];
  groupMetric: GroupMetricId;
  selectedDirIDs: DirectionId[];
  selectedCatIDs: number[];
  selectedCpIDs: ControlPointId[];
  use7DaysAvg: boolean;
}

const lineColors = [
  '#17beff', // 青
  '#ff7f0e', // 橙
  '#2ca02c', // 绿
  '#d62728', // 红
  '#9467bd', // 紫
  '#8c564b', // 棕
  '#e377c2', // 粉
  '#7f7f7f', // 灰
  '#bcbd22', // 黄绿
  '#1f77b4', // 蓝
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173' // 其他备用
];

function makeLine(label: string, data: number[], color: string): ChartDataset<'line'> {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    tension: 0.3,
    pointRadius: 1,
    pointHoverRadius: 5,
    borderWidth: 2,
  };
}

function movingAverage(data: number[], windowSize: number = 7): number[] {
  const result: number[] = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(data.length - 1, i + half);
    const window = data.slice(start, end + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(Math.round(avg));
  }
  return result;
}

interface BuiltChart {
  dates: string[];
  datasets: ChartDataset<'line'>[];
}

// Group the raw rows into one dataset (or several) depending on the grouping
// metric. Uses only the selected categories when summing passenger counts.
function buildChart(
  data: ImmigrationData[],
  groupMetric: GroupMetricId,
  selectedDirIDs: DirectionId[],
  selectedCatIDs: number[],
  selectedCpIDs: ControlPointId[],
  t: (key: string) => string
): BuiltChart {
  const dates = Array.from(new Set(data.map((item) => item.date))).sort();
  const selectedCatSet = new Set(selectedCatIDs);
  const sumSelectedCategories = (item: ImmigrationData): number =>
    (selectedCatSet.has(0) ? item.hk_residents : 0) +
    (selectedCatSet.has(1) ? item.mainland_visitors : 0) +
    (selectedCatSet.has(2) ? item.other_visitors : 0);

  const datasets: ChartDataset<'line'>[] = [];

  if (groupMetric === 0) {
    const totals = new Map<string, number>();
    for (const item of data) {
      totals.set(item.date, (totals.get(item.date) ?? 0) + sumSelectedCategories(item));
    }
    datasets.push(makeLine(t('all'), dates.map((d) => totals.get(d) ?? 0), lineColors[0]));
  } else if (groupMetric === 1) {
    const byDir = new Map<string, [number, number]>();
    for (const item of data) {
      const entry = byDir.get(item.date) ?? [0, 0];
      entry[item.direction_id] += sumSelectedCategories(item);
      byDir.set(item.date, entry);
    }
    if (selectedDirIDs.includes(0)) {
      datasets.push(makeLine(t('arrival'), dates.map((d) => (byDir.get(d) ?? [0, 0])[0]), lineColors[0]));
    }
    if (selectedDirIDs.includes(1)) {
      datasets.push(makeLine(t('departure'), dates.map((d) => (byDir.get(d) ?? [0, 0])[1]), lineColors[1]));
    }
  } else if (groupMetric === 2) {
    const byCat = new Map<string, [number, number, number]>();
    for (const item of data) {
      const entry = byCat.get(item.date) ?? [0, 0, 0];
      if (selectedCatSet.has(0)) entry[0] += item.hk_residents;
      if (selectedCatSet.has(1)) entry[1] += item.mainland_visitors;
      if (selectedCatSet.has(2)) entry[2] += item.other_visitors;
      byCat.set(item.date, entry);
    }
    allCategories.forEach((cat, idx) => {
      if (selectedCatSet.has(idx)) {
        datasets.push(makeLine(t(cat), dates.map((d) => (byCat.get(d) ?? [0, 0, 0])[idx]), lineColors[idx]));
      }
    });
  } else {
    const byCp = new Map<string, Map<ControlPointId, number>>();
    for (const item of data) {
      const byDate = byCp.get(item.date) ?? new Map<ControlPointId, number>();
      byDate.set(item.control_point_id, (byDate.get(item.control_point_id) ?? 0) + sumSelectedCategories(item));
      byCp.set(item.date, byDate);
    }
    const selectedCpSet = new Set(selectedCpIDs);
    allControlPoints.forEach((cp, idx) => {
      if (selectedCpSet.has(idx)) {
        datasets.push(makeLine(t(`controlPointNames.${cp}`), dates.map((d) => byCp.get(d)?.get(idx) ?? 0), lineColors[idx % lineColors.length]));
      }
    });
  }

  return { dates, datasets };
}

const LineChart = ({
  data,
  groupMetric,
  selectedDirIDs,
  selectedCpIDs,
  selectedCatIDs,
  use7DaysAvg,
}: LineChartProps) => {
  const [chartData, setChartData] = useState<ChartData<'line'>>({ labels: [], datasets: [] });
  const { t } = useTranslation();

  useEffect(() => {
    if (data.length === 0) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const { dates, datasets } = buildChart(data, groupMetric, selectedDirIDs, selectedCatIDs, selectedCpIDs, t);
    const finalDatasets = use7DaysAvg
      ? datasets.map((ds) => ({ ...ds, data: movingAverage(ds.data as number[]) }))
      : datasets;

    setChartData({ labels: dates, datasets: finalDatasets });
  }, [data, groupMetric, selectedDirIDs, selectedCatIDs, selectedCpIDs, use7DaysAvg, t]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'PP',
          displayFormats: {
            day: 'M.d',
            week: 'M.d',
            month: 'yyyy.M',
          },
        },
        title: {
          display: true,
          text: t('date'),
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('numberOfPassengers'),
        },
        ticks: {
          callback(value) {
            const num = typeof value === 'number' ? value : Number(value);
            if (num >= 1000000) {
              return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
              return (num / 1000).toFixed(0) + 'K';
            }
            return String(num);
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => {
            const first = items[0];
            if (!first) return '';
            return new Date(first.parsed.x).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: (context: TooltipItem<'line'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${new Intl.NumberFormat('en-US').format(value)}`;
          },
        },
      },
      legend: {
        position: 'top',
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data available for the selected filters
      </div>
    );
  }

  return <Line options={options} data={chartData} />;
};

export default LineChart;