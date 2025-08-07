import { useState, useEffect } from 'react';
import { Clock, Palette, Keyboard, Save, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import { useTimer } from '@/hooks/useTimer';
import { Settings as SettingsType, Theme } from '@/types';
import { useToast } from '@/hooks/use-toast';

const defaultSettings: SettingsType = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStart: false,
  softStart: false,
  idleTimeout: 5,
  theme: 'starcourt',
  websiteBlockingEnabled: true,
  frictionOverride: false,
  blockedSites: ['facebook.com', 'twitter.com', 'reddit.com', 'youtube.com', 'instagram.com'],
  showQuotes: true,
  soundsEnabled: true,
};

export default function Settings() {
  const [settings, setSettings] = useLocalStorage<SettingsType>('pomotron-settings', defaultSettings);
  const { theme, setTheme } = useTheme();
  const { timerState } = useTimer();
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const { toast } = useToast();

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    // Allow saving during sessions, but apply timer config changes after session ends
    if (timerState.isRunning || timerState.isPaused) {
      // Save non-timer settings immediately
      const immediateSettings = {
        ...localSettings,
        // Keep current timer durations for running session
        focusDuration: settings.focusDuration,
        breakDuration: settings.breakDuration,
        longBreakDuration: settings.longBreakDuration,
        cyclesBeforeLongBreak: settings.cyclesBeforeLongBreak,
        autoStart: settings.autoStart,
      };
      
      setSettings(immediateSettings);
      
      // Store pending timer config changes
      if (localSettings.focusDuration !== settings.focusDuration ||
          localSettings.breakDuration !== settings.breakDuration ||
          localSettings.longBreakDuration !== settings.longBreakDuration ||
          localSettings.cyclesBeforeLongBreak !== settings.cyclesBeforeLongBreak ||
          localSettings.autoStart !== settings.autoStart) {
        localStorage.setItem('pomotron-pending-timer-config', JSON.stringify({
          focusDuration: localSettings.focusDuration,
          breakDuration: localSettings.breakDuration,
          longBreakDuration: localSettings.longBreakDuration,
          cyclesBeforeLongBreak: localSettings.cyclesBeforeLongBreak,
          autoStart: localSettings.autoStart,
        }));
        
        toast({
          title: "Settings Partially Saved",
          description: "Timer configuration changes will apply after the current session ends.",
          duration: 4000,
        });
      } else {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully.",
        });
      }
    } else {
      // No active session, apply all settings immediately
      setSettings(localSettings);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    }
    
    // Always apply theme changes immediately
    if (localSettings.theme !== theme) {
      setTheme(localSettings.theme);
    }
  };

  const hasUnsavedChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
  const isFocusSessionRunning = timerState.isRunning && timerState.sessionType === 'focus';
  const hasActiveSession = timerState.isRunning || timerState.isPaused;
  
  // Check for pending timer config changes
  const hasPendingTimerChanges = hasActiveSession && (
    localSettings.focusDuration !== settings.focusDuration ||
    localSettings.breakDuration !== settings.breakDuration ||
    localSettings.longBreakDuration !== settings.longBreakDuration ||
    localSettings.cyclesBeforeLongBreak !== settings.cyclesBeforeLongBreak ||
    localSettings.autoStart !== settings.autoStart
  );

  

  const themeOptions = [
    {
      id: 'starcourt' as Theme,
      name: '🌆 Starcourt Retro',
      description: '80s synthwave vibes',
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      id: 'minimal' as Theme,
      name: '⚪ Minimal',
      description: 'Clean and distraction-free',
      gradient: 'from-gray-200 to-gray-300'
    },
    {
      id: 'ghibli' as Theme,
      name: '🌿 Studio Ghibli',
      description: 'Peaceful nature aesthetic',
      gradient: 'from-green-200 to-yellow-200'
    }
  ];

  const keyboardShortcuts = [
    { action: 'Start/Pause Timer', key: 'Spacebar' },
    { action: 'Reset Timer', key: 'R' },
    { action: 'End Session', key: 'Esc' },
    { action: 'Toggle Analytics', key: 'A' },
    { action: 'Open Settings', key: 'S' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 modal-content-mobile">
      <div className="mb-4 sm:mb-8 text-center modal-header-mobile">
        <h1 className="text-2xl sm:text-4xl font-orbitron font-black text-primary mb-2 neon-text tracking-wider modal-title">
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            SETTINGS & CONFIGURATION
          </span>
        </h1>
        <p className="text-sm sm:text-base text-secondary font-tech-mono">Customize your Pomotron experience</p>
        
        {/* Focus Session Warning */}
        {isFocusSessionRunning && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Settings cannot be changed during a focus session</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 settings-grid-mobile">
        {/* Timer Configuration */}
        <Card className="neon-border glass-morphism">
          <CardHeader className="settings-card-mobile">
            <CardTitle className="section-title text-base sm:text-lg text-secondary flex items-center">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Timer Configuration
              {hasPendingTimerChanges && (
                <Badge variant="secondary" className="ml-2 text-xs animate-pulse">
                  Pending
                </Badge>
              )}
            </CardTitle>
            {hasPendingTimerChanges && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-2"></div>
                Timer changes will apply after the current session ends
              </div>
            )}
          </CardHeader>
          
          {/* Top Save Buttons */}
          <div className="px-4 sm:px-6 pb-4 border-b border-border/20">
            <div className="flex justify-center space-x-2 sm:space-x-4">
              <Button
                onClick={() => setLocalSettings(defaultSettings)}
                className="btn-tertiary px-4 py-2 sm:px-6 sm:py-3 font-medium hover:scale-105 transition-transform timer-control-button"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 button-icon" />
                <span className="button-text text-xs sm:text-sm">RESET</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="btn-primary px-4 py-2 sm:px-6 sm:py-3 font-medium hover:scale-105 transition-transform timer-control-button"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 button-icon" />
                <span className="button-text text-xs sm:text-sm">SAVE</span>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {Object.keys(localSettings).filter(key => 
                      JSON.stringify(localSettings[key as keyof SettingsType]) !== 
                      JSON.stringify(settings[key as keyof SettingsType])
                    ).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <CardContent className="space-y-4 sm:space-y-6 settings-card-mobile">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="focus-duration" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Focus (min)
                </Label>
                <Input
                  id="focus-duration"
                  type="number"
                  min="1"
                  max="120"
                  value={localSettings.focusDuration}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    focusDuration: parseInt(e.target.value) || 25
                  }))}
                  className="form-input mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="break-duration" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Break (min)
                </Label>
                <Input
                  id="break-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.breakDuration}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    breakDuration: parseInt(e.target.value) || 5
                  }))}
                  className="form-input mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="long-break-duration" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Long Break (min)
                </Label>
                <Input
                  id="long-break-duration"
                  type="number"
                  min="1"
                  max="120"
                  value={localSettings.longBreakDuration}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    longBreakDuration: parseInt(e.target.value) || 15
                  }))}
                  className="form-input mt-1 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cycles-before-long-break" className="text-xs sm:text-sm font-medium text-muted-foreground">
                Cycles before long break
              </Label>
              <Input
                id="cycles-before-long-break"
                type="number"
                min="1"
                max="10"
                value={localSettings.cyclesBeforeLongBreak}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  cyclesBeforeLongBreak: parseInt(e.target.value) || 4
                }))}
                className="form-input mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="idle-timeout" className="text-xs sm:text-sm font-medium text-muted-foreground">
                Idle nudge timeout (min)
              </Label>
              <Input
                id="idle-timeout"
                type="number"
                min="0"
                max="60"
                value={localSettings.idleTimeout}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  idleTimeout: parseInt(e.target.value) || 0
                }))}
                className="form-input mt-1 text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Label htmlFor="auto-start" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Auto-start next session
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="center" className="w-80 text-sm">
                    <p>
                      Automatically starts the next session (break or focus) when the current session ends, without requiring manual intervention.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <Switch
                id="auto-start"
                checked={localSettings.autoStart}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  autoStart: checked
                }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Label htmlFor="soft-start" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Soft start (5s countdown)
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="center" className="w-80 text-sm">
                    <p>
                      Adds a 5-second countdown before starting any session, giving you time to prepare and get into focus mode.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <Switch
                id="soft-start"
                checked={localSettings.softStart}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  softStart: checked
                }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Label htmlFor="show-quotes" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Show motivational quotes
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="center" className="w-80 text-sm">
                    <p>
                      Display inspirational quotes at the top of the timer page to keep you motivated during focus sessions.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <Switch
                id="show-quotes"
                checked={localSettings.showQuotes}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  showQuotes: checked
                }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Label htmlFor="sounds-enabled" className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Enable sound effects
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="center" className="w-60 sm:w-80 text-xs sm:text-sm">
                    <p>
                      Play retro-style sound effects for timer events like starting sessions, breaks, and idle notifications.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <Switch
                id="sounds-enabled"
                checked={localSettings.soundsEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  soundsEnabled: checked
                }))}
              />
            </div>

            {/* Bottom Save Buttons */}
            <div className="pt-4 border-t border-border/20">
              <div className="flex justify-center space-x-2 sm:space-x-4">
                <Button
                  onClick={() => setLocalSettings(defaultSettings)}
                  className="btn-tertiary px-4 py-2 sm:px-6 sm:py-3 font-medium hover:scale-105 transition-transform timer-control-button"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 button-icon" />
                  <span className="button-text text-xs sm:text-sm">RESET</span>
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  className="btn-primary px-4 py-2 sm:px-6 sm:py-3 font-medium hover:scale-105 transition-transform timer-control-button"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 button-icon" />
                  <span className="button-text text-xs sm:text-sm">SAVE</span>
                  {hasUnsavedChanges && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {Object.keys(localSettings).filter(key => 
                        JSON.stringify(localSettings[key as keyof SettingsType]) !== 
                        JSON.stringify(settings[key as keyof SettingsType])
                      ).length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card className="neon-border glass-morphism">
          <CardHeader className="settings-card-mobile">
            <CardTitle className="section-title text-base sm:text-lg text-secondary flex items-center">
              <Keyboard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="settings-card-mobile">
            <div className="space-y-2 sm:space-y-3">
              {keyboardShortcuts.map((shortcut) => (
                <div key={shortcut.action} className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">{shortcut.action}</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Pomodoro Technique */}
      <Card className="neon-border glass-morphism">
        <CardHeader className="settings-card-mobile">
          <CardTitle className="section-title text-base sm:text-lg text-secondary flex items-center">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            About the Pomodoro Technique
          </CardTitle>
        </CardHeader>
        <CardContent className="settings-card-mobile">
          <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
            <p>
              The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. 
              The technique uses a timer to break down work into intervals, traditionally 25 minutes in length, 
              separated by short breaks.
            </p>
            <div className="space-y-2">
              <p className="font-semibold text-secondary">How it works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Choose a task to work on</li>
                <li>Set the timer for 25 minutes (one "pomodoro")</li>
                <li>Work on the task until the timer rings</li>
                <li>Take a short break (5 minutes)</li>
                <li>After 4 pomodoros, take a longer break (15-30 minutes)</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-border/20">
              <p className="text-xs text-muted-foreground/80">
                Named after the tomato-shaped kitchen timer that Cirillo used as a university student. 
                "Pomodoro" is Italian for tomato.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Learn more: <a href="https://francescocirillo.com/pages/pomodoro-technique" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-primary underline">francescocirillo.com</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>



    </div>
  );
}