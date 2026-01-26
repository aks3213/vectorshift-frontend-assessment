// nodeFactory.js
// Factory function for creating node types using BaseNode abstraction

import React from 'react';
import { BaseNode, createHandle, HandlePositions } from './BaseNode';

/**
 * Factory function to create node components using BaseNode abstraction
 * @param {Object} config - Node configuration object
 * @param {string} config.title - Node title/type display name
 * @param {React.ReactNode|Function} config.content - Content to render (component or function)
 * @param {Array} config.handles - Array of handle configurations
 * @param {Object} config.style - Custom styling for the node
 * @param {boolean} config.resizable - Whether the node can be resized
 * @param {Function} config.validation - Validation function for node data
 * @returns {React.Component} Node component that can be used with ReactFlow
 */
export const createNode = (config) => {
  // Return a React component that uses BaseNode with the provided configuration
  const NodeComponent = (props) => {
    return <BaseNode config={config} {...props} />;
  };

  // Set display name for debugging
  NodeComponent.displayName = `${config.title || 'Custom'}Node`;

  return NodeComponent;
};

/**
 * Helper function to create common node configurations
 */
export const createNodeConfig = ({
  title,
  content,
  handles = [],
  style = {},
  resizable = false,
  validation = () => true
}) => ({
  title,
  content,
  handles,
  style: {
    width: 200,
    height: 80,
    border: '1px solid black',
    backgroundColor: 'white',
    borderRadius: '4px',
    padding: '8px',
    ...style
  },
  resizable,
  validation
});

/**
 * Common handle configurations for reuse
 */
export const CommonHandles = {
  // Single source handle on the right
  singleSource: (id) => [
    createHandle(`${id}-output`, 'source', HandlePositions.RIGHT)
  ],
  
  // Single target handle on the left
  singleTarget: (id) => [
    createHandle(`${id}-input`, 'target', HandlePositions.LEFT)
  ],
  
  // Both source and target handles
  sourceAndTarget: (id) => [
    createHandle(`${id}-input`, 'target', HandlePositions.LEFT),
    createHandle(`${id}-output`, 'source', HandlePositions.RIGHT)
  ],
  
  // Multiple target handles (for LLM node)
  multipleTargets: (id, targets) => targets.map((target, index) => 
    createHandle(
      `${id}-${target}`, 
      'target', 
      HandlePositions.LEFT, 
      { top: `${(100 * (index + 1)) / (targets.length + 1)}%` }
    )
  ),
  
  // LLM specific handles
  llmHandles: (id) => [
    createHandle(`${id}-system`, 'target', HandlePositions.LEFT, { top: `${100/3}%` }),
    createHandle(`${id}-prompt`, 'target', HandlePositions.LEFT, { top: `${200/3}%` }),
    createHandle(`${id}-response`, 'source', HandlePositions.RIGHT)
  ]
};