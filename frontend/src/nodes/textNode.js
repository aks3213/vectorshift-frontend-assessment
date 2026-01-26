// textNode.js

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, Input } from '../styled';

// Text node content component
const TextNodeContent = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text || '{{input}}');

  const handleTextChange = (e) => {
    setCurrText(e.target.value);
  };

  return (
    <div>
      <FormField>
        <Label>Text:</Label>
        <Input 
          type="text" 
          value={currText} 
          onChange={handleTextChange} 
        />
      </FormField>
    </div>
  );
};

// Create TextNode using the factory
export const TextNode = createNode(
  createNodeConfig({
    title: 'Text',
    content: TextNodeContent,
    handles: ({ id }) => CommonHandles.singleSource(id)
  })
);
