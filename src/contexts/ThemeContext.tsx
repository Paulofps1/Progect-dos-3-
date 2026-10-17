import { createContext, useContext, ReactNode, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light';
  resolvedTheme: 'light';
  setTheme: (theme: 'light') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('theme', 'light');
  }, []);

  const setTheme = () => {
    // Always light mode - no-op
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', resolvedTheme: 'light', setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};