// outputNode.js

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, Input, Select } from '../styled';

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
      <FormField>
        <Label>Name:</Label>
        <Input 
          type="text" 
          value={currName} 
          onChange={handleNameChange} 
        />
      </FormField>
      <FormField>
        <Label>Type:</Label>
        <Select value={outputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="File">Image</option>
        </Select>
      </FormField>
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
