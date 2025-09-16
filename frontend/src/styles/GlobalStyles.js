import { lightTheme, darkTheme, createThemeVariables } from './Theme';

// Global styles that apply theme variables
export const globalStyles = `
  :root {
    /* Light theme variables (default) */
    ${Object.entries(createThemeVariables(lightTheme))
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')}
  }

  /* Dark theme variables */
  .dark {
    ${Object.entries(createThemeVariables(darkTheme))
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n    ')}
  }

  /* Base styles */
  * {
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    line-height: 1.5;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-background);
    color: var(--color-text);
    transition: background-color var(--transition-normal), color var(--transition-normal);
  }

  /* Smooth theme transitions */
  * {
    transition: background-color var(--transition-normal), 
                color var(--transition-normal),
                border-color var(--transition-normal),
                box-shadow var(--transition-normal);
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-background-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-border-dark);
    border-radius: var(--border-radius-md);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-tertiary);
  }

  /* Focus styles */
  *:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Selection styles */
  ::selection {
    background-color: var(--color-primary-light);
    color: var(--color-text);
  }

  /* Button reset */
  button {
    font-family: inherit;
    cursor: pointer;
  }

  /* Link styles */
  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  a:hover {
    color: var(--color-primary-hover);
  }

  /* Form elements */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Utility classes */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .font-bold {
    font-weight: var(--font-weight-bold);
  }

  .font-semibold {
    font-weight: var(--font-weight-semibold);
  }

  .font-medium {
    font-weight: var(--font-weight-medium);
  }

  .text-primary {
    color: var(--color-primary);
  }

  .text-secondary {
    color: var(--color-text-secondary);
  }

  .text-tertiary {
    color: var(--color-text-tertiary);
  }

  .bg-primary {
    background-color: var(--color-primary);
  }

  .bg-secondary {
    background-color: var(--color-background-secondary);
  }

  .bg-tertiary {
    background-color: var(--color-background-tertiary);
  }

  .border {
    border: 1px solid var(--color-border);
  }

  .border-light {
    border: 1px solid var(--color-border-light);
  }

  .border-dark {
    border: 1px solid var(--color-border-dark);
  }

  .rounded {
    border-radius: var(--border-radius-md);
  }

  .rounded-sm {
    border-radius: var(--border-radius-sm);
  }

  .rounded-lg {
    border-radius: var(--border-radius-lg);
  }

  .rounded-xl {
    border-radius: var(--border-radius-xl);
  }

  .rounded-full {
    border-radius: var(--border-radius-full);
  }

  .shadow {
    box-shadow: 0 1px 3px var(--color-shadow);
  }

  .shadow-lg {
    box-shadow: 0 4px 6px var(--color-shadow);
  }

  .shadow-xl {
    box-shadow: 0 10px 15px var(--color-shadow);
  }

  .transition {
    transition: all var(--transition-normal);
  }

  .transition-fast {
    transition: all var(--transition-fast);
  }

  .transition-slow {
    transition: all var(--transition-slow);
  }
`;

// Component to inject global styles
export const GlobalStyles = () => {
  return <style>{globalStyles}</style>;
};
