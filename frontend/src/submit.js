// submit.js

import styled from '@emotion/styled';
import { Button, getThemeValue } from './styled';

const StyledSubmitButton = styled(Button)`
  background-color: ${getThemeValue('colors.secondary')};
  color: ${getThemeValue('colors.text.inverse')};
  padding: ${getThemeValue('spacing.md')} ${getThemeValue('spacing.xl')};
  font-size: ${getThemeValue('typography.fontSize.md')};
  font-weight: ${getThemeValue('typography.fontWeight.semibold')};
  border-radius: ${getThemeValue('borderRadius.md')};
  min-width: 120px;
  box-shadow: ${getThemeValue('shadows.sm')};

  &:hover {
    background-color: ${getThemeValue('colors.primary')};
    box-shadow: ${getThemeValue('shadows.md')};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${getThemeValue('shadows.sm')};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.theme.colors.secondary}40, ${getThemeValue('shadows.sm')};
  }
`;

export const SubmitButton = () => {
    return (
        <StyledSubmitButton type="submit">
            Submit Pipeline
        </StyledSubmitButton>
    );
}
