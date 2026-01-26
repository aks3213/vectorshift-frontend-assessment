// conditionalNode.js
// Conditional node for branching logic

import { useState } from 'react';
import { createNode, createNodeConfig } from '../components/nodeFactory';
import { createHandle, HandlePositions } from '../components/BaseNode';

// Conditional node content component
const ConditionalNodeContent = ({ id, data }) => {
  const [condition, setCondition] = useState(data?.condition || 'equals');
  const [value, setValue] = useState(data?.value || '');

  const handleConditionChange = (e) => {
    setCondition(e.target.value);
  };

  const handleValueChange = (e) => {
    setValue(e.target.value);
  };

  return (
    <div>
      <label>
        Condition:
        <select value={condition} onChange={handleConditionChange} style={{ width: '100%', marginBottom: '4px' }}>
          <option value="equals">Equals</option>
          <option value="notEquals">Not Equals</option>
          <option value="greaterThan">Greater Than</option>
          <option value="lessThan">Less Than</option>
          <option value="isEmpty">Is Empty</option>
          <option value="isNotEmpty">Is Not Empty</option>
        </select>
      </label>
      {!['isEmpty', 'isNotEmpty'].includes(condition) && (
        <label>
          Value:
          <input 
            type="text" 
            value={value} 
            onChange={handleValueChange} 
            placeholder="Comparison value..."
            style={{ width: '100%' }}
          />
        </label>
      )}
    </div>
  );
};

// Custom handles for conditional - single input, two outputs (true/false)
const conditionalHandles = (id) => [
  createHandle(`${id}-input`, 'target', HandlePositions.LEFT),
  createHandle(`${id}-true`, 'source', HandlePositions.RIGHT, { top: '33%' }),
  createHandle(`${id}-false`, 'source', HandlePositions.RIGHT, { top: '67%' })
];

// Create ConditionalNode using the factory
export const ConditionalNode = createNode(
  createNodeConfig({
    title: 'Conditional',
    content: ConditionalNodeContent,
    handles: ({ id }) => conditionalHandles(id),
    style: {
      backgroundColor: '#fff3e0',
      border: '2px solid #f57c00',
      borderRadius: '8px',
      width: 220,
      height: 110
    }
  })
);