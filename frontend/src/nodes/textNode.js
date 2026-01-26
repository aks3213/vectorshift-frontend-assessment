// textNode.js

import { useState, useRef, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, getThemeValue } from '../styled';
import { extractVariableNames } from '../utils/variableParser';

// Constants for auto-resize functionality
const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const MIN_HEIGHT = 40;
const MAX_HEIGHT = 200;
const PADDING = 32; // Account for input padding and borders
const LINE_HEIGHT = 20; // Approximate line height for text

// Auto-resizing textarea component
const AutoResizeTextarea = styled.textarea`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: ${MIN_HEIGHT}px;
  max-height: ${MAX_HEIGHT}px;
  padding: ${getThemeValue('spacing.sm')} ${getThemeValue('spacing.md')};
  border: 2px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.md')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  color: ${getThemeValue('colors.text.primary')};
  background-color: ${getThemeValue('colors.surface')};
  transition: all ${getThemeValue('transitions.normal')};
  box-sizing: border-box;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  resize: none;
  overflow: hidden;
  line-height: ${LINE_HEIGHT}px;

  &:focus {
    outline: none;
    border-color: ${getThemeValue('colors.secondary')};
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 3px ${props => props.theme.colors.secondary}20;
    background-color: #ffffff;
  }

  &:hover {
    border-color: ${getThemeValue('colors.text.secondary')};
    background-color: #ffffff;
  }
`;

// Container that will resize based on content
const ResizableContainer = styled.div`
  transition: all ${getThemeValue('transitions.normal')};
  min-width: ${MIN_WIDTH}px;
  max-width: ${MAX_WIDTH}px;
  width: ${props => props.width}px;
`;

// Text measurement utility function
const measureText = (text, font, maxWidth) => {
  // Create a temporary canvas element for text measurement
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  
  // Split text into lines based on maxWidth
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = context.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Calculate dimensions
  const width = Math.min(
    Math.max(
      lines.reduce((max, line) => Math.max(max, context.measureText(line).width), 0) + PADDING,
      MIN_WIDTH
    ),
    MAX_WIDTH
  );
  
  const height = Math.min(
    Math.max(lines.length * LINE_HEIGHT + PADDING, MIN_HEIGHT),
    MAX_HEIGHT
  );
  
  return { width, height, lineCount: lines.length };
};

// Text node content component with auto-resize functionality and variable detection
const TextNodeContent = ({ id, data }) => {
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  const [dimensions, setDimensions] = useState({ width: MIN_WIDTH, height: MIN_HEIGHT });
  const [detectedVariables, setDetectedVariables] = useState([]);
  const textareaRef = useRef(null);

  // Function to update dimensions based on text content
  const updateDimensions = (text) => {
    if (!textareaRef.current) return;
    
    // Get computed styles for accurate font measurement
    const computedStyle = window.getComputedStyle(textareaRef.current);
    const font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    const maxContentWidth = MAX_WIDTH - PADDING;
    
    // Measure text dimensions
    const { width, height } = measureText(text, font, maxContentWidth);
    
    // Update dimensions with smooth transition
    setDimensions({ width, height });
    
    // Also update textarea height directly for immediate feedback
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, MIN_HEIGHT),
        MAX_HEIGHT
      );
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  };

  // Function to update detected variables
  const updateDetectedVariables = useCallback((text) => {
    const variables = extractVariableNames(text);
    setDetectedVariables(variables);
    
    // Log detected variables for debugging (can be removed in production)
    if (variables.length > 0) {
      console.log(`Text Node ${id}: Detected variables:`, variables);
    }
  }, [id]);

  // Handle text changes
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setCurrText(newText);
    updateDimensions(newText);
    updateDetectedVariables(newText);
  };

  // Update dimensions and variables when component mounts or text changes
  useEffect(() => {
    updateDimensions(currText);
    updateDetectedVariables(currText);
  }, [currText, updateDetectedVariables]);

  return (
    <ResizableContainer width={dimensions.width}>
      <FormField>
        <Label>Text:</Label>
        <AutoResizeTextarea
          ref={textareaRef}
          value={currText}
          onChange={handleTextChange}
          placeholder="Enter your text here..."
          rows={1}
        />
        {detectedVariables.length > 0 && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: '#64748B',
            fontStyle: 'italic'
          }}>
            Variables detected: {detectedVariables.join(', ')}
          </div>
        )}
      </FormField>
    </ResizableContainer>
  );
};

// Create TextNode using the factory with resizable configuration
export const TextNode = createNode(
  createNodeConfig({
    title: 'Text',
    content: TextNodeContent,
    handles: ({ id }) => CommonHandles.singleSource(id),
    resizable: true // Enable resizable functionality
  })
);
