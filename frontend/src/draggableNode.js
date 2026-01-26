// draggableNode.js

import styled from '@emotion/styled';
import { getThemeValue } from './styled';

// Node type color mapping (same as BaseNode)
const getNodeTypeColor = (nodeType) => {
  const colors = {
    'customInput': '#10B981',
    'customOutput': '#EF4444',
    'llm': '#6366F1',
    'text': '#F59E0B',
    'filter': '#06B6D4',
    'transform': '#8B5CF6',
    'aggregator': '#EC4899',
    'conditional': '#F97316',
    'delay': '#64748B'
  };
  return colors[nodeType] || '#64748B';
};

const getNodeTypeColorLight = (nodeType) => {
  const colors = {
    'customInput': '#D1FAE5',
    'customOutput': '#FEE2E2',
    'llm': '#E0E7FF',
    'text': '#FEF3C7',
    'filter': '#CFFAFE',
    'transform': '#EDE9FE',
    'aggregator': '#FCE7F3',
    'conditional': '#FED7AA',
    'delay': '#F1F5F9'
  };
  return colors[nodeType] || '#F1F5F9';
};

const DraggableContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'nodeType'
})`
  cursor: grab;
  min-width: 100px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: ${getThemeValue('borderRadius.lg')};
  background: linear-gradient(135deg, ${props => getNodeTypeColorLight(props.nodeType)} 0%, ${getThemeValue('colors.surface')} 100%);
  border: 2px solid ${props => getNodeTypeColor(props.nodeType)};
  box-shadow: ${getThemeValue('shadows.md')};
  transition: all ${getThemeValue('transitions.fast')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  user-select: none;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: ${getThemeValue('shadows.lg')};
    cursor: grab;
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0) scale(0.98);
  }

  span {
    color: ${props => getNodeTypeColor(props.nodeType)};
    font-weight: ${getThemeValue('typography.fontWeight.semibold')};
    font-size: ${getThemeValue('typography.fontSize.sm')};
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
`;

export const DraggableNode = ({ type, label }) => {
    const onDragStart = (event, nodeType) => {
      const appData = { nodeType }
      event.target.style.cursor = 'grabbing';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };
  
    return (
      <DraggableContainer
        className={type}
        nodeType={type}
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.target.style.cursor = 'grab')}
        draggable
      >
          <span>{label}</span>
      </DraggableContainer>
    );
  };
  