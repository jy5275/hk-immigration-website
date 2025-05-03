import React, { useState, useEffect } from 'react';
import LineChart from './LineChart';
import Filters from './Filters';
import DateRangeSelector from './DateRangeSelector';
import { fetchImmigrationData } from '../services/databaseService';
import { ImmigrationData, FilterOptions } from '../types';
import DataSummary from './DataSummary';
import Map from './Map';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ImmigrationData[]>([]);
  const [filteredData, setFilteredData] = useState<ImmigrationData[]>([]);
  
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 6);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    direction_ids: [0, 1],
    control_point_ids: [],
    group_by: 0,
    passenger_category_ids: [0, 1, 2],
    date_range: {
      startDate: defaultStartDate,
      endDate: defaultEndDate
    }
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const immigrationData = await fetchImmigrationData();
        setData(immigrationData);

        setFilterOptions(prev => ({
          ...prev,
          control_point_ids: [0],
          passenger_category_ids: [0, 1, 2],
          direction_ids: [0]
        }));
        
        setFilteredData(applyFilters(immigrationData, {
          ...filterOptions,
          control_point_ids: [0],
          passenger_category_ids: [0, 1, 2],
          direction_ids: [0]
        }));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const applyFilters = (data: ImmigrationData[], filters: FilterOptions): ImmigrationData[] => {
    return data.filter(item => {
      const dateInRange = new Date(item.date) >= filters.date_range.startDate &&
                          new Date(item.date) <= filters.date_range.endDate;
      const directionMatch = filters.direction_ids.includes(item.direction_id);
      const controlPointMatch = filters.control_point_ids.includes(item.control_point_id);
      return dateInRange && directionMatch && controlPointMatch;
    });
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filterOptions, ...newFilters };
    setFilterOptions(updatedFilters);
    setFilteredData(applyFilters(data, updatedFilters));
  };

  const { i18n } = useTranslation();

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">          
          <DateRangeSelector 
            dateRange={filterOptions.date_range}
            onDateRangeChange={(dateRange) => handleFilterChange({ date_range: dateRange })}
          />
          
          <div className="mt-6 flex flex-col md:flex-row gap-6">
            <div className="md:w-auto min-w-[260px] max-w-sm">
              <Filters 
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            <div className="md:flex-1">
              <div className="h-[715px] w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <LineChart 
                    key={i18n.language}
                    data={filteredData}
                    groupMetric={filterOptions.group_by}
                    selectedDirs={filterOptions.direction_ids}
                    selectedControlPoints={filterOptions.control_point_ids}
                    selectedCategories={filterOptions.passenger_category_ids}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Map selectedPoints={filterOptions.control_point_ids} />
          <DataSummary data={filteredData} selectedCategories={filterOptions.passenger_category_ids} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;