// delayNode.js
// Delay node for timing control in pipelines

import { useState } from 'react';
import { createNode, createNodeConfig, CommonHandles } from '../components/nodeFactory';
import { FormField, Label, Input, Select, NodeText } from '../styled';
import styled from '@emotion/styled';
import { getThemeValue } from '../styled';

const FlexRow = styled.div`
  display: flex;
  gap: ${getThemeValue('spacing.xs')};
`;

const HelpText = styled(NodeText)`
  font-size: ${getThemeValue('typography.fontSize.xs')};
  color: ${getThemeValue('colors.text.secondary')};
  margin-top: ${getThemeValue('spacing.xs')};
`;

// Delay node content component
const DelayNodeContent = ({ id, data }) => {
  const [delayAmount, setDelayAmount] = useState(data?.delayAmount || '1000');
  const [delayUnit, setDelayUnit] = useState(data?.delayUnit || 'ms');

  const handleAmountChange = (e) => {
    setDelayAmount(e.target.value);
  };

  const handleUnitChange = (e) => {
    setDelayUnit(e.target.value);
  };

  return (
    <div>
      <FormField>
        <Label>Delay:</Label>
        <FlexRow>
          <Input 
            type="number" 
            value={delayAmount} 
            onChange={handleAmountChange} 
            min="0"
            style={{ width: '60%' }}
          />
          <Select value={delayUnit} onChange={handleUnitChange} style={{ width: '40%' }}>
            <option value="ms">ms</option>
            <option value="s">s</option>
            <option value="m">m</option>
          </Select>
        </FlexRow>
      </FormField>
      <HelpText>
        Adds timing control to pipeline
      </HelpText>
    </div>
  );
};

// Create DelayNode using the factory
export const DelayNode = createNode(
  createNodeConfig({
    title: 'Delay',
    content: DelayNodeContent,
    handles: ({ id }) => CommonHandles.sourceAndTarget(id),
    style: {
      backgroundColor: '#fce4ec',
      border: '2px solid #c2185b',
      width: 200,
      height: 90
    }
  })
);