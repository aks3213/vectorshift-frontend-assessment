// inputNode.js

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, Input, Select } from '../styled';

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
        <Select value={inputType} onChange={handleTypeChange}>
          <option value="Text">Text</option>
          <option value="File">File</option>
        </Select>
      </FormField>
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
