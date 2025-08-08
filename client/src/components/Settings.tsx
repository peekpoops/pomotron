import { useState, useEffect } from 'react';
import { Clock, Palette, Keyboard, Save, Info, Target, RotateCcw, MessageCircle, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import { Settings as SettingsType, Theme } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FeedbackModal } from '@/components/FeedbackModal';

const defaultSettings: SettingsType = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStart: true,
  softStart: false,
  idleTimeout: 5,
  theme: 'starcourt',
  websiteBlockingEnabled: true,
  frictionOverride: false,
  blockedSites: ['facebook.com', 'twitter.com', 'reddit.com', 'youtube.com', 'instagram.com'],
  showQuotes: false,
  soundsEnabled: true,
  motivationalQuotesEnabled: false,
};

export default function Settings() {
  const [settings, setSettings] = useLocalStorage<SettingsType>('pomotron-settings', defaultSettings);
  const { theme, setTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const { toast } = useToast();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    setSettings(localSettings);
    if (localSettings.theme !== theme) {
      setTheme(localSettings.theme);
    }
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleResetToDefaults = () => {
    setLocalSettings(defaultSettings);
    setSettings(defaultSettings); // Actually save the defaults to localStorage
    if (defaultSettings.theme !== theme) {
      setTheme(defaultSettings.theme);
    }
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  

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
  //  { action: 'Pause Timer', key: 'Spacebar' },
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
      </div>
      
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 settings-grid-mobile">
        {/* Timer Configuration */}
        <Card className="neon-border glass-morphism">
          <CardHeader className="settings-card-mobile">
            <CardTitle className="section-title text-base sm:text-lg text-secondary flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Timer Configuration
              </div>
              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefaults}
                  className="p-2 sm:px-3 sm:py-2 text-xs sm:text-sm"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="btn-primary p-2 sm:px-3 sm:py-2 text-xs sm:text-sm"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
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
              <p className="text-xs text-muted-foreground/70 mt-1">Set to 0 to disable idle detection</p>
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
                <Label htmlFor="motivational-quotes-enabled" className="text-xs sm:text-sm font-medium text-muted-foreground">
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
                id="motivational-quotes-enabled"
                checked={localSettings.motivationalQuotesEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  motivationalQuotesEnabled: checked
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

            {/* Bottom action buttons */}
            <div className="flex justify-center sm:justify-end space-x-2 pt-4 border-t border-border/20">
              <Button
                onClick={handleSave}
                className="btn-primary px-4 sm:px-6 py-2 text-xs sm:text-sm"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Save Changes
              </Button>
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
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {shortcut.action}
                  </span>
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
      <Card className="neon-border glass-morphism mt-8">
        <CardHeader>
          <CardTitle className="section-title text-base sm:text-lg text-secondary flex items-center">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            About the Pomodoro Technique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm text-muted-foreground">
          <p>
            The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. 
            It uses a timer to break work into intervals, typically 25 minutes in length, separated by short breaks.
          </p>
          <div className="space-y-2">
            <p className="font-semibold text-secondary">How it works:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Choose a task to work on</li>
              <li>Set the timer for 25 minutes (one "Pomodoro")</li>
              <li>Work on the task until the timer rings</li>
              <li>Take a 5-minute break</li>
              <li>After 4 Pomodoros, take a longer 15-30 minute break</li>
            </ul>
          </div>
          <div className="pt-4 border-t border-border/20">
            <p className="text-xs text-muted-foreground/80">
              Created by Francesco Cirillo • Named after the tomato-shaped kitchen timer he used as a university student
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="neon-border glass-morphism mt-8 relative animate-float animate-glow-pulse">
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping"></div>
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full"></div>
        <CardHeader>
          <CardTitle className="section-title text-base sm:text-lg text-secondary flex items-center">
            <Coffee className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-pulse" />
            Support Pomotron
            <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-1 rounded-full animate-pulse">New!</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Help improve Pomotron and support its development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={() => setShowFeedbackModal(true)}
              variant="outline"
              className="group flex-1 bg-gradient-to-r from-blue-500/15 to-purple-500/15 border-blue-500/30 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-[1.03] transition-all duration-500 animate-float-gentle relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow-pulse" />
              <MessageCircle className="h-4 w-4 mr-2 group-hover:animate-bounce group-hover:text-blue-300 relative z-10 transition-colors duration-300" />
              <span className="relative z-10 font-medium group-hover:text-blue-100 transition-colors duration-300">✨ Share Feedback</span>
            </Button>
            <Button
              onClick={() => window.open('https://ko-fi.com/pomotron', '_blank')}
              variant="outline"
              className="group flex-1 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-xl hover:shadow-yellow-500/30 transform hover:scale-[1.03] transition-all duration-500 animate-float-gentle relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out"
              style={{ animationDelay: '1s' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-coffee-glow" />
              <Coffee className="h-4 w-4 mr-2 group-hover:animate-bounce group-hover:text-yellow-300 relative z-10 transition-colors duration-300" />
              <span className="relative z-10 font-medium group-hover:text-yellow-100 transition-colors duration-300">☕ Buy me a coffee</span>
            </Button>
          </div>
          <div className="text-center mt-4 space-y-2">
            <p className="text-xs text-muted-foreground/80 animate-pulse">
              Your feedback and support help make Pomotron better for everyone
            </p>
            <div className="flex justify-center items-center space-x-1 text-xs text-accent/60">
              <span className="animate-bounce" style={{ animationDelay: '0s' }}>💙</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>Thank</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>you!</span>
              <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>💙</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <FeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
      />
    </div>
  );
}