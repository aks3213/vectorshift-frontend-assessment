from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from typing import List, Dict, Any, Set
import logging
import traceback
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VectorShift Pipeline API",
    description="API for processing and validating node-based pipelines",
    version="1.0.0"
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PipelineData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class PipelineResponse(BaseModel):
    """Structured response model for pipeline parsing."""
    num_nodes: int
    num_edges: int
    is_dag: bool

class ErrorResponse(BaseModel):
    """Enhanced error response model."""
    error: str
    message: str
    status_code: int
    timestamp: float
    details: Dict[str, Any] = None

class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    message: str
    timestamp: float
    version: str = "1.0.0"

def validate_pipeline_structure(pipeline_data: PipelineData) -> None:
    """
    Validate the structure and content of pipeline data.
    
    Args:
        pipeline_data: The pipeline data to validate
        
    Raises:
        HTTPException: If validation fails
    """
    nodes = pipeline_data.nodes
    edges = pipeline_data.edges
    
    # Validate nodes structure
    if not isinstance(nodes, list):
        raise HTTPException(
            status_code=400,
            detail="Invalid input: 'nodes' must be a list"
        )
    
    if not isinstance(edges, list):
        raise HTTPException(
            status_code=400,
            detail="Invalid input: 'edges' must be a list"
        )
    
    # Validate individual nodes
    node_ids = set()
    for i, node in enumerate(nodes):
        if not isinstance(node, dict):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid node at index {i}: must be an object"
            )
        
        node_id = node.get('id')
        if not node_id:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid node at index {i}: missing required 'id' field"
            )
        
        if node_id in node_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate node ID '{node_id}' found at index {i}"
            )
        
        node_ids.add(str(node_id))
    
    # Validate individual edges
    for i, edge in enumerate(edges):
        if not isinstance(edge, dict):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid edge at index {i}: must be an object"
            )
        
        source = edge.get('source')
        target = edge.get('target')
        
        if not source:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid edge at index {i}: missing required 'source' field"
            )
        
        if not target:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid edge at index {i}: missing required 'target' field"
            )
        
        # Check if source and target nodes exist
        if str(source) not in node_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid edge at index {i}: source node '{source}' does not exist"
            )
        
        if str(target) not in node_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid edge at index {i}: target node '{target}' does not exist"
            )

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

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for debugging and monitoring."""
    start_time = time.time()
    
    # Log request details
    logger.info(f"Request: {request.method} {request.url}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {str(e)} - {process_time:.3f}s")
        raise

@app.get('/', response_model=HealthResponse)
def health_check():
    """Health check endpoint to verify server status."""
    return HealthResponse(
        status="healthy",
        message="VectorShift Pipeline API is running",
        timestamp=time.time()
    )

@app.get('/health', response_model=HealthResponse)
def detailed_health_check():
    """Detailed health check with additional system information."""
    return HealthResponse(
        status="healthy",
        message="All systems operational",
        timestamp=time.time()
    )

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
        # Validate input data structure and content
        validate_pipeline_structure(pipeline_data)
        
        nodes = pipeline_data.nodes
        edges = pipeline_data.edges
        
        # Count nodes and edges (Requirements 4.2, 4.3)
        num_nodes = len(nodes)
        num_edges = len(edges)
        
        logger.info(f"Processing pipeline with {num_nodes} nodes and {num_edges} edges")
        
        # Validate if the pipeline forms a DAG (Requirements 4.4)
        try:
            is_dag_result = is_dag(nodes, edges)
            logger.info(f"DAG validation result: {is_dag_result}")
        except ValueError as e:
            logger.error(f"DAG validation error: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"DAG validation failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error during DAG validation: {str(e)}")
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
        logger.error(f"Pydantic validation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input data format: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in parse_pipeline: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error occurred while processing pipeline"
        )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Enhanced exception handler for HTTP exceptions."""
    error_response = ErrorResponse(
        error="HTTP_ERROR",
        message=exc.detail,
        status_code=exc.status_code,
        timestamp=time.time(),
        details={
            "path": str(request.url.path),
            "method": request.method
        }
    )
    
    logger.error(f"HTTP Exception {exc.status_code}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.dict()
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Enhanced exception handler for Pydantic validation errors."""
    error_response = ErrorResponse(
        error="VALIDATION_ERROR",
        message="Invalid input data format",
        status_code=400,
        timestamp=time.time(),
        details={
            "path": str(request.url.path),
            "method": request.method,
            "validation_errors": exc.errors()
        }
    )
    
    logger.error(f"Validation Error: {exc.errors()}")
    
    return JSONResponse(
        status_code=400,
        content=error_response.dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Enhanced exception handler for unexpected errors."""
    error_response = ErrorResponse(
        error="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        status_code=500,
        timestamp=time.time(),
        details={
            "path": str(request.url.path),
            "method": request.method,
            "error_type": type(exc).__name__
        }
    )
    
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content=error_response.dict()
    )
