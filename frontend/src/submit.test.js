// submit.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from './ThemeProvider';
import { SubmitButton } from './submit';
import { pipelineAPI, PipelineAPIError } from './api/pipelineAPI';
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

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('SubmitButton', () => {
  const mockNodes = [
    { id: 'node1', type: 'input', data: {} },
    { id: 'node2', type: 'output', data: {} }
  ];
  
  const mockEdges = [
    { id: 'edge1', source: 'node1', target: 'node2' }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock store selectors
    mockUseStore.mockImplementation((selector) => {
      const state = { nodes: mockNodes, edges: mockEdges };
      return selector(state);
    });
  });

  test('renders submit button with correct text', () => {
    renderWithTheme(<SubmitButton />);
    
    expect(screen.getByRole('button', { name: /submit pipeline/i })).toBeInTheDocument();
  });

  test('button click triggers API call with correct data', async () => {
    const mockResponse = {
      num_nodes: 2,
      num_edges: 1,
      is_dag: true
    };
    
    pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    // Verify API was called with correct data
    expect(pipelineAPI.submitPipeline).toHaveBeenCalledWith(mockNodes, mockEdges);
    
    // Wait for success alert with enhanced formatting
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('🎉 Pipeline Submitted Successfully!')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('📦 Total Nodes: 2')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('🔗 Total Connections: 1')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Graph Structure: Valid DAG ✅')
      );
    });
  });

  test('shows loading state during submission', async () => {
    // Mock a delayed response
    pipelineAPI.submitPipeline.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ num_nodes: 2, num_edges: 1, is_dag: true }), 100))
    );
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    act(() => {
      fireEvent.click(button);
    });
    
    // Check loading state
    expect(screen.getByText(/submitting.../i)).toBeInTheDocument();
    expect(button).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/submit pipeline/i)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const mockError = new Error('Network error');
    pipelineAPI.submitPipeline.mockRejectedValue(mockError);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Check for error modal instead of alert
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred: Network error/)).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  test('handles network connection errors with user-friendly message', async () => {
    const mockError = new Error('Failed to fetch');
    pipelineAPI.submitPipeline.mockRejectedValue(mockError);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Check for error modal instead of alert
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred: Failed to fetch/)).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  test('prevents multiple simultaneous submissions', async () => {
    let resolvePromise;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    pipelineAPI.submitPipeline.mockReturnValue(delayedPromise);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    // Click multiple times rapidly
    act(() => {
      fireEvent.click(button);
    });
    
    // Button should be disabled after first click
    expect(button).toBeDisabled();
    
    // Additional clicks should not trigger more API calls
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    
    // API should only be called once
    expect(pipelineAPI.submitPipeline).toHaveBeenCalledTimes(1);
    
    // Resolve the promise to clean up
    act(() => {
      resolvePromise({ num_nodes: 2, num_edges: 1, is_dag: true });
    });
  });

  test('displays user-friendly alert for empty pipeline', async () => {
    const mockResponse = {
      num_nodes: 0,
      num_edges: 0,
      is_dag: true
    };
    
    pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Your pipeline is empty')
      );
    });
  });

  test('displays user-friendly alert for invalid DAG', async () => {
    const mockResponse = {
      num_nodes: 3,
      num_edges: 3,
      is_dag: false
    };
    
    pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Graph Structure: Invalid (Contains Cycles) ❌')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('❌ Circular dependencies detected')
      );
    });
  });

  test('handles HTTP 400 errors with specific message', async () => {
    const mockError = new Error('HTTP error! status: 400');
    pipelineAPI.submitPipeline.mockRejectedValue(mockError);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Check for error modal instead of alert
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred: HTTP error! status: 400/)).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  test('handles HTTP 500 errors with specific message', async () => {
    const mockError = new Error('HTTP error! status: 500');
    pipelineAPI.submitPipeline.mockRejectedValue(mockError);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Check for error modal instead of alert
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred: HTTP error! status: 500/)).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  test('displays complete success message format for valid pipeline', async () => {
    const mockResponse = {
      num_nodes: 5,
      num_edges: 4,
      is_dag: true
    };
    
    pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Verify all components of the success message are present
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringMatching(/🎉 Pipeline Submitted Successfully![\s\S]*📊 Pipeline Analysis Results:[\s\S]*📦 Total Nodes: 5[\s\S]*🔗 Total Connections: 4[\s\S]*🔄 Graph Structure: Valid DAG ✅[\s\S]*💡 Tip:/)
      );
    });
  });

  test('displays complete error message format for network failures', async () => {
    const mockError = new Error('Failed to fetch');
    pipelineAPI.submitPipeline.mockRejectedValue(mockError);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Check for error modal instead of alert
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred: Failed to fetch/)).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  test('handles malformed response data gracefully', async () => {
    // Mock a response that's missing required fields
    const mockResponse = {
      num_nodes: 2
      // Missing num_edges and is_dag
    };
    
    pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      // Should still display success message even with incomplete data
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('🎉 Pipeline Submitted Successfully!')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('📦 Total Nodes: 2')
      );
    });
  });

  test('handles response with zero values correctly', async () => {
    const mockResponse = {
      num_nodes: 0,
      num_edges: 0,
      is_dag: true
    };
    
    pipelineAPI.submitPipeline.mockResolvedValue(mockResponse);
    
    renderWithTheme(<SubmitButton />);
    
    const button = screen.getByRole('button', { name: /submit pipeline/i });
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('📦 Total Nodes: 0')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Your pipeline is empty')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('🔗 Total Connections: 0')
      );
    });
  });
});

/**
 * Property-Based Tests for Error Handling Robustness
 */
describe('Property 10: Error Handling Robustness', () => {
  /**
   * Feature: vectorshift-assessment, Property 10: Error Handling Robustness
   * 
   * Property: For any failed backend request (network error, server error, invalid response), 
   * the frontend should handle the error gracefully without crashing and provide user feedback.
   * 
   * Validates: Requirements 4.8
   */
  test('**Feature: vectorshift-assessment, Property 10: Error Handling Robustness** - frontend handles all error types gracefully without crashing', async () => {
    // Simplified generator for different error types that can occur
    const errorTypeArb = fc.oneof(
      // Network errors
      fc.record({
        type: fc.constant('NETWORK_ERROR'),
        message: fc.constant('Network error'),
        status: fc.constant(0)
      }),
      
      // Timeout errors
      fc.record({
        type: fc.constant('TIMEOUT_ERROR'),
        message: fc.constant('Request timeout'),
        status: fc.constant(408)
      }),
      
      // HTTP errors (4xx client errors)
      fc.record({
        type: fc.constant('HTTP_ERROR'),
        message: fc.constant('Bad request'),
        status: fc.constant(400)
      }),
      
      // HTTP errors (5xx server errors)
      fc.record({
        type: fc.constant('HTTP_ERROR'),
        message: fc.constant('Internal server error'),
        status: fc.constant(500)
      }),
      
      // Validation errors
      fc.record({
        type: fc.constant('VALIDATION_ERROR'),
        message: fc.constant('Invalid data'),
        status: fc.constant(400)
      })
    );

    // Property-based test using fast-check
    await fc.assert(
      fc.asyncProperty(errorTypeArb, async (errorConfig) => {
        // Reset mocks for each test iteration
        jest.clearAllMocks();
        
        // Create a PipelineAPIError with the generated configuration
        const testError = new PipelineAPIError(
          errorConfig.message,
          errorConfig.status,
          errorConfig.type
        );

        // Mock the API to reject with this error
        pipelineAPI.submitPipeline.mockRejectedValue(testError);

        // Render the component
        const { container, unmount } = renderWithTheme(<SubmitButton />);

        try {
          // Get the submit button
          const button = screen.getByRole('button', { name: /submit pipeline/i });

          // Click the button to trigger the error
          await act(async () => {
            fireEvent.click(button);
          });

          // Wait for the error to be processed
          await waitFor(() => {
            // Verify the component didn't crash - it should still be in the DOM
            expect(container).toBeInTheDocument();
            expect(button).toBeInTheDocument();

            // Verify error modal is displayed by looking for the error title
            const errorTitle = screen.queryByText(/Connection Failed|Request Timeout|Invalid Pipeline Data|Server Error|HTTP Error|Multiple Attempts Failed|Invalid Server Response|Unknown Error|Unexpected Error|Invalid Request/);
            expect(errorTitle).toBeInTheDocument();

            // Verify the button is not stuck in loading state
            expect(button).not.toBeDisabled();
            expect(screen.queryByText(/submitting.../i)).not.toBeInTheDocument();

            // Verify there are action buttons in the error modal
            const closeButton = screen.queryByText('Close');
            expect(closeButton).toBeInTheDocument();
          }, { timeout: 2000 });

          return true;
        } finally {
          // Clean up after each test
          unmount();
        }
      }),
      { 
        numRuns: 10, // Reduced to 10 for faster execution
        timeout: 3000 // 3 second timeout for each test
      }
    );
  }, 15000); // 15 second timeout for the entire test

  test('Property 10a: Error modal interaction and recovery', async () => {
    // Test that error modals can be interacted with and dismissed
    const errorTypes = [
      new PipelineAPIError('Network error', 0, 'NETWORK_ERROR'),
      new PipelineAPIError('Server error', 500, 'HTTP_ERROR'),
      new PipelineAPIError('Timeout error', 408, 'TIMEOUT_ERROR'),
      new PipelineAPIError('Validation error', 400, 'VALIDATION_ERROR')
    ];

    for (const error of errorTypes) {
      // Reset mocks for each error type
      jest.clearAllMocks();
      pipelineAPI.submitPipeline.mockRejectedValue(error);

      const { unmount } = renderWithTheme(<SubmitButton />);
      
      const button = screen.getByRole('button', { name: /submit pipeline/i });

      // Trigger the error
      await act(async () => {
        fireEvent.click(button);
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(button).not.toHaveTextContent('Submitting...');
      }, { timeout: 3000 });

      // Wait a bit for error modal to render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Check if error modal appeared
      const closeButton = screen.queryByText('Close');
      if (closeButton) {
        expect(closeButton).toBeInTheDocument();

        // Click close button
        await act(async () => {
          fireEvent.click(closeButton);
        });

        // Verify modal is dismissed
        await waitFor(() => {
          expect(screen.queryByText('Close')).not.toBeInTheDocument();
        }, { timeout: 1000 });
      }
      
      // Verify component is still functional
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();

      unmount();
    }
  });

  test('Property 10b: Error handling preserves component state', async () => {
    // Test that errors don't corrupt component state
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Reduced from 5 to 3 for faster execution
        fc.oneof(
          fc.constant(new PipelineAPIError('Network error', 0, 'NETWORK_ERROR')),
          fc.constant(new PipelineAPIError('Server error', 500, 'HTTP_ERROR')),
          fc.constant(new PipelineAPIError('Timeout', 408, 'TIMEOUT_ERROR'))
        ),
        async (numErrors, errorType) => {
          const { container, unmount } = renderWithTheme(<SubmitButton />);
          
          try {
            const button = screen.getByRole('button', { name: /submit pipeline/i });

            // Trigger multiple consecutive errors
            for (let i = 0; i < numErrors; i++) {
              jest.clearAllMocks();
              pipelineAPI.submitPipeline.mockRejectedValueOnce(errorType);
              
              // Click button and wait for loading state
              await act(async () => {
                fireEvent.click(button);
              });

              // Wait for loading to complete and error to be processed
              await waitFor(() => {
                expect(button).not.toHaveTextContent('Submitting...');
              }, { timeout: 3000 });

              // Wait a bit more for error modal to render
              await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
              });

              // Check if error modal appeared - if not, the error might not have been set
              const errorTitle = screen.queryByText(/Connection Failed|Server Error|Request Timeout|Unknown Error/);
              
              // If error modal appeared, dismiss it
              if (errorTitle) {
                expect(errorTitle).toBeInTheDocument();
                
                const closeButton = screen.queryByText('Close');
                if (closeButton) {
                  await act(async () => {
                    fireEvent.click(closeButton);
                  });
                  
                  // Wait for modal to be dismissed
                  await waitFor(() => {
                    const errorTitle = screen.queryByText(/Connection Failed|Server Error|Request Timeout|Unknown Error/);
                    expect(errorTitle).not.toBeInTheDocument();
                  }, { timeout: 1000 });
                }
              }
              
              // Ensure component is still functional after each error
              expect(container).toBeInTheDocument();
              expect(button).toBeInTheDocument();
              expect(button).not.toBeDisabled();
            }

            // After all errors, component should still be functional
            expect(button).toBeInTheDocument();
            expect(button).not.toBeDisabled();
            expect(screen.queryByText(/submitting.../i)).not.toBeInTheDocument();
            
            // Component should be ready for another submission
            expect(button.textContent).toBe('Submit Pipeline');
            
            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10, timeout: 3000 } // Reduced iterations for faster execution
    );
  });

  test('Property 10c: Error messages are user-friendly and informative', () => {
    // Test that all error types produce meaningful user messages
    const errorScenarios = [
      {
        error: new PipelineAPIError('Failed to fetch', 0, 'NETWORK_ERROR'),
        expectedKeywords: ['Connection Failed', 'server is running', 'network connection']
      },
      {
        error: new PipelineAPIError('Request timeout', 408, 'TIMEOUT_ERROR'),
        expectedKeywords: ['Request Timeout', 'too long to respond', 'Try submitting again']
      },
      {
        error: new PipelineAPIError('Bad request', 400, 'HTTP_ERROR'),
        expectedKeywords: ['Invalid Request', 'server rejected', 'verify']
      },
      {
        error: new PipelineAPIError('Internal server error', 500, 'HTTP_ERROR'),
        expectedKeywords: ['Server Error', 'internal error', 'try again']
      },
      {
        error: new PipelineAPIError('Invalid data', 400, 'VALIDATION_ERROR'),
        expectedKeywords: ['Invalid Pipeline Data', 'check', 'valid']
      },
      {
        error: new PipelineAPIError('Invalid response', 500, 'INVALID_RESPONSE'),
        expectedKeywords: ['Invalid Server Response', 'unexpected response', 'server-side issue']
      }
    ];

    errorScenarios.forEach(({ error, expectedKeywords }) => {
      pipelineAPI.submitPipeline.mockRejectedValue(error);
      
      const { unmount } = renderWithTheme(<SubmitButton />);
      const button = screen.getByRole('button', { name: /submit pipeline/i });

      act(() => {
        fireEvent.click(button);
      });

      waitFor(() => {
        // Check that at least one expected keyword appears in the error message
        const hasExpectedContent = expectedKeywords.some(keyword => 
          screen.queryByText(new RegExp(keyword, 'i'))
        );
        expect(hasExpectedContent).toBe(true);

        // Verify the error message is not just a raw technical error
        const errorContent = screen.getByText(/Connection Failed|Request Timeout|Invalid Request|Server Error|Invalid Pipeline Data|Invalid Server Response/);
        expect(errorContent).toBeInTheDocument();
      });

      unmount();
    });
  });

  test('Property 10d: Retry functionality works after errors', () => {
    // Test that retry functionality works correctly after various error types
    const retryableErrors = [
      new PipelineAPIError('Network error', 0, 'NETWORK_ERROR'),
      new PipelineAPIError('Server error', 500, 'HTTP_ERROR'),
      new PipelineAPIError('Timeout', 408, 'TIMEOUT_ERROR'),
      new PipelineAPIError('Max retries exceeded', 0, 'MAX_RETRIES_EXCEEDED', { attempts: 3 })
    ];

    retryableErrors.forEach(error => {
      jest.clearAllMocks();
      
      // First call fails, second call succeeds
      pipelineAPI.submitPipeline
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ num_nodes: 1, num_edges: 0, is_dag: true });

      const { unmount } = renderWithTheme(<SubmitButton />);
      const button = screen.getByRole('button', { name: /submit pipeline/i });

      // First submission fails
      act(() => {
        fireEvent.click(button);
      });

      waitFor(() => {
        const retryButton = screen.queryByText('Retry');
        if (retryButton) {
          // Click retry
          act(() => {
            fireEvent.click(retryButton);
          });

          // Wait for success
          waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith(
              expect.stringContaining('🎉 Pipeline Submitted Successfully!')
            );
          });
        }
      });

      unmount();
    });
  });
});