// delayNode.js
// Delay node for timing control in pipelines

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// Delay node content component
const DelayNodeContent = ({ id, data }) => {
  const [delayAmount, setDelayAmount] = useState(data?.delayAmount || '1000');
  const [delayUnit, setDelayUnit] = useState(data?.delayUnit || 'ms');

  const handleAmountChange = (e) => {
    setDelayAmount(e.target.value);
  };

  const handleUnitChange = (e) => {
    setDelayUnit(e.target.value);
  };

  return (
    <div>
      <label>
        Delay:
        <div style={{ display: 'flex', gap: '4px' }}>
          <input 
            type="number" 
            value={delayAmount} 
            onChange={handleAmountChange} 
            min="0"
            style={{ width: '60%' }}
          />
          <select value={delayUnit} onChange={handleUnitChange} style={{ width: '40%' }}>
            <option value="ms">ms</option>
            <option value="s">s</option>
            <option value="m">m</option>
          </select>
        </div>
      </label>
      <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
        Adds timing control to pipeline
      </div>
    </div>
  );
};

// Create DelayNode using the factory
export const DelayNode = createNode(
  createNodeConfig({
    title: 'Delay',
    content: DelayNodeContent,
    handles: ({ id }) => CommonHandles.sourceAndTarget(id),
    style: {
      backgroundColor: '#fce4ec',
      border: '2px solid #c2185b',
      borderRadius: '8px',
      width: 200,
      height: 90
    }
  })
);