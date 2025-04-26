import React from 'react';
import { FilterOptions } from '../types';

interface FiltersProps {
  filterOptions: FilterOptions;
  allControlPoints: string[];
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
}

const Filters: React.FC<FiltersProps> = ({ 
  filterOptions, 
  allControlPoints,
  onFilterChange 
}) => {
  const handleDirectionChange = (direction: string) => {
    // Single select for direction
    onFilterChange({ direction: direction });
  };

  const handleModeChange = (mode: string) => {
    onFilterChange({ mode: mode });
  };

  const handleControlPointChange = (controlPoint: string) => {
    const newControlPoints = filterOptions.controlPoints.includes(controlPoint)
      ? filterOptions.controlPoints.filter(cp => cp !== controlPoint)
      : [...filterOptions.controlPoints, controlPoint];
    
    onFilterChange({ 
      controlPoints: newControlPoints,
      travelerCategories: [] 
    });
  };

  const handleSelectAllControlPoints = () => {
    // If all points are already selected, deselect all
    const allSelected = allControlPoints.length === filterOptions.controlPoints.length;
    onFilterChange({ 
      controlPoints: allSelected ? [] : [...allControlPoints],
      travelerCategories: [] 
    });
  };

  const handleTravelerCategoryChange = (category: string) => {
    const newCategories = filterOptions.travelerCategories.includes(category)
      ? filterOptions.travelerCategories.filter(c => c !== category)
      : [...filterOptions.travelerCategories, category];
    
    if (newCategories.length > 0) {
      // When selecting traveler categories, clear control points
      onFilterChange({ 
        travelerCategories: newCategories,
        controlPoints: [] 
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">Direction</h3>
        <div className="flex space-x-6">{['Arrival', 'Departure'].map(direction => (
            <label key={direction} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={filterOptions.direction === direction}
                onChange={() => handleDirectionChange(direction)}
                name="direction"
                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700">{direction}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-gray-700">Mode</h3>
        <div className="flex space-x-9">{['Sum', 'Separated'].map(mode => (
            <label key={mode} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={filterOptions.mode === mode}
                onChange={() => handleModeChange(mode)}
                name="mode"
                className="text-blue-600 focus:ring-blue-500 h-4 w-4" />
              <span className="text-sm text-gray-700">{mode}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        <h3 className="font-medium text-gray-700 mb-2">Control Points</h3>
        <div className="flex-grow overflow-y-auto pr-2 border rounded-lg bg-gray-50">
          <div className="p-3 space-y-1.5">
            <label className="flex items-center space-x-2 cursor-pointer border-b border-gray-200 pb-2 mb-1">
              <input
                type="checkbox"
                checked={allControlPoints.length === filterOptions.controlPoints.length}
                onChange={handleSelectAllControlPoints}
                disabled={filterOptions.travelerCategories.length > 100}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-50"
              />
              <span className={`text-sm font-medium ${filterOptions.travelerCategories.length > 100 ? 'text-gray-400' : 'text-gray-700'}`}>
                Select All
              </span>
            </label>
            {allControlPoints.map(point => (
              <label key={point} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterOptions.controlPoints.includes(point)}
                  onChange={() => handleControlPointChange(point)}
                  disabled={filterOptions.travelerCategories.length > 100}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 disabled:opacity-50"
                />
                <span className={`text-sm 'text-gray-700'}`}>
                  {point}
                </span>
              </label>
            ))}
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