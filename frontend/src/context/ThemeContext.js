import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = {
  dark: {
    name: 'Dark',
    vars: {
      '--bg-primary': '#0d0f14',
      '--bg-secondary': '#13161e',
      '--bg-card': '#181c26',
      '--bg-card-hover': '#1e2330',
      '--border': '#252a38',
      '--border-light': '#2e3447',
      '--text-primary': '#f0f2f8',
      '--text-secondary': '#8892a4',
      '--text-muted': '#505a6e',
    },
  },
  light: {
    name: 'Light',
    vars: {
      '--bg-primary': '#f4f6fb',
      '--bg-secondary': '#ffffff',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f0f3fa',
      '--border': '#e2e8f0',
      '--border-light': '#cbd5e1',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
    },
  },
  midnight: {
    name: 'Midnight Blue',
    vars: {
      '--bg-primary': '#060c1a',
      '--bg-secondary': '#0a1220',
      '--bg-card': '#0f1a2e',
      '--bg-card-hover': '#162238',
      '--border': '#1e3050',
      '--border-light': '#264070',
      '--text-primary': '#e8f0fe',
      '--text-secondary': '#7a9cc8',
      '--text-muted': '#4a6890',
      '--accent': '#4f8ef7',
      '--accent-light': '#7aaeff',
      '--accent-dim': 'rgba(79,142,247,0.15)',
    },
  },
  forest: {
    name: 'Forest',
    vars: {
      '--bg-primary': '#0a120e',
      '--bg-secondary': '#0e1812',
      '--bg-card': '#122016',
      '--bg-card-hover': '#182b1c',
      '--border': '#1e3824',
      '--border-light': '#264e30',
      '--text-primary': '#e6f5ec',
      '--text-secondary': '#7aac8a',
      '--text-muted': '#4a7058',
      '--accent': '#22c55e',
      '--accent-light': '#4ade80',
      '--accent-dim': 'rgba(34,197,94,0.15)',
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const t = THEMES[theme] || THEMES.dark;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([key, val]) => root.style.setProperty(key, val));
    // Reset accent if not overridden
    if (!t.vars['--accent']) {
      root.style.setProperty('--accent', '#6c63ff');
      root.style.setProperty('--accent-light', '#8b85ff');
      root.style.setProperty('--accent-dim', 'rgba(108,99,255,0.15)');
    }
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
