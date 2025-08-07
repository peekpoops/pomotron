import { useState, useEffect } from 'react';
import { Clock, Palette, Keyboard, Save, Info } from 'lucide-react';
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
};

export default function Settings() {
  const [settings, setSettings] = useLocalStorage<SettingsType>('pomotron-settings', defaultSettings);
  const { theme, setTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const { toast } = useToast();

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-orbitron font-black text-primary mb-2 neon-text tracking-wider">
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            SETTINGS & CONFIGURATION
          </span>
        </h1>
        <p className="text-secondary font-tech-mono">Customize your Pomotron experience</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Timer Configuration */}
        <Card className="neon-border glass-morphism">
          <CardHeader>
            <CardTitle className="section-title text-lg text-secondary flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Timer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="focus-duration" className="text-sm font-medium text-muted-foreground">
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
                  className="form-input mt-1"
                />
              </div>
              <div>
                <Label htmlFor="break-duration" className="text-sm font-medium text-muted-foreground">
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
                  className="form-input mt-1"
                />
              </div>
              <div>
                <Label htmlFor="long-break-duration" className="text-sm font-medium text-muted-foreground">
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
                  className="form-input mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cycles-before-long-break" className="text-sm font-medium text-muted-foreground">
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
                className="form-input mt-1"
              />
            </div>

            <div>
              <Label htmlFor="idle-timeout" className="text-sm font-medium text-muted-foreground">
                Idle nudge timeout (min)
              </Label>
              <Input
                id="idle-timeout"
                type="number"
                min="1"
                max="60"
                value={localSettings.idleTimeout}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  idleTimeout: parseInt(e.target.value) || 5
                }))}
                className="form-input mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="auto-start" className="text-sm font-medium text-muted-foreground">
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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="soft-start" className="text-sm font-medium text-muted-foreground">
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
          </CardContent>
        </Card>

        

        {/* Keyboard Shortcuts */}
        <Card className="neon-border glass-morphism">
          <CardHeader>
            <CardTitle className="section-title text-lg text-secondary flex items-center">
              <Keyboard className="h-5 w-5 mr-2" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keyboardShortcuts.map((shortcut) => (
                <div key={shortcut.action} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <div className="text-center">
        <Button
          onClick={handleSave}
          className="btn-primary px-8 py-3 font-medium"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}