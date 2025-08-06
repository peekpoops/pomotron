import { useState, useEffect } from 'react';
import { Clock, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Timer from '@/components/Timer';
import Analytics from '@/components/Analytics';
import SettingsComponent from '@/components/Settings';
import { useTheme } from '@/hooks/useTheme';
import { initializeAudio } from '@/lib/sounds';
import { ViewType } from '@/types';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('timer');
  const { theme } = useTheme();

  useEffect(() => {
    // Initialize audio on first user interaction
    initializeAudio();
    
    // Add retro background for starcourt theme
    if (theme === 'starcourt') {
      document.body.classList.add('retro-bg');
    } else {
      document.body.classList.remove('retro-bg');
    }
    
    return () => {
      document.body.classList.remove('retro-bg');
    };
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key.toLowerCase()) {
        case 'a':
          event.preventDefault();
          setCurrentView('analytics');
          break;
        case 's':
          event.preventDefault();
          setCurrentView('settings');
          break;
        case 't':
          event.preventDefault();
          setCurrentView('timer');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigation = [
    { id: 'timer' as ViewType, label: 'Timer', icon: Clock },
    { id: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b border-border/30 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl font-orbitron font-black neon-text text-primary animate-glow tracking-wider">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  POMOTRON
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className="flex space-x-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => setCurrentView(item.id)}
                      className={`nav-tab px-4 py-2 font-medium transition-all duration-300 ${
                        currentView === item.id ? 'active' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative">
        {currentView === 'timer' && <Timer onOpenSettings={() => setCurrentView('settings')} />}
        {currentView === 'analytics' && <Analytics />}
        {currentView === 'settings' && <SettingsComponent />}
      </main>
    </div>
  );
}
