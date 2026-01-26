// toolbar.js

import styled from '@emotion/styled';
import { DraggableNode } from './draggableNode';
import { Container, FlexContainer, Text, getThemeValue } from './styled';

const ToolbarContainer = styled(Container)`
  background-color: ${getThemeValue('colors.surface')};
  border-bottom: 1px solid ${getThemeValue('colors.border')};
  box-shadow: ${getThemeValue('shadows.sm')};
  padding: ${getThemeValue('spacing.lg')};
  position: sticky;
  top: 0;
  z-index: ${getThemeValue('zIndex.sticky')};
`;

const ToolbarHeader = styled.div`
  margin-bottom: ${getThemeValue('spacing.md')};
`;

const ToolbarTitle = styled(Text)`
  font-size: ${getThemeValue('typography.fontSize.lg')};
  font-weight: ${getThemeValue('typography.fontWeight.semibold')};
  color: ${getThemeValue('colors.text.primary')};
`;

const NodesGrid = styled(FlexContainer)`
  flex-wrap: wrap;
  gap: ${getThemeValue('spacing.sm')};
  align-items: flex-start;
`;

export const PipelineToolbar = () => {
    return (
        <ToolbarContainer>
            <ToolbarHeader>
                <ToolbarTitle>Node Library</ToolbarTitle>
                <Text variant="secondary" size="sm">
                    Drag nodes to the canvas to build your pipeline
                </Text>
            </ToolbarHeader>
            <NodesGrid>
                <DraggableNode type='customInput' label='Input' />
                <DraggableNode type='llm' label='LLM' />
                <DraggableNode type='customOutput' label='Output' />
                <DraggableNode type='text' label='Text' />
                <DraggableNode type='filter' label='Filter' />
                <DraggableNode type='transform' label='Transform' />
                <DraggableNode type='aggregator' label='Aggregator' />
                <DraggableNode type='conditional' label='Conditional' />
                <DraggableNode type='delay' label='Delay' />
            </NodesGrid>
        </ToolbarContainer>
    );
};
