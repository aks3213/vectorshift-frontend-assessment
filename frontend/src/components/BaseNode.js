// BaseNode.js
// Base component for all node types with configurable handles and content

import React from 'react';
import { Handle, Position } from 'reactflow';
import styled from '@emotion/styled';
import { getThemeValue } from '../styled';

// Styled components for BaseNode
const NodeContainer = styled.div`
  background-color: ${getThemeValue('colors.surface')};
  border: 1px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.md')};
  padding: ${getThemeValue('spacing.md')};
  box-shadow: ${getThemeValue('shadows.sm')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  transition: all ${getThemeValue('transitions.fast')};
  position: relative;
  min-width: 200px;
  max-width: 300px;
  min-height: 80px;
  overflow: hidden;
  word-wrap: break-word;

  &:hover {
    box-shadow: ${getThemeValue('shadows.md')};
    border-color: ${getThemeValue('colors.secondary')};
  }

  &.selected {
    border-color: ${getThemeValue('colors.secondary')};
    box-shadow: ${getThemeValue('shadows.lg')};
  }
`;

const NodeHeader = styled.div`
  font-weight: ${getThemeValue('typography.fontWeight.semibold')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  color: ${getThemeValue('colors.text.primary')};
  margin-bottom: ${getThemeValue('spacing.sm')};
  text-align: center;
  border-bottom: 1px solid ${getThemeValue('colors.border')};
  padding-bottom: ${getThemeValue('spacing.xs')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NodeContent = styled.div`
  color: ${getThemeValue('colors.text.primary')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  line-height: ${getThemeValue('typography.lineHeight.normal')};
  overflow: hidden;
  
  /* Ensure form fields don't overflow */
  & > div {
    max-width: 100%;
  }
`;

const StyledHandle = styled(Handle)`
  width: 12px;
  height: 12px;
  background-color: ${getThemeValue('colors.secondary')};
  border: 2px solid ${getThemeValue('colors.surface')};
  transition: all ${getThemeValue('transitions.fast')};

  &:hover {
    background-color: ${getThemeValue('colors.primary')};
    transform: scale(1.2);
  }

  &.react-flow__handle-connecting {
    background-color: ${getThemeValue('colors.success')};
  }
`;

const HandleLabel = styled.span`
  font-size: ${getThemeValue('typography.fontSize.xs')};
  color: ${getThemeValue('colors.text.secondary')};
  margin-left: ${getThemeValue('spacing.xs')};
  font-weight: ${getThemeValue('typography.fontWeight.medium')};
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

  // Render content based on type (component or function)
  const renderContent = () => {
    if (typeof nodeConfig.content === 'function') {
      return nodeConfig.content({ id, data, selected, ...props });
    }
    return nodeConfig.content;
  };

  // Render handles based on configuration
  const renderHandles = () => {
    let handles = nodeConfig.handles;
    
    // If handles is a function, call it with node props
    if (typeof handles === 'function') {
      handles = handles({ id, data, selected, ...props });
    }
    
    return handles.map((handleConfig, index) => {
      const {
        id: handleId,
        type,
        position,
        style: handleStyle = {},
        label,
        ...handleProps
      } = handleConfig;

      return (
        <StyledHandle
          key={handleId || `handle-${index}`}
          id={handleId || `${id}-${type}-${index}`}
          type={type}
          position={position}
          style={handleStyle}
          {...handleProps}
        >
          {label && <HandleLabel>{label}</HandleLabel>}
        </StyledHandle>
      );
    });
  };

  return (
    <NodeContainer 
      style={nodeConfig.style} 
      className={`base-node ${selected ? 'selected' : ''}`}
    >
      {renderHandles()}
      
      <NodeHeader>
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