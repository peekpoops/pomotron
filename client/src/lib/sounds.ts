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

export function playSound(type: 'start' | 'reset' | 'sessionComplete' | 'idleNudge'): void {
  // Check if sounds are enabled in settings
  const settings = localStorage.getItem('pomotron-settings');
  if (settings) {
    const parsedSettings = JSON.parse(settings);
    if (parsedSettings.soundsEnabled === false) {
      return;
    }
  }

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
