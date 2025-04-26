import React, { useEffect, useState, useTransition } from 'react';
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
import { aggregateDataByDirection } from '../utils/dataUtils';
import { decodeControlPoint } from '../types/consts';
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
  selectedCategories: string[];
  separateDirections: boolean;
  separateControlPoints: boolean;
}

const categoryColors: Record<string, string> = {
  hk_residents: 'rgb(53, 162, 235)',
  mainland_visitors: 'rgb(255, 99, 132)',
  other_visitors: 'rgb(75, 192, 192)',
  total: 'rgb(153, 102, 255)',
};

const categoryLabels: Record<string, string> = {
  hk_residents: 'Hong Kong Residents',
  mainland_visitors: 'Mainland Visitors',
  other_visitors: 'Other Visitors',
  total: 'Total',
};

const LineChart: React.FC<LineChartProps> = ({ data, selectedCategories, separateDirections=true, separateControlPoints }) => {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [] as any[],
  });
  const { t } = useTranslation();

  useEffect(() => {
    if (data.length === 0) {
      setChartData({
        labels: [],
        datasets: [],
      });
      return;
    }

    const { arrivalData, departureData, dates } = aggregateDataByDirection(data);
    const datasets: any[] = [];

    // If control points are selected, show total for each control point
    const showControlPointTotals = true; // selectedCategories.length === 0; // TODO: Implement logic to determine if control points should be shown

    if (showControlPointTotals) {
      const controlPointIDs = Array.from(new Set(data.map(item => item.control_point_id)));
      if (!separateControlPoints) {
        // Get sum of all control points
        let date2sum = new Map<string, number>();
        controlPointIDs.forEach((controlPointID, index) => {
          const controlPointData = data.filter(item => item.control_point_id === controlPointID);
          const { arrivalData: cpArrival, departureData: cpDeparture } = aggregateDataByDirection(controlPointData);
          const directionID = data[0]?.direction_id;
          dates.forEach(date => {
            const count = directionID === 0 
              ? (cpArrival[date] === undefined ? 0 : cpArrival[date].total || 0) 
              : (cpDeparture[date] === undefined ? 0 : cpDeparture[date].total || 0);
            let prev = date2sum.get(date) || 0;
            date2sum.set(date, prev + count);
          });
        });
        datasets.push({
          label: t('all'),
          data: dates.map(date => { return date2sum.get(date); }),
          borderColor: Object.values(categoryColors)[0],
          backgroundColor: `${Object.values(categoryColors)[0]}33`,
          tension: 0.3,
          pointRadius: 1,
          pointHoverRadius: 5,
          borderWidth: 2,
        });
      } else {
        controlPointIDs.forEach((controlPointID, index) => {
          const controlPointData = data.filter(item => item.control_point_id === controlPointID);
          const { arrivalData: cpArrival, departureData: cpDeparture } = aggregateDataByDirection(controlPointData);
          datasets.push({
            label: t(`controlPointNames.${decodeControlPoint(controlPointID)}`),
            data: dates.map(date => {
              const directionID = data[0]?.direction_id;
              return directionID === 0 
                ? cpArrival[date]?.total || 0 : cpDeparture[date]?.total || 0;
            }),
            borderColor: Object.values(categoryColors)[index % Object.keys(categoryColors).length],
            backgroundColor: `${Object.values(categoryColors)[index % Object.keys(categoryColors).length]}33`,
            tension: 0.3,
            pointRadius: 1,
            pointHoverRadius: 5,
            borderWidth: 2,
          });
        });
      }
    }
    //  else {
    //   // Show selected traveler categories
    //   selectedCategories.forEach(category => {
    //     datasets.push({
    //       label: categoryLabels[category],
    //       data: dates.map(date => {
    //         const directionID = data[0]?.direction_id;
    //         return directionID === 0 
    //           ? arrivalData[date]?.[category] || 0 
    //           : departureData[date]?.[category] || 0;
    //       }),
    //       borderColor: categoryColors[category],
    //       backgroundColor: `${categoryColors[category]}33`,
    //       tension: 0.3,
    //       pointRadius: 1,
    //       pointHoverRadius: 5,
    //       borderWidth: 2,
    //     });
    //   });
    // }

    setChartData({
      labels: dates,
      datasets,
    });
  }, [data, selectedCategories]);

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