import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DiscoSpinnerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
}

export function DiscoSpinner({ isOpen, onClose }: DiscoSpinnerProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [beatPulse, setBeatPulse] = useState(false);
  const [showScoreBoost, setShowScoreBoost] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const beatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const particleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBeatTimeRef = useRef<number>(0);
  
  // Beat timing (120 BPM = 500ms per beat)
  const BEAT_INTERVAL = 500;
  const TIMING_TOLERANCE = 150;

  const createParticle = useCallback((x: number, y: number) => {
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff4081', '#7c4dff'];
    const newParticle: Particle = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
      opacity: 1,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
    };
    
    setParticles(prev => [...prev, newParticle]);
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  }, []);

  const updateParticles = useCallback(() => {
    setParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      opacity: particle.opacity - 0.02,
    })).filter(p => p.opacity > 0));
  }, []);

  const createSynthBeat = useCallback(() => {
    console.log('Creating synth beat, audio context state:', audioContextRef.current?.state);
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      try {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(80, audioContextRef.current.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.15);
        
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.15);
        
        setBeatPulse(true);
        setTimeout(() => setBeatPulse(false), 150);
      } catch (error) {
        console.error('Error creating synth beat:', error);
      }
    } else {
      console.log('Audio context not ready or suspended');
    }
  }, []);

  const playHitSound = useCallback(() => {
    if (audioContextRef.current) {
      try {
        const hitOsc = audioContextRef.current.createOscillator();
        const hitGain = audioContextRef.current.createGain();
        
        hitOsc.connect(hitGain);
        hitGain.connect(audioContextRef.current.destination);
        
        hitOsc.type = 'sine';
        hitOsc.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
        hitGain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        hitGain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
        
        hitOsc.start();
        hitOsc.stop(audioContextRef.current.currentTime + 0.1);
      } catch (error) {
        console.error('Error playing hit sound:', error);
      }
    }
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.code, 'isPlaying:', isPlaying);
    if (!isPlaying || event.code !== 'Space') return;
    
    event.preventDefault();
    const currentTime = Date.now();
    const timeSinceLastBeat = (currentTime - lastBeatTimeRef.current) % BEAT_INTERVAL;
    const isOnBeat = timeSinceLastBeat <= TIMING_TOLERANCE || 
                     timeSinceLastBeat >= (BEAT_INTERVAL - TIMING_TOLERANCE);
    
    console.log('Spacebar timing - since last beat:', timeSinceLastBeat, 'on beat:', isOnBeat);
    
    if (isOnBeat) {
      console.log('HIT! Adding point');
      setScore(prev => prev + 1);
      setShowScoreBoost(true);
      setTimeout(() => setShowScoreBoost(false), 300);
      
      // Create particles at center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => createParticle(centerX, centerY), i * 50);
      }
      
      playHitSound();
    } else {
      console.log('MISS! Wrong timing');
    }
  }, [isPlaying, createParticle, playHitSound]);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    
    // Clear all timers
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (beatTimerRef.current) clearInterval(beatTimerRef.current);
    if (particleTimerRef.current) clearInterval(particleTimerRef.current);
    
    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyPress);
    
    // Auto-close after showing final score
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [handleKeyPress, onClose]);

  const startGame = useCallback(async () => {
    console.log('Starting disco spinner game');
    setScore(0);
    setTimeLeft(10);
    setIsPlaying(true);
    setParticles([]);
    
    // Initialize audio context with user interaction
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('Created audio context, state:', audioContextRef.current.state);
      }
      
      // Resume audio context for modern browsers
      if (audioContextRef.current.state === 'suspended') {
        console.log('Resuming suspended audio context');
        await audioContextRef.current.resume();
        console.log('Audio context resumed, state:', audioContextRef.current.state);
      }
      
      // Start beat loop
      lastBeatTimeRef.current = Date.now();
      const beatLoop = () => {
        createSynthBeat();
        lastBeatTimeRef.current = Date.now();
      };
      
      // First beat after a short delay to ensure audio context is ready
      setTimeout(() => {
        beatLoop();
        beatTimerRef.current = setInterval(beatLoop, BEAT_INTERVAL);
        console.log('Started beat timer with interval:', BEAT_INTERVAL);
      }, 100);
      
      // Game timer
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Particle animation
      particleTimerRef.current = setInterval(updateParticles, 16);
      
      // Add keyboard listener
      document.addEventListener('keydown', handleKeyPress);
      console.log('Added keydown listener');
      
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }, [createSynthBeat, handleKeyPress, updateParticles, endGame]);

  useEffect(() => {
    if (isOpen && !isPlaying && timeLeft === 10) {
      startGame();
    }
    
    return () => {
      // Cleanup on unmount
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (beatTimerRef.current) clearInterval(beatTimerRef.current);
      if (particleTimerRef.current) clearInterval(particleTimerRef.current);
      document.removeEventListener('keydown', handleKeyPress);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isOpen, isPlaying, timeLeft, startGame, handleKeyPress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none sparkle-particle"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      <Card className="relative w-96 h-96 bg-black/80 border-2 border-accent neon-glow">
        <CardContent className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Title */}
          <h2 className="text-2xl font-orbitron font-bold text-accent mb-4 text-center">
            DISCO SPINNER
          </h2>

          {/* Timer and Score */}
          <div className="flex justify-between w-full mb-6 text-center">
            <div>
              <div className="text-sm text-white/60 font-tech-mono">TIME</div>
              <div className="text-xl font-orbitron font-bold text-primary">{timeLeft}s</div>
            </div>
            <div>
              <div className="text-sm text-white/60 font-tech-mono">SCORE</div>
              <div className="text-xl font-orbitron font-bold text-secondary">{score}</div>
            </div>
          </div>

          {/* Disco Ball */}
          <div className="relative mb-6">
            <div 
              className={`w-24 h-24 rounded-full relative disco-ball-spin ${
                beatPulse ? 'disco-ball-pulse scale-110' : ''
              } transition-all duration-150 cursor-pointer`}
              onClick={async () => {
                // Enable audio context on click
                if (audioContextRef.current?.state === 'suspended') {
                  await audioContextRef.current.resume();
                  console.log('Audio context resumed via click');
                }
              }}
              style={{
                background: 'conic-gradient(from 0deg, #ff00ff, #00ffff, #ffff00, #ff4081, #7c4dff, #ff00ff)',
                boxShadow: beatPulse 
                  ? '0 0 40px #ff00ff, 0 0 80px #00ffff, 0 0 120px #ffff00' 
                  : '0 0 20px #ff00ff, 0 0 40px #00ffff',
              }}
            >
              {/* Disco ball segments */}
              <div className="absolute inset-2 rounded-full bg-black/20 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white/40 rounded-full animate-pulse"
                    style={{
                      left: `${15 + (i % 4) * 20}%`,
                      top: `${15 + Math.floor(i / 4) * 25}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Beat pulse ring */}
            {beatPulse && (
              <div className="absolute inset-0 rounded-full border-4 border-accent animate-ping opacity-75" />
            )}
          </div>

          {/* Score boost indicator */}
          {showScoreBoost && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="text-4xl font-orbitron font-bold text-accent animate-bounce">
                +1
              </div>
            </div>
          )}

          {/* Instructions */}
          {isPlaying ? (
            <div className="text-center text-white/80">
              {audioContextRef.current?.state === 'suspended' ? (
                <div className="text-sm font-tech-mono mb-2 text-yellow-400">
                  CLICK THE DISCO BALL TO ENABLE SOUND
                </div>
              ) : (
                <>
                  <div className="text-sm font-tech-mono mb-2">TAP SPACEBAR TO THE BEAT!</div>
                  <div className="flex items-center justify-center text-xs text-white/60">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Hit the rhythm for points
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-white/80">
              <div className="text-xl font-orbitron font-bold text-accent mb-2">
                FINAL SCORE: {score}
              </div>
              <div className="text-sm text-white/60">Closing in 2s...</div>
            </div>
          )}

          {/* Background grid effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,0,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}