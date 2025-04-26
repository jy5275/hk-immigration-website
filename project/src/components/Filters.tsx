import React from 'react';
import { FilterOptions } from '../types';
import { allControlPoints, DirectionId, encodeControlPoint, encodeDirection } from '../types/consts';
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
  const handleDirectionChange = (direction_id: DirectionId) => {
    // Single select for direction
    onFilterChange({ direction_id: direction_id });
  };

  const handleModeChange = (mode: string) => {
    onFilterChange({ mode: mode });
  };

  const handleControlPointChange = (controlPointID: number) => {
    const newControlPointIDs = filterOptions.control_point_ids.includes(controlPointID)
      ? filterOptions.control_point_ids.filter(cp => cp !== controlPointID)
      : [...filterOptions.control_point_ids, controlPointID];
    onFilterChange({ 
      control_point_ids: newControlPointIDs,
      passenger_categories: [] 
    });
  };

  const handleSelectAllControlPoints = () => {
    // If all points are already selected, deselect all
    const allSelected = allControlPoints.length === filterOptions.control_point_ids.length;
    onFilterChange({ 
      control_point_ids: allSelected ? [] : Array.from({ length: allControlPoints.length }, (_, i) => i),
      passenger_categories: [] 
    });
  };

  // const handleTravelerCategoryChange = (category: string) => {
  //   const newCategories = filterOptions.passenger_categories.includes(category)
  //     ? filterOptions.passenger_categories.filter(c => c !== category)
  //     : [...filterOptions.passenger_categories, category];
    
  //   if (newCategories.length > 0) {
  //     // When selecting traveler categories, clear control points
  //     onFilterChange({ 
  //       passenger_categories: newCategories,
  //       controlPoints: [] 
  //     });
  //   }
  // };

  return (
    <div className="space-y-4">
      <h3 className={`${styles.filterTitleText}`}>{t('direction')}</h3>
      <div className="grid grid-cols-2 gap-x-6">
        {['arrival','departure'].map(direction => {
          const isSelected = filterOptions.direction_id === encodeDirection(direction);
          return (
            <label key={direction} className={`flex items-center space-x-2 cursor-pointer ${styles.hoverEffect}`}>
              <input type="radio" checked={isSelected}
                onChange={() => handleDirectionChange(encodeDirection(direction))}
                name="direction"
                className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`}/>
              <span className={`text-sm ${isSelected ?  styles.textSelected : styles.textUnselected}`}>{t(`${direction}`)}</span>
            </label>
          )
        })}
      </div>

      <h3 className={`${styles.filterTitleText}`}>{t('mode')}</h3>

      {/* sum / separated 选项 */}
      <div className="grid grid-cols-2 gap-x-6">
        {['sum', 'separated'].map(mode => {
          const isSelected = filterOptions.mode === mode;
          return(
            <label key={mode} className={`flex items-center space-x-2 cursor-pointer ${styles.hoverEffect}`}>
              <input type="radio" checked={filterOptions.mode === mode}
                onChange={() => handleModeChange(mode)}
                name="mode"
                className={`${isSelected ? styles.radioSelected : styles.radioUnselected}`}/>
              <span className={`text-sm ${isSelected ? styles.textSelected : styles.textUnselected}`}>{t(`${mode}`)}</span>
            </label>
        )})}
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
                disabled={filterOptions.passenger_categories.length > 100}
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
                    disabled={filterOptions.passenger_categories.length > 100}
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

{/* TODO: to be enabled */}
      {/* <div className="space-y-3">
        <h3 className="font-medium text-gray-700">Traveler Categories</h3>
        <div className="space-y-2">
          {[
            { id: 'hk_residents', label: 'Hong Kong Residents' },
            { id: 'mainland_visitors', label: 'Mainland Visitors' },
            { id: 'other_visitors', label: 'Other Visitors' }
          ].map(category => (
            <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOptions.travelerCategories.includes(category.id)}
                onChange={() => handleTravelerCategoryChange(category.id)}
                disabled={filterOptions.controlPoints.length > 0}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-50"
              />
              <span className={`text-sm ${filterOptions.controlPoints.length > 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                {category.label}
              </span>
            </label>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default Filters;