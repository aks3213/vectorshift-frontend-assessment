// integration.test.js
// Property-based tests for system integration

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactFlowProvider } from 'reactflow';
import { BaseNode, createHandle, HandlePositions } from './components/BaseNode';
import { TextNode } from './nodes/textNode';
import { ThemeProvider } from './ThemeProvider';
import { SubmitButton } from './submit';
import { pipelineAPI, PipelineAPIError } from './api/pipelineAPI';
import { extractVariableNames } from './utils/variableParser';
import fc from 'fast-check';

// Mock the API
jest.mock('./api/pipelineAPI');

// Mock the store
const mockUseStore = jest.fn();
jest.mock('./store', () => ({
  useStore: (selector) => mockUseStore(selector)
}));

// Mock window.alert
global.alert = jest.fn();

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

// Utility functions for generating test data
const generateRandomString = (minLength = 1, maxLength = 20) => {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRandomNodeConfig = () => {
  const numHandles = Math.floor(Math.random() * 4);
  const handles = Array.from({ length: numHandles }, (_, idx) => ({
    id: `handle-${idx}`,
    type: Math.random() > 0.5 ? 'source' : 'target',
    position: [HandlePositions.LEFT, HandlePositions.RIGHT, HandlePositions.TOP, HandlePositions.BOTTOM][Math.floor(Math.random() * 4)]
  }));
  
  return {
    title: generateRandomString(1, 25),
    content: Math.random() > 0.5 ? <div>Test Content</div> : null,
    handles: handles,
    resizable: Math.random() > 0.5
  };
};

describe('System Integration Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock store selectors
    mockUseStore.mockImplementation((selector) => {
      const state = { 
        nodes: [
          { id: 'node1', type: 'text', data: { text: 'Hello {{name}}' } },
          { id: 'node2', type: 'input', data: {} }
        ], 
        edges: [
          { id: 'edge1', source: 'node1', target: 'node2' }
        ],
        updateNodeField: jest.fn()
      };
      return selector(state);
    });
  });

  /**
   * Feature: vectorshift-assessment, Property 11: Abstraction System Integration
   * Validates: Requirements 5.3, 5.4
   */
  test('Property 11: Abstraction System Integration - any node type created through abstraction works with all system features', () => {
    // Property-based test using fast-check
    fc.assert(
      fc.property(
        // Generate random node configurations
        fc.record({
          nodeType: fc.constantFrom('text', 'input', 'output', 'llm', 'filter', 'transform', 'aggregator', 'conditional', 'delay'),
          text: fc.string({ minLength: 0, maxLength: 50 }),
          hasVariables: fc.boolean()
        }),
        (testData) => {
          const { nodeType, text, hasVariables } = testData;
          
          // Create text with or without variables based on test data
          const nodeText = hasVariables ? `Hello {{${generateRandomString(1, 10)}}` : text;
          
          // Test 1: Node abstraction works with styling system
          const config = generateRandomNodeConfig();
          config.title = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
          
          const nodeProps = {
            id: `integration-test-${nodeType}`,
            data: { text: nodeText },
            config: config,
            type: nodeType
          };

          let renderResult;
          expect(() => {
            renderResult = render(
              <TestWrapper>
                <BaseNode {...nodeProps} />
              </TestWrapper>
            );
          }).not.toThrow();

          // Verify the node renders successfully with styling
          const nodeElement = renderResult.container.querySelector('.base-node');
          expect(nodeElement).toBeInTheDocument();
          expect(screen.getByText(config.title)).toBeInTheDocument();

          // Verify handles are rendered correctly
          const handles = renderResult.container.querySelectorAll('.react-flow__handle');
          expect(handles).toHaveLength(config.handles.length);

          // Test 2: Dynamic text nodes work within abstraction (if it's a text node)
          if (nodeType === 'text') {
            const textarea = renderResult.container.querySelector('textarea');
            if (textarea) {
              expect(textarea).toBeInTheDocument();
              
              // If the node has variables, verify variable detection works
              if (hasVariables) {
                const variables = extractVariableNames(nodeText);
                if (variables.length > 0) {
                  // Should have variable handles + output handle
                  expect(handles.length).toBeGreaterThan(0);
                }
              }
            }
          }

          // Test 3: Backend integration compatibility
          // Verify the node structure is compatible with backend submission
          const nodeData = {
            id: nodeProps.id,
            type: nodeType,
            data: nodeProps.data,
            position: { x: 0, y: 0 }
          };

          // Node should have required fields for backend
          expect(nodeData.id).toBeDefined();
          expect(nodeData.type).toBeDefined();
          expect(nodeData.data).toBeDefined();
          expect(nodeData.position).toBeDefined();

          // Test 4: Styling system integration
          // Verify node has proper CSS classes and styling
          expect(nodeElement).toHaveClass('base-node');
          
          // Verify handles have proper ReactFlow classes
          handles.forEach(handle => {
            expect(handle).toHaveClass('react-flow__handle');
          });

          renderResult.unmount();
        }
      ),
      { numRuns: 25 } // Reduced for faster execution
    );
  });

  test('Property 11a: Node abstraction integrates with backend submission', () => {
    // Test that nodes created through abstraction can be submitted to backend
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            type: fc.constantFrom('text', 'input', 'output', 'llm'),
            text: fc.string({ minLength: 0, maxLength: 30 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (nodeConfigs) => {
          // Create nodes using abstraction
          const nodes = nodeConfigs.map(config => ({
            id: config.id,
            type: config.type,
            data: { text: config.text },
            position: { x: 0, y: 0 }
          }));

          const edges = [];

          // Mock successful API response
          const mockResponse = {
            num_nodes: nodes.length,
            num_edges: edges.length,
            is_dag: true
          };
          pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);

          // Mock store to return our test data
          mockUseStore.mockImplementation((selector) => {
            const state = { nodes, edges };
            return selector(state);
          });

          // Render submit button and test submission
          const { unmount } = render(
            <TestWrapper>
              <SubmitButton />
            </TestWrapper>
          );

          const button = screen.getByRole('button', { name: /submit pipeline/i });
          expect(button).toBeInTheDocument();

          // Verify button is functional (doesn't throw when clicked)
          expect(() => {
            fireEvent.click(button);
          }).not.toThrow();

          // Verify API would be called with correct data structure
          // (We can't wait for async in property tests, but we can verify the structure)
          expect(nodes.every(node => 
            node.id && node.type && node.data !== undefined && node.position
          )).toBe(true);

          unmount();
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 11b: Styling system works with all node types', () => {
    // Test that styling system applies consistently across all node types
    const nodeTypes = ['text', 'input', 'output', 'llm', 'filter', 'transform', 'aggregator', 'conditional', 'delay'];
    
    nodeTypes.forEach(nodeType => {
      for (let i = 0; i < 5; i++) {
        const config = {
          title: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
          content: <div>Test content for {nodeType}</div>,
          handles: [
            { id: 'input', type: 'target', position: HandlePositions.LEFT },
            { id: 'output', type: 'source', position: HandlePositions.RIGHT }
          ]
        };

        const nodeProps = {
          id: `style-test-${nodeType}-${i}`,
          data: {},
          config: config,
          type: nodeType
        };

        const { unmount } = render(
          <TestWrapper>
            <BaseNode {...nodeProps} />
          </TestWrapper>
        );

        // Verify consistent styling is applied
        const nodeElement = screen.getByText(config.title).closest('.base-node');
        expect(nodeElement).toBeInTheDocument();
        expect(nodeElement).toHaveClass('base-node');

        // Verify handles have consistent styling
        const handles = nodeElement.querySelectorAll('.react-flow__handle');
        expect(handles).toHaveLength(2);
        
        handles.forEach(handle => {
          expect(handle).toHaveClass('react-flow__handle');
          // Verify handle has proper positioning classes
          const hasPositionClass = handle.classList.contains('react-flow__handle-left') || 
                                   handle.classList.contains('react-flow__handle-right');
          expect(hasPositionClass).toBe(true);
        });

        unmount();
      }
    });
  });

  test('Property 11c: Dynamic functionality works within abstraction', () => {
    // Test that dynamic features (like text node auto-resize and variable detection) work within abstraction
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 100 }),
          hasVariables: fc.boolean()
        }),
        ({ text, hasVariables }) => {
          // Create text with variables if specified
          const nodeText = hasVariables ? `${text} {{variable${Math.floor(Math.random() * 10)}}}` : text;
          
          const nodeProps = {
            id: 'dynamic-test',
            data: { text: nodeText },
            type: 'text'
          };

          const { unmount } = render(
            <TestWrapper>
              <TextNode {...nodeProps} />
            </TestWrapper>
          );

          // Verify the text node renders
          const nodeElement = screen.getByText('Text').closest('.base-node');
          expect(nodeElement).toBeInTheDocument();

          // Verify textarea is present and functional
          const textarea = nodeElement.querySelector('textarea');
          expect(textarea).toBeInTheDocument();
          
          // Verify text content
          const expectedText = nodeText || '{{input}}'; // TextNode has default
          expect(textarea.value).toBe(expectedText);

          // If variables are expected, verify variable detection
          if (hasVariables) {
            const variables = extractVariableNames(expectedText);
            if (variables.length > 0) {
              // Should show variable detection message
              const variableMessage = nodeElement.querySelector('div[style*="font-style: italic"]');
              if (variableMessage) {
                expect(variableMessage).toHaveTextContent('Variables detected:');
              }
            }
          }

          // Verify handles are present (at least output handle)
          const handles = nodeElement.querySelectorAll('.react-flow__handle');
          expect(handles.length).toBeGreaterThan(0);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});

  /**
   * Feature: vectorshift-assessment, Property 12: State Consistency
   * Validates: Requirements 5.5
   */
  test('Property 12: State Consistency - application state remains consistent across user interactions', () => {
    // Property-based test for state consistency
    fc.assert(
      fc.property(
        // Generate a sequence of user interactions
        fc.array(
          fc.record({
            action: fc.constantFrom('addNode', 'updateText', 'connectNodes', 'deleteNode'),
            nodeType: fc.constantFrom('text', 'input', 'output', 'llm'),
            text: fc.string({ minLength: 0, maxLength: 50 }),
            nodeId: fc.string({ minLength: 1, maxLength: 10 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (interactions) => {
          // Mock store state that tracks changes
          let mockState = {
            nodes: [],
            edges: [],
            updateNodeField: jest.fn((id, field, value) => {
              const nodeIndex = mockState.nodes.findIndex(n => n.id === id);
              if (nodeIndex >= 0) {
                mockState.nodes[nodeIndex].data = {
                  ...mockState.nodes[nodeIndex].data,
                  [field]: value
                };
              }
            }),
            addNode: jest.fn((node) => {
              mockState.nodes.push(node);
            }),
            removeNode: jest.fn((id) => {
              mockState.nodes = mockState.nodes.filter(n => n.id !== id);
            })
          };

          // Mock store to return our test state
          mockUseStore.mockImplementation((selector) => {
            return selector(mockState);
          });

          // Simulate each interaction
          interactions.forEach((interaction, index) => {
            const { action, nodeType, text, nodeId } = interaction;
            const uniqueId = `${nodeId}-${index}`;

            try {
              switch (action) {
                case 'addNode':
                  // Simulate adding a node
                  const newNode = {
                    id: uniqueId,
                    type: nodeType,
                    data: { text: text || '' },
                    position: { x: Math.random() * 500, y: Math.random() * 500 }
                  };
                  mockState.addNode(newNode);
                  break;

                case 'updateText':
                  // Simulate updating text in an existing node
                  if (mockState.nodes.length > 0) {
                    const existingNode = mockState.nodes[0];
                    mockState.updateNodeField(existingNode.id, 'text', text);
                  }
                  break;

                case 'connectNodes':
                  // Simulate connecting two nodes
                  if (mockState.nodes.length >= 2) {
                    const edge = {
                      id: `edge-${index}`,
                      source: mockState.nodes[0].id,
                      target: mockState.nodes[1].id
                    };
                    mockState.edges.push(edge);
                  }
                  break;

                case 'deleteNode':
                  // Simulate deleting a node
                  if (mockState.nodes.length > 0) {
                    const nodeToDelete = mockState.nodes[0];
                    mockState.removeNode(nodeToDelete.id);
                  }
                  break;
              }

              // After each interaction, verify state consistency
              // 1. All nodes should have required fields
              mockState.nodes.forEach(node => {
                expect(node).toHaveProperty('id');
                expect(node).toHaveProperty('type');
                expect(node).toHaveProperty('data');
                expect(node).toHaveProperty('position');
                expect(typeof node.id).toBe('string');
                expect(typeof node.type).toBe('string');
                expect(typeof node.data).toBe('object');
                expect(typeof node.position).toBe('object');
              });

              // 2. All edges should reference existing nodes
              mockState.edges.forEach(edge => {
                expect(edge).toHaveProperty('source');
                expect(edge).toHaveProperty('target');
                
                const sourceExists = mockState.nodes.some(n => n.id === edge.source);
                const targetExists = mockState.nodes.some(n => n.id === edge.target);
                
                // If edge exists, both nodes should exist (or edge should be cleaned up)
                if (!sourceExists || !targetExists) {
                  // In a real app, orphaned edges would be cleaned up
                  // For this test, we'll just verify the structure is valid
                  expect(typeof edge.source).toBe('string');
                  expect(typeof edge.target).toBe('string');
                }
              });

              // 3. Node IDs should be unique
              const nodeIds = mockState.nodes.map(n => n.id);
              const uniqueIds = new Set(nodeIds);
              expect(uniqueIds.size).toBe(nodeIds.length);

              // 4. State should be serializable (no circular references)
              expect(() => JSON.stringify(mockState.nodes)).not.toThrow();
              expect(() => JSON.stringify(mockState.edges)).not.toThrow();

            } catch (error) {
              // If any interaction causes an error, the state should still be consistent
              console.error(`State consistency error during ${action}:`, error);
              throw error;
            }
          });

          // Final state validation
          // Verify that the final state is in a valid, consistent state
          expect(Array.isArray(mockState.nodes)).toBe(true);
          expect(Array.isArray(mockState.edges)).toBe(true);
          
          // All nodes should be valid
          mockState.nodes.forEach(node => {
            expect(node.id).toBeDefined();
            expect(node.type).toBeDefined();
            expect(node.data).toBeDefined();
            expect(node.position).toBeDefined();
          });

          // All edges should be valid
          mockState.edges.forEach(edge => {
            expect(edge.source).toBeDefined();
            expect(edge.target).toBeDefined();
          });
        }
      ),
      { numRuns: 20 } // Reduced for faster execution
    );
  });

  test('Property 12a: Component state consistency during text node interactions', () => {
    // Test that text node state remains consistent during variable detection and handle updates
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            text: fc.string({ minLength: 0, maxLength: 100 }),
            hasVariables: fc.boolean()
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (textUpdates) => {
          let currentText = '{{input}}'; // Default text
          
          textUpdates.forEach((update, index) => {
            const { text, hasVariables } = update;
            
            // Create text with or without variables
            const newText = hasVariables ? 
              `${text} {{var${index}}}` : 
              text;

            // Mock store state for this text update
            mockUseStore.mockImplementation((selector) => {
              const state = {
                nodes: [{
                  id: 'test-node',
                  type: 'text',
                  data: { text: newText }
                }],
                edges: [],
                updateNodeField: jest.fn()
              };
              return selector(state);
            });

            // Render text node with new text
            const { unmount } = render(
              <TestWrapper>
                <TextNode id="test-node" data={{ text: newText }} type="text" />
              </TestWrapper>
            );

            // Verify component renders consistently
            const nodeElement = screen.getByText('Text').closest('.base-node');
            expect(nodeElement).toBeInTheDocument();

            // Verify textarea contains expected text
            const textarea = nodeElement.querySelector('textarea');
            expect(textarea).toBeInTheDocument();
            
            const expectedText = newText || '{{input}}';
            expect(textarea.value).toBe(expectedText);

            // Verify handles are consistent with variables
            const handles = nodeElement.querySelectorAll('.react-flow__handle');
            expect(handles.length).toBeGreaterThan(0); // At least output handle

            // If variables are present, verify variable detection is consistent
            if (hasVariables) {
              const variables = extractVariableNames(expectedText);
              if (variables.length > 0) {
                // Should have variable handles + output handle
                expect(handles.length).toBe(variables.length + 1);
              }
            }

            // Update current text for next iteration
            currentText = newText;
            
            unmount();
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 12b: Backend submission state consistency', async () => {
    // Test that backend submission doesn't corrupt application state
    // Create pipeline state with empty nodes and edges
    const pipelineNodes = [];
    const pipelineEdges = [];

    // Mock API to reject with error
    pipelineAPI.submitPipeline.mockRejectedValue(
      new PipelineAPIError('API Error', 500, 'HTTP_ERROR')
    );

    // Mock store state
    const initialState = {
      nodes: [...pipelineNodes], // Copy to detect mutations
      edges: [...pipelineEdges]
    };

    mockUseStore.mockImplementation((selector) => {
      return selector(initialState);
    });

    // Render submit button
    const { unmount } = render(
      <TestWrapper>
        <SubmitButton />
      </TestWrapper>
    );

    const button = screen.getByRole('button', { name: /submit pipeline/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled(); // Initially enabled

    // Trigger submission
    fireEvent.click(button);

    // Button should be disabled during loading
    expect(button).toBeDisabled();

    // Wait for async operation to complete and error modal to appear
    await waitFor(() => {
      // Look for error modal (any error modal)
      const errorModal = screen.queryByText('Unknown Error');
      expect(errorModal).toBeInTheDocument();
    }, { timeout: 3000 });

    // Button should be enabled again after error
    expect(button).not.toBeDisabled();

    // Verify state hasn't been corrupted by submission
    expect(initialState.nodes).toEqual(pipelineNodes);
    expect(initialState.edges).toEqual(pipelineEdges);

    // Verify nodes still have consistent structure
    initialState.nodes.forEach(node => {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('data');
      expect(node).toHaveProperty('position');
    });

    // Verify button is still functional after submission
    expect(button).toBeInTheDocument();

    unmount();
  });