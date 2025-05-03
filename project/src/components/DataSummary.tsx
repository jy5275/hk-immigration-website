import React, { useMemo } from 'react';
import { ImmigrationData } from '../types';
import { BarChart2, Users } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ControlPointId, decodeControlPoint } from '../types/consts';
import { useTranslation } from 'react-i18next';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DataSummaryProps {
  data: ImmigrationData[];
  selectedCategories: number[];
}

const DataSummary: React.FC<DataSummaryProps> = ({ data, selectedCategories }) => {
  const { t } = useTranslation();
  const summary = useMemo(() => {
    if (data.length === 0) {
      return {
        totalTravelers: 0,
        totalFlow: 0,
        topControlPoint: 'N/A',
        topControlPointCount: 0,
        hkResidentsCount: 0,
        mainlandVisitorsCount: 0,
        otherVisitorsCount: 0,
      };
    }

    let totalTravelers = 0;
    let totalHkResidents = 0;
    let totalMainlandVisitors = 0;
    let totalOtherVisitors = 0;
    if (selectedCategories.includes(0)) {
      totalHkResidents = data.reduce((sum, item) => sum + item.hk_residents, 0);
      totalTravelers += totalHkResidents;
    }
    if (selectedCategories.includes(1)) {
      totalMainlandVisitors = data.reduce((sum, item) => sum + item.mainland_visitors, 0);
      totalTravelers += totalMainlandVisitors;
    }
    if (selectedCategories.includes(2)) {
      totalOtherVisitors = data.reduce((sum, item) => sum + item.other_visitors, 0);
      totalTravelers += totalOtherVisitors;
    }
    const controlPointID2Counts = data.reduce((acc, item) => {
      acc[item.control_point_id] = (acc[item.control_point_id] || 0) + item.total;
      return acc;
    }, {} as Record<ControlPointId, number>);

    const topControlPointID2Count = Object.entries(controlPointID2Counts).sort((a, b) => b[1] - a[1])[0] || ['-1', 0];
    
    return {
      totalTravelers,
      totalFlow: totalTravelers,
      topControlPoint: decodeControlPoint(parseInt(topControlPointID2Count[0], 10)),
      topControlPointCount: topControlPointID2Count[1],
      hkResidentsCount: totalHkResidents,
      mainlandVisitorsCount: totalMainlandVisitors,
      otherVisitorsCount: totalOtherVisitors,
    };
  }, [data]);

  const pieChartData = {
    labels: [t('hkResidents'), t('mainlandVisitors'), t('otherVisitors')],
    datasets: [
      {
        data: [
          summary.hkResidentsCount,
          summary.mainlandVisitorsCount,
          summary.otherVisitorsCount,
        ],
        backgroundColor: [
          'rgb(53, 162, 235)',
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
        ],
        borderColor: [
          'rgba(53, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 14,
          },
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${new Intl.NumberFormat('en-US').format(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (data.length === 0) {
    return null;
  }

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('en-US').format(number);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800 mb-4">{t('dataSummary')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">{t('totalPassengers')}</p>
              <p className="text-xl font-semibold text-blue-900">{formatNumber(summary.totalTravelers)}</p>
            </div>
          </div>
        </div>
                
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-full">
              <BarChart2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-emerald-700 font-medium">{t('topControlPoint')}</p>
              <p className="text-l leading-tight font-semibold text-emerald-900" title={summary.topControlPoint}>
                {t(`controlPointNames.${summary.topControlPoint}`)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">{t('passengerCategories')}</h3>
        <div className="h-[calc(100%-2rem)]">
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default DataSummary;