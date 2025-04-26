import React from 'react';
import { useTranslation } from 'react-i18next';
import { DateRange } from '../types';
import { formatISO } from 'date-fns';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  dateRange, 
  onDateRangeChange 
}) => {
  const { t } = useTranslation();
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value ? new Date(e.target.value) : new Date('2020-01-24');
    onDateRangeChange({
      startDate: newStartDate,
      endDate: dateRange.endDate
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value ? new Date(e.target.value) : new Date();
    onDateRangeChange({
      startDate: dateRange.startDate,
      endDate: newEndDate
    });
  };

  // Pre-defined date range options
  const dateRangeOptions = [
    { label: t('dateRange.last30Days'), value: '30d' },
    { label: t('dateRange.last60Days'), value: '60d' },
    { label: t('dateRange.last90Days'), value: '90d' },
    { label: t('dateRange.last6Months'), value: '6m' },
    { label: t('dateRange.lastYear'), value: '1y' },
    // { label: t('dateRange.yearToDate'), value: 'ytd' },
    { label: '2020', value: '2020' },
    { label: '2021', value: '2021' },
    { label: '2022', value: '2022' },
    { label: '2023', value: '2023' },
    { label: '2024', value: '2024' },
    { label: t('dateRange.allTime'), value: 'all' },
  ];

  const handleQuickRangeSelect = (range: string) => {
    let endDate = new Date();
    let startDate: Date;
    
    switch (range) {
      case '30d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '60d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 60);
        break;
      case '90d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '6m':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'ytd':
        startDate = new Date();
        startDate = new Date(startDate.getFullYear(), 0, 1);
        break;
      case '2020':
        startDate = new Date("2020-01-24");
        endDate = new Date("2020-12-31");
        break;
      case '2021':
        startDate = new Date("2021-01-01");
        endDate = new Date("2021-12-31");
        break;
      case '2022':
        startDate = new Date("2022-01-01");
        endDate = new Date("2022-12-31");
        break;
      case '2023':
        startDate = new Date("2023-01-01");
        endDate = new Date("2023-12-31");
        break;
      case '2024':
        startDate = new Date("2024-01-01");
        endDate = new Date("2024-12-31");
        break;
      case 'all':
        startDate = new Date('2020-01-24');
        break;
      case '1y':
      default:
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    onDateRangeChange({ startDate, endDate });
  };

  // Format dates for input fields
  const formatDate = (date: Date): string => {
    return formatISO(date, { representation: 'date' });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="start-date" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t('dateRange.from')}:
        </label>
        <input id="start-date" type="date"
          value={formatDate(dateRange.startDate)}
          min="2020-01-24"
          max={formatDate(dateRange.endDate)}
          onChange={handleStartDateChange}
          className="rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition focus:outline-none sm:text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="end-date" className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {t('dateRange.to')}:
        </label>
        <input id="end-date" type="date"
          value={formatDate(dateRange.endDate)}
          min={formatDate(dateRange.startDate)}
          max={formatDate(new Date())}
          onChange={handleEndDateChange}
          className="rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition focus:outline-none sm:text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {dateRangeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => handleQuickRangeSelect(option.value)}
            className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md transform transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangeSelector;