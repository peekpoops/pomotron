import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
  loadingType?: 'initial' | 'timer-start' | 'data-sync' | 'transition';
  duration?: number;
  onComplete?: () => void;
}

const pixelArtFrames = [
  // Frame 1 - Basic grid
  `
  ████████████████
  ██            ██
  ██  ████████  ██
  ██  ██    ██  ██
  ██  ██ ██ ██  ██
  ██  ██    ██  ██
  ██  ████████  ██
  ██            ██
  ████████████████
  `,
  // Frame 2 - Loading bar
  `
  ████████████████
  ██            ██
  ██  ████████  ██
  ██  ████████  ██
  ██  ████████  ██
  ██  ████████  ██
  ██  ████████  ██
  ██            ██
  ████████████████
  `,
  // Frame 3 - Expanding
  `
  ████████████████
  ██            ██
  ██    ████    ██
  ██  ████████  ██
  ██  ████████  ██
  ██  ████████  ██
  ██    ████    ██
  ██            ██
  ████████████████
  `,
];

const loadingMessages = {
  'initial': [
    'INITIALIZING FOCUS GRID...',
    'LOADING RETRO PROTOCOLS...',
    'SYNCING TIME CIRCUITS...',
    'PREPARING POMODORO ENGINE...',
    'ENTERING THE ZONE...'
  ],
  'timer-start': [
    'ACTIVATING FOCUS MODE...',
    'ENGAGING PRODUCTIVITY MATRIX...',
    'ESTABLISHING DEEP WORK LINK...',
    'INITIALIZING SESSION...'
  ],
  'data-sync': [
    'SYNCING ANALYTICS DATA...',
    'UPDATING SESSION RECORDS...',
    'PROCESSING PERFORMANCE METRICS...',
    'CALCULATING SUCCESS RATES...'
  ],
  'transition': [
    'TRANSITIONING...',
    'SWITCHING MODES...',
    'UPDATING INTERFACE...',
    'READY FOR NEXT SESSION...'
  ]
};

export default function LoadingScreen({ 
  isLoading, 
  loadingType = 'initial', 
  duration = 3000,
  onComplete 
}: LoadingScreenProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scanlineOffset, setScanlineOffset] = useState(0);

  const messages = loadingMessages[loadingType];

  useEffect(() => {
    if (!isLoading) return;

    const frameInterval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % pixelArtFrames.length);
    }, 200);

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = 100 / (duration / 50);
        return Math.min(prev + increment, 100);
      });
    }, 50);

    const scanlineInterval = setInterval(() => {
      setScanlineOffset(prev => (prev + 1) % 100);
    }, 50);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearInterval(frameInterval);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearInterval(scanlineInterval);
      clearTimeout(completeTimer);
    };
  }, [isLoading, duration, messages.length, onComplete]);

  // Reset progress when loading starts
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setCurrentFrame(0);
      setCurrentMessage(0);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          style={{
            background: `
              linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)
            `
          }}
        >
          {/* Scanlines Effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255, 107, 157, 0.1) 2px,
                  rgba(255, 107, 157, 0.1) 4px
                ),
                linear-gradient(
                  90deg,
                  transparent ${scanlineOffset}%,
                  rgba(255, 107, 157, 0.2) ${scanlineOffset + 1}%,
                  transparent ${scanlineOffset + 2}%
                )
              `
            }}
          />
          
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-12 grid-rows-8 h-full w-full">
              {Array.from({ length: 96 }, (_, i) => (
                <div key={i} className="border border-primary/20" />
              ))}
            </div>
          </div>

          <div className="text-center relative z-10">
            {/* Pixel Art Animation */}
            <motion.div
              className="mb-8 mx-auto"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <pre 
                className="text-primary font-mono text-xs leading-none pixel-art"
                style={{ 
                  filter: 'drop-shadow(0 0 10px var(--neon-pink))',
                  textShadow: '0 0 20px var(--neon-pink)'
                }}
              >
                {pixelArtFrames[currentFrame]}
              </pre>
            </motion.div>

            {/* Loading Message */}
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-orbitron font-bold text-primary drop-shadow-neon mb-2">
                {messages[currentMessage]}
              </h2>
              <div className="flex justify-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-secondary rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-80 max-w-sm mx-auto mb-4">
              <div className="relative h-4 bg-muted/20 rounded-full border border-primary/30 overflow-hidden">
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                  animate={{ x: [-100, 400] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* Progress fill */}
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: '0 0 20px var(--neon-pink), inset 0 0 20px rgba(255,255,255,0.2)'
                    }}
                  />
                </motion.div>
              </div>
              
              {/* Progress text */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2 font-tech-mono">
                <span>LOADING...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Retro Loading Indicator */}
            <motion.div
              className="flex items-center justify-center space-x-4 text-accent font-tech-mono text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-8 h-1 bg-accent/50 rounded-full overflow-hidden">
                <motion.div
                  className="w-2 h-full bg-accent rounded-full"
                  animate={{ x: [-8, 24] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span>FOCUS GRID ONLINE</span>
            </motion.div>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 text-primary/30 font-tech-mono text-xs">
            POMOTRON v2.1
          </div>
          <div className="absolute top-4 right-4 text-primary/30 font-tech-mono text-xs">
            RETRO MODE
          </div>
          <div className="absolute bottom-4 left-4 text-primary/30 font-tech-mono text-xs">
            {new Date().toLocaleDateString()}
          </div>
          <div className="absolute bottom-4 right-4 text-primary/30 font-tech-mono text-xs">
            SYNTHWAVE OS
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}