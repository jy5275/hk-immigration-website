import React, { useEffect, useState } from 'react';
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
import { allCategories, allControlPoints, ControlPointId, DirectionId, encodeCategory, GroupMetricId } from '../types/consts';
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

function movingAverage(data: number[], windowSize: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(Math.round(avg)); // 可选：四舍五入为整数
  }
  return result;
}

const LineChart: React.FC<LineChartProps> = (
  {
    data,
    groupMetric,
    selectedDirIDs,
    selectedCpIDs,
    selectedCatIDs,
    use7DaysAvg,
  }) => {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [] as any[],
  });
  const { t } = useTranslation();

  useEffect(() => {
    if (data.length === 0) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const datasets: any[] = [];
    const dateSet = new Set<string>();
    data.forEach(item => dateSet.add(item.date))
    const dates = Array.from(dateSet).sort();
    const selectedCatIDsSet = new Set(selectedCatIDs);
    const getFilteredCategoryTotal = (item: ImmigrationData) => {
      let total = item.total;
      if (!selectedCatIDsSet.has(0)) total -= item.hk_residents;
      if (!selectedCatIDsSet.has(1)) total -= item.mainland_visitors;
      if (!selectedCatIDsSet.has(2)) total -= item.other_visitors;
      return total
    };

    switch (groupMetric) {
      case 0:
        let date2sum = new Map<string, number>();
        data.forEach(item => {
          const prev = date2sum.get(item.date) || 0;
          date2sum.set(item.date, prev + getFilteredCategoryTotal(item));
        });
        datasets.push({
          label: t('all'),
          data: dates.map(date => { return date2sum.get(date); }),
          borderColor: lineColors[0],
          backgroundColor: lineColors[0],        
          tension: 0.3, pointRadius: 1, pointHoverRadius: 5, borderWidth: 2,});
        break;

      case 1: // group by directions. It's possible that `data` contains both arrival and departure items
        let dateDir2Sum = new Map<string, [number, number]>();
        const defaultCouple: [number, number] = [0, 0];

        data.forEach(item => {
          if (!dateDir2Sum.has(item.date)) {
            dateDir2Sum.set(item.date, [0, 0]);
          }
          let prev = dateDir2Sum.get(item.date)!;
          prev[item.direction_id] = prev[item.direction_id] + getFilteredCategoryTotal(item);
        });
        if (selectedDirIDs.includes(0)) {
          datasets.push({
            label: t('arrival'),
            data: dates.map(date => (dateDir2Sum.get(date) ?? defaultCouple)[0]),
            borderColor: lineColors[0],
            backgroundColor: lineColors[0],
            tension: 0.3, pointRadius: 1, pointHoverRadius: 5, borderWidth: 2});
        }
        if (selectedDirIDs.includes(1)) {
          datasets.push({
            label: t('departure'),
            data: dates.map(date => (dateDir2Sum.get(date) ?? defaultCouple)[1]),
            borderColor: lineColors[1],
            backgroundColor: lineColors[1],
            tension: 0.3, pointRadius: 1, pointHoverRadius: 5, borderWidth: 2});
        }
        break;

      case 2: // group by categories
        let dateCat2Sum = new Map<string, [number, number, number]>();
        const defaultTriplet: [number, number, number] = [0, 0, 0];

        data.forEach(item => {
          if (!dateCat2Sum.has(item.date)) {
            dateCat2Sum.set(item.date, [0, 0, 0]);
          }
          const prev = dateCat2Sum.get(item.date)!;
          if (selectedCatIDsSet.has(0)) prev[0] += item.hk_residents;
          if (selectedCatIDsSet.has(1)) prev[1] += item.mainland_visitors;
          if (selectedCatIDsSet.has(2)) prev[2] += item.other_visitors;
        });

        allCategories.forEach(cat => {
          const idx = encodeCategory(cat);
          if (selectedCatIDsSet.has(idx)) {
            datasets.push({
              label: t(cat),
              data: dates.map(date => (dateCat2Sum.get(date) ?? defaultTriplet)[idx]),
              borderColor: lineColors[idx],
              backgroundColor: lineColors[idx],
              tension: 0.3, pointRadius: 1, pointHoverRadius: 5, borderWidth: 2
            });
          }
        });
        break;

      case 3: // group by control_points
        let dateCp2Sum = new Map<string, Map<ControlPointId, number>>();
        data.forEach(item => {
          if (!dateCp2Sum.has(item.date)) {
            dateCp2Sum.set(item.date, new Map<ControlPointId, number>());
          }
          const prevDate: Map<ControlPointId, number> = dateCp2Sum.get(item.date)!;
          prevDate.set(item.control_point_id, (prevDate.get(item.control_point_id) ?? 0) + getFilteredCategoryTotal(item));
        });
        const selectedCpSet = new Set(selectedCpIDs);        
        allControlPoints.forEach(item => {
          const idx = allControlPoints.indexOf(item);
          if (selectedCpSet.has(idx)) {
            datasets.push({
              label: t(`controlPointNames.${item}`),
              data: dates.map(date => dateCp2Sum.get(date)?.get(idx) ?? 0),
              borderColor: lineColors[idx % lineColors.length],
              backgroundColor: lineColors[idx % lineColors.length],
              tension: 0.3, pointRadius: 1, pointHoverRadius: 5, borderWidth: 2,});
          }
        })
    }
    if (use7DaysAvg) {
      datasets.forEach(item => {
        item.data = movingAverage(item.data)
      });
    }

    setChartData({ labels: dates, datasets });
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
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
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const date = new Date(context[0].label);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US').format(context.parsed.y);
            }
            return label;
          },
        },
      },
      legend: {
        position: 'top' as const,
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