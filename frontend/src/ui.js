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
  background-color: ${getThemeValue('colors.background')};
  border: 1px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.lg')};
  overflow: hidden;
  box-shadow: ${getThemeValue('shadows.md')};
  position: relative;

  .react-flow__controls {
    background-color: ${getThemeValue('colors.surface')};
    border: 1px solid ${getThemeValue('colors.border')};
    border-radius: ${getThemeValue('borderRadius.md')};
    box-shadow: ${getThemeValue('shadows.sm')};
  }

  .react-flow__controls-button {
    background-color: ${getThemeValue('colors.surface')};
    border-bottom: 1px solid ${getThemeValue('colors.border')};
    color: ${getThemeValue('colors.text.primary')};
    transition: all ${getThemeValue('transitions.fast')};

    &:hover {
      background-color: ${getThemeValue('colors.background')};
      color: ${getThemeValue('colors.secondary')};
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .react-flow__minimap {
    background-color: ${getThemeValue('colors.surface')};
    border: 1px solid ${getThemeValue('colors.border')};
    border-radius: ${getThemeValue('borderRadius.md')};
    box-shadow: ${getThemeValue('shadows.sm')};
  }

  .react-flow__background {
    background-color: ${getThemeValue('colors.background')};
  }

  .react-flow__edge-path {
    stroke: ${getThemeValue('colors.secondary')};
    stroke-width: 2;
  }

  .react-flow__connection-line {
    stroke: ${getThemeValue('colors.secondary')};
    stroke-width: 2;
  }

  .react-flow__handle {
    background-color: ${getThemeValue('colors.secondary')};
    border: 2px solid ${getThemeValue('colors.surface')};
    width: 10px;
    height: 10px;
    transition: all ${getThemeValue('transitions.fast')};

    &:hover {
      background-color: ${getThemeValue('colors.primary')};
      transform: scale(1.2);
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
                    switch (node.type) {
                      case 'customInput': return '#10B981';
                      case 'customOutput': return '#EF4444';
                      case 'llm': return '#6366F1';
                      case 'text': return '#F59E0B';
                      default: return '#64748B';
                    }
                  }}
                  maskColor="rgba(248, 250, 252, 0.8)"
                />
            </ReactFlow>
        </PipelineContainer>
    )
}
