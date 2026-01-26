// submit.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from './ThemeProvider';
import { SubmitButton } from './submit';
import { pipelineAPI } from './api/pipelineAPI';

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
    
    // Wait for success alert
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline submitted successfully!')
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
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Error: Failed to submit pipeline: Network error')
      );
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
      expect(global.alert).toHaveBeenCalledWith(
        'Error: Unable to connect to the server. Please check if the backend is running.'
      );
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
});