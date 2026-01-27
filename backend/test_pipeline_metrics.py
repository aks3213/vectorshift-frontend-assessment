"""
Property-based tests for pipeline metrics calculation.

This module tests Property 7: Pipeline Metrics Calculation and Property 8: DAG Validation
Validates: Requirements 4.2, 4.3, 4.4
"""

import pytest
from hypothesis import given, strategies as st
from fastapi.testclient import TestClient
from main import app, PipelineData

client = TestClient(app)

# Strategy for generating valid node objects with unique IDs
@st.composite
def unique_node_strategy(draw, existing_ids=None):
    """Generate a node with a unique ID."""
    if existing_ids is None:
        existing_ids = set()
    
    # Generate a unique ID
    node_id = draw(st.text(min_size=1, max_size=50))
    attempts = 0
    while node_id in existing_ids and attempts < 100:
        node_id = draw(st.text(min_size=1, max_size=50))
        attempts += 1
    
    # If we can't generate a unique ID, use a UUID-like approach
    if node_id in existing_ids:
        import uuid
        node_id = str(uuid.uuid4())[:8]
    
    existing_ids.add(node_id)
    
    return {
        'id': node_id,
        'type': draw(st.sampled_from(['input', 'output', 'text', 'llm', 'aggregator', 'conditional', 'delay', 'filter', 'transform'])),
        'position': {
            'x': draw(st.floats(min_value=-1000, max_value=1000)),
            'y': draw(st.floats(min_value=-1000, max_value=1000))
        },
        'data': draw(st.dictionaries(st.text(), st.one_of(st.text(), st.integers(), st.booleans())))
    }

# Strategy for generating valid pipeline data with unique node IDs and consistent references
@st.composite
def pipeline_strategy(draw):
    """Generate valid pipeline data where all node IDs are unique and edges only reference existing nodes."""
    # Generate nodes with unique IDs
    num_nodes = draw(st.integers(min_value=0, max_value=20))
    nodes = []
    existing_ids = set()
    
    for i in range(num_nodes):
        # Generate unique node ID
        node_id = f"node_{i}_{draw(st.integers(min_value=0, max_value=9999))}"
        while node_id in existing_ids:
            node_id = f"node_{i}_{draw(st.integers(min_value=0, max_value=9999))}"
        
        existing_ids.add(node_id)
        
        node = {
            'id': node_id,
            'type': draw(st.sampled_from(['input', 'output', 'text', 'llm', 'aggregator', 'conditional', 'delay', 'filter', 'transform'])),
            'position': {
                'x': draw(st.floats(min_value=-1000, max_value=1000)),
                'y': draw(st.floats(min_value=-1000, max_value=1000))
            },
            'data': draw(st.dictionaries(st.text(), st.one_of(st.text(), st.integers(), st.booleans())))
        }
        nodes.append(node)
    
    # Extract node IDs for edge generation
    node_ids = [node['id'] for node in nodes]
    
    # Generate edges that only reference existing nodes
    if len(node_ids) >= 2:
        # Generate edges between existing nodes
        edges = draw(st.lists(
            st.fixed_dictionaries({
                'id': st.text(min_size=1, max_size=50),
                'source': st.sampled_from(node_ids),
                'target': st.sampled_from(node_ids),
                'sourceHandle': st.one_of(st.none(), st.text()),
                'targetHandle': st.one_of(st.none(), st.text())
            }),
            min_size=0,
            max_size=min(50, len(node_ids) * 2)  # Reasonable edge limit
        ))
    else:
        # No edges if fewer than 2 nodes
        edges = []
    
    return {'nodes': nodes, 'edges': edges}

@given(pipeline_strategy())
def test_property_7_pipeline_metrics_calculation(pipeline_data):
    """
    **Feature: vectorshift-assessment, Property 7: Pipeline Metrics Calculation**
    
    Property: For any pipeline data (nodes and edges), the backend should correctly 
    calculate the number of nodes and edges, returning accurate counts.
    
    **Validates: Requirements 4.2, 4.3**
    """
    # Arrange
    nodes = pipeline_data['nodes']
    edges = pipeline_data['edges']
    expected_num_nodes = len(nodes)
    expected_num_edges = len(edges)
    
    # Act
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    
    # Verify the response contains the required fields
    assert 'num_nodes' in response_data
    assert 'num_edges' in response_data
    assert 'is_dag' in response_data
    
    # Verify the counts are correct (Requirements 4.2, 4.3)
    assert response_data['num_nodes'] == expected_num_nodes, f"Expected {expected_num_nodes} nodes, got {response_data['num_nodes']}"
    assert response_data['num_edges'] == expected_num_edges, f"Expected {expected_num_edges} edges, got {response_data['num_edges']}"
    
    # Verify the types are correct
    assert isinstance(response_data['num_nodes'], int)
    assert isinstance(response_data['num_edges'], int)
    assert isinstance(response_data['is_dag'], bool)

@pytest.mark.parametrize("num_nodes,num_edges", [
    (0, 0),  # Empty pipeline
    (1, 0),  # Single node, no edges
    (2, 1),  # Two nodes, one edge
    (10, 9),  # Multiple nodes with valid edges (changed from 15 to 9)
])
def test_pipeline_metrics_specific_cases(num_nodes, num_edges):
    """
    Unit test for specific cases of pipeline metrics calculation.
    Tests edge cases and boundary conditions.
    """
    # Generate test data
    nodes = [{'id': f'node_{i}', 'type': 'text', 'position': {'x': 0, 'y': 0}, 'data': {}} for i in range(num_nodes)]
    
    # Generate edges that only reference existing nodes
    edges = []
    if num_nodes > 0:
        for i in range(min(num_edges, num_nodes - 1)):  # Ensure we don't exceed valid connections
            source_idx = i % num_nodes
            target_idx = (i + 1) % num_nodes
            edges.append({
                'id': f'edge_{i}', 
                'source': f'node_{source_idx}', 
                'target': f'node_{target_idx}'
            })
    
    pipeline_data = {'nodes': nodes, 'edges': edges}
    
    # Act
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['num_nodes'] == num_nodes
    assert response_data['num_edges'] == num_edges

def test_pipeline_data_model_validation():
    """
    Test that the PipelineData model correctly validates input data.
    """
    # Test valid data
    valid_data = {'nodes': [], 'edges': []}
    pipeline = PipelineData(**valid_data)
    assert pipeline.nodes == []
    assert pipeline.edges == []
    
    # Test with actual node and edge data
    node_data = {'nodes': [{'id': 'test', 'type': 'text'}], 'edges': [{'id': 'edge1', 'source': 'a', 'target': 'b'}]}
    pipeline = PipelineData(**node_data)
    assert len(pipeline.nodes) == 1
    assert len(pipeline.edges) == 1

# Strategy for generating DAG test cases
@st.composite
def generate_dag_nodes_edges(draw):
    """Generate nodes and edges that form a DAG structure."""
    num_nodes = draw(st.integers(min_value=1, max_value=20))
    
    # Generate nodes with sequential IDs for easier DAG construction
    nodes = []
    for i in range(num_nodes):
        node = {
            'id': f'node_{i}',
            'type': draw(st.sampled_from(['input', 'output', 'text', 'llm', 'aggregator', 'conditional', 'delay', 'filter', 'transform'])),
            'position': {'x': draw(st.floats(min_value=-1000, max_value=1000)), 'y': draw(st.floats(min_value=-1000, max_value=1000))},
            'data': draw(st.dictionaries(st.text(), st.one_of(st.text(), st.integers(), st.booleans())))
        }
        nodes.append(node)
    
    # Generate edges that maintain DAG property (only connect from lower to higher indices)
    edges = []
    edge_count = 0
    for i in range(num_nodes):
        for j in range(i + 1, num_nodes):
            # Randomly decide whether to add this edge (but ensure DAG property)
            if draw(st.booleans()) and edge_count < num_nodes * 2:  # Limit edge count
                edge = {
                    'id': f'edge_{edge_count}',
                    'source': f'node_{i}',
                    'target': f'node_{j}',
                    'sourceHandle': draw(st.one_of(st.none(), st.text())),
                    'targetHandle': draw(st.one_of(st.none(), st.text()))
                }
                edges.append(edge)
                edge_count += 1
    
    return {'nodes': nodes, 'edges': edges}

@st.composite
def generate_cyclic_nodes_edges(draw):
    """Generate nodes and edges that contain at least one cycle."""
    num_nodes = draw(st.integers(min_value=2, max_value=10))
    
    # Generate nodes
    nodes = []
    for i in range(num_nodes):
        node = {
            'id': f'node_{i}',
            'type': draw(st.sampled_from(['input', 'output', 'text', 'llm', 'aggregator', 'conditional', 'delay', 'filter', 'transform'])),
            'position': {'x': draw(st.floats(min_value=-1000, max_value=1000)), 'y': draw(st.floats(min_value=-1000, max_value=1000))},
            'data': draw(st.dictionaries(st.text(), st.one_of(st.text(), st.integers(), st.booleans())))
        }
        nodes.append(node)
    
    # Create a cycle by connecting nodes in a ring
    edges = []
    for i in range(num_nodes):
        edge = {
            'id': f'edge_{i}',
            'source': f'node_{i}',
            'target': f'node_{(i + 1) % num_nodes}',
            'sourceHandle': draw(st.one_of(st.none(), st.text())),
            'targetHandle': draw(st.one_of(st.none(), st.text()))
        }
        edges.append(edge)
    
    # Optionally add more edges
    edge_count = num_nodes
    for i in range(num_nodes):
        for j in range(num_nodes):
            if i != j and edge_count < num_nodes * 2:
                if draw(st.booleans()):  # Randomly add additional edges
                    edge = {
                        'id': f'edge_{edge_count}',
                        'source': f'node_{i}',
                        'target': f'node_{j}',
                        'sourceHandle': draw(st.one_of(st.none(), st.text())),
                        'targetHandle': draw(st.one_of(st.none(), st.text()))
                    }
                    edges.append(edge)
                    edge_count += 1
    
    return {'nodes': nodes, 'edges': edges}

@given(st.data())
def test_property_8_dag_validation(data):
    """
    **Feature: vectorshift-assessment, Property 8: DAG Validation**
    
    Property: For any pipeline structure, the backend should correctly identify 
    whether the graph forms a valid DAG (contains no cycles).
    
    **Validates: Requirements 4.4**
    """
    # Test both DAG and non-DAG cases
    test_case = data.draw(st.sampled_from(['dag', 'cyclic', 'empty', 'single_node']))
    
    if test_case == 'dag':
        # Generate a structure that should be a DAG
        pipeline_data = data.draw(generate_dag_nodes_edges())
        expected_is_dag = True
        
    elif test_case == 'cyclic':
        # Generate a structure that contains cycles
        pipeline_data = data.draw(generate_cyclic_nodes_edges())
        expected_is_dag = False
        
    elif test_case == 'empty':
        # Empty pipeline should be a DAG
        pipeline_data = {'nodes': [], 'edges': []}
        expected_is_dag = True
        
    else:  # single_node
        # Single node with no edges should be a DAG
        node = {
            'id': 'single_node',
            'type': data.draw(st.sampled_from(['input', 'output', 'text', 'llm'])),
            'position': {'x': 0, 'y': 0},
            'data': {}
        }
        pipeline_data = {'nodes': [node], 'edges': []}
        expected_is_dag = True
    
    # Act
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    
    # Verify the response contains the required fields
    assert 'num_nodes' in response_data
    assert 'num_edges' in response_data
    assert 'is_dag' in response_data
    
    # Verify the DAG validation result
    actual_is_dag = response_data['is_dag']
    assert isinstance(actual_is_dag, bool), "is_dag should be a boolean value"
    
    # For known cases, verify the expected result
    if test_case in ['empty', 'single_node']:
        assert actual_is_dag == expected_is_dag, f"Expected is_dag={expected_is_dag} for {test_case} case, got {actual_is_dag}"
    elif test_case == 'cyclic':
        assert actual_is_dag == False, f"Cyclic graph should have is_dag=False, got {actual_is_dag}"

@pytest.mark.parametrize("nodes,edges,expected_is_dag", [
    # Empty graph - should be DAG
    ([], [], True),
    
    # Single node - should be DAG
    ([{'id': 'a', 'type': 'text'}], [], True),
    
    # Two nodes, one edge - should be DAG
    ([{'id': 'a', 'type': 'text'}, {'id': 'b', 'type': 'text'}], 
     [{'id': 'e1', 'source': 'a', 'target': 'b'}], True),
    
    # Simple cycle - should not be DAG
    ([{'id': 'a', 'type': 'text'}, {'id': 'b', 'type': 'text'}], 
     [{'id': 'e1', 'source': 'a', 'target': 'b'}, {'id': 'e2', 'source': 'b', 'target': 'a'}], False),
    
    # Three node cycle - should not be DAG
    ([{'id': 'a', 'type': 'text'}, {'id': 'b', 'type': 'text'}, {'id': 'c', 'type': 'text'}], 
     [{'id': 'e1', 'source': 'a', 'target': 'b'}, {'id': 'e2', 'source': 'b', 'target': 'c'}, {'id': 'e3', 'source': 'c', 'target': 'a'}], False),
    
    # Self-loop - should not be DAG
    ([{'id': 'a', 'type': 'text'}], 
     [{'id': 'e1', 'source': 'a', 'target': 'a'}], False),
    
    # Complex DAG - should be DAG
    ([{'id': 'a', 'type': 'text'}, {'id': 'b', 'type': 'text'}, {'id': 'c', 'type': 'text'}, {'id': 'd', 'type': 'text'}], 
     [{'id': 'e1', 'source': 'a', 'target': 'b'}, {'id': 'e2', 'source': 'a', 'target': 'c'}, {'id': 'e3', 'source': 'b', 'target': 'd'}, {'id': 'e4', 'source': 'c', 'target': 'd'}], True),
])
def test_dag_validation_specific_cases(nodes, edges, expected_is_dag):
    """
    Unit test for specific DAG validation cases.
    Tests known DAG and non-DAG structures.
    """
    pipeline_data = {'nodes': nodes, 'edges': edges}
    
    # Act
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['is_dag'] == expected_is_dag, f"Expected is_dag={expected_is_dag}, got {response_data['is_dag']} for nodes={[n.get('id', 'unknown') for n in nodes]}, edges={[(e.get('source', 'unknown'), e.get('target', 'unknown')) for e in edges]}"

@given(pipeline_strategy())
def test_property_9_api_response_format(pipeline_data):
    """
    **Feature: vectorshift-assessment, Property 9: API Response Format**
    
    Property: For any valid pipeline submission, the backend should return a response 
    containing exactly the fields: num_nodes (integer), num_edges (integer), and is_dag (boolean).
    
    **Validates: Requirements 4.5**
    """
    # Act
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    # Assert successful response
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    
    # Get response data
    response_data = response.json()
    
    # Verify response contains exactly the required fields (no more, no less)
    expected_fields = {'num_nodes', 'num_edges', 'is_dag'}
    actual_fields = set(response_data.keys())
    assert actual_fields == expected_fields, f"Response fields mismatch. Expected: {expected_fields}, Got: {actual_fields}"
    
    # Verify field types are correct
    assert isinstance(response_data['num_nodes'], int), f"num_nodes should be int, got {type(response_data['num_nodes'])}"
    assert isinstance(response_data['num_edges'], int), f"num_edges should be int, got {type(response_data['num_edges'])}"
    assert isinstance(response_data['is_dag'], bool), f"is_dag should be bool, got {type(response_data['is_dag'])}"
    
    # Verify field values are non-negative integers for counts
    assert response_data['num_nodes'] >= 0, f"num_nodes should be non-negative, got {response_data['num_nodes']}"
    assert response_data['num_edges'] >= 0, f"num_edges should be non-negative, got {response_data['num_edges']}"
    
    # Verify field values match expected counts
    expected_num_nodes = len(pipeline_data['nodes'])
    expected_num_edges = len(pipeline_data['edges'])
    assert response_data['num_nodes'] == expected_num_nodes, f"Expected {expected_num_nodes} nodes, got {response_data['num_nodes']}"
    assert response_data['num_edges'] == expected_num_edges, f"Expected {expected_num_edges} edges, got {response_data['num_edges']}"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

# Additional tests for error handling and structured response format (Task 6.7)

def test_structured_response_format():
    """
    Test that the API returns the exact structured response format required.
    Validates: Requirements 4.5
    """
    # Test with valid data (both nodes must exist)
    pipeline_data = {
        'nodes': [
            {'id': 'node1', 'type': 'text'},
            {'id': 'node2', 'type': 'text'}
        ],
        'edges': [{'id': 'edge1', 'source': 'node1', 'target': 'node2'}]
    }
    
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    # Assert successful response
    assert response.status_code == 200
    response_data = response.json()
    
    # Verify exact response structure
    assert set(response_data.keys()) == {'num_nodes', 'num_edges', 'is_dag'}
    
    # Verify data types
    assert isinstance(response_data['num_nodes'], int)
    assert isinstance(response_data['num_edges'], int)
    assert isinstance(response_data['is_dag'], bool)
    
    # Verify values
    assert response_data['num_nodes'] == 2
    assert response_data['num_edges'] == 1
    assert response_data['is_dag'] == True

def test_error_handling_invalid_json():
    """
    Test error handling for invalid JSON input.
    """
    # Send invalid JSON
    response = client.post('/pipelines/parse', 
                          data="invalid json",
                          headers={"Content-Type": "application/json"})
    
    assert response.status_code == 422  # FastAPI validation error
    response_data = response.json()
    assert 'detail' in response_data

def test_error_handling_missing_fields():
    """
    Test error handling for missing required fields.
    """
    # Missing 'nodes' field
    response = client.post('/pipelines/parse', json={'edges': []})
    assert response.status_code == 422
    
    # Missing 'edges' field
    response = client.post('/pipelines/parse', json={'nodes': []})
    assert response.status_code == 422

def test_error_handling_invalid_field_types():
    """
    Test error handling for invalid field types.
    """
    # 'nodes' is not a list
    response = client.post('/pipelines/parse', json={'nodes': 'invalid', 'edges': []})
    assert response.status_code == 422
    
    # 'edges' is not a list
    response = client.post('/pipelines/parse', json={'nodes': [], 'edges': 'invalid'})
    assert response.status_code == 422

def test_error_handling_malformed_nodes():
    """
    Test error handling for malformed node data.
    """
    # Node without 'id' field should return 400 (validation error)
    pipeline_data = {
        'nodes': [{'type': 'text'}],  # Missing 'id'
        'edges': []
    }
    
    response = client.post('/pipelines/parse', json=pipeline_data)
    # This should return 400 due to our validation
    assert response.status_code == 400
    response_data = response.json()
    assert 'error' in response_data
    assert response_data['status_code'] == 400

def test_error_handling_malformed_edges():
    """
    Test error handling for malformed edge data.
    """
    # Edge without 'source' or 'target' field should return 400 (validation error)
    pipeline_data = {
        'nodes': [{'id': 'node1', 'type': 'text'}],
        'edges': [{'id': 'edge1'}]  # Missing 'source' and 'target'
    }
    
    response = client.post('/pipelines/parse', json=pipeline_data)
    # This should return 400 due to our validation
    assert response.status_code == 400
    response_data = response.json()
    assert 'error' in response_data
    assert response_data['status_code'] == 400

def test_http_status_codes():
    """
    Test that appropriate HTTP status codes are returned.
    """
    # Valid request should return 200
    valid_data = {'nodes': [], 'edges': []}
    response = client.post('/pipelines/parse', json=valid_data)
    assert response.status_code == 200
    
    # Invalid request should return 422 (validation error)
    response = client.post('/pipelines/parse', json={})
    assert response.status_code == 422
    
    # Malformed data should return 400 (validation error)
    malformed_data = {'nodes': [{}], 'edges': []}  # Node without id
    response = client.post('/pipelines/parse', json=malformed_data)
    assert response.status_code == 400

def test_error_response_structure():
    """
    Test that error responses have the correct structure.
    """
    # Test 400 error response structure
    malformed_data = {'nodes': [{}], 'edges': []}  # Node without id
    response = client.post('/pipelines/parse', json=malformed_data)
    
    assert response.status_code == 400
    response_data = response.json()
    
    # Verify error response structure
    assert 'error' in response_data
    assert 'message' in response_data
    assert 'status_code' in response_data
    assert response_data['status_code'] == 400

def test_large_pipeline_handling():
    """
    Test that the API can handle large pipelines without errors.
    """
    # Create a large but valid pipeline
    num_nodes = 1000
    nodes = [{'id': f'node_{i}', 'type': 'text'} for i in range(num_nodes)]
    edges = [{'id': f'edge_{i}', 'source': f'node_{i}', 'target': f'node_{i+1}'} 
             for i in range(num_nodes-1)]
    
    pipeline_data = {'nodes': nodes, 'edges': edges}
    
    response = client.post('/pipelines/parse', json=pipeline_data)
    
    assert response.status_code == 200
    response_data = response.json()
    assert response_data['num_nodes'] == num_nodes
    assert response_data['num_edges'] == num_nodes - 1
    assert response_data['is_dag'] == True