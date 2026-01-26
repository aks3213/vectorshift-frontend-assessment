// outputNode.js

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// Output node content component
const OutputNodeContent = ({ id, data }) => {
  const [currName, setCurrName] = useState(data?.outputName || id.replace('customOutput-', 'output_'));
  const [outputType, setOutputType] = useState(data.outputType || 'Text');

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
  };

  const handleTypeChange = (e) => {
    setOutputType(e.target.value);
  };

  return (
    <div>
      <label>
        Name:
        <input 
          type="text" 
          value={currName} 
          onChange={handleNameChange} 
          style={{ width: '100%', marginBottom: '4px' }}
        />
      </label>
      <label>
        Type:
        <select value={outputType} onChange={handleTypeChange} style={{ width: '100%' }}>
          <option value="Text">Text</option>
          <option value="File">Image</option>
        </select>
      </label>
    </div>
  );
};

// Create OutputNode using the factory
export const OutputNode = createNode(
  createNodeConfig({
    title: 'Output',
    content: OutputNodeContent,
    handles: ({ id }) => CommonHandles.singleTarget(id)
  })
);
