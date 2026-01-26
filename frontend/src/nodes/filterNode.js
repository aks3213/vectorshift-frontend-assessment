// filterNode.js
// Filter node for data filtering operations

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// Filter node content component
const FilterNodeContent = ({ id, data }) => {
  const [filterType, setFilterType] = useState(data?.filterType || 'contains');
  const [filterValue, setFilterValue] = useState(data?.filterValue || '');

  const handleTypeChange = (e) => {
    setFilterType(e.target.value);
  };

  const handleValueChange = (e) => {
    setFilterValue(e.target.value);
  };

  return (
    <div>
      <label>
        Filter Type:
        <select value={filterType} onChange={handleTypeChange} style={{ width: '100%', marginBottom: '4px' }}>
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="startsWith">Starts With</option>
          <option value="endsWith">Ends With</option>
          <option value="regex">Regex</option>
        </select>
      </label>
      <label>
        Value:
        <input 
          type="text" 
          value={filterValue} 
          onChange={handleValueChange} 
          placeholder="Filter value..."
          style={{ width: '100%' }}
        />
      </label>
    </div>
  );
};

// Create FilterNode using the factory
export const FilterNode = createNode(
  createNodeConfig({
    title: 'Filter',
    content: FilterNodeContent,
    handles: ({ id }) => CommonHandles.sourceAndTarget(id),
    style: {
      backgroundColor: '#e3f2fd',
      border: '2px solid #1976d2',
      borderRadius: '8px',
      width: 220,
      height: 100
    }
  })
);