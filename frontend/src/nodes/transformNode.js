// transformNode.js
// Transform node for data transformation operations

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, Input, Select } from '../styled';

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
      <FormField>
        <Label>Transform:</Label>
        <Select value={transformType} onChange={handleTypeChange}>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="trim">Trim</option>
          <option value="reverse">Reverse</option>
          <option value="custom">Custom</option>
        </Select>
      </FormField>
      {transformType === 'custom' && (
        <FormField>
          <Label>Function:</Label>
          <Input 
            type="text" 
            value={customFunction} 
            onChange={handleFunctionChange} 
            placeholder="x => x.replace(...)"
          />
        </FormField>
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
      width: 220,
      height: 100
    }
  })
);