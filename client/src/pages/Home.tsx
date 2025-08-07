import { useState, useEffect } from 'react';
import { Clock, BarChart3, Settings, Zap, Activity, Cog } from 'lucide-react';
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
    { id: 'timer' as ViewType, label: 'Timer', icon: Zap, shortcut: 'T' },
    { id: 'analytics' as ViewType, label: 'Analytics', icon: Activity, shortcut: 'A' },
    { id: 'settings' as ViewType, label: 'Settings', icon: Cog, shortcut: 'S' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b border-border/30 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl font-orbitron font-black tracking-wider relative">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,107,157,0.8)] filter">
                  POMOTRON
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent blur-sm opacity-50 animate-pulse">
                  POMOTRON
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className="flex space-x-3 p-2 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => setCurrentView(item.id)}
                      className={`nav-tab relative group font-medium transition-all duration-500 ${
                        currentView === item.id ? 'active' : ''
                      }`}
                      title={`Switch to ${item.label} (Press ${item.shortcut})`}
                    >
                      <Icon className="h-5 w-5 mr-3 relative z-10" />
                      <span className="relative z-10">{item.label}</span>
                      <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold font-tech-mono">{item.shortcut}</span>
                      </div>
                      {/* Animated background gradient */}
                      <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
                        currentView === item.id 
                          ? 'opacity-100' 
                          : 'opacity-0 group-hover:opacity-30'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-lg animate-pulse"></div>
                      </div>
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
