import { useState, useEffect } from 'react';
import LineChart from './LineChart';
import Filters from './Filters';
import DateRangeSelector from './DateRangeSelector';
import { fetchImmigrationData } from '../services/databaseService';
import { ImmigrationData, FilterOptions, CanUseAvgMode } from '../types';
import DataSummary from './DataSummary';
import Map from './Map';
import { useTranslation } from 'react-i18next';
import { allCategories, allControlPoints, ControlPointId, DirectionId, GroupMetricId } from '../types/consts';
import { formatISO } from 'date-fns';

function toDateKey(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

function createDefaultFilterOptions(): FilterOptions {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 6);

  return {
    direction_ids: [0, 1] as DirectionId[],
    control_point_ids: Array.from(allControlPoints.slice(0, -3), (_, i) => i) as ControlPointId[],
    group_by: 2 as GroupMetricId,
    category_ids: Array.from(allCategories, (_, i) => i),
    date_range: { startDate, endDate },
    use7DaysAvg: false,
  };
}

// "YYYY-MM-DD" strings compare correctly lexicographically, avoiding the
// timezone pitfalls of `new Date("YYYY-MM-DD")`.
function applyFilters(data: ImmigrationData[], filters: FilterOptions): ImmigrationData[] {
  const start = toDateKey(filters.date_range.startDate);
  const end = toDateKey(filters.date_range.endDate);
  return data.filter(
    (item) =>
      item.date >= start &&
      item.date <= end &&
      filters.direction_ids.includes(item.direction_id) &&
      filters.control_point_ids.includes(item.control_point_id)
  );
}

const defaultFilterOptions = createDefaultFilterOptions();

const Dashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ImmigrationData[]>([]);
  const [filteredData, setFilteredData] = useState<ImmigrationData[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const immigrationData = await fetchImmigrationData();
        setData(immigrationData);
        setFilterOptions(defaultFilterOptions);
        setFilteredData(applyFilters(immigrationData, defaultFilterOptions));
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    if (newFilters.date_range?.startDate && newFilters.date_range?.endDate) {
      if (!CanUseAvgMode(newFilters.date_range)) {
        newFilters.use7DaysAvg = false;
      }
    }

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

          <div className="mt-6 flex flex-col md:flex-row gap-6 items-stretch">
            <div className="md:w-auto min-w-[260px] max-w-sm">
              <Filters
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="md:flex-1 flex">
              <div className="w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <LineChart
                    key={i18n.language}
                    data={filteredData}
                    groupMetric={filterOptions.group_by}
                    selectedDirIDs={filterOptions.direction_ids}
                    selectedCpIDs={filterOptions.control_point_ids}
                    selectedCatIDs={filterOptions.category_ids}
                    use7DaysAvg={filterOptions.use7DaysAvg}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Map selectedPoints={filterOptions.control_point_ids} />
          <DataSummary data={filteredData} selectedCategories={filterOptions.category_ids} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;