/**
 * Styled components utilities and common styled elements
 * Provides reusable styled components and helper functions
 */

import styled from '@emotion/styled';

/**
 * Helper function to access theme values safely
 */
export const getThemeValue = (path, fallback = '') => (props) => {
  const keys = path.split('.');
  let value = props.theme;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback;
    }
  }
  
  return value || fallback;
};

/**
 * Common styled components that can be reused across the application
 */

export const Container = styled.div`
  padding: ${getThemeValue('spacing.md')};
  background-color: ${getThemeValue('colors.background')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
`;

export const Card = styled.div`
  background-color: ${getThemeValue('colors.surface')};
  border: 1px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.md')};
  padding: ${getThemeValue('spacing.md')};
  box-shadow: ${getThemeValue('shadows.sm')};
  transition: box-shadow ${getThemeValue('transitions.fast')};

  &:hover {
    box-shadow: ${getThemeValue('shadows.md')};
  }
`;

export const Button = styled.button`
  background-color: ${getThemeValue('colors.primary')};
  color: ${getThemeValue('colors.text.inverse')};
  border: none;
  border-radius: ${getThemeValue('borderRadius.sm')};
  padding: ${getThemeValue('spacing.sm')} ${getThemeValue('spacing.md')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  font-weight: ${getThemeValue('typography.fontWeight.medium')};
  cursor: pointer;
  transition: all ${getThemeValue('transitions.fast')};

  &:hover {
    background-color: ${props => props.theme.colors.secondary};
    transform: translateY(-1px);
    box-shadow: ${getThemeValue('shadows.md')};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${getThemeValue('colors.border')};
    color: ${getThemeValue('colors.text.secondary')};
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const Text = styled.span`
  color: ${props => props.variant === 'secondary' 
    ? getThemeValue('colors.text.secondary')(props)
    : getThemeValue('colors.text.primary')(props)
  };
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  font-size: ${props => getThemeValue(`typography.fontSize.${props.size || 'md'}`)(props)};
  font-weight: ${props => getThemeValue(`typography.fontWeight.${props.weight || 'normal'}`)(props)};
  line-height: ${getThemeValue('typography.lineHeight.normal')};
`;

export const FlexContainer = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => getThemeValue(`spacing.${props.gap || 'md'}`)(props)};
  flex-wrap: ${props => props.wrap || 'nowrap'};
`;

/**
 * Form components for node content
 */
export const FormField = styled.div`
  margin-bottom: ${getThemeValue('spacing.sm')};
  max-width: 100%;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const Label = styled.label`
  display: block;
  font-size: ${getThemeValue('typography.fontSize.xs')};
  font-weight: ${getThemeValue('typography.fontWeight.medium')};
  color: ${getThemeValue('colors.text.secondary')};
  margin-bottom: ${getThemeValue('spacing.xs')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Input = styled.input`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: ${getThemeValue('spacing.sm')} ${getThemeValue('spacing.md')};
  border: 2px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.md')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  color: ${getThemeValue('colors.text.primary')};
  background-color: ${getThemeValue('colors.surface')};
  transition: all ${getThemeValue('transitions.fast')};
  box-sizing: border-box;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

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

export const Select = styled.select`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: ${getThemeValue('spacing.sm')} ${getThemeValue('spacing.md')};
  border: 2px solid ${getThemeValue('colors.border')};
  border-radius: ${getThemeValue('borderRadius.md')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  color: ${getThemeValue('colors.text.primary')};
  background-color: ${getThemeValue('colors.surface')};
  transition: all ${getThemeValue('transitions.fast')};
  cursor: pointer;
  box-sizing: border-box;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

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

export const NodeText = styled.span`
  color: ${getThemeValue('colors.text.primary')};
  font-size: ${getThemeValue('typography.fontSize.sm')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  line-height: ${getThemeValue('typography.lineHeight.normal')};
`;

const styledComponents = {
  Container,
  Card,
  Button,
  Text,
  FlexContainer,
  FormField,
  Label,
  Input,
  Select,
  NodeText,
  getThemeValue
};

export default styledComponents;