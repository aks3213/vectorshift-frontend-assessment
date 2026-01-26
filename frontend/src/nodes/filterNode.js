// filterNode.js
// Filter node for data filtering operations

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, Input, Select } from '../styled';

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
      <FormField>
        <Label>Filter Type:</Label>
        <Select value={filterType} onChange={handleTypeChange}>
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="startsWith">Starts With</option>
          <option value="endsWith">Ends With</option>
          <option value="regex">Regex</option>
        </Select>
      </FormField>
      <FormField>
        <Label>Value:</Label>
        <Input 
          type="text" 
          value={filterValue} 
          onChange={handleValueChange} 
          placeholder="Filter value..."
        />
      </FormField>
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
      width: 220,
      height: 100
    }
  })
);