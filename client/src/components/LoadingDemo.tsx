import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingScreen from './LoadingScreen';
import PixelTransition from './PixelTransition';

export default function LoadingDemo() {
  const [activeLoading, setActiveLoading] = useState<string | null>(null);
  const [activeTransition, setActiveTransition] = useState<string | null>(null);

  const loadingTypes = [
    { type: 'initial', label: 'App Startup', duration: 3000 },
    { type: 'timer-start', label: 'Timer Start', duration: 1500 },
    { type: 'data-sync', label: 'Data Sync', duration: 2000 },
    { type: 'transition', label: 'Page Transition', duration: 1000 },
  ] as const;

  const transitionPatterns = [
    { pattern: 'blocks', label: 'Blocks Pattern' },
    { pattern: 'diagonal', label: 'Diagonal Sweep' },
    { pattern: 'wave', label: 'Wave Effect' },
    { pattern: 'spiral', label: 'Spiral Animation' },
  ] as const;

  const showLoadingScreen = (type: string, duration: number) => {
    setActiveLoading(type);
    setTimeout(() => setActiveLoading(null), duration);
  };

  const showTransition = (pattern: string) => {
    setActiveTransition(pattern);
    setTimeout(() => setActiveTransition(null), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-orbitron font-bold text-primary mb-2 drop-shadow-neon">
          LOADING SCREEN DEMO
        </h1>
        <p className="text-muted-foreground font-tech-mono">
          Experience the 8-bit pixel art loading animations
        </p>
      </div>

      {/* Loading Screen Demos */}
      <Card className="glass-morphism neon-border">
        <CardHeader>
          <CardTitle className="text-primary font-orbitron">
            Loading Screens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingTypes.map(({ type, label, duration }) => (
              <Button
                key={type}
                onClick={() => showLoadingScreen(type, duration)}
                disabled={!!activeLoading}
                className="btn-primary h-auto p-4 flex flex-col items-center space-y-2"
              >
                <span className="font-orbitron font-bold">{label}</span>
                <Badge variant="secondary" className="font-tech-mono text-xs">
                  {duration}ms
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Type: {type}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pixel Transition Demos */}
      <Card className="glass-morphism neon-border">
        <CardHeader>
          <CardTitle className="text-secondary font-orbitron">
            Pixel Transitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transitionPatterns.map(({ pattern, label }) => (
              <Button
                key={pattern}
                onClick={() => showTransition(pattern)}
                disabled={!!activeTransition}
                className="btn-secondary h-auto p-4 flex flex-col items-center space-y-2"
              >
                <span className="font-orbitron font-bold">{label}</span>
                <Badge variant="outline" className="font-tech-mono text-xs">
                  Pattern: {pattern}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Instructions */}
      <Card className="glass-morphism border-accent/30">
        <CardHeader>
          <CardTitle className="text-accent font-orbitron text-center">
            Demo Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <h3 className="font-tech-mono text-primary">Loading Screens:</h3>
            <p className="text-sm text-muted-foreground">
              Each loading screen shows different retro messages and animations.
              They automatically complete after their specified duration.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-tech-mono text-secondary">Pixel Transitions:</h3>
            <p className="text-sm text-muted-foreground">
              Watch different pixel animation patterns create smooth transitions
              between interface states.
            </p>
          </div>

          <div className="pt-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground font-tech-mono">
              These animations appear throughout Pomotron during session starts,
              view changes, and data synchronization.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Loading Screen */}
      <LoadingScreen
        isLoading={!!activeLoading}
        loadingType={activeLoading as any || 'initial'}
        duration={3000}
        onComplete={() => setActiveLoading(null)}
      />

      {/* Active Pixel Transition */}
      <PixelTransition
        isActive={!!activeTransition}
        onComplete={() => setActiveTransition(null)}
        direction="in"
        pattern={activeTransition as any || 'blocks'}
      />
    </div>
  );
}