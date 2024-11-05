// FilterButtons.jsx

import React from 'react';

const FilterButtons = ({ activeFilters, onFilterChange, categories, subcategories }) => {
  return (
    <div className="filter-buttons">
      <select 
        value={activeFilters.category} 
        onChange={(e) => onFilterChange('category', e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>

      {activeFilters.category && (
        <select 
          value={activeFilters.subcategory} 
          onChange={(e) => onFilterChange('subcategory', e.target.value)}
        >
          <option value="">All Subcategories</option>
          {subcategories.map(subcategory => (
            <option key={subcategory} value={subcategory}>{subcategory}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default FilterButtons;