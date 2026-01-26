// llmNode.js

import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { NodeText } from '../styled';

// LLM node content component
const LLMNodeContent = ({ id, data }) => {
  return (
    <div>
      <NodeText>This is a LLM.</NodeText>
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
