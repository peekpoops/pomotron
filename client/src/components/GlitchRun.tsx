import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { playSound } from '@/lib/sounds';

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
  collided: boolean;
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
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished' | 'showingBackToFocus'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [playerY, setPlayerY] = useState(GROUND_Y);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenGlitch, setScreenGlitch] = useState(false);
  const [jumpAura, setJumpAura] = useState(0); // For jump ring effect
  const [successBurst, setSuccessBurst] = useState<{x: number, y: number, time: number} | null>(null);

  const gameLoopRef = useRef<number>();
  const lastObstacleRef = useRef<number>(0);
  const obstacleIdRef = useRef<number>(0);
  const particleIdRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const jumpVelocityRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start game
  const startGame = useCallback(() => {
    // Play game start sound immediately before state changes
    playSound('glitch-game-start');
    
    setGameState('playing');
    setScore(0);
    setTimeLeft(10);
    setPlayerY(GROUND_Y);
    setIsJumping(false);
    setObstacles([]);
    setParticles([]);
    setScreenGlitch(false);
    setJumpAura(0);
    setSuccessBurst(null);
    
    lastObstacleRef.current = 0;
    obstacleIdRef.current = 0;
    particleIdRef.current = 0;
    jumpVelocityRef.current = 0;
    gameStartTimeRef.current = Date.now();
  }, []);

  // End game
  const endGame = useCallback(() => {
    setGameState('finished');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    // Play game over sound
    playSound('glitch-game-over');

    // Show "BACK TO FOCUS" message after 1 second delay, then auto-close after 2 more seconds
    setTimeout(() => {
      setGameState('showingBackToFocus');
      setTimeout(() => {
        onClose();
        setGameState('waiting');
      }, 2000);
    }, 1000);
  }, [onClose]);

  // Update game state
  const updateGame = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - gameStartTimeRef.current) / 1000;
    const newTimeLeft = Math.max(0, 10 - elapsed);

    setTimeLeft(Math.ceil(newTimeLeft));

    // Update jump aura (fades much faster)
    if (jumpAura > 0) {
      setJumpAura(prev => Math.max(0, prev - 0.25));
    }

    // Update success burst effect
    if (successBurst && now - successBurst.time > 500) {
      setSuccessBurst(null);
    }

    // End game after 10 seconds
    if (elapsed >= 10) {
      endGame();
      return;
    }

    // Update player jump with proper physics
    if (isJumping) {
      jumpVelocityRef.current += 1.2; // gravity
      const newY = playerY + jumpVelocityRef.current;
      


      if (newY >= GROUND_Y) {
        setPlayerY(GROUND_Y);
        setIsJumping(false);
        jumpVelocityRef.current = 0;
        // Play landing sound
        playSound('glitch-land');
      } else {
        setPlayerY(newY);
      }
    }

    // Spawn obstacles
    if (now - lastObstacleRef.current > 1000 + Math.random() * 1500) {
      setObstacles(prev => [...prev, {
        id: obstacleIdRef.current++,
        x: GAME_WIDTH,
        y: GROUND_Y - OBSTACLE_HEIGHT, // Place obstacle bottom at ground level (obstacle extends upward)
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        glitchPhase: Math.random() * Math.PI * 2,
        collided: false
      }]);
      lastObstacleRef.current = now;
    }

    // Update obstacles and check collisions using forEach loop
    setObstacles(prev => {
      const updatedObstacles: typeof prev = [];
      const GRACE_MARGIN = 4;
      
      prev.forEach(obstacle => {
        // Update obstacle position and glitch phase
        const updatedObstacle = {
          ...obstacle,
          x: obstacle.x - OBSTACLE_SPEED,
          glitchPhase: obstacle.glitchPhase + 0.2
        };

        // Player position for collision checking
        const playerLeft = PLAYER_X;
        const playerRight = PLAYER_X + PLAYER_SIZE;
        const playerTop = playerY;
        const playerBottom = playerY + PLAYER_SIZE;

        const obsLeft = updatedObstacle.x;
        const obsRight = updatedObstacle.x + updatedObstacle.width;
        const obsTop = updatedObstacle.y; // y is the top of obstacle
        const obsBottom = updatedObstacle.y + updatedObstacle.height; // bottom is y + height

        // Removed excessive logging

        // Check for collision - include boundary touching
        const hasHorizontalOverlap = playerRight >= obsLeft && playerLeft <= obsRight;
        const hasVerticalOverlap = playerBottom >= obsTop && playerTop <= obsBottom;
        
        const isCollision = hasHorizontalOverlap && hasVerticalOverlap;



        // Mark collision if it occurred
        if (isCollision && !updatedObstacle.collided) {
          console.log('🔴 COLLISION! Obstacle', updatedObstacle.id, 'hit player - marking as collided');
          updatedObstacle.collided = true;
          // Collision detected - trigger effects but don't end game
          setScreenGlitch(true);
          setTimeout(() => setScreenGlitch(false), 400);
          playSound('glitch-collision');
        }

        // Handle obstacle that went off-screen
        if (updatedObstacle.x < -updatedObstacle.width) {
          // Award score only if no collision occurred during the obstacle's lifetime
          if (!updatedObstacle.collided) {
            console.log('✅ SCORE! Obstacle', updatedObstacle.id, 'passed without collision - awarding 10 points');
            setScore(s => {
              const newScore = s + 10;
              playSound('glitch-score');
              return newScore;
            });
            // Create success burst effect
            setSuccessBurst({
              x: PLAYER_X + PLAYER_SIZE/2,
              y: playerY + PLAYER_SIZE/2,
              time: Date.now()
            });
          } else {
            console.log('❌ NO SCORE - Obstacle', updatedObstacle.id, 'was collided with, not awarding points');
          }
          // Don't add to updatedObstacles (remove it)
          return;
        }

        // Keep all obstacles in the game (don't remove them after collision)
        updatedObstacles.push(updatedObstacle);
      });

      return updatedObstacles;
    });

    // Update particles
    setParticles(prev => prev.map(particle => ({
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.2,
      life: particle.life - 1
    })).filter(particle => particle.life > 0));
  }, [playerY, isJumping, endGame, successBurst]);

  // Handle jump
  const handleJump = useCallback(() => {
    if (gameState !== 'playing' || isJumping) return;

    // Play jump sound immediately before state changes
    playSound('glitch-jump');
    
    setIsJumping(true);
    jumpVelocityRef.current = -16; // Strong upward velocity
    setJumpAura(1.0); // Trigger aura ring once per jump

    // Create enhanced jump particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: PLAYER_X + PLAYER_SIZE / 2 + (Math.random() - 0.5) * 15,
        y: playerY + PLAYER_SIZE,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 3,
        life: 35,
        maxLife: 35
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

  // Canvas rendering function
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current) return;

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

    // Draw enhanced Tron-like avatar
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    const rotation = isJumping ? Math.sin(Date.now() * 0.03) * 0.15 : 0;

    const avatarWidth = PLAYER_SIZE * 1.4; // Larger avatar
    const avatarHeight = PLAYER_SIZE * 1.4;
    const centerX = PLAYER_X + PLAYER_SIZE / 2;
    const centerY = playerY + PLAYER_SIZE / 2;
    


    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Draw jump aura ring (only when aura > 0, not tied to isJumping)
    if (jumpAura > 0) {
      const auraSize = avatarWidth * 1.5 * jumpAura;
      ctx.globalAlpha = jumpAura * 0.8;
      ctx.strokeStyle = '#ff6b9d';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff6b9d';
      ctx.beginPath();
      ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Avatar outline glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';

    // Draw head (hexagonal)
    const headSize = avatarWidth * 0.35;
    ctx.fillStyle = `rgba(255, 107, 157, ${pulse})`;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * headSize;
      const y = Math.sin(angle) * headSize - avatarHeight * 0.3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw energy core in head
    const coreSize = headSize * 0.4;
    const corePulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = `rgba(255, 255, 255, ${corePulse})`;
    ctx.beginPath();
    ctx.arc(0, -avatarHeight * 0.3, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw torso (taller rectangle with rounded corners)
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.9})`;
    const torsoWidth = avatarWidth * 0.5;
    const torsoHeight = avatarHeight * 0.6;
    ctx.fillRect(-torsoWidth/2, -avatarHeight * 0.1, torsoWidth, torsoHeight);

    // Draw energy core in torso
    const torsoCore = Math.sin(Date.now() * 0.015) * 0.3 + 0.7;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff6b9d';
    ctx.fillStyle = `rgba(255, 107, 157, ${torsoCore})`;
    ctx.beginPath();
    ctx.arc(0, avatarHeight * 0.1, avatarWidth * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw arms (dynamic positioning)
    const armLength = avatarWidth * 0.35;
    const armWidth = avatarWidth * 0.12;
    const armAngle = isJumping ? 0.4 : 0.1;

    ctx.fillStyle = `rgba(255, 255, 0, ${pulse * 0.8})`;

    // Left arm
    ctx.save();
    ctx.rotate(-armAngle);
    ctx.fillRect(-avatarWidth * 0.4, -avatarHeight * 0.05, armLength, armWidth);
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.rotate(armAngle);
    ctx.fillRect(avatarWidth * 0.1, -avatarHeight * 0.05, armLength, armWidth);
    ctx.restore();

    // Draw legs (spread when jumping)
    const legSpread = isJumping ? 0.6 : 0.2;
    const legLength = avatarHeight * 0.4;
    const legWidth = avatarWidth * 0.12;

    ctx.fillStyle = `rgba(255, 107, 157, ${pulse * 0.8})`;

    // Left leg
    ctx.save();
    ctx.rotate(-legSpread);
    ctx.fillRect(-avatarWidth * 0.15, avatarHeight * 0.25, legWidth, legLength);
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.rotate(legSpread);
    ctx.fillRect(avatarWidth * 0.05, avatarHeight * 0.25, legWidth, legLength);
    ctx.restore();

    // Jump trail effect
    if (isJumping) {
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 4; i++) {
        const trailAlpha = (4 - i) / 4 * 0.6;
        ctx.globalAlpha = trailAlpha;
        ctx.fillStyle = '#ff6b9d';
        ctx.fillRect(-avatarWidth/2 - i * 8, -avatarHeight/6, avatarWidth/3, 4);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-avatarWidth/2 - i * 8, avatarHeight/6, avatarWidth/3, 4);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
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
        obstacle.y, 
        obstacle.width, 
        obstacle.height
      );

      // Additional glitch lines
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = glitchIntensity;
      ctx.fillRect(obstacle.x, obstacle.y + glitchIntensity * 10, obstacle.width, 2);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });

    // Draw particles with enhanced effects
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      const size = 2 + alpha * 3;

      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff6b9d';
      ctx.fillStyle = `rgba(255, 107, 157, ${alpha})`;

      // Draw main particle
      ctx.fillRect(particle.x - size/2, particle.y - size/2, size, size);

      // Draw particle trail
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      ctx.globalAlpha = 1;

      ctx.shadowBlur = 0;
    });

    // Success burst effect
    if (successBurst) {
      const burstAge = (Date.now() - successBurst.time) / 500;
      const burstAlpha = Math.max(0, 1 - burstAge);
      const burstSize = 30 + burstAge * 40;

      ctx.globalAlpha = burstAlpha;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ff6b9d';

      // Draw burst rings
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255, 107, 157, ${burstAlpha * (1 - i * 0.3)})`;
        ctx.lineWidth = 4 - i;
        ctx.beginPath();
        ctx.arc(successBurst.x, successBurst.y, burstSize + i * 15, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw burst sparkles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const sparkleDistance = burstSize * 0.7;
        const sparkleX = successBurst.x + Math.cos(angle) * sparkleDistance;
        const sparkleY = successBurst.y + Math.sin(angle) * sparkleDistance;

        ctx.fillStyle = `rgba(0, 255, 255, ${burstAlpha})`;
        ctx.fillRect(sparkleX - 2, sparkleY - 2, 4, 4);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Screen glitch effect
    if (screenGlitch) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.globalAlpha = 1;
    }
  }, [playerY, isJumping, jumpAura, obstacles, particles, screenGlitch, successBurst]);

  // Main game loop effect
  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        updateGame();
        renderCanvas();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameState === 'waiting' && isOpen) {
      // Initial render when game opens
      renderCanvas();
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, isOpen, updateGame, renderCanvas]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // Reset game completely when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      // Reset all game state
      setGameState('waiting');
      setScore(0);
      setTimeLeft(10);
      setPlayerY(GROUND_Y);
      setIsJumping(false);
      setObstacles([]);
      setParticles([]);
      setScreenGlitch(false);
      setJumpAura(0);
      setSuccessBurst(null);
      
      // Reset refs
      lastObstacleRef.current = 0;
      obstacleIdRef.current = 0;
      particleIdRef.current = 0;
      jumpVelocityRef.current = 0;
      gameStartTimeRef.current = 0;
    }
  }, [isOpen]);

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
          <div className="flex justify-center gap-8 mb-4 text-center">
            <div>
              <div className="text-sm text-white/60 font-tech-mono">TIME</div>
              <div className="text-xl font-orbitron font-bold text-primary">{timeLeft}s</div>
            </div>
            <div>
              <div className="text-sm text-white/60 font-tech-mono">SCORE</div>
              <div className="text-xl font-orbitron font-bold text-secondary">{score}</div>
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
              <div className="text-sm text-white/60">
                Game Over
              </div>
            )}
          </div>

          {/* Game Finished Overlay */}
          {gameState === 'finished' && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
              <div className="text-center">
                <div className="text-lg text-white/80 font-tech-mono">
                  Final Score: {score}
                </div>
              </div>
            </div>
          )}

          {/* Back to Focus Overlay */}
          {gameState === 'showingBackToFocus' && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
              <div className="text-center animate-pulse">
                <div className="text-3xl font-orbitron font-bold text-accent mb-3 neon-text">
                  BACK TO FOCUS
                </div>
                <div className="text-lg text-white/80 font-tech-mono">
                  Final Score: {score}
                </div>
                <div className="text-sm text-white/50 mt-2">
                  Returning to focus session...
                </div>
              </div>
            </div>
          )}

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