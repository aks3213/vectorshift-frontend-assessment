// pipelineAPI.js
// API client for backend communication with comprehensive error handling

class PipelineAPIError extends Error {
  constructor(message, status, type, details = null) {
    super(message);
    this.name = 'PipelineAPIError';
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

class PipelineAPI {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.timeout = 30000; // 30 second timeout
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second initial delay
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'TypeError' || // Network errors
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('timeout') ||
      (error.status >= 500 && error.status < 600)
    );
  }

  /**
   * Validate pipeline data before sending
   */
  validatePipelineData(nodes, edges) {
    if (!Array.isArray(nodes)) {
      throw new PipelineAPIError(
        'Invalid pipeline data: nodes must be an array',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!Array.isArray(edges)) {
      throw new PipelineAPIError(
        'Invalid pipeline data: edges must be an array',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate node structure
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || typeof node !== 'object') {
        throw new PipelineAPIError(
          `Invalid node at index ${i}: must be an object`,
          400,
          'VALIDATION_ERROR'
        );
      }
      if (!node.id) {
        throw new PipelineAPIError(
          `Invalid node at index ${i}: missing required 'id' field`,
          400,
          'VALIDATION_ERROR'
        );
      }
    }

    // Validate edge structure
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (!edge || typeof edge !== 'object') {
        throw new PipelineAPIError(
          `Invalid edge at index ${i}: must be an object`,
          400,
          'VALIDATION_ERROR'
        );
      }
      if (!edge.source || !edge.target) {
        throw new PipelineAPIError(
          `Invalid edge at index ${i}: missing required 'source' or 'target' field`,
          400,
          'VALIDATION_ERROR'
        );
      }
    }
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  async makeRequest(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorType = 'HTTP_ERROR';
        let errorDetails = null;

        try {
          // Try to parse error response body
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.error) {
            errorType = errorData.error;
          }
          errorDetails = errorData;
        } catch (parseError) {
          // If we can't parse the error response, use default message
          console.warn('Could not parse error response:', parseError);
        }

        throw new PipelineAPIError(errorMessage, response.status, errorType, errorDetails);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new PipelineAPIError(
          'Request timeout: The server took too long to respond',
          408,
          'TIMEOUT_ERROR'
        );
      }

      if (error instanceof PipelineAPIError) {
        throw error;
      }

      // Handle network errors
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        throw new PipelineAPIError(
          'Network error: Unable to connect to the server',
          0,
          'NETWORK_ERROR'
        );
      }

      // Handle other unexpected errors
      throw new PipelineAPIError(
        `Unexpected error: ${error.message}`,
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Submit pipeline with retry logic and comprehensive error handling
   */
  async submitPipeline(nodes, edges) {
    // Validate input data first
    this.validatePipelineData(nodes, edges);

    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Pipeline submission attempt ${attempt}/${this.maxRetries}`);

        const response = await this.makeRequest(`${this.baseURL}/pipelines/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nodes,
            edges,
          }),
        });

        const data = await response.json();

        // Validate response structure
        if (typeof data.num_nodes !== 'number' || 
            typeof data.num_edges !== 'number' || 
            typeof data.is_dag !== 'boolean') {
          throw new PipelineAPIError(
            'Invalid response format from server',
            500,
            'INVALID_RESPONSE'
          );
        }

        console.log('Pipeline submission successful:', data);
        return data;

      } catch (error) {
        lastError = error;
        console.error(`Pipeline submission attempt ${attempt} failed:`, error);

        // Don't retry if it's not a retryable error
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // If we get here, all retries failed
    throw new PipelineAPIError(
      `Pipeline submission failed after ${this.maxRetries} attempts: ${lastError.message}`,
      lastError.status || 0,
      'MAX_RETRIES_EXCEEDED',
      { originalError: lastError, attempts: this.maxRetries }
    );
  }

  /**
   * Health check endpoint to verify server connectivity
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest(`${this.baseURL}/`, {
        method: 'GET',
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new PipelineAPIError(
        `Health check failed: ${error.message}`,
        error.status || 0,
        'HEALTH_CHECK_FAILED'
      );
    }
  }
}

export const pipelineAPI = new PipelineAPI();
export { PipelineAPIError };