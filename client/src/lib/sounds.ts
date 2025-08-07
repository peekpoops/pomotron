// Audio context for Web Audio API
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Generate retro-style sound effects using Web Audio API
function createRetroBeep(frequency: number, duration: number, type: OscillatorType = 'square'): void {
  try {
    const ctx = getAudioContext();
    
    // Create oscillator
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure oscillator
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Configure gain (volume envelope)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    // Start and stop
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn('Could not play sound:', error);
  }
}

function createStartSound(): void {
  // Synthwave-style ascending arpeggio
  const frequencies = [220, 277, 330, 440]; // A, C#, E, A (A major chord)
  const noteDuration = 0.15;
  
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      createRetroBeep(freq, noteDuration, 'sawtooth');
    }, index * 80);
  });
}

function createResetSound(): void {
  // Descending digital blip
  const frequencies = [880, 660, 440, 220];
  const noteDuration = 0.1;
  
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      createRetroBeep(freq, noteDuration, 'square');
    }, index * 60);
  });
}

function createSessionCompleteSound(): void {
  // Victory fanfare
  const melody = [
    { freq: 523, duration: 0.2 }, // C5
    { freq: 659, duration: 0.2 }, // E5
    { freq: 784, duration: 0.2 }, // G5
    { freq: 1047, duration: 0.4 }, // C6
  ];
  
  melody.forEach((note, index) => {
    setTimeout(() => {
      createRetroBeep(note.freq, note.duration, 'triangle');
    }, index * 150);
  });
}

function createIdleNudgeSound(): void {
  // Gentle reminder beep
  createRetroBeep(440, 0.3, 'sine');
  setTimeout(() => {
    createRetroBeep(550, 0.3, 'sine');
  }, 400);
}

// GlitchRun specific sound effects
function createJumpSound(): void {
  // Rising synth woosh
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

function createLandSound(): void {
  // Soft landing blip
  createRetroBeep(150, 0.1, 'triangle');
}

function createScoreSound(): void {
  // Pleasant arpeggiated ping
  const frequencies = [523, 659, 784]; // C, E, G major chord
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      createRetroBeep(freq, 0.15, 'triangle');
    }, index * 40);
  });
}

function createCollisionSound(): void {
  // Soft, gentle impact sound
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine'; // Much softer wave type
  oscillator.frequency.setValueAtTime(220, ctx.currentTime); // Lower, gentler frequency
  oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2); // Gentle downward slide
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01); // Much quieter volume
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2); // Shorter duration
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

function createGameStartSound(): void {
  // Retro 8-bit start blip
  createRetroBeep(880, 0.1, 'square');
  setTimeout(() => {
    createRetroBeep(1100, 0.15, 'square');
  }, 120);
}

function createGameOverSound(): void {
  // Cheerful win synth tone with rising pitch
  const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord progression)
  frequencies.forEach((freq, index) => {
    setTimeout(() => {
      createRetroBeep(freq, 0.25, 'triangle');
    }, index * 100);
  });
}

export function playSound(type: 'start' | 'reset' | 'sessionComplete' | 'idleNudge' | 'glitch-jump' | 'glitch-land' | 'glitch-score' | 'glitch-collision' | 'glitch-game-start' | 'glitch-game-over'): void {
  // Check if sounds are enabled in settings
  const settings = localStorage.getItem('pomotron-settings');
  if (settings) {
    const parsedSettings = JSON.parse(settings);
    // Debug: check what's in settings
    console.log('Sound settings check:', { soundsEnabled: parsedSettings.soundsEnabled, type });
    if (parsedSettings.soundsEnabled === false) {
      console.log('Sounds disabled, skipping:', type);
      return;
    }
  }
  // If no settings exist, sounds are enabled by default

  // Check if audio is enabled and context is available
  if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
    console.warn('Web Audio API not supported');
    return;
  }
  
  // Resume audio context if suspended (required by browser autoplay policies)
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      playSound(type); // Retry after resuming
    }).catch(console.warn);
    return;
  }
  
  switch (type) {
    case 'start':
      createStartSound();
      break;
    case 'reset':
      createResetSound();
      break;
    case 'sessionComplete':
      createSessionCompleteSound();
      break;
    case 'idleNudge':
      createIdleNudgeSound();
      break;
    case 'glitch-jump':
      createJumpSound();
      break;
    case 'glitch-land':
      createLandSound();
      break;
    case 'glitch-score':
      createScoreSound();
      break;
    case 'glitch-collision':
      createCollisionSound();
      break;
    case 'glitch-game-start':
      createGameStartSound();
      break;
    case 'glitch-game-over':
      createGameOverSound();
      break;
    default:
      console.warn('Unknown sound type:', type);
  }
}

// Initialize audio context on first user interaction
export function initializeAudio(): void {
  if (audioContext) return;
  
  const initAudio = () => {
    getAudioContext();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
    document.removeEventListener('touchstart', initAudio);
  };
  
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);
  document.addEventListener('touchstart', initAudio);
}
