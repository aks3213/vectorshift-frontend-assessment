// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import styled from '@emotion/styled';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { InputNode } from './nodes/inputNode';
import { LLMNode } from './nodes/llmNode';
import { OutputNode } from './nodes/outputNode';
import { TextNode } from './nodes/textNode';
import { FilterNode } from './nodes/filterNode';
import { TransformNode } from './nodes/transformNode';
import { AggregatorNode } from './nodes/aggregatorNode';
import { ConditionalNode } from './nodes/conditionalNode';
import { DelayNode } from './nodes/delayNode';
import { getThemeValue } from './styled';

import 'reactflow/dist/style.css';

const PipelineContainer = styled.div`
  width: 100%;
  height: 70vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.xl')};
  overflow: hidden;
  box-shadow: ${getThemeValue('shadows.nodeSelected')};
  position: relative;

  .react-flow__controls {
    background-color: ${getThemeValue('colors.surface')};
    border: 2px solid ${getThemeValue('colors.border')};
    border-radius: ${getThemeValue('borderRadius.lg')};
    box-shadow: ${getThemeValue('shadows.md')};
  }

  .react-flow__controls-button {
    background-color: ${getThemeValue('colors.surface')};
    border-bottom: 1px solid ${getThemeValue('colors.border')};
    color: ${getThemeValue('colors.text.primary')};
    transition: all ${getThemeValue('transitions.fast')};
    font-weight: ${getThemeValue('typography.fontWeight.medium')};

    &:hover {
      background-color: ${getThemeValue('colors.secondary')};
      color: ${getThemeValue('colors.text.inverse')};
      transform: scale(1.05);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .react-flow__minimap {
    background-color: ${getThemeValue('colors.surface')};
    border: 2px solid ${getThemeValue('colors.border')};
    border-radius: ${getThemeValue('borderRadius.lg')};
    box-shadow: ${getThemeValue('shadows.md')};
  }

  .react-flow__background {
    background-color: transparent;
  }

  .react-flow__edge-path {
    stroke: ${getThemeValue('colors.secondary')};
    stroke-width: 3;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .react-flow__connection-line {
    stroke: ${getThemeValue('colors.secondary')};
    stroke-width: 3;
    stroke-dasharray: 5, 5;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }

  .react-flow__handle {
    background-color: ${getThemeValue('colors.secondary')};
    border: 3px solid ${getThemeValue('colors.surface')};
    width: 12px;
    height: 12px;
    transition: all ${getThemeValue('transitions.fast')};

    &:hover {
      background-color: ${getThemeValue('colors.primary')};
      transform: scale(1.3);
    }
  }
`;

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  filter: FilterNode,
  transform: TransformNode,
  aggregator: AggregatorNode,
  conditional: ConditionalNode,
  delay: DelayNode,
};

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const {
      nodes,
      edges,
      getNodeID,
      addNode,
      onNodesChange,
      onEdgesChange,
      onConnect
    } = useStore(selector, shallow);

    const getInitNodeData = (nodeID, type) => {
      let nodeData = { id: nodeID, nodeType: `${type}` };
      return nodeData;
    }

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;
      
            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }
      
            const position = reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            const nodeID = getNodeID(type);
            const newNode = {
              id: nodeID,
              type,
              position,
              data: getInitNodeData(nodeID, type),
            };
      
            addNode(newNode);
          }
        },
        [reactFlowInstance, getNodeID, addNode]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    return (
        <PipelineContainer ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                snapGrid={[gridSize, gridSize]}
                connectionLineType='smoothstep'
            >
                <Background 
                  color="#cbd5e1" 
                  gap={gridSize} 
                  size={1}
                />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    const colors = {
                      'customInput': '#10B981',
                      'customOutput': '#EF4444',
                      'llm': '#6366F1',
                      'text': '#F59E0B',
                      'filter': '#06B6D4',
                      'transform': '#8B5CF6',
                      'aggregator': '#EC4899',
                      'conditional': '#F97316',
                      'delay': '#64748B'
                    };
                    return colors[node.type] || '#64748B';
                  }}
                  maskColor="rgba(248, 250, 252, 0.8)"
                />
            </ReactFlow>
        </PipelineContainer>
    )
}
