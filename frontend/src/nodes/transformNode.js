// transformNode.js
// Transform node for data transformation operations

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// Transform node content component
const TransformNodeContent = ({ id, data }) => {
  const [transformType, setTransformType] = useState(data?.transformType || 'uppercase');
  const [customFunction, setCustomFunction] = useState(data?.customFunction || '');

  const handleTypeChange = (e) => {
    setTransformType(e.target.value);
  };

  const handleFunctionChange = (e) => {
    setCustomFunction(e.target.value);
  };

  return (
    <div>
      <label>
        Transform:
        <select value={transformType} onChange={handleTypeChange} style={{ width: '100%', marginBottom: '4px' }}>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="trim">Trim</option>
          <option value="reverse">Reverse</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {transformType === 'custom' && (
        <label>
          Function:
          <input 
            type="text" 
            value={customFunction} 
            onChange={handleFunctionChange} 
            placeholder="x => x.replace(...)"
            style={{ width: '100%' }}
          />
        </label>
      )}
    </div>
  );
};

// Create TransformNode using the factory
export const TransformNode = createNode(
  createNodeConfig({
    title: 'Transform',
    content: TransformNodeContent,
    handles: ({ id }) => CommonHandles.sourceAndTarget(id),
    style: {
      backgroundColor: '#f3e5f5',
      border: '2px solid #7b1fa2',
      borderRadius: '8px',
      width: 220,
      height: 100
    }
  })
);