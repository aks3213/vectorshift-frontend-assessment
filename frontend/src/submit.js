// submit.js

import { useState } from 'react';
import styled from '@emotion/styled';
import { Button, getThemeValue } from './styled';
import { useStore } from './store';
import { pipelineAPI, PipelineAPIError } from './api/pipelineAPI';

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

const ErrorModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ErrorContent = styled.div`
  background: ${getThemeValue('colors.surface')};
  border-radius: ${getThemeValue('borderRadius.lg')};
  padding: ${getThemeValue('spacing.xl')};
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${getThemeValue('shadows.lg')};
  margin: ${getThemeValue('spacing.md')};
`;

const ErrorTitle = styled.h3`
  color: ${getThemeValue('colors.error')};
  margin: 0 0 ${getThemeValue('spacing.md')} 0;
  font-size: ${getThemeValue('typography.fontSize.lg')};
  font-weight: ${getThemeValue('typography.fontWeight.bold')};
`;

const ErrorMessage = styled.div`
  color: ${getThemeValue('colors.text.primary')};
  margin-bottom: ${getThemeValue('spacing.lg')};
  line-height: 1.5;
  white-space: pre-line;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: ${getThemeValue('spacing.md')};
  justify-content: flex-end;
`;

const ErrorButton = styled(Button)`
  padding: ${getThemeValue('spacing.sm')} ${getThemeValue('spacing.md')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
`;

export const SubmitButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const nodes = useStore(state => state.nodes);
    const edges = useStore(state => state.edges);

    const formatPipelineAlert = (response) => {
        const { num_nodes, num_edges, is_dag } = response;
        
        // Create a comprehensive, user-friendly alert message
        let message = '🎉 Pipeline Submitted Successfully!\n\n';
        message += '📊 Pipeline Analysis Results:\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        // Node count with descriptive text
        message += `📦 Total Nodes: ${num_nodes}\n`;
        if (num_nodes === 0) {
            message += '   ⚠️  Your pipeline is empty\n';
        } else if (num_nodes === 1) {
            message += '   ℹ️  Single node pipeline\n';
        } else {
            message += `   ✅ Multi-node pipeline with ${num_nodes} processing units\n`;
        }
        
        message += '\n';
        
        // Edge count with descriptive text
        message += `🔗 Total Connections: ${num_edges}\n`;
        if (num_edges === 0 && num_nodes > 1) {
            message += '   ⚠️  No connections between nodes\n';
        } else if (num_edges > 0) {
            message += `   ✅ ${num_edges} connection${num_edges === 1 ? '' : 's'} established\n`;
        }
        
        message += '\n';
        
        // DAG validation with detailed explanation
        message += `🔄 Graph Structure: ${is_dag ? 'Valid DAG ✅' : 'Invalid (Contains Cycles) ❌'}\n`;
        if (is_dag) {
            message += '   ✅ Your pipeline forms a valid Directed Acyclic Graph\n';
            message += '   ✅ No circular dependencies detected\n';
            message += '   ✅ Pipeline can be executed successfully\n';
        } else {
            message += '   ❌ Circular dependencies detected in your pipeline\n';
            message += '   ⚠️  This may cause infinite loops during execution\n';
            message += '   💡 Please review and remove circular connections\n';
        }
        
        message += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        message += '💡 Tip: A valid DAG ensures your pipeline can execute without loops!';
        
        return message;
    };

    const getErrorDetails = (error) => {
        if (!(error instanceof PipelineAPIError)) {
            return {
                title: 'Unexpected Error',
                message: `An unexpected error occurred: ${error.message}`,
                canRetry: false,
                actions: ['Close']
            };
        }

        switch (error.type) {
            case 'NETWORK_ERROR':
                return {
                    title: 'Connection Failed',
                    message: `Unable to connect to the server.\n\n🔧 Troubleshooting Steps:\n• Check if the backend server is running on http://localhost:8000\n• Verify your network connection\n• Make sure no firewall is blocking the connection\n• Try refreshing the page and attempting again`,
                    canRetry: true,
                    actions: ['Check Server Status', 'Retry', 'Close']
                };

            case 'TIMEOUT_ERROR':
                return {
                    title: 'Request Timeout',
                    message: `The server took too long to respond (>30 seconds).\n\n💡 This might be due to:\n• Server overload or slow processing\n• Network connectivity issues\n• Large pipeline complexity\n\nTry submitting again or simplify your pipeline.`,
                    canRetry: true,
                    actions: ['Retry', 'Close']
                };

            case 'VALIDATION_ERROR':
                return {
                    title: 'Invalid Pipeline Data',
                    message: `${error.message}\n\n🔍 Please check:\n• All nodes have valid configurations\n• All connections are properly established\n• No corrupted data in your pipeline`,
                    canRetry: false,
                    actions: ['Close']
                };

            case 'HTTP_ERROR':
                if (error.status === 400) {
                    return {
                        title: 'Invalid Request',
                        message: `The server rejected your pipeline data.\n\n📝 Error Details:\n${error.message}\n\n💡 Please verify:\n• All nodes have required fields\n• All edges connect valid nodes\n• Pipeline structure is correct`,
                        canRetry: false,
                        actions: ['Close']
                    };
                } else if (error.status >= 500) {
                    return {
                        title: 'Server Error',
                        message: `The server encountered an internal error (${error.status}).\n\n🔧 This is likely a temporary issue.\nPlease try again in a moment.\n\nIf the problem persists, contact support.`,
                        canRetry: true,
                        actions: ['Retry', 'Close']
                    };
                } else {
                    return {
                        title: `HTTP Error ${error.status}`,
                        message: `Server responded with error: ${error.message}`,
                        canRetry: error.status >= 500,
                        actions: error.status >= 500 ? ['Retry', 'Close'] : ['Close']
                    };
                }

            case 'MAX_RETRIES_EXCEEDED':
                return {
                    title: 'Multiple Attempts Failed',
                    message: `Pipeline submission failed after ${error.details?.attempts || 3} attempts.\n\n🔄 Last error: ${error.details?.originalError?.message || 'Unknown error'}\n\n💡 Suggestions:\n• Check your network connection\n• Verify the server is running and accessible\n• Try again later if this is a server issue\n• Simplify your pipeline if it's too complex`,
                    canRetry: true,
                    actions: ['Retry', 'Close']
                };

            case 'INVALID_RESPONSE':
                return {
                    title: 'Invalid Server Response',
                    message: `The server returned an unexpected response format.\n\n🔧 This indicates a server-side issue.\nPlease try again or contact support if the problem persists.`,
                    canRetry: true,
                    actions: ['Retry', 'Close']
                };

            default:
                return {
                    title: 'Unknown Error',
                    message: `An unknown error occurred: ${error.message}\n\nError Type: ${error.type}`,
                    canRetry: true,
                    actions: ['Retry', 'Close']
                };
        }
    };

    const handleHealthCheck = async () => {
        try {
            setIsLoading(true);
            await pipelineAPI.healthCheck();
            alert('✅ Server is running and accessible!\n\nThe backend server is responding correctly.\nYou can now try submitting your pipeline again.');
        } catch (error) {
            const healthError = getErrorDetails(error);
            alert(`❌ Server Health Check Failed\n\n${healthError.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = async () => {
        setError(null);
        setRetryCount(prev => prev + 1);
        await handleSubmit();
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        setIsLoading(true);
        
        try {
            const response = await pipelineAPI.submitPipeline(nodes, edges);
            
            // Reset retry count on success
            setRetryCount(0);
            
            // Show enhanced success alert with formatted pipeline statistics
            const alertMessage = formatPipelineAlert(response);
            setSuccessData({ title: 'Pipeline Submitted Successfully!', message: alertMessage });
            
        } catch (error) {
            console.error('Pipeline submission failed:', error);
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleErrorAction = (action) => {
        switch (action) {
            case 'Retry':
                handleRetry();
                break;
            case 'Check Server Status':
                setError(null);
                handleHealthCheck();
                break;
            case 'Close':
            default:
                setError(null);
                break;
        }
    };

    const errorDetails = error ? getErrorDetails(error) : null;

    return (
        <>
            <StyledSubmitButton 
                type="button" 
                onClick={handleSubmit}
                disabled={isLoading}
                title={retryCount > 0 ? `Retry attempt ${retryCount}` : 'Submit pipeline for analysis'}
            >
                {isLoading && <LoadingSpinner />}
                {isLoading ? 'Submitting...' : 'Submit Pipeline'}
            </StyledSubmitButton>

            {error && errorDetails && (
                <ErrorModal onClick={(e) => e.target === e.currentTarget && setError(null)}>
                    <ErrorContent>
                        <ErrorTitle>{errorDetails.title}</ErrorTitle>
                        <ErrorMessage>{errorDetails.message}</ErrorMessage>
                        <ErrorActions>
                            {errorDetails.actions.map((action) => (
                                <ErrorButton
                                    key={action}
                                    onClick={() => handleErrorAction(action)}
                                    style={{
                                        backgroundColor: action === 'Retry' ? getThemeValue('colors.secondary') : 
                                                       action === 'Check Server Status' ? getThemeValue('colors.warning') :
                                                       getThemeValue('colors.border'),
                                        color: action === 'Close' ? getThemeValue('colors.text.primary') : getThemeValue('colors.text.inverse')
                                    }}
                                >
                                    {action}
                                </ErrorButton>
                            ))}
                        </ErrorActions>
                    </ErrorContent>
                </ErrorModal>
            )}

            {successData && (
                <ErrorModal onClick={() => setSuccessData(null)}>
                    <ErrorContent>
                        <ErrorTitle>{successData.title}</ErrorTitle>
                        <ErrorMessage>{successData.message}</ErrorMessage>
                        <ErrorActions>
                            <ErrorButton onClick={() => setSuccessData(null)}>Close</ErrorButton>
                        </ErrorActions>
                    </ErrorContent>
                </ErrorModal>
            )}
        </>
    );
}