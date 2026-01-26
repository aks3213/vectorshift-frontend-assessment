// inputNode.js

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// Input node content component
const InputNodeContent = ({ id, data }) => {
  const [currName, setCurrName] = useState(data?.inputName || id.replace('customInput-', 'input_'));
  const [inputType, setInputType] = useState(data.inputType || 'Text');

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
  };

  const handleTypeChange = (e) => {
    setInputType(e.target.value);
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
        <select value={inputType} onChange={handleTypeChange} style={{ width: '100%' }}>
          <option value="Text">Text</option>
          <option value="File">File</option>
        </select>
      </label>
    </div>
  );
};

// Create InputNode using the factory
export const InputNode = createNode(
  createNodeConfig({
    title: 'Input',
    content: InputNodeContent,
    handles: ({ id }) => CommonHandles.singleSource(id)
  })
);
