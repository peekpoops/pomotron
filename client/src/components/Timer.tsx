import { useState } from 'react';
import { Clock, Play, Pause, RotateCcw, Square, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTimer } from '@/hooks/useTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Settings } from '@/types';
import IntentionModal from './IntentionModal';

interface TimerProps {
  onOpenSettings: () => void;
}

const motivationalQuotes = [
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "You don't have to be great to get started, but you have to get started to be great.", author: "Les Brown" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The art of being wise is knowing what to overlook.", author: "William James" },
  { text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Meister Eckhart" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Productivity is never an accident. It is always the result of commitment to excellence.", author: "Paul J. Meyer" },
];

export default function Timer({ onOpenSettings }: TimerProps) {
  const { timerState, startSession, pauseSession, resumeSession, resetSession, endSession, formatTime, getProgress } = useTimer();
  const [settings] = useLocalStorage<Settings>('pomotron-settings', {
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
    blockedSites: [],
  });
  
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);
  const [showFullQuote, setShowFullQuote] = useState(false);

  const getNextQuote = () => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setCurrentQuote(motivationalQuotes[randomIndex]);
  };

  const handleStartSession = () => {
    if (timerState.sessionType === 'focus') {
      setShowIntentionModal(true);
    } else {
      startSession();
    }
  };

  const handleIntentionSet = (intention?: { task: string; why: string }) => {
    setShowIntentionModal(false);
    startSession(intention);
  };

  const getSessionInfo = () => {
    if (timerState.sessionType === 'focus') {
      return `Cycle ${timerState.currentCycle} of ${settings.cyclesBeforeLongBreak} • Long break after ${settings.cyclesBeforeLongBreak} cycles`;
    } else if (timerState.sessionType === 'break') {
      return `Short break • Cycle ${timerState.currentCycle} of ${settings.cyclesBeforeLongBreak}`;
    } else {
      return 'Long break • Starting fresh after this break';
    }
  };

  const getSessionTypeLabel = () => {
    switch (timerState.sessionType) {
      case 'focus':
        return 'Focus Time';
      case 'break':
        return 'Break Time';
      case 'longBreak':
        return 'Long Break';
    }
  };

  const getSessionTypeColor = () => {
    switch (timerState.sessionType) {
      case 'focus':
        return 'bg-primary';
      case 'break':
        return 'bg-secondary';
      case 'longBreak':
        return 'bg-accent';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Motivational Quote Banner */}
      <Card className="glass-morphism animate-float">
        <CardContent className="p-6 relative">
          <div className="text-center">
            <p className="text-lg italic text-secondary font-tech-mono">
              "{showFullQuote ? currentQuote.text : `${currentQuote.text.substring(0, 60)}...`}"
            </p>
            {showFullQuote && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-accent font-semibold">
                  — {currentQuote.author}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getNextQuote}
                  className="text-xs text-accent hover:text-primary font-tech-mono"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  New Quote
                </Button>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullQuote(!showFullQuote)}
            className="absolute top-4 right-4 text-accent hover:text-primary p-1"
          >
            {showFullQuote ? '↑' : '→'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Timer Section */}
        <div className="lg:col-span-2">
          <Card className="neon-border glass-morphism">
            <CardContent className="p-8">
              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="timer-display text-6xl md:text-8xl font-orbitron font-bold neon-text text-primary mb-4">
                  {formatTime(timerState.timeLeft)}
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge className={`${getSessionTypeColor()} text-primary-foreground`}>
                    {getSessionTypeLabel()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getSessionInfo()}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <Progress 
                  value={getProgress()} 
                  className="h-3 mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatTime(
                      (timerState.sessionType === 'focus' ? settings.focusDuration :
                       timerState.sessionType === 'break' ? settings.breakDuration :
                       settings.longBreakDuration) * 60 - timerState.timeLeft
                    )}
                  </span>
                  <span>
                    {formatTime(
                      (timerState.sessionType === 'focus' ? settings.focusDuration :
                       timerState.sessionType === 'break' ? settings.breakDuration :
                       settings.longBreakDuration) * 60
                    )}
                  </span>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                {!timerState.isRunning && !timerState.isPaused ? (
                  <Button
                    onClick={handleStartSession}
                    className="btn-primary px-8 py-4 text-lg font-orbitron font-bold hover:scale-105 transition-transform"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    START
                  </Button>
                ) : timerState.isRunning ? (
                  <Button
                    onClick={pauseSession}
                    className="btn-secondary px-6 py-4 font-medium hover:scale-105 transition-transform"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    PAUSE
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSession}
                    className="btn-primary px-6 py-4 font-medium hover:scale-105 transition-transform"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    RESUME
                  </Button>
                )}
                
                <Button
                  onClick={resetSession}
                  className="btn-tertiary px-6 py-4 font-medium hover:scale-105 transition-transform"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  RESET
                </Button>
                
                <Button
                  onClick={endSession}
                  className="btn-danger px-6 py-4 font-medium hover:scale-105 transition-transform"
                >
                  <Square className="h-4 w-4 mr-2" />
                  END
                </Button>
              </div>

              {/* Quick Settings */}
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-start" checked={settings.autoStart} disabled />
                  <Label htmlFor="auto-start">Auto-start</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="soft-start" checked={settings.softStart} disabled />
                  <Label htmlFor="soft-start">Soft start</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenSettings}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <Card className="neon-border glass-morphism">
            <CardContent className="p-6">
              <h3 className="section-title text-lg mb-4 text-secondary">
                Today's Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sessions:</span>
                  <span className="text-sm font-medium">
                    {new Date().toDateString() === new Date().toDateString() ? 
                      timerState.currentCycle - 1 : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Focus Time:</span>
                  <span className="text-sm font-medium">
                    {Math.floor((timerState.currentCycle - 1) * settings.focusDuration / 60)}h{' '}
                    {(timerState.currentCycle - 1) * settings.focusDuration % 60}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Streak:</span>
                  <span className="text-sm font-medium text-accent">1 day</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Website Blocker Status */}
          <Card className="neon-border glass-morphism">
            <CardContent className="p-6">
              <h3 className="section-title text-lg mb-4 text-secondary">
                Website Blocker
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={timerState.isRunning && timerState.sessionType === 'focus' ? 'default' : 'secondary'}>
                    {timerState.isRunning && timerState.sessionType === 'focus' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blocked Sites:</span>
                  <span className="text-sm font-medium">{settings.blockedSites.length}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={onOpenSettings}
                >
                  Manage Sites
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Current Intention - Only show if user has started and entered text */}
      {timerState.currentIntention.task && (
        <Card className="glass-morphism animate-float">
          <CardContent className="p-6">
            <h3 className="section-title text-lg mb-4 text-secondary flex items-center justify-center">
              <Clock className="h-5 w-5 mr-2" />
              Current Intention
            </h3>
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">What are you working on today:</span>{' '}
                <span className="text-foreground">{timerState.currentIntention.task}</span>
              </div>
              {timerState.currentIntention.why && (
                <div className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Why is this important to you:</span>{' '}
                  <span className="text-foreground">{timerState.currentIntention.why}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <IntentionModal
        open={showIntentionModal}
        onOpenChange={setShowIntentionModal}
        onSubmit={handleIntentionSet}
      />
    </div>
  );
}
