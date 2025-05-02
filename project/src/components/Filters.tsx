import React from 'react';
import { FilterOptions } from '../types';
import { allControlPoints, DirectionId, encodeCategory, encodeControlPoint, encodeDirection, GroupMetricId } from '../types/consts';
import { useTranslation } from 'react-i18next';

const styles = {
  hoverEffect: "transform transition-transform duration-200 hover:scale-105 active:scale-95 hover:shadow-md",
  checkBoxBasic: "rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-50",
  filterTitleText: "font-semibold font-medium text-gray-700",
  textSelected: "text-blue-600 font-semibold",
  textUnselected: "text-gray-700",
  radioSelected: "h-4 w-4 rounded-full border-2 border-blue-600",
  radioUnselected: "h-4 w-4 rounded-full border-2 border-gray-400",
  primaryButton: "bg-blue-600 text-white px-4 py-2 rounded-md",
  secondaryButton: "bg-gray-200 text-gray-700 px-4 py-2 rounded-md",
};

interface FiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
}

const Filters: React.FC<FiltersProps> = ({ 
  filterOptions, 
  onFilterChange 
}) => {
  const { t } = useTranslation();
  const handleDirectionChange = (directionID: DirectionId) => {
    const newDirectionIDs = filterOptions.direction_ids.includes(directionID)
    ? filterOptions.direction_ids.filter(cp => cp !== directionID)
    : [...filterOptions.direction_ids, directionID];
    onFilterChange({ direction_ids: newDirectionIDs });
  };

  const handleGroupMetricChange = (groupBy: GroupMetricId) => {
    onFilterChange({ group_by: groupBy });
  };

  const handleControlPointChange = (controlPointID: number) => {
    const newControlPointIDs = filterOptions.control_point_ids.includes(controlPointID)
      ? filterOptions.control_point_ids.filter(cp => cp !== controlPointID)
      : [...filterOptions.control_point_ids, controlPointID];
    onFilterChange({ 
      control_point_ids: newControlPointIDs,
    });
  };

  const handleSelectAllControlPoints = () => {
    // If all points are already selected, deselect all
    const allSelected = allControlPoints.length === filterOptions.control_point_ids.length;
    onFilterChange({ 
      control_point_ids: allSelected ? [] : Array.from({ length: allControlPoints.length }, (_, i) => i),
    });
  };

  const handleTravelerCategoryChange = (categoryIDs: number) => {
    const newCategories = filterOptions.passenger_category_ids.includes(categoryIDs)
      ? filterOptions.passenger_category_ids.filter(c => c !== categoryIDs)
      : [...filterOptions.passenger_category_ids, categoryIDs];
    onFilterChange({ passenger_category_ids: newCategories });
  };

  return (
    <div className="space-y-4">
      <h3 className={`${styles.filterTitleText}`}>{t('mode')}</h3>
      <div className="grid grid-cols-2 gap-x-6">
        {[{id:0,label:"all"}, {id:1,label:"byDir"}, {id:2,label:"byCat"}, {id:3,label:"byCp"}].map(metric => {
          const isSelected = filterOptions.group_by === metric.id;
          return(
            <label key={metric.id} className={`flex items-center space-x-2 cursor-pointer ${styles.hoverEffect}`}>
              <input type="radio" checked={filterOptions.group_by === metric.id}
                onChange={() => handleGroupMetricChange(metric.id as GroupMetricId)}
                name="metric"
                className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`}/>
              <span className={`text-sm ${isSelected ? styles.textSelected : styles.textUnselected}`}>{t(`groupMetric.${metric.label}`)}</span>
            </label>
        )})}
      </div>

      <h3 className={`${styles.filterTitleText}`}>{t('direction')}</h3>
      <div className="grid grid-cols-2 gap-x-6">
        {['arrival','departure'].map(direction => {
          const isSelected = filterOptions.direction_ids.includes(encodeDirection(direction));
          return (
            <label key={direction} className={`flex items-center space-x-2 cursor-pointer ${styles.hoverEffect}`}>
              <input type="checkbox" checked={isSelected}
                onChange={() => handleDirectionChange(encodeDirection(direction))}
                name="direction"
                className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`}/>
              <span className={`text-sm ${isSelected ?  styles.textSelected : styles.textUnselected}`}>{t(`${direction}`)}</span>
            </label>
          )
        })}
      </div>

      <h3 className={`${styles.filterTitleText}`}>{t('passengerCategories')}</h3>
      <div className="flex-grow flex flex-col min-h-0">
        <div className="flex-grow overflow-y-auto pr-2 border rounded-lg bg-gray-50">
          <div className="p-3 space-y-1.5">

            {[{ id: 'hkResidents', label: 'Hong Kong Residents' },
              { id: 'mainlandVisitors', label: 'Mainland Visitors' },
              { id: 'otherVisitors', label: 'Other Visitors' }].map(category => {
              const isSelected = filterOptions.passenger_category_ids.includes(encodeCategory(category.id));
              return (
                <label key={category.id} className={`flex items-center space-x-2 cursor-pointer ${styles.hoverEffect}`}>
                  <input type="checkbox" checked={isSelected}
                    onChange={() => handleTravelerCategoryChange(encodeCategory(category.id))}
                    name="category"
                    className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`}/>
                  <span className={`text-sm ${isSelected ?  styles.textSelected : styles.textUnselected}`}>{t(`${category.id}`)}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        <h3 className={`${styles.filterTitleText} mb-2`}>{t('controlPoints')}</h3>
        <div className="flex-grow overflow-y-auto pr-2 border rounded-lg bg-gray-50">
          <div className="p-3 space-y-1.5">
            <label className={`flex items-center space-x-2 cursor-pointer border-b border-gray-200 pb-2 mb-1 ${styles.hoverEffect}`}>
              <input
                type="checkbox"
                checked={allControlPoints.length === filterOptions.control_point_ids.length}
                onChange={handleSelectAllControlPoints}
                disabled={filterOptions.passenger_category_ids.length > 100}
                className={`${styles.checkBoxBasic}`}
                />
              <span className={`text-sm font-medium ${allControlPoints.length === filterOptions.control_point_ids.length 
                                ? styles.textSelected : styles.textUnselected}`}>{t('selectAll')}</span>
            </label>
            {allControlPoints.map(point => {
              const isSelected = filterOptions.control_point_ids.includes(encodeControlPoint(point));
              return (
                <label key={point} className={`flex items-center space-x-2 cursor-pointer ${styles.hoverEffect}`}>
                  <input
                    type="checkbox"
                    checked={filterOptions.control_point_ids.includes(encodeControlPoint(point))}
                    onChange={() => handleControlPointChange(encodeControlPoint(point))}
                    disabled={filterOptions.passenger_category_ids.length > 100}
                    className={`${styles.checkBoxBasic}`}
                  />
                  <span className={`text-sm ${isSelected ? styles.textSelected : styles.textUnselected}`}>
                    {t(`controlPointNames.${point}`)}
                  </span>
                </label>);
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;