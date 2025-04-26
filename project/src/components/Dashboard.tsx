import React, { useState, useEffect } from 'react';
import LineChart from './LineChart';
import Filters from './Filters';
import DateRangeSelector from './DateRangeSelector';
import { fetchImmigrationData } from '../services/databaseService';
import { ImmigrationData, FilterOptions } from '../types';
import DataSummary from './DataSummary';
import Map from './Map';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ImmigrationData[]>([]);
  const [filteredData, setFilteredData] = useState<ImmigrationData[]>([]);
  
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 6);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    direction: 'Arrival',
    controlPoints: [],
    mode: "Separated",
    travelerCategories: ['hk_residents', 'mainland_visitors', 'other_visitors'],
    dateRange: {
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
        
        const uniqueControlPoints = ["Lo Wu","Lok Ma Chau Spur Line","Airport","Shenzhen Bay","Hong Kong-Zhuhai-Macao Bridge","Express Rail Link West Kowloon","Heung Yuen Wai",
          "Lok Ma Chau","Macau Ferry Terminal","Man Kam To","China Ferry Terminal","Kai Tak Cruise Terminal","Harbour Control","Sha Tau Kok","Hung Hom","Tuen Mun Ferry Terminal"];
        
        setFilterOptions(prev => ({
          ...prev,
          controlPoints: uniqueControlPoints.slice(0, 1)
        }));
        
        setFilteredData(applyFilters(immigrationData, {
          ...filterOptions,
          controlPoints: uniqueControlPoints.slice(0, 1)
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
      const dateInRange = new Date(item.date) >= filters.dateRange.startDate &&
                          new Date(item.date) <= filters.dateRange.endDate;
      
      const directionMatch = filters.direction === item.direction;
      const controlPointMatch = filters.controlPoints.includes(item.control_point);
      
      return dateInRange && directionMatch && controlPointMatch;
    });
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filterOptions, ...newFilters };
    setFilterOptions(updatedFilters);
    setFilteredData(applyFilters(data, updatedFilters));
  };

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">          
          <DateRangeSelector 
            dateRange={filterOptions.dateRange}
            onDateRangeChange={(dateRange) => handleFilterChange({ dateRange })}
          />
          
          <div className="mt-6 flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4">
              <Filters 
                filterOptions={filterOptions}
                allControlPoints={Array.from(new Set(data.map(item => item.control_point)))}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            <div className="md:w-3/4">
              <div className="h-[600px] w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <LineChart 
                    data={filteredData} 
                    selectedCategories={filterOptions.travelerCategories}
                    separateControlPoints={filterOptions.mode === 'Separated' ? true : false}
                    separateDirections={true}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Map selectedPoints={filterOptions.controlPoints} />
          <DataSummary data={filteredData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;