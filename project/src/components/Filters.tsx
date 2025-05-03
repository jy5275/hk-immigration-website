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
  filterBg: "bg-gray-100 p-3 rounded-md",
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

  const handleCategoryChange = (categoryIDs: number) => {
    const newCategories = filterOptions.category_ids.includes(categoryIDs)
      ? filterOptions.category_ids.filter(c => c !== categoryIDs)
      : [...filterOptions.category_ids, categoryIDs];
    onFilterChange({ category_ids: newCategories });
  };

  return (
    <div className="space-y-3">
      <div className={styles.filterBg}>
        <h3 className={`${styles.filterTitleText} text-base font-medium mb-2`}>{t('mode')}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[{ id: 0, label: "all" }, { id: 1, label: "byDir" }, { id: 2, label: "byCat" }, { id: 3, label: "byCp" }].map(metric => {
            const isSelected = filterOptions.group_by === metric.id;
            return (
              <label key={metric.id} className={`flex items-center space-x-1.5 cursor-pointer text-sm ${styles.hoverEffect}`}>
                <input type="radio" checked={isSelected}
                  onChange={() => handleGroupMetricChange(metric.id as GroupMetricId)}
                  name="metric"
                  className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`} />
                <span className={`${isSelected ? styles.textSelected : styles.textUnselected}`}>{t(`groupMetric.${metric.label}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.filterBg}>
        <h3 className={`${styles.filterTitleText} text-base font-medium mb-2`}>{t('direction')}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {['arrival', 'departure'].map(direction => {
            const isSelected = filterOptions.direction_ids.includes(encodeDirection(direction));
            return (
              <label key={direction} className={`flex items-center space-x-1.5 cursor-pointer text-sm ${styles.hoverEffect}`}>
                <input type="checkbox" checked={isSelected}
                  onChange={() => handleDirectionChange(encodeDirection(direction))}
                  name="direction"
                  className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`} />
                <span className={`${isSelected ? styles.textSelected : styles.textUnselected}`}>{t(`${direction}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.filterBg}>
        <h3 className={`${styles.filterTitleText} text-base font-medium mb-2`}>{t('passengerCategories')}</h3>
        <div className="space-y-1.5">
          {[{ id: 'hkResidents', label: 'Hong Kong Residents' },
          { id: 'mainlandVisitors', label: 'Mainland Visitors' },
          { id: 'otherVisitors', label: 'Other Visitors' }].map(category => {
            const isSelected = filterOptions.category_ids.includes(encodeCategory(category.id));
            return (
              <label key={category.id} className={`flex items-center space-x-1.5 cursor-pointer text-sm ${styles.hoverEffect}`}>
                <input type="checkbox" checked={isSelected}
                  onChange={() => handleCategoryChange(encodeCategory(category.id))}
                  name="category"
                  className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`} />
                <span className={`${isSelected ? styles.textSelected : styles.textUnselected}`}>{t(`${category.id}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.filterBg}>
        <h3 className={`${styles.filterTitleText} text-base font-medium mb-2`}>{t('controlPoints')}</h3>
        <div className="max-h-80 overflow-y-auto pr-1 rounded-md bg-white">
          <div className={`${styles.filterBg} p-1 space-y-1.5`}>
            <label className={`flex items-center space-x-1.5 cursor-pointer border-b border-gray-200 pb-1 mb-1 text-sm ${styles.hoverEffect}`}>
              <input
                type="checkbox"
                checked={allControlPoints.length === filterOptions.control_point_ids.length}
                onChange={handleSelectAllControlPoints}
                disabled={filterOptions.category_ids.length > 100}
                className={`${styles.checkBoxBasic}`}
              />
              <span className={`font-medium ${allControlPoints.length === filterOptions.control_point_ids.length
                ? styles.textSelected : styles.textUnselected}`}>{t('selectAll')}</span>
            </label>
            {allControlPoints.map(point => {
              const isSelected = filterOptions.control_point_ids.includes(encodeControlPoint(point));
              return (
                <label key={point} className={`flex items-center space-x-1.5 cursor-pointer text-sm ${styles.hoverEffect}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleControlPointChange(encodeControlPoint(point))}
                    disabled={filterOptions.category_ids.length > 100}
                    className={`${styles.checkBoxBasic}`}
                  />
                  <span className={`${isSelected ? styles.textSelected : styles.textUnselected}`}>
                    {t(`controlPointNames.${point}`)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;