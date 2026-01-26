"""
Property-based tests for pipeline metrics calculation.

This module tests Property 7: Pipeline Metrics Calculation
Validates: Requirements 4.2, 4.3
"""

import pytest
from hypothesis import given, strategies as st
from fastapi.testclient import TestClient
from main import app, PipelineData

client = TestClient(app)

# Strategy for generating valid node objects
node_strategy = st.fixed_dictionaries({
    'id': st.text(min_size=1, max_size=50),
    'type': st.sampled_from(['input', 'output', 'text', 'llm', 'aggregator', 'conditional', 'delay', 'filter', 'transform']),
    'position': st.fixed_dictionaries({
        'x': st.floats(min_value=-1000, max_value=1000),
        'y': st.floats(min_value=-1000, max_value=1000)
    }),
    'data': st.dictionaries(st.text(), st.one_of(st.text(), st.integers(), st.booleans()))
})

# Strategy for generating valid edge objects
edge_strategy = st.fixed_dictionaries({
    'id': st.text(min_size=1, max_size=50),
    'source': st.text(min_size=1, max_size=50),
    'target': st.text(min_size=1, max_size=50),
    'sourceHandle': st.one_of(st.none(), st.text()),
    'targetHandle': st.one_of(st.none(), st.text())
})

# Strategy for generating pipeline data
pipeline_strategy = st.fixed_dictionaries({
    'nodes': st.lists(node_strategy, min_size=0, max_size=100),
    'edges': st.lists(edge_strategy, min_size=0, max_size=100)
})

@given(pipeline_strategy)
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
    (10, 15),  # Multiple nodes and edges
])
def test_pipeline_metrics_specific_cases(num_nodes, num_edges):
    """
    Unit test for specific cases of pipeline metrics calculation.
    Tests edge cases and boundary conditions.
    """
    # Generate test data
    nodes = [{'id': f'node_{i}', 'type': 'text', 'position': {'x': 0, 'y': 0}, 'data': {}} for i in range(num_nodes)]
    edges = [{'id': f'edge_{i}', 'source': f'node_{i}', 'target': f'node_{(i+1) % max(1, num_nodes)}'} for i in range(num_edges)]
    
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

if __name__ == "__main__":
    pytest.main([__file__, "-v"])