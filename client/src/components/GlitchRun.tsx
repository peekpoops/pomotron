
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GlitchRunProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  glitchPhase: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const PLAYER_SIZE = 20;
const PLAYER_X = 50;
const GROUND_Y = GAME_HEIGHT - 60;
const JUMP_HEIGHT = 60;
const OBSTACLE_SPEED = 4;
const OBSTACLE_WIDTH = 25;
const OBSTACLE_HEIGHT = 40;

export function GlitchRun({ isOpen, onClose }: GlitchRunProps) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenGlitch, setScreenGlitch] = useState(false);
  const [distance, setDistance] = useState(0);

  const gameLoopRef = useRef<number>();
  const lastObstacleRef = useRef<number>(0);
  const obstacleIdRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const jumpVelocityRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(10);
    setDistance(0);
    setPlayerY(GROUND_Y);
    setIsJumping(false);
    setObstacles([]);
    setParticles([]);
    setScreenGlitch(false);
    lastObstacleRef.current = 0;
    obstacleIdRef.current = 0;
    particleIdRef.current = 0;
    jumpVelocityRef.current = 0;
    gameStartTimeRef.current = Date.now();

    // Start game loop
    const gameLoop = () => {
      updateGame();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // End game
  const endGame = useCallback(() => {
    setGameState('finished');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Auto-close after 2 seconds
    setTimeout(() => {
      onClose();
      setGameState('waiting');
    }, 2000);
  }, [onClose]);

  // Update game state
  const updateGame = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - gameStartTimeRef.current) / 1000;
    const newTimeLeft = Math.max(0, 10 - elapsed);
    
    setTimeLeft(Math.ceil(newTimeLeft));
    setDistance(Math.floor(elapsed * 50));

    // End game after 10 seconds
    if (elapsed >= 10) {
      endGame();
      return;
    }

    // Update player jump
    if (isJumping) {
      jumpVelocityRef.current += 0.8; // gravity
      const newY = playerY + jumpVelocityRef.current;
      
      if (newY >= GROUND_Y) {
        setPlayerY(GROUND_Y);
        setIsJumping(false);
        jumpVelocityRef.current = 0;
      } else {
        setPlayerY(newY);
      }
    }

    // Spawn obstacles
    if (now - lastObstacleRef.current > 1000 + Math.random() * 1500) {
      setObstacles(prev => [...prev, {
        id: obstacleIdRef.current++,
        x: GAME_WIDTH,
        y: GROUND_Y,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        glitchPhase: Math.random() * Math.PI * 2
      }]);
      lastObstacleRef.current = now;
    }

    // Update obstacles and check collisions
    setObstacles(prev => {
      return prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - OBSTACLE_SPEED,
        glitchPhase: obstacle.glitchPhase + 0.2
      })).filter(obstacle => {
        // Remove obstacles that are off-screen
        if (obstacle.x < -obstacle.width) {
          setScore(s => s + 10); // Points for surviving
          return false;
        }

        // Check collision
        const playerLeft = PLAYER_X;
        const playerRight = PLAYER_X + PLAYER_SIZE;
        const playerTop = playerY;
        const playerBottom = playerY + PLAYER_SIZE;

        const obsLeft = obstacle.x;
        const obsRight = obstacle.x + obstacle.width;
        const obsTop = obstacle.y - obstacle.height;
        const obsBottom = obstacle.y;

        if (playerRight > obsLeft && 
            playerLeft < obsRight && 
            playerBottom > obsTop && 
            playerTop < obsBottom) {
          // Collision detected
          setScreenGlitch(true);
          setTimeout(() => setScreenGlitch(false), 200);
          return false; // Remove obstacle
        }

        return true;
      });
    });

    // Update particles
    setParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.2,
      life: particle.life - 1
    })).filter(particle => particle.life > 0));
  }, [playerY, isJumping, endGame]);

  // Handle jump
  const handleJump = useCallback(() => {
    if (gameState !== 'playing' || isJumping) return;
    
    setIsJumping(true);
    jumpVelocityRef.current = -12;
    setScore(s => s + 5); // Points for jumping

    // Create jump particles
    const newParticles = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: PLAYER_X + PLAYER_SIZE / 2,
        y: playerY + PLAYER_SIZE,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 20,
        maxLife: 20
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, [gameState, isJumping, playerY]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (gameState === 'waiting') {
          startGame();
        } else if (gameState === 'playing') {
          handleJump();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, gameState, startGame, handleJump]);

  // Canvas rendering
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = screenGlitch ? '#ff00ff' : '#0a0a1a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw grid background
    ctx.strokeStyle = screenGlitch ? '#ff00ff' : '#00ffff';
    ctx.lineWidth = screenGlitch ? 2 : 1;
    ctx.globalAlpha = screenGlitch ? 0.8 : 0.3;
    
    // Vertical lines
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      const offset = (Date.now() * 0.1 + x * 0.05) % 20;
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset, GAME_HEIGHT);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      const offset = (Date.now() * 0.05) % 20;
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(GAME_WIDTH, y + offset);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Draw ground line
    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + PLAYER_SIZE);
    ctx.lineTo(GAME_WIDTH, GROUND_Y + PLAYER_SIZE);
    ctx.stroke();

    // Draw horizon line
    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(GAME_WIDTH, 50);
    ctx.stroke();

    // Draw player
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff6b9d';
    ctx.fillStyle = `rgba(255, 107, 157, ${pulse})`;
    ctx.fillRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE);
    ctx.shadowBlur = 0;

    // Draw obstacles
    obstacles.forEach(obstacle => {
      const glitchIntensity = Math.sin(obstacle.glitchPhase) * 0.5 + 0.5;
      const colors = ['#ff0066', '#00ffff', '#ffff00'];
      const colorIndex = Math.floor(glitchIntensity * colors.length);
      
      ctx.fillStyle = colors[colorIndex] || '#ff0066';
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle;
      
      // Glitch effect
      const glitchOffset = Math.sin(obstacle.glitchPhase * 2) * 3;
      ctx.fillRect(
        obstacle.x + glitchOffset, 
        obstacle.y - obstacle.height, 
        obstacle.width, 
        obstacle.height
      );
      
      // Additional glitch lines
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = glitchIntensity;
      ctx.fillRect(obstacle.x, obstacle.y - obstacle.height + glitchIntensity * 10, obstacle.width, 2);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = `rgba(255, 107, 157, ${alpha})`;
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ff6b9d';
      ctx.fillRect(particle.x, particle.y, 3, 3);
      ctx.shadowBlur = 0;
    });

    // Screen glitch effect
    if (screenGlitch) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.globalAlpha = 1;
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="relative w-fit bg-black/80 border-2 border-accent neon-glow">
        <CardContent className="p-6 relative overflow-hidden">
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
            GLITCH RUN
          </h2>

          {/* Game Stats */}
          <div className="flex justify-between mb-4 text-center">
            <div>
              <div className="text-sm text-white/60 font-tech-mono">TIME</div>
              <div className="text-xl font-orbitron font-bold text-primary">{timeLeft}s</div>
            </div>
            <div>
              <div className="text-sm text-white/60 font-tech-mono">SCORE</div>
              <div className="text-xl font-orbitron font-bold text-secondary">{score}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 font-tech-mono">DISTANCE</div>
              <div className="text-xl font-orbitron font-bold text-accent">{distance}m</div>
            </div>
          </div>

          {/* Game Canvas */}
          <div className="relative mb-4">
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={GAME_HEIGHT}
              className="border border-primary/50 bg-black cursor-pointer"
              onClick={() => {
                if (gameState === 'waiting') {
                  startGame();
                } else if (gameState === 'playing') {
                  handleJump();
                }
              }}
            />
          </div>

          {/* Game Instructions */}
          <div className="text-center text-white/80">
            {gameState === 'waiting' && (
              <div>
                <div className="text-lg font-orbitron font-bold text-accent mb-2">
                  READY TO RUN
                </div>
                <div className="text-sm font-tech-mono mb-2">
                  TAP CANVAS OR PRESS SPACEBAR TO START
                </div>
                <div className="text-xs text-white/60">
                  Jump over glitch blocks • Survive 10 seconds
                </div>
              </div>
            )}
            
            {gameState === 'playing' && (
              <div>
                <div className="text-sm font-tech-mono mb-2">
                  TAP/SPACEBAR TO JUMP!
                </div>
                <div className="flex items-center justify-center text-xs text-white/60">
                  <Zap className="h-4 w-4 mr-1" />
                  Dodge the glitch blocks
                </div>
              </div>
            )}
            
            {gameState === 'finished' && (
              <div>
                <div className="text-xl font-orbitron font-bold text-accent mb-2">
                  BACK TO FOCUS
                </div>
                <div className="text-sm text-white/60">
                  Final Score: {score} • Distance: {distance}m
                </div>
              </div>
            )}
          </div>

          {/* Animated circuit decoration */}
          <div className="absolute top-2 left-2 opacity-15">
            <div className="flex space-x-1">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 h-1 bg-accent rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
