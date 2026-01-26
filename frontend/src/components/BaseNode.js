// BaseNode.js
// Base component for all node types with configurable handles and content

import React from 'react';
import { Handle, Position } from 'reactflow';

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
 */
export const BaseNode = ({ id, data, config, ...props }) => {
  // Default configuration
  const defaultConfig = {
    title: 'Node',
    content: null,
    handles: [],
    style: {
      width: 200,
      height: 80,
      border: '1px solid black',
      backgroundColor: 'white',
      borderRadius: '4px',
      padding: '8px'
    },
    resizable: false,
    validation: () => true
  };

  // Merge provided config with defaults
  const nodeConfig = { ...defaultConfig, ...config };

  // Render content based on type (component or function)
  const renderContent = () => {
    if (typeof nodeConfig.content === 'function') {
      return nodeConfig.content({ id, data, ...props });
    }
    return nodeConfig.content;
  };

  // Render handles based on configuration
  const renderHandles = () => {
    let handles = nodeConfig.handles;
    
    // If handles is a function, call it with node props
    if (typeof handles === 'function') {
      handles = handles({ id, data, ...props });
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
        <Handle
          key={handleId || `handle-${index}`}
          id={handleId || `${id}-${type}-${index}`}
          type={type}
          position={position}
          style={handleStyle}
          {...handleProps}
        >
          {label && <span style={{ fontSize: '10px', marginLeft: '4px' }}>{label}</span>}
        </Handle>
      );
    });
  };

  return (
    <div style={nodeConfig.style} className="base-node">
      {renderHandles()}
      
      <div className="node-header" style={{ marginBottom: '4px', fontWeight: 'bold' }}>
        {nodeConfig.title}
      </div>
      
      <div className="node-content">
        {renderContent()}
      </div>
    </div>
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