import React from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { theme } from './theme';

/**
 * ThemeProvider component that wraps the application with Emotion's ThemeProvider
 * Makes the theme object available to all styled components
 */
export const ThemeProvider = ({ children }) => {
  return (
    <EmotionThemeProvider theme={theme}>
      {children}
    </EmotionThemeProvider>
  );
};

export default ThemeProvider;