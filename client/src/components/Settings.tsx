import { useState, useEffect } from 'react';
import { Clock, Palette, Shield, Keyboard, Save, Plus, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [newSite, setNewSite] = useState('');
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

  const addBlockedSite = () => {
    const site = newSite.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (site && !localSettings.blockedSites.includes(site)) {
      setLocalSettings(prev => ({
        ...prev,
        blockedSites: [...prev.blockedSites, site]
      }));
      setNewSite('');
    }
  };

  const removeBlockedSite = (site: string) => {
    setLocalSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(s => s !== site)
    }));
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
            
            <TooltipProvider>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="auto-start" className="text-sm font-medium text-muted-foreground">
                    Auto-start next session
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Automatically starts the next session (break or focus) when the current session ends, without requiring manual intervention.
                      </p>
                    </TooltipContent>
                  </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Adds a 5-second countdown before starting any session, giving you time to prepare and get into focus mode.
                      </p>
                    </TooltipContent>
                  </Tooltip>
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
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Website Blocker */}
        <Card className="neon-border glass-morphism">
          <CardHeader>
            <CardTitle className="section-title text-lg text-secondary flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Website Blocker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="blocker-enabled" className="text-sm font-medium text-muted-foreground">
                Enable website blocking
              </Label>
              <Switch
                id="blocker-enabled"
                checked={localSettings.websiteBlockingEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  websiteBlockingEnabled: checked
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="friction-override" className="text-sm font-medium text-muted-foreground">
                Friction-based override
              </Label>
              <Switch
                id="friction-override"
                checked={localSettings.frictionOverride}
                onCheckedChange={(checked) => setLocalSettings(prev => ({
                  ...prev,
                  frictionOverride: checked
                }))}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Blocked Websites
              </Label>
              <div className="space-y-2 mb-3">
                {localSettings.blockedSites.map((site) => (
                  <div key={site} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{site}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlockedSite(site)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add website..."
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addBlockedSite();
                    }
                  }}
                  className="form-input flex-1"
                />
                <Button
                  onClick={addBlockedSite}
                  className="btn-primary px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
