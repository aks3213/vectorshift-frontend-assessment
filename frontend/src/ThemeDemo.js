import React from 'react';
import { Card, Button, Text, FlexContainer } from './styled';

/**
 * Demo component to showcase the theme system and styled components
 * This component demonstrates the design tokens in action
 */
export const ThemeDemo = () => {
  return (
    <Card>
      <FlexContainer direction="column" gap="md">
        <Text size="lg" weight="semibold">
          Theme System Demo
        </Text>
        <Text variant="secondary">
          This demonstrates the Emotion CSS-in-JS setup with design tokens
        </Text>
        <FlexContainer gap="sm">
          <Button>Primary Button</Button>
          <Button disabled>Disabled Button</Button>
        </FlexContainer>
        <Text size="sm">
          Colors, spacing, typography, and other design tokens are now available
          throughout the application via the theme system.
        </Text>
      </FlexContainer>
    </Card>
  );
};

export default ThemeDemo;