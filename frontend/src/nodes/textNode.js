// textNode.js

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// Text node content component
const TextNodeContent = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text || '{{input}}');

  const handleTextChange = (e) => {
    setCurrText(e.target.value);
  };

  return (
    <div>
      <label>
        Text:
        <input 
          type="text" 
          value={currText} 
          onChange={handleTextChange} 
          style={{ width: '100%' }}
        />
      </label>
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
