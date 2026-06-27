import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Obtener el tema guardado o usar el sistema por defecto
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light'; // SSR check
    const saved = localStorage.getItem('theme');
    console.log('Saved theme:', saved);
    if (saved && ['light', 'dark'].includes(saved)) {
      return saved;
    }
    console.log('Invalid saved theme, resetting to system preference');
    // Verificar preferencia del sistema
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Actualizar la clase en el root
    const root = document.documentElement;
    console.log('Setting theme:', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Guardar la preferencia
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    console.log('Toggling theme!');
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      console.log('New theme will be:', newTheme);
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
