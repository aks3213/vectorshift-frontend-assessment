import styled from '@emotion/styled';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { ThemeProvider } from './ThemeProvider';
import { getThemeValue } from './styled';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${getThemeValue('colors.background')};
  font-family: ${getThemeValue('typography.fontFamily.primary')};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${getThemeValue('spacing.lg')};
  display: flex;
  flex-direction: column;
  gap: ${getThemeValue('spacing.lg')};
`;

const SubmitSection = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${getThemeValue('spacing.md')};
  border-top: 1px solid ${getThemeValue('colors.border')};
  background-color: ${getThemeValue('colors.surface')};
`;

function App() {
  return (
    <ThemeProvider>
      <AppContainer>
        <PipelineToolbar />
        <MainContent>
          <PipelineUI />
        </MainContent>
        <SubmitSection>
          <SubmitButton />
        </SubmitSection>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
