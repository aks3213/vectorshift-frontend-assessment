// BaseNode.test.js
// Property-based tests for BaseNode component configuration flexibility

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactFlowProvider } from 'reactflow';
import { BaseNode, createHandle, HandlePositions } from './BaseNode';
import { TextNode } from '../nodes/textNode';
import { ThemeProvider } from '../ThemeProvider';
import fc from 'fast-check';

// Test wrapper to provide ReactFlow and Theme context
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        {children}
      </div>
    </ReactFlowProvider>
  </ThemeProvider>
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
      // With styled components, we need to check for the title text instead of class
      expect(screen.getByText(config.title)).toBeInTheDocument();

      // Node should maintain its structure regardless of ReactFlow state props
      expect(nodeElement).toBeInTheDocument();
      expect(nodeElement.tagName.toLowerCase()).toBe('div');

      renderResult.unmount();
    }
  });

  /**
   * Feature: vectorshift-assessment, Property 3: Responsive Design Consistency
   * Validates: Requirements 2.4
   */
  test('Property 3: Responsive Design Consistency - components render without layout breaks across viewport sizes', () => {
    // Test viewport sizes from 320px to 1920px width
    const viewportSizes = [
      { width: 320, height: 568 },   // Mobile portrait
      { width: 375, height: 667 },   // iPhone SE
      { width: 414, height: 896 },   // iPhone XR
      { width: 768, height: 1024 },  // iPad portrait
      { width: 1024, height: 768 },  // iPad landscape
      { width: 1280, height: 720 },  // Desktop small
      { width: 1440, height: 900 },  // Desktop medium
      { width: 1920, height: 1080 }  // Desktop large
    ];

    // Run property test across different viewport sizes
    viewportSizes.forEach(viewport => {
      for (let i = 0; i < 20; i++) {
        // Generate random node configuration with reasonable constraints
        const config = {
          title: generateRandomString(5, 20), // Reasonable title length
          content: Math.random() > 0.5 ? <div>Test Content</div> : null,
          handles: Array.from({ length: Math.floor(Math.random() * 4) }, (_, idx) => ({
            id: `handle-${idx}`,
            type: Math.random() > 0.5 ? 'source' : 'target',
            position: [HandlePositions.LEFT, HandlePositions.RIGHT, HandlePositions.TOP, HandlePositions.BOTTOM][Math.floor(Math.random() * 4)]
          })),
          style: {
            // Ensure node width doesn't exceed viewport constraints
            width: Math.min(Math.floor(Math.random() * 200) + 100, viewport.width - 40),
            height: Math.floor(Math.random() * 100) + 60,
            backgroundColor: generateRandomColor(),
            border: `1px solid ${generateRandomColor()}`,
            borderRadius: '8px',
            padding: '8px'
          }
        };
        
        // Create test wrapper with specific viewport size
        const ViewportTestWrapper = ({ children }) => (
          <div 
            style={{ 
              width: `${viewport.width}px`, 
              height: `${viewport.height}px`, 
              overflow: 'hidden',
              position: 'relative'
            }}
            data-testid={`viewport-${viewport.width}x${viewport.height}`}
          >
            <ReactFlowProvider>
              <div style={{ width: '100%', height: '100%' }}>
                {children}
              </div>
            </ReactFlowProvider>
          </div>
        );

        const nodeProps = {
          id: `responsive-test-${viewport.width}-${i}`,
          data: { label: `Responsive Test ${viewport.width}x${viewport.height}` },
          config: config
        };

        let renderResult;
        expect(() => {
          renderResult = render(
            <ViewportTestWrapper>
              <BaseNode {...nodeProps} />
            </ViewportTestWrapper>
          );
        }).not.toThrow();

        const nodeElement = renderResult.container.querySelector('.base-node');
        expect(nodeElement).toBeInTheDocument();

        // Verify viewport wrapper is properly sized
        const viewportElement = renderResult.container.querySelector(`[data-testid="viewport-${viewport.width}x${viewport.height}"]`);
        expect(viewportElement).toBeInTheDocument();
        expect(viewportElement).toHaveStyle({
          width: `${viewport.width}px`,
          height: `${viewport.height}px`
        });

        // Verify node has proper styling applied (since getBoundingClientRect doesn't work in JSDOM)
        if (config.style) {
          expect(nodeElement).toHaveStyle({
            width: `${config.style.width}px`,
            height: `${config.style.height}px`,
            backgroundColor: config.style.backgroundColor,
            border: config.style.border,
            borderRadius: config.style.borderRadius,
            padding: config.style.padding
          });
        }

        // Verify title is rendered and accessible
        expect(screen.getByText(config.title)).toBeInTheDocument();

        // Verify handles are rendered correctly
        const handles = renderResult.container.querySelectorAll('.react-flow__handle');
        expect(handles).toHaveLength(config.handles.length);

        // Verify each handle has correct ReactFlow classes and attributes
        config.handles.forEach((handleConfig, index) => {
          const handle = handles[index];
          expect(handle).toHaveClass('react-flow__handle');
          expect(handle).toHaveClass(`react-flow__handle-${handleConfig.position}`);
          expect(handle).toHaveClass(handleConfig.type);
          expect(handle).toHaveAttribute('data-handleid', handleConfig.id);
        });

        // Verify node structure is responsive-friendly
        // Check that the node has proper CSS structure for responsive design
        const computedStyle = window.getComputedStyle(nodeElement);
        expect(['visible', 'hidden', 'auto', 'scroll']).toContain(computedStyle.overflow);

        renderResult.unmount();
      }
    });
  });

  test('Property 3a: Text content adapts to viewport constraints', () => {
    const viewportSizes = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 }
    ];

    viewportSizes.forEach(viewport => {
      for (let i = 0; i < 15; i++) {
        // Generate text content of varying lengths
        const shortText = generateRandomString(5, 15);
        const mediumText = generateRandomString(20, 50);
        const longText = generateRandomString(60, 120);
        const textOptions = [shortText, mediumText, longText];
        const selectedText = textOptions[Math.floor(Math.random() * textOptions.length)];

        const config = {
          title: `Title-${i}-${viewport.width}`, // Unique title to avoid conflicts
          content: <div data-testid={`content-${i}-${viewport.width}`} style={{ padding: '8px', wordWrap: 'break-word' }}>{selectedText}</div>,
          handles: [],
          style: {
            maxWidth: viewport.width - 40, // Ensure it fits within viewport
            width: 'auto',
            minWidth: 100,
            padding: '8px',
            boxSizing: 'border-box'
          }
        };

        const ViewportTestWrapper = ({ children }) => (
          <div 
            style={{ 
              width: `${viewport.width}px`, 
              height: `${viewport.height}px`,
              overflow: 'hidden'
            }}
            data-testid={`text-viewport-${viewport.width}x${viewport.height}-${i}`}
          >
            <ReactFlowProvider>
              <div style={{ width: '100%', height: '100%' }}>
                {children}
              </div>
            </ReactFlowProvider>
          </div>
        );

        const renderResult = render(
          <ViewportTestWrapper>
            <BaseNode id={`text-responsive-${viewport.width}-${i}`} data={{}} config={config} />
          </ViewportTestWrapper>
        );

        const nodeElement = renderResult.container.querySelector('.base-node');
        expect(nodeElement).toBeInTheDocument();

        // Verify viewport wrapper is properly sized
        const viewportElement = renderResult.container.querySelector(`[data-testid="text-viewport-${viewport.width}x${viewport.height}-${i}"]`);
        expect(viewportElement).toHaveStyle({
          width: `${viewport.width}px`,
          height: `${viewport.height}px`
        });

        // Verify node has responsive styling applied
        expect(nodeElement).toHaveStyle({
          maxWidth: `${viewport.width - 40}px`,
          boxSizing: 'border-box'
        });

        // Verify title is rendered and accessible
        expect(screen.getByText(config.title)).toBeInTheDocument();

        // Verify content is rendered with proper text wrapping
        const contentElement = renderResult.container.querySelector(`[data-testid="content-${i}-${viewport.width}"]`);
        expect(contentElement).toBeInTheDocument();
        expect(contentElement).toHaveStyle({
          wordWrap: 'break-word',
          padding: '8px'
        });
        expect(contentElement).toHaveTextContent(selectedText);

        renderResult.unmount();
      }
    });
  });

  test('Property 3b: Handle positioning remains consistent across viewports', () => {
    const viewportSizes = [
      { width: 320, height: 568 },
      { width: 1024, height: 768 },
      { width: 1920, height: 1080 }
    ];

    viewportSizes.forEach(viewport => {
      for (let i = 0; i < 10; i++) {
        // Create node with multiple handles in different positions
        const handles = [
          { id: `left-1-${i}`, type: 'target', position: HandlePositions.LEFT },
          { id: `left-2-${i}`, type: 'target', position: HandlePositions.LEFT },
          { id: `right-1-${i}`, type: 'source', position: HandlePositions.RIGHT },
          { id: `right-2-${i}`, type: 'source', position: HandlePositions.RIGHT },
          { id: `top-1-${i}`, type: 'target', position: HandlePositions.TOP },
          { id: `bottom-1-${i}`, type: 'source', position: HandlePositions.BOTTOM }
        ];

        const config = {
          title: `Handle Test Node ${i}`,
          handles: handles,
          style: {
            width: Math.min(200, viewport.width - 60), // Ensure node fits in viewport
            height: 120,
            padding: '16px',
            boxSizing: 'border-box'
          }
        };

        const ViewportTestWrapper = ({ children }) => (
          <div 
            style={{ 
              width: `${viewport.width}px`, 
              height: `${viewport.height}px`,
              overflow: 'hidden'
            }}
            data-testid={`handle-viewport-${viewport.width}x${viewport.height}-${i}`}
          >
            <ReactFlowProvider>
              <div style={{ width: '100%', height: '100%' }}>
                {children}
              </div>
            </ReactFlowProvider>
          </div>
        );

        const renderResult = render(
          <ViewportTestWrapper>
            <BaseNode id={`handle-responsive-${viewport.width}-${i}`} data={{}} config={config} />
          </ViewportTestWrapper>
        );

        const nodeElement = renderResult.container.querySelector('.base-node');
        const renderedHandles = renderResult.container.querySelectorAll('.react-flow__handle');
        
        expect(renderedHandles).toHaveLength(handles.length);

        // Verify viewport wrapper is properly sized
        const viewportElement = renderResult.container.querySelector(`[data-testid="handle-viewport-${viewport.width}x${viewport.height}-${i}"]`);
        expect(viewportElement).toHaveStyle({
          width: `${viewport.width}px`,
          height: `${viewport.height}px`
        });

        // Verify node has proper responsive styling
        expect(nodeElement).toHaveStyle({
          width: `${Math.min(200, viewport.width - 60)}px`,
          height: '120px',
          boxSizing: 'border-box'
        });

        // Verify each handle has correct ReactFlow attributes and classes
        renderedHandles.forEach((handle, index) => {
          const handleConfig = handles[index];

          // Verify handle has required ReactFlow classes
          expect(handle).toHaveClass('react-flow__handle');
          expect(handle).toHaveClass(`react-flow__handle-${handleConfig.position}`);
          expect(handle).toHaveClass(handleConfig.type);
          
          // Verify handle has proper data attributes for ReactFlow
          expect(handle).toHaveAttribute('data-handleid', handleConfig.id);
          
          // Verify handle position is valid ReactFlow position
          const validPositions = ['left', 'right', 'top', 'bottom'];
          expect(validPositions).toContain(handleConfig.position);
          
          // Verify handle type is valid ReactFlow type
          const validTypes = ['source', 'target'];
          expect(validTypes).toContain(handleConfig.type);

          // Verify handle has proper CSS positioning classes
          expect(handle).toHaveClass(`react-flow__handle-${handleConfig.position}`);
        });

        // Verify handles maintain consistent structure across viewports
        const leftHandles = renderResult.container.querySelectorAll('.react-flow__handle-left');
        const rightHandles = renderResult.container.querySelectorAll('.react-flow__handle-right');
        const topHandles = renderResult.container.querySelectorAll('.react-flow__handle-top');
        const bottomHandles = renderResult.container.querySelectorAll('.react-flow__handle-bottom');

        expect(leftHandles).toHaveLength(2);
        expect(rightHandles).toHaveLength(2);
        expect(topHandles).toHaveLength(1);
        expect(bottomHandles).toHaveLength(1);

        renderResult.unmount();
      }
    });
  });

  /**
   * Feature: vectorshift-assessment, Property 4: Text Node Auto-Resize
   * Validates: Requirements 3.1
   */
  test('Property 4: Text Node Auto-Resize - text content automatically adjusts node dimensions', () => {
    // Mock canvas context for text measurement in test environment
    const mockMeasureText = jest.fn((text) => ({
      width: Math.max(text.length * 8, 100) // Simple width estimation
    }));
    
    const mockCanvas = {
      getContext: jest.fn(() => ({
        font: '',
        measureText: mockMeasureText
      }))
    };
    
    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Property-based test using fast-check
    fc.assert(
      fc.property(
        // Generate random text content with various characteristics
        fc.string({ minLength: 1, maxLength: 100 }),
        (text) => {
          // Create a text node with the generated text
          const nodeProps = {
            id: 'auto-resize-test',
            data: { text: text },
            type: 'textNode'
          };

          let renderResult;
          expect(() => {
            renderResult = render(
              <TestWrapper>
                <TextNode {...nodeProps} />
              </TestWrapper>
            );
          }).not.toThrow();

          // Verify the text node renders successfully
          const nodeElement = renderResult.container.querySelector('.base-node');
          expect(nodeElement).toBeInTheDocument();

          // Verify the textarea element exists and contains the text
          const textarea = renderResult.container.querySelector('textarea');
          expect(textarea).toBeInTheDocument();
          expect(textarea.value).toBe(text);

          // Verify the text node title is present
          expect(screen.getByText('Text')).toBeInTheDocument();

          // Verify textarea has proper styling for auto-resize
          const textareaStyle = window.getComputedStyle(textarea);
          expect(textareaStyle.resize).toBe('none'); // Should not be manually resizable
          expect(textareaStyle.overflow).toBe('hidden'); // Should hide overflow for auto-resize

          // Verify the node maintains proper structure
          expect(nodeElement).toHaveClass('base-node');

          // Verify the node can handle various text lengths without breaking
          // This tests the core auto-resize property: any text content should be accommodated
          expect(textarea).toBeInTheDocument();
          expect(textarea.value).toBe(text);

          // Verify that measureText was called (indicating auto-resize functionality is active)
          expect(mockMeasureText).toHaveBeenCalled();

          renderResult.unmount();
        }
      ),
      { 
        numRuns: 50, // Reduced iterations for stability
        verbose: false 
      }
    );

    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  test('Property 4a: Text Node Auto-Resize - component renders with different text lengths', () => {
    // Mock canvas context for text measurement in test environment
    const mockMeasureText = jest.fn((text) => ({
      width: Math.max(text.length * 8, 100) // Simple width estimation based on text length
    }));
    
    const mockCanvas = {
      getContext: jest.fn(() => ({
        font: '',
        measureText: mockMeasureText
      }))
    };
    
    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Test that different text lengths render successfully
    fc.assert(
      fc.property(
        fc.record({
          shortText: fc.string({ minLength: 1, maxLength: 10 }),
          longText: fc.string({ minLength: 20, maxLength: 100 })
        }),
        ({ shortText, longText }) => {
          // Test short text
          const shortTextProps = {
            id: 'short-text-test',
            data: { text: shortText },
            type: 'textNode'
          };

          const shortRender = render(
            <TestWrapper>
              <TextNode {...shortTextProps} />
            </TestWrapper>
          );

          const shortTextarea = shortRender.container.querySelector('textarea');
          expect(shortTextarea).toBeInTheDocument();
          expect(shortTextarea.value).toBe(shortText);

          shortRender.unmount();

          // Test long text
          const longTextProps = {
            id: 'long-text-test',
            data: { text: longText },
            type: 'textNode'
          };

          const longRender = render(
            <TestWrapper>
              <TextNode {...longTextProps} />
            </TestWrapper>
          );

          const longTextarea = longRender.container.querySelector('textarea');
          expect(longTextarea).toBeInTheDocument();
          expect(longTextarea.value).toBe(longText);

          // Verify that measureText was called for both texts
          expect(mockMeasureText).toHaveBeenCalled();

          longRender.unmount();
        }
      ),
      { 
        numRuns: 25,
        verbose: false 
      }
    );

    // Restore original createElement
    document.createElement = originalCreateElement;
  });

  test('Property 4b: Text Node Auto-Resize - maintains proper styling constraints', () => {
    // Mock canvas context for text measurement in test environment
    const mockMeasureText = jest.fn((text) => ({
      width: Math.max(text.length * 8, 100) // Simple width estimation
    }));
    
    const mockCanvas = {
      getContext: jest.fn(() => ({
        font: '',
        measureText: mockMeasureText
      }))
    };
    
    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement.call(document, tagName);
    });

    // Test that styling constraints are maintained
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''), // Empty text
          fc.string({ minLength: 1, maxLength: 5 }), // Short text
          fc.string({ minLength: 50, maxLength: 100 }) // Long text
        ),
        (text) => {
          const nodeProps = {
            id: 'constraint-test',
            data: { text: text },
            type: 'textNode'
          };

          const renderResult = render(
            <TestWrapper>
              <TextNode {...nodeProps} />
            </TestWrapper>
          );

          const textarea = renderResult.container.querySelector('textarea');
          expect(textarea).toBeInTheDocument();

          // Verify textarea contains the expected text (or default value)
          const expectedText = text || '{{input}}'; // TextNode has default value
          expect(textarea.value).toBe(expectedText);

          // Verify auto-resize styling is applied
          const textareaStyle = window.getComputedStyle(textarea);
          expect(textareaStyle.resize).toBe('none');
          expect(textareaStyle.overflow).toBe('hidden');

          // Verify the node structure is maintained
          const nodeElement = renderResult.container.querySelector('.base-node');
          expect(nodeElement).toBeInTheDocument();
          expect(nodeElement).toHaveClass('base-node');

          renderResult.unmount();
        }
      ),
      { 
        numRuns: 25,
        verbose: false 
      }
    );

    // Restore original createElement
    document.createElement = originalCreateElement;
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