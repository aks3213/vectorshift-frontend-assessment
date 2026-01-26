# Design Document

## Overview

This design outlines the implementation of the VectorShift Frontend Technical Assessment, which involves creating a node-based pipeline editor with improved abstractions, modern styling, dynamic text functionality, and backend integration. The system will transform the existing ReactFlow-based application into a more maintainable, visually appealing, and feature-rich pipeline editor.

## Architecture

The application follows a component-based React architecture with the following key layers:

### Frontend Architecture
- **Presentation Layer**: React components with modern CSS-in-JS styling
- **State Management**: Zustand store for pipeline state management
- **Node System**: Abstracted node components with configurable behavior
- **Integration Layer**: API communication with FastAPI backend

### Backend Architecture
- **API Layer**: FastAPI endpoints for pipeline processing
- **Processing Layer**: Graph analysis algorithms for DAG validation
- **Response Layer**: Structured JSON responses with pipeline metrics

## Components and Interfaces

### Node Abstraction System

#### BaseNode Component
```javascript
interface NodeConfig {
  title: string;
  content: ReactNode | ((props: NodeProps) => ReactNode);
  handles: HandleConfig[];
  style?: NodeStyle;
  resizable?: boolean;
  validation?: (data: any) => boolean;
}

interface HandleConfig {
  id: string;
  type: 'source' | 'target';
  position: Position;
  style?: object;
  label?: string;
}
```

The BaseNode component will serve as the foundation for all node types, providing:
- Common styling and layout structure
- Handle management and positioning
- State management integration
- Event handling for drag/drop and connections

#### Node Factory
A factory function will create specific node types from configurations:
```javascript
const createNode = (config: NodeConfig) => {
  return (props: NodeProps) => (
    <BaseNode config={config} {...props} />
  );
};
```

### Styling System

#### Design Tokens
The application will use a design token system for consistent styling:
```javascript
const theme = {
  colors: {
    primary: '#1C2536',
    secondary: '#6366F1',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
      inverse: '#FFFFFF'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
};
```

#### Styled Components Implementation
Using Emotion's styled-components for component styling:
- Consistent theming across all components
- Dynamic styling based on props and state
- Responsive design capabilities
- Performance optimization through CSS-in-JS

### Dynamic Text Node

#### Variable Detection System
```javascript
interface Variable {
  name: string;
  startIndex: number;
  endIndex: number;
}

const parseVariables = (text: string): Variable[] => {
  const regex = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
  // Implementation details for variable extraction
};
```

#### Auto-Resize Functionality
- Text measurement using canvas context or DOM measurement
- Dynamic width/height calculation based on content
- Minimum and maximum size constraints
- Smooth transitions for size changes

#### Handle Management
- Dynamic handle creation/removal based on detected variables
- Handle positioning algorithm for optimal layout
- Connection validation for variable handles

### Backend Integration

#### API Client
```javascript
class PipelineAPI {
  async submitPipeline(nodes: Node[], edges: Edge[]): Promise<PipelineResponse> {
    // Implementation for API communication
  }
}

interface PipelineResponse {
  num_nodes: number;
  num_edges: number;
  is_dag: boolean;
}
```

#### DAG Validation Algorithm
The backend will implement cycle detection using depth-first search:
```python
def is_dag(nodes: List[dict], edges: List[dict]) -> bool:
    # Build adjacency list
    # Perform DFS with cycle detection
    # Return True if no cycles found
```

## Data Models

### Node Data Structure
```javascript
interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    [key: string]: any;
    // Node-specific data fields
  };
}
```

### Edge Data Structure
```javascript
interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
}
```

### Pipeline State
```javascript
interface PipelineState {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: { x: number; y: number; zoom: number };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Node Configuration Flexibility
*For any* valid node configuration object, the Node_Abstraction should successfully create a functional React component that can be rendered in ReactFlow
**Validates: Requirements 1.2**

### Property 2: ReactFlow Compatibility
*For any* node created through the Node_Abstraction, it should maintain full compatibility with ReactFlow's drag, drop, and connection functionality
**Validates: Requirements 1.5**

### Property 3: Responsive Design Consistency
*For any* viewport size within reasonable bounds (320px to 1920px width), all components should render without layout breaks or content overflow
**Validates: Requirements 2.4**

### Property 4: Text Node Auto-Resize
*For any* text content entered into a Text_Node, the node dimensions should automatically adjust to accommodate the content without text overflow
**Validates: Requirements 3.1**

### Property 5: Variable Handle Management
*For any* text containing valid JavaScript variable patterns ({{ variable_name }}), the Text_Node should create corresponding handles, and removing variables should remove the corresponding handles
**Validates: Requirements 3.2, 3.4**

### Property 6: Variable Name Validation
*For any* string within double curly brackets, the Text_Node should only create handles for strings that follow JavaScript variable naming conventions (start with letter/underscore, contain only alphanumeric characters and underscores)
**Validates: Requirements 3.3**

### Property 7: Pipeline Metrics Calculation
*For any* pipeline data (nodes and edges), the backend should correctly calculate the number of nodes and edges, returning accurate counts
**Validates: Requirements 4.2, 4.3**

### Property 8: DAG Validation
*For any* pipeline structure, the backend should correctly identify whether the graph forms a valid DAG (contains no cycles)
**Validates: Requirements 4.4**

### Property 9: API Response Format
*For any* valid pipeline submission, the backend should return a response containing exactly the fields: num_nodes (integer), num_edges (integer), and is_dag (boolean)
**Validates: Requirements 4.5**

### Property 10: Error Handling Robustness
*For any* failed backend request (network error, server error, invalid response), the frontend should handle the error gracefully without crashing and provide user feedback
**Validates: Requirements 4.8**

### Property 11: Abstraction System Integration
*For any* node type created through the abstraction system, it should work seamlessly with all system features including styling, backend submission, and dynamic functionality
**Validates: Requirements 5.3, 5.4**

### Property 12: State Consistency
*For any* sequence of user interactions (adding nodes, connecting edges, modifying text), the application state should remain consistent and all features should continue to function correctly
**Validates: Requirements 5.5**

## Error Handling

### Frontend Error Handling
- **Network Errors**: Graceful degradation with user-friendly error messages
- **Validation Errors**: Real-time feedback for invalid inputs
- **State Errors**: Automatic recovery and state consistency checks
- **Rendering Errors**: Error boundaries to prevent application crashes

### Backend Error Handling
- **Invalid Input**: Proper validation and descriptive error responses
- **Processing Errors**: Graceful handling of malformed pipeline data
- **Server Errors**: Appropriate HTTP status codes and error messages

### Error Recovery Strategies
- Automatic retry mechanisms for transient network failures
- State rollback for failed operations
- User notification system for critical errors
- Logging and monitoring for debugging

## Testing Strategy

### Dual Testing Approach
The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Component rendering with specific props
- API endpoint responses with known data
- Error conditions and boundary cases
- User interaction flows

**Property-Based Tests**: Verify universal properties across all inputs
- Generate random node configurations and verify abstraction system works
- Generate random text content and verify auto-resize functionality
- Generate random pipeline structures and verify backend calculations
- Generate random variable patterns and verify handle management

### Property-Based Testing Configuration
- **Testing Library**: Use `fast-check` for JavaScript property-based testing
- **Minimum Iterations**: 100 iterations per property test
- **Test Tagging**: Each property test tagged with format: **Feature: vectorshift-assessment, Property {number}: {property_text}**

### Testing Coverage Areas
1. **Node Abstraction System**: Configuration flexibility and ReactFlow compatibility
2. **Styling System**: Responsive design and visual consistency
3. **Dynamic Text Functionality**: Auto-resize and variable detection
4. **Backend Integration**: API communication and data processing
5. **Error Handling**: Graceful degradation and recovery
6. **State Management**: Consistency across user interactions

### Integration Testing
- End-to-end user workflows from node creation to pipeline submission
- Cross-browser compatibility testing
- Performance testing under various load conditions
- Accessibility testing for keyboard navigation and screen readers