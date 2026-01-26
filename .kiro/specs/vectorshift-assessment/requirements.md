# Requirements Document

## Introduction

This document outlines the requirements for completing the VectorShift Frontend Technical Assessment. The system involves creating a node-based pipeline editor with improved abstractions, styling, dynamic text nodes, and backend integration for pipeline validation.

## Glossary

- **Node**: A visual component in the pipeline editor representing a processing unit with inputs and outputs
- **Handle**: Connection points on nodes that allow data flow between nodes
- **Pipeline**: A collection of connected nodes forming a workflow
- **DAG**: Directed Acyclic Graph - a graph with directed edges and no cycles
- **Text_Node**: A specific node type that accepts text input and can define variables
- **Variable**: A JavaScript variable name surrounded by double curly brackets (e.g., "{{ input }}")
- **Node_Abstraction**: A reusable component system for creating different node types
- **Frontend**: The React-based user interface for the pipeline editor
- **Backend**: The FastAPI-based service for pipeline processing

## Requirements

### Requirement 1: Version Control Management

**User Story:** As a developer, I want proper version control tracking, so that I can monitor progress and maintain code history throughout the assessment implementation.

#### Acceptance Criteria

1. THE System SHALL initialize a git repository for the project if one does not exist
2. THE System SHALL create an initial commit with the current project state
3. WHEN each requirement is completed, THE System SHALL create a commit with descriptive messages
4. THE System SHALL push commits to track implementation progress
5. THE System SHALL maintain a clear commit history that corresponds to requirement completion

### Requirement 2: Node Abstraction System

**User Story:** As a developer, I want a reusable node abstraction system, so that I can efficiently create new node types without duplicating code.

#### Acceptance Criteria

1. THE Node_Abstraction SHALL provide a base component that handles common node functionality
2. WHEN creating a new node type, THE Node_Abstraction SHALL allow customization of content, handles, and behavior through configuration
3. THE Node_Abstraction SHALL eliminate code duplication between existing node types (input, output, LLM, text)
4. WHEN a developer creates five new node types, THE Node_Abstraction SHALL demonstrate flexibility and efficiency
5. THE Node_Abstraction SHALL maintain compatibility with existing ReactFlow functionality
6. WHEN this requirement is completed, THE System SHALL commit and push the node abstraction implementation

### Requirement 3: Visual Design System

**User Story:** As a user, I want an appealing and unified design, so that the application is visually consistent and professional.

#### Acceptance Criteria

1. THE Frontend SHALL apply consistent styling across all components
2. THE Frontend SHALL use a unified color scheme and typography system
3. THE Frontend SHALL provide visual hierarchy and clear component boundaries
4. THE Frontend SHALL ensure responsive design that works across different screen sizes
5. THE Frontend SHALL maintain usability while improving visual appeal
6. WHEN this requirement is completed, THE System SHALL commit and push the styling implementation

### Requirement 4: Dynamic Text Node Functionality

**User Story:** As a user, I want text nodes that adapt to content and support variables, so that I can create flexible text processing workflows.

#### Acceptance Criteria

1. WHEN a user enters text in a Text_Node, THE Text_Node SHALL automatically resize width and height to accommodate the content
2. WHEN a user enters a variable pattern ({{ variable_name }}), THE Text_Node SHALL create a new Handle on the left side
3. THE Text_Node SHALL validate that variable names follow JavaScript variable naming conventions
4. WHEN a variable is removed from text, THE Text_Node SHALL remove the corresponding Handle
5. THE Text_Node SHALL maintain proper visual layout as handles are added or removed
6. THE Text_Node SHALL preserve existing functionality while adding dynamic features
7. WHEN this requirement is completed, THE System SHALL commit and push the dynamic text node implementation

### Requirement 5: Backend Pipeline Integration

**User Story:** As a user, I want to submit pipelines for validation, so that I can verify my pipeline structure and connectivity.

#### Acceptance Criteria

1. WHEN a user clicks the submit button, THE Frontend SHALL send nodes and edges data to the backend /pipelines/parse endpoint
2. THE Backend SHALL calculate the number of nodes in the received pipeline
3. THE Backend SHALL calculate the number of edges in the received pipeline  
4. THE Backend SHALL determine if the pipeline forms a valid DAG (Directed Acyclic Graph)
5. THE Backend SHALL return a response in the format: {num_nodes: int, num_edges: int, is_dag: bool}
6. WHEN the Frontend receives the backend response, THE Frontend SHALL display an alert with the pipeline statistics
7. THE Frontend SHALL present the alert information in a user-friendly format
8. IF the backend request fails, THE Frontend SHALL handle the error gracefully and inform the user
9. WHEN this requirement is completed, THE System SHALL commit and push the backend integration implementation

### Requirement 6: System Integration

**User Story:** As a user, I want all components to work together seamlessly, so that I can create, style, and validate pipelines in one cohesive application.

#### Acceptance Criteria

1. THE Frontend SHALL integrate the node abstraction system with the existing ReactFlow setup
2. THE Frontend SHALL apply consistent styling to both existing and new node types
3. THE Text_Node SHALL work within the abstraction system while maintaining dynamic functionality
4. THE Backend integration SHALL work with all node types created through the abstraction system
5. THE Frontend SHALL maintain state consistency across all features during user interactions
6. WHEN this requirement is completed, THE System SHALL commit and push the final integrated implementation