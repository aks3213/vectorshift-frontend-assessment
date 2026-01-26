// llmNode.js

import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';

// LLM node content component
const LLMNodeContent = ({ id, data }) => {
  return (
    <div>
      <span>This is a LLM.</span>
    </div>
  );
};

// Create LLMNode using the factory
export const LLMNode = createNode(
  createNodeConfig({
    title: 'LLM',
    content: LLMNodeContent,
    handles: ({ id }) => CommonHandles.llmHandles(id)
  })
);
