import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Theme } from '@/types';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('pomotron-theme', 'starcourt');

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('minimal-theme', 'ghibli-theme');
    
    // Add current theme class
    if (theme === 'minimal') {
      root.classList.add('minimal-theme');
    } else if (theme === 'ghibli') {
      root.classList.add('ghibli-theme');
    }
    
    // Update data attribute for additional styling
    document.body.dataset.theme = theme;
  }, [theme]);

  return { theme, setTheme };
}
