from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Any, Set
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class PipelineData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class PipelineResponse(BaseModel):
    """Structured response model for pipeline parsing."""
    num_nodes: int
    num_edges: int
    is_dag: bool

class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    message: str
    status_code: int

def is_dag(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> bool:
    """
    Determine if the pipeline forms a valid DAG (Directed Acyclic Graph) using DFS cycle detection.
    
    Args:
        nodes: List of node dictionaries with 'id' field
        edges: List of edge dictionaries with 'source' and 'target' fields
        
    Returns:
        bool: True if the graph is a DAG (no cycles), False if cycles exist
        
    Raises:
        ValueError: If nodes or edges contain invalid data
    """
    try:
        # Handle empty graph case
        if not nodes:
            return True  # Empty graph is a DAG
        
        # Build adjacency list from edges
        graph = {}
        node_ids = set()
        
        # Initialize graph with all nodes
        for node in nodes:
            if not isinstance(node, dict):
                raise ValueError(f"Invalid node format: expected dict, got {type(node)}")
            
            node_id = node.get('id')
            if not node_id:
                raise ValueError("Node missing required 'id' field")
            
            if not isinstance(node_id, str):
                # Convert to string for consistency
                node_id = str(node_id)
            
            graph[node_id] = []
            node_ids.add(node_id)
        
        # Add edges to adjacency list
        for edge in edges:
            if not isinstance(edge, dict):
                raise ValueError(f"Invalid edge format: expected dict, got {type(edge)}")
            
            source = edge.get('source')
            target = edge.get('target')
            
            if not source or not target:
                raise ValueError("Edge missing required 'source' or 'target' field")
            
            # Convert to strings for consistency
            source = str(source)
            target = str(target)
            
            # Only add edges between existing nodes
            if source in node_ids and target in node_ids:
                graph[source].append(target)
            # Note: We silently ignore edges to non-existent nodes rather than raising an error
            # This allows for more flexible pipeline structures
        
        # DFS cycle detection using three colors:
        # WHITE (0): unvisited
        # GRAY (1): currently being processed (in recursion stack)
        # BLACK (2): completely processed
        WHITE, GRAY, BLACK = 0, 1, 2
        colors = {node_id: WHITE for node_id in node_ids}
        
        def dfs_has_cycle(node_id: str) -> bool:
            """
            Perform DFS to detect cycles starting from given node.
            
            Args:
                node_id: Starting node ID for DFS
                
            Returns:
                bool: True if cycle detected, False otherwise
            """
            if colors[node_id] == GRAY:
                # Back edge found - cycle detected
                return True
            
            if colors[node_id] == BLACK:
                # Already processed this node
                return False
            
            # Mark as currently being processed
            colors[node_id] = GRAY
            
            # Visit all neighbors
            for neighbor in graph[node_id]:
                if dfs_has_cycle(neighbor):
                    return True
            
            # Mark as completely processed
            colors[node_id] = BLACK
            return False
        
        # Check for cycles starting from each unvisited node
        for node_id in node_ids:
            if colors[node_id] == WHITE:
                if dfs_has_cycle(node_id):
                    return False  # Cycle found - not a DAG
        
        return True  # No cycles found - is a DAG
        
    except Exception as e:
        logger.error(f"Error in is_dag function: {str(e)}")
        raise ValueError(f"DAG validation failed: {str(e)}")

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

@app.post('/pipelines/parse', response_model=PipelineResponse)
def parse_pipeline(pipeline_data: PipelineData):
    """
    Parse pipeline data and return metrics including node count, edge count, and DAG validation.
    
    Args:
        pipeline_data: PipelineData containing nodes and edges arrays
        
    Returns:
        PipelineResponse: {num_nodes: int, num_edges: int, is_dag: bool}
        
    Raises:
        HTTPException: 400 for invalid input data
        HTTPException: 500 for internal server errors
    """
    try:
        # Validate input data structure
        if not isinstance(pipeline_data.nodes, list):
            raise HTTPException(
                status_code=400,
                detail="Invalid input: 'nodes' must be a list"
            )
        
        if not isinstance(pipeline_data.edges, list):
            raise HTTPException(
                status_code=400,
                detail="Invalid input: 'edges' must be a list"
            )
        
        nodes = pipeline_data.nodes
        edges = pipeline_data.edges
        
        # Count nodes and edges (Requirements 4.2, 4.3)
        num_nodes = len(nodes)
        num_edges = len(edges)
        
        # Validate if the pipeline forms a DAG (Requirements 4.4)
        try:
            is_dag_result = is_dag(nodes, edges)
        except Exception as e:
            logger.error(f"Error during DAG validation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error during DAG validation"
            )
        
        # Return structured response (Requirements 4.5)
        response = PipelineResponse(
            num_nodes=num_nodes,
            num_edges=num_edges,
            is_dag=is_dag_result
        )
        
        logger.info(f"Successfully processed pipeline: {num_nodes} nodes, {num_edges} edges, is_dag={is_dag_result}")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input data format: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in parse_pipeline: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Custom exception handler for HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc: ValidationError):
    """Custom exception handler for Pydantic validation errors."""
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation Error",
            "message": "Invalid input data format",
            "status_code": 400,
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Custom exception handler for unexpected errors."""
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "status_code": 500
        }
    )
