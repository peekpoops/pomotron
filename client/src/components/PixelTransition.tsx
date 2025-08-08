import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PixelTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
  direction?: 'in' | 'out';
  duration?: number;
  pattern?: 'blocks' | 'diagonal' | 'wave' | 'spiral';
}

export default function PixelTransition({
  isActive,
  onComplete,
  direction = 'in',
  duration = 1000,
  pattern = 'blocks'
}: PixelTransitionProps) {
  const [pixels, setPixels] = useState<boolean[]>([]);
  
  const gridSize = 16; // 16x16 grid
  const totalPixels = gridSize * gridSize;

  useEffect(() => {
    if (isActive) {
      setPixels(new Array(totalPixels).fill(false));
      
      const animatePixels = () => {
        let delays: number[] = [];
        
        switch (pattern) {
          case 'blocks':
            delays = Array.from({ length: totalPixels }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              return (row + col) * 50;
            });
            break;
            
          case 'diagonal':
            delays = Array.from({ length: totalPixels }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              return (row + col) * 30;
            });
            break;
            
          case 'wave':
            delays = Array.from({ length: totalPixels }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              return Math.sin((col / gridSize) * Math.PI * 2) * 200 + row * 40;
            });
            break;
            
          case 'spiral':
            delays = Array.from({ length: totalPixels }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              const centerX = gridSize / 2;
              const centerY = gridSize / 2;
              const distance = Math.sqrt(Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2));
              const angle = Math.atan2(row - centerY, col - centerX);
              return distance * 30 + angle * 50;
            });
            break;
        }

        delays.forEach((delay, index) => {
          setTimeout(() => {
            setPixels(prev => {
              const newPixels = [...prev];
              newPixels[index] = direction === 'in';
              return newPixels;
            });
          }, delay);
        });

        setTimeout(() => {
          if (onComplete) onComplete();
        }, Math.max(...delays) + 100);
      };

      animatePixels();
    }
  }, [isActive, direction, pattern, totalPixels, gridSize, onComplete]);

  if (!isActive) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div 
        className="grid w-full h-full"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }}
      >
        {pixels.map((isVisible, index) => (
          <motion.div
            key={index}
            className={`
              ${isVisible ? 'bg-primary' : 'bg-transparent'}
              transition-colors duration-75
            `}
            style={{
              filter: isVisible ? 'drop-shadow(0 0 4px var(--neon-pink))' : 'none'
            }}
            initial={{ scale: 0 }}
            animate={{ 
              scale: isVisible ? 1 : 0,
              opacity: isVisible ? 0.9 : 0
            }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}