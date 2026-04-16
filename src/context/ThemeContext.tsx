import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME_ID } from '../themes/themes';
import type { Theme } from '../themes/types';

interface ThemeContextValue {
  theme: Theme;
  setThemeId: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, val] of Object.entries(theme.cssVars)) {
      root.style.setProperty(key, val);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
