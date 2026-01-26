// pipelineAPI.js
// API client for backend communication

class PipelineAPI {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
  }

  async submitPipeline(nodes, edges) {
    try {
      const response = await fetch(`${this.baseURL}/pipelines/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Pipeline submission failed:', error);
      throw error;
    }
  }
}

export const pipelineAPI = new PipelineAPI();