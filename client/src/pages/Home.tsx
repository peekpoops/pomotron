import { useState, useEffect } from 'react';
import { Clock, BarChart3, Settings, Zap, Activity, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Timer from '@/components/Timer';
import Analytics from '@/components/Analytics';
import SettingsComponent from '@/components/Settings';
import { useTheme } from '@/hooks/useTheme';
import { useTimer } from '@/hooks/useTimer';
import { initializeAudio } from '@/lib/sounds';
import { ViewType } from '@/types';


export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('timer');
  const { theme } = useTheme();

  // Tracks whether the intention modal is open, to prevent triggering shortcuts while it's visible
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Move timer state to Home level to persist across tab switches
  const timerHook = useTimer();
  
  // 🔽 For keyboard shortcuts to work
  const {
    timerState,
    startSession,
    pauseSession,
    resumeSession,
    resetSession,
    endSession,
  } = useTimer();

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
        case 'r':
          event.preventDefault();
          timerHook.resetSession();
          break; // Added break here
        case 'escape': 
          event.preventDefault();
          timerHook.endSession();
          break; // Added break here
        case ' ':
          event.preventDefault();
          if (timerHook.timerState === 'running') {
          timerHook.pauseSession();
          } else if (timerHook.timerState === 'paused') {
          timerHook.resumeSession();
          } 
          break; // Added break here
        }
     };
          

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView, timerHook], []);

  const navigation = [
    { id: 'timer' as ViewType, label: 'Timer', icon: Zap, shortcut: 'T' },
    { id: 'analytics' as ViewType, label: 'Analytics', icon: Activity, shortcut: 'A' },
    { id: 'settings' as ViewType, label: 'Settings', icon: Cog, shortcut: 'S' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b border-border/30 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <nav className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl sm:text-4xl font-orbitron font-black tracking-wider relative mobile-header-title">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,107,157,0.8)] filter">
                  POMOTRON
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent blur-sm opacity-50 animate-pulse">
                  POMOTRON
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Navigation Tabs */}
              <div className="flex space-x-2 sm:space-x-3 p-1 sm:p-2 rounded-xl bg-black/20 backdrop-blur-sm border border-white/10 mobile-nav-container">
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
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-0 sm:mr-3 relative z-10 tab-icon" />
                      <span className="relative z-10 tab-text hidden sm:inline">{item.label}</span>
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
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative">
        {currentView === 'timer' && <Timer onOpenSettings={() => setCurrentView('settings')} timerHook={timerHook} onModalStateChange={setIsModalOpen}/>}   
        {currentView === 'analytics' && <Analytics />}
        {currentView === 'settings' && <SettingsComponent />}
      </main>
    </div>
  );
}
