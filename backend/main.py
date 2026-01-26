from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

class PipelineData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

@app.post('/pipelines/parse')
def parse_pipeline(pipeline_data: PipelineData):
    """
    Parse pipeline data and return metrics including node count, edge count, and DAG validation.
    
    Args:
        pipeline_data: PipelineData containing nodes and edges arrays
        
    Returns:
        dict: {num_nodes: int, num_edges: int, is_dag: bool}
    """
    nodes = pipeline_data.nodes
    edges = pipeline_data.edges
    
    # Count nodes and edges
    num_nodes = len(nodes)
    num_edges = len(edges)
    
    # For now, we'll implement basic DAG validation in the next task
    # This task focuses on node and edge counting (Requirements 4.2, 4.3)
    is_dag = True  # Placeholder - will be implemented in task 6.5
    
    return {
        'num_nodes': num_nodes,
        'num_edges': num_edges,
        'is_dag': is_dag
    }
