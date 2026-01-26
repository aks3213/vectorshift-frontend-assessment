// aggregatorNode.js
// Aggregator node for combining multiple inputs

import { useState } from 'react';
import { createNode, createNodeConfig } from '../components/nodeFactory';
import { createHandle, HandlePositions } from '../components/BaseNode';

// Aggregator node content component
const AggregatorNodeContent = ({ id, data }) => {
  const [aggregationType, setAggregationType] = useState(data?.aggregationType || 'concat');
  const [separator, setSeparator] = useState(data?.separator || ', ');

  const handleTypeChange = (e) => {
    setAggregationType(e.target.value);
  };

  const handleSeparatorChange = (e) => {
    setSeparator(e.target.value);
  };

  return (
    <div>
      <label>
        Operation:
        <select value={aggregationType} onChange={handleTypeChange} style={{ width: '100%', marginBottom: '4px' }}>
          <option value="concat">Concatenate</option>
          <option value="merge">Merge</option>
          <option value="join">Join Array</option>
          <option value="sum">Sum</option>
          <option value="average">Average</option>
        </select>
      </label>
      {(aggregationType === 'concat' || aggregationType === 'join') && (
        <label>
          Separator:
          <input 
            type="text" 
            value={separator} 
            onChange={handleSeparatorChange} 
            style={{ width: '100%' }}
          />
        </label>
      )}
    </div>
  );
};

// Custom handles for aggregator - multiple inputs, single output
const aggregatorHandles = (id) => [
  createHandle(`${id}-input1`, 'target', HandlePositions.LEFT, { top: '25%' }),
  createHandle(`${id}-input2`, 'target', HandlePositions.LEFT, { top: '50%' }),
  createHandle(`${id}-input3`, 'target', HandlePositions.LEFT, { top: '75%' }),
  createHandle(`${id}-output`, 'source', HandlePositions.RIGHT)
];

// Create AggregatorNode using the factory
export const AggregatorNode = createNode(
  createNodeConfig({
    title: 'Aggregator',
    content: AggregatorNodeContent,
    handles: ({ id }) => aggregatorHandles(id),
    style: {
      backgroundColor: '#e8f5e8',
      border: '2px solid #388e3c',
      borderRadius: '8px',
      width: 220,
      height: 120
    }
  })
);