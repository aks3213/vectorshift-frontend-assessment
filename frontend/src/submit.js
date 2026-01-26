// submit.js

import { useState } from 'react';
import styled from '@emotion/styled';
import { Button, getThemeValue } from './styled';
import { useStore } from './store';
import { pipelineAPI } from './api/pipelineAPI';

const StyledSubmitButton = styled(Button)`
  background-color: ${props => props.disabled ? getThemeValue('colors.border') : getThemeValue('colors.secondary')};
  color: ${getThemeValue('colors.text.inverse')};
  padding: ${getThemeValue('spacing.md')} ${getThemeValue('spacing.xl')};
  font-size: ${getThemeValue('typography.fontSize.md')};
  font-weight: ${getThemeValue('typography.fontWeight.semibold')};
  border-radius: ${getThemeValue('borderRadius.md')};
  min-width: 120px;
  box-shadow: ${getThemeValue('shadows.sm')};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all ${getThemeValue('transitions.fast')};

  &:hover:not(:disabled) {
    background-color: ${getThemeValue('colors.primary')};
    box-shadow: ${getThemeValue('shadows.md')};
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: ${getThemeValue('shadows.sm')};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.secondary}40, ${getThemeValue('shadows.sm')};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: ${getThemeValue('spacing.sm')};

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const SubmitButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const nodes = useStore(state => state.nodes);
    const edges = useStore(state => state.edges);

    const handleSubmit = async () => {
        if (isLoading) return;

        setIsLoading(true);
        
        try {
            const response = await pipelineAPI.submitPipeline(nodes, edges);
            
            // Show success alert with pipeline statistics
            alert(`Pipeline submitted successfully!\n\nStatistics:\n- Nodes: ${response.num_nodes || nodes.length}\n- Edges: ${response.num_edges || edges.length}\n- Valid DAG: ${response.is_dag ? 'Yes' : 'No'}`);
            
        } catch (error) {
            // Show error alert with user-friendly message
            const errorMessage = error.message.includes('Failed to fetch') 
                ? 'Unable to connect to the server. Please check if the backend is running.'
                : `Failed to submit pipeline: ${error.message}`;
            
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <StyledSubmitButton 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading}
        >
            {isLoading && <LoadingSpinner />}
            {isLoading ? 'Submitting...' : 'Submit Pipeline'}
        </StyledSubmitButton>
    );
}
