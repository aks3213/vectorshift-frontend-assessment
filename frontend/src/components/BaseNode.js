// BaseNode.js
// Base component for all node types with configurable handles and content

import React from 'react';
import { Handle, Position } from 'reactflow';
import styled from '@emotion/styled';
import { getThemeValue } from '../styled';

// Node type color mapping for visual differentiation
const getNodeTypeColor = (nodeType) => {
  const colors = {
    'customInput': '#10B981', // Green
    'customOutput': '#EF4444', // Red  
    'llm': '#6366F1', // Purple
    'text': '#F59E0B', // Orange
    'filter': '#06B6D4', // Cyan
    'transform': '#8B5CF6', // Violet
    'aggregator': '#EC4899', // Pink
    'conditional': '#F97316', // Orange-red
    'delay': '#64748B' // Gray
  };
  return colors[nodeType] || '#64748B';
};

// Get lighter version of node color for backgrounds
const getNodeTypeColorLight = (nodeType) => {
  const colors = {
    'customInput': '#D1FAE5', // Light green
    'customOutput': '#FEE2E2', // Light red  
    'llm': '#E0E7FF', // Light purple
    'text': '#FEF3C7', // Light orange
    'filter': '#CFFAFE', // Light cyan
    'transform': '#EDE9FE', // Light violet
    'aggregator': '#FCE7F3', // Light pink
    'conditional': '#FED7AA', // Light orange-red
    'delay': '#F1F5F9' // Light gray
  };
  return colors[nodeType] || '#F1F5F9';
};

// Styled components for BaseNode
const NodeContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'nodeType' && prop !== 'resizable'
})`
  background: linear-gradient(135deg, ${props => getNodeTypeColorLight(props.nodeType)} 0%, ${getThemeValue('colors.surface')} 100%);
  border: 2px solid ${props => getNodeTypeColor(props.nodeType)};
  border-radius: ${getThemeValue('borderRadius.lg')};
  padding: ${getThemeValue('spacing.lg')};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  transition: all ${getThemeValue('transitions.normal')};
  position: relative;
  min-width: ${props => props.resizable ? '180px' : '220px'};
  max-width: ${props => props.resizable ? '400px' : '320px'};
  min-height: 100px;
  overflow: visible;
  word-wrap: break-word;
  width: ${props => props.resizable ? 'auto' : 'initial'};
  height: ${props => props.resizable ? 'auto' : 'initial'};

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    border-color: ${props => getNodeTypeColor(props.nodeType)};
    filter: brightness(1.02);
  }

  &.selected {
    border-color: ${props => getNodeTypeColor(props.nodeType)};
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2), 0 0 0 3px ${props => getNodeTypeColor(props.nodeType)}20;
    transform: translateY(-1px);
  }
`;

const NodeHeader = styled('div', {
  shouldForwardProp: (prop) => prop !== 'nodeType'
})`
  font-weight: ${getThemeValue('typography.fontWeight.bold')};
  font-size: ${getThemeValue('typography.fontSize.md')};
  color: ${props => getNodeTypeColor(props.nodeType)};
  background: rgba(255, 255, 255, 0.9);
  padding: ${getThemeValue('spacing.sm')} ${getThemeValue('spacing.md')};
  border-radius: calc(${getThemeValue('borderRadius.lg')} - 2px) calc(${getThemeValue('borderRadius.lg')} - 2px) 0 0;
  margin: -${getThemeValue('spacing.lg')} -${getThemeValue('spacing.lg')} ${getThemeValue('spacing.md')} -${getThemeValue('spacing.lg')};
  text-align: center;
  border-bottom: 2px solid ${props => getNodeTypeColor(props.nodeType)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const NodeContent = styled.div`
  color: ${getThemeValue('colors.text.primary')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  line-height: ${getThemeValue('typography.lineHeight.relaxed')};
  overflow: visible;
  padding-top: ${getThemeValue('spacing.xs')};
  
  /* Ensure form fields don't overflow */
  & > div {
    max-width: 100%;
  }
`;

const StyledHandle = styled(Handle, {
  shouldForwardProp: (prop) => prop !== 'nodeType'
})`
  width: 16px;
  height: 16px;
  background: ${props => getNodeTypeColor(props.nodeType)};
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all ${getThemeValue('transitions.fast')};
  z-index: 10;

  &:hover {
    background: ${props => getNodeTypeColor(props.nodeType)};
    transform: scale(1.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  &.react-flow__handle-connecting {
    background: ${getThemeValue('colors.success')};
    box-shadow: 0 0 0 4px ${getThemeValue('colors.success')}40;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 ${getThemeValue('colors.success')}40; }
    70% { box-shadow: 0 0 0 8px ${getThemeValue('colors.success')}00; }
    100% { box-shadow: 0 0 0 0 ${getThemeValue('colors.success')}00; }
  }
`;

const HandleLabel = styled.span`
  position: absolute;
  font-size: ${getThemeValue('typography.fontSize.xs')};
  color: ${getThemeValue('colors.text.secondary')};
  font-weight: ${getThemeValue('typography.fontWeight.medium')};
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: ${getThemeValue('borderRadius.sm')};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
  
  /* Position based on handle position */
  ${props => {
    switch (props.position) {
      case 'left':
        return `
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
        `;
      case 'right':
        return `
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
        `;
      case 'top':
        return `
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        `;
      case 'bottom':
        return `
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        `;
      default:
        return `
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
        `;
    }
  }}
`;

/**
 * BaseNode component that provides a configurable foundation for all node types
 * @param {Object} props - Component props
 * @param {string} props.id - Unique node identifier
 * @param {Object} props.data - Node data
 * @param {Object} props.config - Node configuration object
 * @param {string} props.config.title - Node title/type display name
 * @param {React.ReactNode|Function} props.config.content - Content to render (component or function)
 * @param {Array} props.config.handles - Array of handle configurations
 * @param {Object} props.config.style - Custom styling for the node
 * @param {boolean} props.config.resizable - Whether the node can be resized
 * @param {Function} props.config.validation - Validation function for node data
 * @param {boolean} props.selected - Whether the node is selected
 */
export const BaseNode = ({ id, data, config, selected, ...props }) => {
  // Default configuration
  const defaultConfig = {
    title: 'Node',
    content: null,
    handles: [],
    style: {},
    resizable: false,
    validation: () => true
  };

  // Merge provided config with defaults
  const nodeConfig = { ...defaultConfig, ...config };

  // Extract node type from props or data
  const nodeType = props.type || data?.nodeType || 'default';

  // Render content based on type (component or function)
  const renderContent = () => {
    if (typeof nodeConfig.content === 'function') {
      return nodeConfig.content({ id, data, selected, nodeType, ...props });
    }
    return nodeConfig.content;
  };

  // Render handles based on configuration
  const renderHandles = () => {
    let handles = nodeConfig.handles;
    
    // If handles is a function, call it with node props
    if (typeof handles === 'function') {
      handles = handles({ id, data, selected, nodeType, ...props });
    }

    // Group handles by position
    const handlesByPosition = handles.reduce((acc, handle) => {
      acc[handle.position] = acc[handle.position] || [];
      acc[handle.position].push(handle);
      return acc;
    }, {});

    const renderedHandles = [];

    for (const position in handlesByPosition) {
      const group = handlesByPosition[position];
      const count = group.length;

      group.forEach((handleConfig, index) => {
        const {
          id: handleId,
          type,
          position,
          style: handleStyle = {},
          label,
          ...handleProps
        } = handleConfig;

        const calculatedStyle = { ...handleStyle };

        if (count > 1) {
          if (position === Position.Left || position === Position.Right) {
            calculatedStyle.top = `${(100 * (index + 1)) / (count + 1)}%`;
          } else if (position === Position.Top || position === Position.Bottom) {
            calculatedStyle.left = `${(100 * (index + 1)) / (count + 1)}%`;
          }
        }

        renderedHandles.push(
          <StyledHandle
            key={handleId || `handle-${position}-${index}`}
            id={handleId || `${id}-${type}-${position}-${index}`}
            type={type}
            position={position}
            style={calculatedStyle}
            nodeType={nodeType}
            {...handleProps}
          >
            {label && (
              <HandleLabel position={position}>
                {label}
              </HandleLabel>
            )}
          </StyledHandle>
        );
      });
    }
    
    return renderedHandles;
  };

  return (
    <NodeContainer 
      style={nodeConfig.style} 
      className={`base-node ${selected ? 'selected' : ''}`}
      nodeType={nodeType}
      resizable={nodeConfig.resizable}
    >
      {renderHandles()}
      
      <NodeHeader nodeType={nodeType}>
        {nodeConfig.title}
      </NodeHeader>
      
      <NodeContent>
        {renderContent()}
      </NodeContent>
    </NodeContainer>
  );
};

/**
 * Handle configuration helper
 * @param {string} id - Handle identifier
 * @param {string} type - Handle type ('source' or 'target')
 * @param {Position} position - Handle position (Position.Left, Right, Top, Bottom)
 * @param {Object} style - Custom handle styling
 * @param {string} label - Optional handle label
 * @returns {Object} Handle configuration object
 */
export const createHandle = (id, type, position, style = {}, label = null) => ({
  id,
  type,
  position,
  style,
  label
});

/**
 * Common handle positions for convenience
 */
export const HandlePositions = {
  LEFT: Position.Left,
  RIGHT: Position.Right,
  TOP: Position.Top,
  BOTTOM: Position.Bottom
};