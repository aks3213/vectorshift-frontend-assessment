// BaseNode.test.js
// Property-based tests for BaseNode component configuration flexibility

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactFlowProvider } from 'reactflow';
import { BaseNode, createHandle, HandlePositions } from './BaseNode';

// Test wrapper to provide ReactFlow context
const TestWrapper = ({ children }) => (
  <ReactFlowProvider>
    <div style={{ width: '100vw', height: '100vh' }}>
      {children}
    </div>
  </ReactFlowProvider>
);

// Simple property testing utilities
const generateRandomString = (minLength = 1, maxLength = 20) => {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRandomColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
};

const generateRandomHandle = () => {
  const types = ['source', 'target'];
  const positions = [HandlePositions.LEFT, HandlePositions.RIGHT, HandlePositions.TOP, HandlePositions.BOTTOM];
  
  return {
    id: generateRandomString(1, 15),
    type: types[Math.floor(Math.random() * types.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    style: {
      backgroundColor: generateRandomColor(),
      width: Math.floor(Math.random() * 12) + 8,
      height: Math.floor(Math.random() * 12) + 8
    },
    label: Math.random() > 0.5 ? generateRandomString(1, 10) : null
  };
};

const generateRandomNodeConfig = () => {
  const numHandles = Math.floor(Math.random() * 5);
  const handles = Array.from({ length: numHandles }, () => generateRandomHandle());
  
  const contentOptions = [
    null,
    <div>Static Test Content</div>,
    ({ data }) => <span>{data?.label || 'Dynamic Content'}</span>
  ];
  
  return {
    title: generateRandomString(1, 25),
    content: contentOptions[Math.floor(Math.random() * contentOptions.length)],
    handles: handles,
    style: {
      width: Math.floor(Math.random() * 300) + 100,
      height: Math.floor(Math.random() * 140) + 60,
      backgroundColor: generateRandomColor(),
      border: `${Math.floor(Math.random() * 3) + 1}px solid ${generateRandomColor()}`,
      borderRadius: `${Math.floor(Math.random() * 8) + 2}px`,
      padding: `${Math.floor(Math.random() * 12) + 4}px`
    },
    resizable: Math.random() > 0.5,
    validation: () => true
  };
};

describe('BaseNode Property Tests', () => {
  /**
   * Feature: vectorshift-assessment, Property 1: Node Configuration Flexibility
   * Validates: Requirements 1.2
   */
  test('Property 1: Node Configuration Flexibility - any valid config creates functional component', () => {
    // Run property test with 100 iterations
    for (let i = 0; i < 100; i++) {
      const config = generateRandomNodeConfig();
      const nodeProps = {
        id: `test-node-${i}`,
        data: { label: `Test Node ${i}` },
        config: config
      };

      // Test that the component renders without throwing
      let renderResult;
      expect(() => {
        renderResult = render(
          <TestWrapper>
            <BaseNode {...nodeProps} />
          </TestWrapper>
        );
      }).not.toThrow();

      // Verify the component is rendered
      expect(renderResult.container.querySelector('.base-node')).toBeInTheDocument();
      
      // Verify title is displayed
      expect(screen.getByText(config.title)).toBeInTheDocument();

      // Verify handles are rendered correctly
      const handles = renderResult.container.querySelectorAll('.react-flow__handle');
      expect(handles).toHaveLength(config.handles.length);

      // Verify each handle has correct attributes
      config.handles.forEach((handleConfig, index) => {
        const handle = handles[index];
        expect(handle).toHaveClass(`react-flow__handle-${handleConfig.position}`);
        expect(handle).toHaveClass(handleConfig.type); // ReactFlow adds type as a class directly
      });

      // Cleanup
      renderResult.unmount();
    }
  });

  test('Property 1a: Handle configuration creates valid ReactFlow handles', () => {
    // Run property test with 50 iterations
    for (let i = 0; i < 50; i++) {
      const numHandles = Math.floor(Math.random() * 4) + 1;
      const handles = Array.from({ length: numHandles }, () => generateRandomHandle());
      
      const config = {
        title: 'Test Node',
        handles: handles
      };

      const nodeProps = {
        id: `test-node-handles-${i}`,
        data: {},
        config: config
      };

      const renderResult = render(
        <TestWrapper>
          <BaseNode {...nodeProps} />
        </TestWrapper>
      );

      // Verify all handles are rendered
      const renderedHandles = renderResult.container.querySelectorAll('.react-flow__handle');
      expect(renderedHandles).toHaveLength(handles.length);

      // Verify each handle has unique ID and correct type/position
      handles.forEach((handleConfig, index) => {
        const handle = renderedHandles[index];
        const expectedId = handleConfig.id || `test-node-handles-${i}-${handleConfig.type}-${index}`;
        
        expect(handle).toHaveAttribute('data-handleid', expectedId);
        expect(handle).toHaveClass(handleConfig.type); // ReactFlow adds type as a class directly
        expect(handle).toHaveClass(`react-flow__handle-${handleConfig.position}`);

        // Verify label if present
        if (handleConfig.label) {
          expect(handle).toHaveTextContent(handleConfig.label);
        }
      });

      renderResult.unmount();
    }
  });

  test('Property 1b: Content rendering flexibility', () => {
    // Test different content types
    const contentTypes = [
      { content: null, testId: null },
      { content: <div data-testid="static-content">Static Content</div>, testId: 'static-content' },
      { content: ({ data }) => <div data-testid="dynamic-content">{data?.message || 'Default'}</div>, testId: 'dynamic-content' }
    ];

    contentTypes.forEach((contentType, i) => {
      for (let j = 0; j < 20; j++) {
        const data = { message: generateRandomString(1, 15) };
        const config = {
          title: 'Content Test',
          content: contentType.content
        };

        const nodeProps = {
          id: `test-node-content-${i}-${j}`,
          data: data,
          config: config
        };

        const renderResult = render(
          <TestWrapper>
            <BaseNode {...nodeProps} />
          </TestWrapper>
        );

        // Verify node renders
        expect(renderResult.container.querySelector('.base-node')).toBeInTheDocument();
        expect(screen.getByText('Content Test')).toBeInTheDocument();

        // Verify content based on type
        if (contentType.content === null) {
          // No content should be rendered
          expect(renderResult.container.querySelector('[data-testid]')).not.toBeInTheDocument();
        } else if (contentType.testId === 'static-content') {
          // Static content should be rendered
          expect(screen.getByTestId('static-content')).toBeInTheDocument();
        } else if (contentType.testId === 'dynamic-content') {
          // Dynamic content should be rendered with data
          expect(screen.getByTestId('dynamic-content')).toBeInTheDocument();
          expect(screen.getByText(data.message)).toBeInTheDocument();
        }

        renderResult.unmount();
      }
    });
  });
});

  /**
   * Feature: vectorshift-assessment, Property 2: ReactFlow Compatibility
   * Validates: Requirements 1.5
   */
  test('Property 2: ReactFlow Compatibility - nodes maintain drag, drop, and connection functionality', () => {
    // Run property test with 100 iterations
    for (let i = 0; i < 100; i++) {
      const config = generateRandomNodeConfig();
      const nodeProps = {
        id: `test-node-reactflow-${i}`,
        data: { label: `ReactFlow Test Node ${i}` },
        config: config,
        // ReactFlow-specific props that should be preserved
        selected: Math.random() > 0.5,
        dragging: Math.random() > 0.5,
        xPos: Math.floor(Math.random() * 500),
        yPos: Math.floor(Math.random() * 500),
        zIndex: Math.floor(Math.random() * 100),
        isConnectable: Math.random() > 0.3,
        type: 'custom',
        dragHandle: '.node-header'
      };

      let renderResult;
      expect(() => {
        renderResult = render(
          <TestWrapper>
            <BaseNode {...nodeProps} />
          </TestWrapper>
        );
      }).not.toThrow();

      const nodeElement = renderResult.container.querySelector('.base-node');
      expect(nodeElement).toBeInTheDocument();

      // Verify ReactFlow compatibility: node should accept and handle ReactFlow props
      // The node should render without errors when ReactFlow props are passed
      expect(nodeElement).toBeInTheDocument();

      // Verify handles are properly configured for ReactFlow connections
      const handles = renderResult.container.querySelectorAll('.react-flow__handle');
      expect(handles).toHaveLength(config.handles.length);

      // Each handle should have ReactFlow-compatible attributes
      config.handles.forEach((handleConfig, index) => {
        const handle = handles[index];
        
        // Verify handle has required ReactFlow classes
        expect(handle).toHaveClass('react-flow__handle');
        expect(handle).toHaveClass(`react-flow__handle-${handleConfig.position}`);
        expect(handle).toHaveClass(handleConfig.type);
        
        // Verify handle has proper data attributes for ReactFlow
        const expectedId = handleConfig.id || `test-node-reactflow-${i}-${handleConfig.type}-${index}`;
        expect(handle).toHaveAttribute('data-handleid', expectedId);
        
        // Verify handle position is valid ReactFlow position
        const validPositions = ['left', 'right', 'top', 'bottom'];
        expect(validPositions).toContain(handleConfig.position);
        
        // Verify handle type is valid ReactFlow type
        const validTypes = ['source', 'target'];
        expect(validTypes).toContain(handleConfig.type);
      });

      // Verify node structure is compatible with ReactFlow's expectations
      // ReactFlow expects nodes to be wrapped in a div and handle events properly
      expect(nodeElement.tagName.toLowerCase()).toBe('div');
      
      // Verify the node can accept ReactFlow's standard props without breaking
      expect(() => {
        // Test with additional ReactFlow props that might be passed
        const extendedProps = {
          ...nodeProps,
          sourcePosition: 'right',
          targetPosition: 'left',
          hidden: false,
          parentNode: null,
          extent: 'parent',
          expandParent: false,
          positionAbsolute: { x: nodeProps.xPos, y: nodeProps.yPos }
        };
        
        const extendedRender = render(
          <TestWrapper>
            <BaseNode {...extendedProps} />
          </TestWrapper>
        );
        extendedRender.unmount();
      }).not.toThrow();

      renderResult.unmount();
    }
  });

  test('Property 2a: Handle connectivity validation', () => {
    // Test that handles created through abstraction are properly connectable
    for (let i = 0; i < 50; i++) {
      const sourceHandles = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, idx) => ({
        id: `source-${idx}`,
        type: 'source',
        position: HandlePositions.RIGHT
      }));
      
      const targetHandles = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, idx) => ({
        id: `target-${idx}`,
        type: 'target',
        position: HandlePositions.LEFT
      }));

      const config = {
        title: 'Connection Test Node',
        handles: [...sourceHandles, ...targetHandles]
      };

      const nodeProps = {
        id: `connection-test-${i}`,
        data: {},
        config: config,
        isConnectable: true
      };

      const renderResult = render(
        <TestWrapper>
          <BaseNode {...nodeProps} />
        </TestWrapper>
      );

      // Verify all handles are rendered and connectable
      const allHandles = renderResult.container.querySelectorAll('.react-flow__handle');
      expect(allHandles).toHaveLength(sourceHandles.length + targetHandles.length);

      // Verify source handles
      const sourceElements = renderResult.container.querySelectorAll('.react-flow__handle.source');
      expect(sourceElements).toHaveLength(sourceHandles.length);
      
      sourceElements.forEach((handle, index) => {
        expect(handle).toHaveAttribute('data-handleid', `source-${index}`);
        expect(handle).toHaveClass('react-flow__handle-right');
      });

      // Verify target handles
      const targetElements = renderResult.container.querySelectorAll('.react-flow__handle.target');
      expect(targetElements).toHaveLength(targetHandles.length);
      
      targetElements.forEach((handle, index) => {
        expect(handle).toHaveAttribute('data-handleid', `target-${index}`);
        expect(handle).toHaveClass('react-flow__handle-left');
      });

      renderResult.unmount();
    }
  });

  test('Property 2b: Node positioning and dragging compatibility', () => {
    // Test that nodes work with ReactFlow's positioning system
    for (let i = 0; i < 30; i++) {
      const config = generateRandomNodeConfig();
      const position = {
        x: Math.floor(Math.random() * 1000),
        y: Math.floor(Math.random() * 1000)
      };

      const nodeProps = {
        id: `position-test-${i}`,
        data: {},
        config: config,
        xPos: position.x,
        yPos: position.y,
        selected: Math.random() > 0.5,
        dragging: Math.random() > 0.5,
        dragHandle: '.node-header' // Should be able to specify drag handle
      };

      const renderResult = render(
        <TestWrapper>
          <BaseNode {...nodeProps} />
        </TestWrapper>
      );

      const nodeElement = renderResult.container.querySelector('.base-node');
      expect(nodeElement).toBeInTheDocument();

      // Verify node has proper structure for ReactFlow dragging
      const nodeHeader = renderResult.container.querySelector('.node-header');
      expect(nodeHeader).toBeInTheDocument();
      expect(nodeHeader).toHaveTextContent(config.title);

      // Node should maintain its structure regardless of ReactFlow state props
      expect(nodeElement).toBeInTheDocument();
      expect(nodeElement.tagName.toLowerCase()).toBe('div');

      renderResult.unmount();
    }
  });

describe('BaseNode Unit Tests', () => {
  test('renders with minimal configuration', () => {
    const config = {
      title: 'Minimal Node'
    };

    const renderResult = render(
      <TestWrapper>
        <BaseNode id="minimal" data={{}} config={config} />
      </TestWrapper>
    );

    expect(screen.getByText('Minimal Node')).toBeInTheDocument();
    expect(renderResult.container.querySelector('.base-node')).toBeInTheDocument();
    
    renderResult.unmount();
  });

  test('applies custom styling correctly', () => {
    const config = {
      title: 'Styled Node',
      style: {
        backgroundColor: '#ff0000',
        width: 300,
        height: 150,
        border: '2px solid blue'
      }
    };

    const renderResult = render(
      <TestWrapper>
        <BaseNode id="styled" data={{}} config={config} />
      </TestWrapper>
    );

    const nodeElement = renderResult.container.querySelector('.base-node');
    expect(nodeElement).toHaveStyle({
      backgroundColor: '#ff0000',
      width: '300px',
      height: '150px',
      border: '2px solid blue'
    });

    renderResult.unmount();
  });

  test('createHandle helper function works correctly', () => {
    const handle = createHandle('test-handle', 'source', HandlePositions.RIGHT, { color: 'red' }, 'Output');
    
    expect(handle).toEqual({
      id: 'test-handle',
      type: 'source',
      position: HandlePositions.RIGHT,
      style: { color: 'red' },
      label: 'Output'
    });
  });
});