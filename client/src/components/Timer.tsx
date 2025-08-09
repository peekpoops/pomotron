import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Clock, Play, Pause, RotateCcw, Square, Settings2, Target, Gamepad2, Flame, TrendingUp, Heart, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTimer } from '@/hooks/useTimer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Settings, Session } from '@/types';
import IntentionModal from './IntentionModal';
import { GlitchRun } from './GlitchRun';
// import LoadingScreen from './LoadingScreen';
// import PixelTransition from './PixelTransition';

interface TimerProps {
  onOpenSettings: () => void;
  timerHook?: ReturnType<typeof useTimer>;
  onModalStateChange?: (isOpen: boolean) => void;
  onGlitchRunStateChange?: (isOpen: boolean) => void;
}

const motivationalQuotes = [
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { text: "Go to heaven for the climate and hell for the company.", author: "Benjamin Franklin Wade" },
  { text: "A day without laughter is a day wasted.", author: "Nicolas Chamfort" },
  { text: "Have you ever noticed how 'What the hell' is always the right decision to make?", author: "Terry Johnson" },
  { text: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", author: "Anne Frank" },
  { text: "Never doubt that a small group of thoughtful, committed, citizens can change the world.", author: "Margaret Mead" },
  { text: "You talk when you cease to be at peace with your thoughts.", author: "Kahlil Gibran" },
  { text: "Man is the only creature who refuses to be what he is.", author: "Albert Camus" },
  { text: "May you live every day of your life.", author: "Jonathan Swift" },
  { text: "We have to dare to be ourselves, however frightening or strange that self may prove to be.", author: "May Sarton" },
  { text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare" },
  { text: "It is hard enough to remember my opinions, without also remembering my reasons for them!", author: "Friedrich Nietzsche" },
  { text: "Never let your sense of morals prevent you from doing what is right.", author: "Isaac Asimov" },
  { text: "If you ever find yourself in the wrong story, leave.", author: "Mo Willems" },
  { text: "The past has no power over the present moment.", author: "Eckhart Tolle" },
  { text: "Maybe everyone can live beyond what they're capable of.", author: "Markus Zusak" },
  { text: "Happiness can be found, even in the darkest of times, if one only remembers to turn on the light.", author: "J.K. Rowling" },
  { text: "The price good men pay for indifference to public affairs is to be ruled by evil men.", author: "Plato" },
  { text: "Science is not only compatible with spirituality; it is a profound source of spirituality.", author: "Carl Sagan" },
  { text: "Heard melodies are sweet, but those unheard, are sweeter.", author: "John Keats" },
  { text: "It is not true that people stop pursuing dreams because they grow old; they grow old because they stop pursuing dreams.", author: "Gabriel García Márquez" },
  { text: "Like all magnificent things, it's very simple.", author: "Natalie Babbitt" },
  { text: "A serious and good philosophical work could be written consisting entirely of jokes.", author: "Ludwig Wittgenstein" },
  { text: "Be kind, for everyone you meet is fighting a hard battle.", author: "Socrates" },
  { text: "Man suffers only because he takes seriously what the gods made for fun.", author: "Alan Watts" },
  { text: "I would believe only in a God that knows how to dance.", author: "Friedrich Nietzsche" },
  { text: "Perhaps home is not a place but simply an irrevocable condition.", author: "James Baldwin" },
  { text: "The day the power of love overrules the love of power, the world will know peace.", author: "Mahatma Gandhi" },
  { text: "The smallest minority on earth is the individual. Those who deny individual rights cannot claim to be defenders of minorities.", author: "Ayn Rand" },
  { text: "The first duty of a man is to think for himself.", author: "José Martí" },
  { text: "Expect everything, I always say, and the unexpected never happens.", author: "Norton Juster" },
  { text: "One is not born, but rather becomes, a woman.", author: "Simone de Beauvoir" },
  { text: "For every minute you are angry you lose sixty seconds of happiness.", author: "Ralph Waldo Emerson" },
  { text: "Love is that condition in which the happiness of another person is essential to your own.", author: "Robert A. Heinlein" },
  { text: "Folks are usually about as happy as they make their minds up to be.", author: "Abraham Lincoln" },
  { text: "Time you enjoy wasting is not wasted time.", author: "Marthe Troly‑Curtin" },
  { text: "Happiness in intelligent people is the rarest thing I know.", author: "Ernest Hemingway" },
  { text: "Happiness is when what you think, what you say, and what you do are in harmony.", author: "Mahatma Gandhi" },
  { text: "Let us be grateful to the people who make us happy; they are the charming gardeners who make our souls blossom.", author: "Marcel Proust" },
  { text: "If you want to be happy, do not dwell in the past, do not worry about the future, focus on living fully in the present.", author: "Roy T. Bennett" },
  { text: "They say a person needs just three things to be truly happy in this world: someone to love, something to do, and something to hope for.", author: "Tom Bodett" },
  { text: "Take responsibility of your own happiness, never put it in other people's hands.", author: "Roy T. Bennett" },
  { text: "The most important thing is to enjoy your life—to be happy—it's all that matters.", author: "Audrey Hepburn" },
  { text: "Happiness is a warm puppy.", author: "Charles M. Schulz" },
  { text: "You cannot protect yourself from sadness without protecting yourself from happiness.", author: "Jonathan Safran Foer" },
  { text: "It isn't what you have or who you are or where you are or what you are doing that makes you happy or unhappy; it is what you think about it.", author: "Dale Carnegie" },
  { text: "Happiness is not the absence of problems, it's the ability to deal with them.", author: "Steve Maraboli" },
  { text: "So we shall let the reader answer this question for himself: who is the happier man, he who has braved the storm of life and lived or he who has stayed securely on shore and merely existed?", author: "Hunter S. Thompson" },
  { text: "I think and think and think, I've thought myself out of happiness one million times, but never once into it.", author: "Jonathan Safran Foer" },
  { text: "I'd far rather be happy than right any day.", author: "Douglas Adams" },
  { text: "The grand essentials to happiness in this life are something to do, something to love, and something to hope for.", author: "George Washington Burnap" },
  { text: "It was only a sunny smile, and little it cost in the giving, but like morning light it scattered the night and made the day worth living.", author: "F. Scott Fitzgerald" },
  { text: "One of the keys to happiness is a bad memory.", author: "Rita Mae Brown" },
  { text: "The more you feed your mind with positive thoughts, the more you can attract great things into your life.", author: "Roy T. Bennett" },
  { text: "Happiness depends upon ourselves.", author: "Aristotle" },
  { text: "Happiness is the meaning and the purpose of life, the whole aim and end of human existence.", author: "Aristotle" },
  { text: "The problem with people is they forget that most of the time it's the small things that count.", author: "Jennifer Niven" },
  { text: "We don't even ask happiness, just a little less pain.", author: "Charles Bukowski" },
  { text: "Those who are not looking for happiness are the most likely to find it, because those who are searching forget that the surest way to be happy is to seek happiness for others.", author: "Martin Luther King Jr." },
  { text: "Happiness is an accident of nature, a beautiful and flawless aberration.", author: "Pat Conroy" },
  { text: "Laughter is poison to fear.", author: "George R.R. Martin" },
  { text: "Happiness is not a possession to be prized, it is a quality of thought, a state of mind.", author: "Daphne du Maurier" },
  { text: "The secret of happiness is freedom, the secret of freedom is courage.", author: "Carrie Jones" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "It is the very mark of the spirit of rebellion to crave for happiness in this life.", author: "Henrik Ibsen" },
  { text: "Very little is needed to make a happy life; it is all within yourself in your way of thinking.", author: "Marcus Aurelius" },
  { text: "Action may not always bring happiness, but there is no happiness without action.", author: "William James" },
  { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
  { text: "Start each day with a positive thought and a grateful heart.", author: "Roy T. Bennett" },
  { text: "Do not fear failure but rather fear not trying.", author: "Roy T. Bennett" },
  { text: "You never change your life until you step out of your comfort zone; change begins at the end of your comfort zone.", author: "Roy T. Bennett" },
  { text: "Be brave to stand for what you believe in even if you stand alone.", author: "Roy T. Bennett" },
  { text: "If you hang out with chickens, you're going to cluck and if you hang out with eagles, you're going to fly.", author: "Steve Maraboli" },
  { text: "You are the average of the five people you spend the most time with.", author: "Jim Rohn" },
  { text: "You have to accept whatever comes, and the only important thing is that you meet it with the best you have to give.", author: "Eleanor Roosevelt" },
  { text: "In the end, you have to choose whether or not to trust someone.", author: "Sophie Kinsella" },
  { text: "Rejection is an opportunity for your selection.", author: "Bernard Branson" },
  { text: "You were put on this earth to achieve your greatest self, to live out your purpose, and to do it courageously.", author: "Steve Maraboli" },
  { text: "My past has not defined me, destroyed me, deterred me, or defeated me; it has only strengthened me.", author: "Steve Maraboli" },
  { text: "One resolution I have made, and try always to keep, is this: 'To rise above little things'.", author: "John Burroughs" },
  { text: "You are essentially who you create yourself to be and all that occurs in your life is the result of your own making.", author: "Stephen Richards" },
  { text: "The bravest are surely those who have the clearest vision of what is before them, glory and danger alike, and yet notwithstanding, go out to meet it.", author: "Thucydides" },
  { text: "Make the best use of what's in your power and take the rest as it happens.", author: "Epictetus" },
  { text: "In the midst of chaos, there is also opportunity.", author: "Sun Tzu" },
  { text: "The nobler a man, the harder it is for him to suspect inferiority in others.", author: "Cicero" },
  { text: "True wisdom comes to each of us when we realize how little we understand about life, ourselves, and the world around us.", author: "Socrates" },
  { text: "The easiest and noblest way is not to be crushing others, but to be improving yourselves.", author: "Socrates" },
  { text: "No one has the right to be sorry for himself for a misfortune that strikes everyone.", author: "Cicero" },
  { text: "The function of wisdom is to discriminate between good and evil.", author: "Cicero" },
  { text: "I have never met a man so ignorant that I couldn't learn something from him.", author: "Galileo Galilei" },
  { text: "You can't teach anybody anything, only make them realize the answers are already inside them.", author: "Galileo Galilei" },
  { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { text: "Always do what you are afraid to do.", author: "Ralph Waldo Emerson" },
  { text: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain" },
  { text: "Never put off till tomorrow what may be done day after tomorrow just as well.", author: "Mark Twain" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "Always forgive your enemies; nothing annoys them so much.", author: "Oscar Wilde" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { text: "You cannot swim for new horizons until you have courage to lose sight of the shore.", author: "William Faulkner" },
  { text: "We must be free not because we claim freedom, but because we practice it.", author: "William Faulkner" }
];

const Timer = memo(({ onOpenSettings, timerHook: externalTimerHook, onModalStateChange, onGlitchRunStateChange }: TimerProps) => {
  const internalTimerHook = useTimer();
  const timerHook = externalTimerHook || internalTimerHook;
  const { timerState, startSession, pauseSession, resumeSession, resetSession, endSession, formatTime, getProgress, sessions: timerSessions } = timerHook;
  const [settings, setSettings] = useLocalStorage<Settings>('pomotron-settings', {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    autoStart: true,
    softStart: false,
    idleTimeout: 5,
    theme: 'starcourt',
    websiteBlockingEnabled: true,
    frictionOverride: false,
    blockedSites: [],
    showQuotes: false,
    soundsEnabled: true,
    motivationalQuotesEnabled: false,
  });
  
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  // const [showTimerLoading, setShowTimerLoading] = useState(false);
  // const [showTransition, setShowTransition] = useState(false);
  
  // 🔽 Tell parent about modal state
  useEffect(() => {
    onModalStateChange?.(showIntentionModal);
  }, [showIntentionModal]);
  
  // Helper function to get a random quote
  // Memoize quote selection functions to prevent recreation on each render
  const getRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  }, []);

  const getShuffledQuotes = useCallback(() => {
    const shuffled = [...motivationalQuotes].sort(() => Math.random() - 0.5);
    return shuffled;
  }, []);

  const [currentQuote, setCurrentQuote] = useState(() => getRandomQuote());
  const [showFullQuote, setShowFullQuote] = useState(false);
  const [availableQuotes, setAvailableQuotes] = useLocalStorage<typeof motivationalQuotes>('pomotron-available-quotes', getShuffledQuotes());
  const [usedQuotes, setUsedQuotes] = useLocalStorage<typeof motivationalQuotes>('pomotron-used-quotes', []);
  const [showGlitchRun, setShowGlitchRun] = useState(false);
  const [glitchRunUsedThisSession, setGlitchRunUsedThisSession] = useLocalStorage<boolean>('glitch-run-used', false);

  // Sound toggle function
  const toggleSound = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      soundsEnabled: !prev.soundsEnabled
    }));
  }, [setSettings]);

  // Initialize the first quote if we haven't set one yet
  useEffect(() => {
    if (availableQuotes.length === motivationalQuotes.length && usedQuotes.length === 0) {
      getNextQuote();
    }
  }, []);

  // Force refresh quotes on app restart to ensure randomization
  useEffect(() => {
    // Clear existing quote state to ensure fresh randomization on app restart
    const shouldRefreshQuotes = localStorage.getItem('pomotron-quotes-refreshed') !== 'true';
    if (shouldRefreshQuotes) {
      localStorage.removeItem('pomotron-available-quotes');
      localStorage.removeItem('pomotron-used-quotes');
      localStorage.setItem('pomotron-quotes-refreshed', 'true');
      
      // Reset to shuffled quotes
      const shuffledQuotes = [...motivationalQuotes].sort(() => Math.random() - 0.5);
      setAvailableQuotes(shuffledQuotes);
      setUsedQuotes([]);
      
      // Set a random initial quote
      const randomQuote = getRandomQuote();
      setCurrentQuote(randomQuote);
    }
  }, []);

  const getNextQuote = useCallback(() => {
    // If no available quotes, reset the cycle with shuffled quotes
    if (availableQuotes.length === 0) {
      // Create a shuffled copy of all quotes
      const shuffledQuotes = getShuffledQuotes();
      setAvailableQuotes(shuffledQuotes);
      setUsedQuotes([]);
      
      // Select the first quote from the shuffled array
      const selectedQuote = shuffledQuotes[0];
      setCurrentQuote(selectedQuote);
      setAvailableQuotes(shuffledQuotes.slice(1)); // Remove selected quote
      setUsedQuotes([selectedQuote]);
      return;
    }
    
    // Select random quote from available quotes
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const selectedQuote = availableQuotes[randomIndex];
    
    // Update state
    setCurrentQuote(selectedQuote);
    setAvailableQuotes(prev => prev.filter((_, index) => index !== randomIndex));
    setUsedQuotes(prev => [...prev, selectedQuote]);
  }, [availableQuotes, getShuffledQuotes, setAvailableQuotes, setUsedQuotes, getRandomQuote, setCurrentQuote]);

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

  // Calculate today's completed focus cycles with reactive updates from timer hook
  const todayCompletedCycles = useMemo(() => {
    const today = new Date().toDateString();
    return (timerSessions || []).filter(session => 
      session.completed && 
      session.sessionType === 'focus' && 
      new Date(session.startTime).toDateString() === today
    ).length;
  }, [timerSessions]);

  const getSessionInfo = () => {
    if (timerState.sessionType === 'focus') {
      return `Cycle ${timerState.currentCycle} of ${settings.cyclesBeforeLongBreak} • Long break after ${settings.cyclesBeforeLongBreak} cycles`;
    } else if (timerState.sessionType === 'break') {
      return `Short break after completing Cycle ${timerState.currentCycle} • Next: Cycle ${timerState.currentCycle + 1}`;
    } else {
      return `Long break after completing ${settings.cyclesBeforeLongBreak} cycles • Starting fresh after this break`;
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
        return 'bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400';
      case 'longBreak':
        return 'bg-gradient-to-r from-purple-500 to-pink-400 border-purple-400';
    }
  };

  const getTimerDisplayColor = () => {
    switch (timerState.sessionType) {
      case 'focus':
        return 'text-primary timer-glow';
      case 'break':
        return 'text-emerald-400 timer-glow-green';
      case 'longBreak':
        return 'text-purple-400 timer-glow-purple';
    }
  };

  const getCardClassName = () => {
    switch (timerState.sessionType) {
      case 'focus':
        return 'neon-border glass-morphism';
      case 'break':
        return 'neon-border glass-morphism break-session-card';
      case 'longBreak':
        return 'neon-border glass-morphism long-break-session-card';
    }
  };

  // GlitchRun logic
  const canPlayGlitchRun = () => {
    if (timerState.sessionType === 'focus' && timerState.isRunning) {
      return !glitchRunUsedThisSession;
    }
    return !timerState.isRunning || timerState.sessionType === 'break' || timerState.sessionType === 'longBreak';
  };

  const handleGlitchRun = () => {
    if (canPlayGlitchRun()) {
      setShowGlitchRun(true);
      onGlitchRunStateChange?.(true);
      if (timerState.sessionType === 'focus' && timerState.isRunning) {
        setGlitchRunUsedThisSession(true);
      }
    }
  };

  const handleGlitchRunClose = () => {
    setShowGlitchRun(false);
    onGlitchRunStateChange?.(false);
  };

  // Reset GlitchRun usage when new focus session starts
  useEffect(() => {
    if (timerState.sessionType === 'focus' && timerState.isRunning) {
      // Reset usage at start of new focus session (when time is full)
      const sessionDurationMinutes = settings.focusDuration;
      const sessionDurationSeconds = sessionDurationMinutes * 60;
      if (timerState.timeLeft === sessionDurationSeconds) {
        setGlitchRunUsedThisSession(false);
      }
    }
  }, [timerState.sessionType, timerState.isRunning, timerState.timeLeft, settings.focusDuration]);

  return (
    <div className="w-full space-y-6 lg:space-y-8">
      {/* Motivational Quote Banner */}
      {settings.motivationalQuotesEnabled && (
        <Card className="glass-morphism animate-float">
          <CardContent className="p-4 sm:p-6 relative pr-12 sm:pr-16">
            <div className="text-center">
              <p className="text-sm sm:text-lg italic text-secondary font-tech-mono quote-text-mobile">
                "{showFullQuote ? currentQuote.text : currentQuote.text.length > 120 ? `${currentQuote.text.substring(0, 120)}...` : currentQuote.text}"
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
              className="absolute top-2 right-2 text-accent hover:text-primary p-2 min-w-8 min-h-8 flex items-center justify-center z-10"
            >
              {showFullQuote ? '↑' : '↓'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid xl:grid-cols-3 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Timer Section */}
        <div className="xl:col-span-2 lg:col-span-2 w-full">
          <Card className={getCardClassName()}>
            <CardContent className="p-6 sm:p-8 lg:p-12 xl:p-16 mobile-padding-md">
              {/* Break Session Visual Enhancement */}
              {(timerState.sessionType === 'break' || timerState.sessionType === 'longBreak') && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* Animated particles for breaks */}
                  <div className="break-particles">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full ${
                          timerState.sessionType === 'break' ? 'bg-emerald-400' : 'bg-purple-400'
                        } animate-ping`}
                        style={{
                          left: `${10 + (i * 12)}%`,
                          top: `${20 + (i % 3) * 25}%`,
                          animationDelay: `${i * 0.3}s`,
                          animationDuration: '2s'
                        }}
                      />
                    ))}
                  </div>
                  {/* Gradient overlay for dopamine effect */}
                  <div className={`absolute inset-0 ${
                    timerState.sessionType === 'break' 
                      ? 'bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-400/5' 
                      : 'bg-gradient-to-br from-purple-500/5 via-transparent to-pink-400/5'
                  } animate-pulse`} style={{ animationDuration: '3s' }} />
                </div>
              )}
              
              {/* Timer Display */}
              <div className="text-center mb-8 lg:mb-12 xl:mb-16 relative z-10 w-full max-w-full px-2 sm:px-4">
                {(timerState.sessionType === 'break' || timerState.sessionType === 'longBreak') && (
                  <div className="mb-4 animate-bounce">
                    <div className={`text-2xl sm:text-3xl font-orbitron font-bold ${
                      timerState.sessionType === 'break' ? 'text-emerald-400' : 'text-purple-400'
                    }`}>
                      🎉 {timerState.sessionType === 'break' ? 'BREAK TIME!' : 'LONG BREAK!'} 🎉
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 font-tech-mono">
                      {timerState.sessionType === 'break' 
                        ? 'Time to recharge your focus energy!' 
                        : 'You\'ve earned this extended break!'}
                    </div>
                  </div>
                )}
                <div className={`timer-display mobile-timer-large iphone-se-fix text-8xl sm:text-9xl md:text-[7rem] lg:text-[8rem] xl:text-[10rem] font-orbitron font-black ${getTimerDisplayColor()} mb-6 lg:mb-8 leading-none w-full max-w-full overflow-hidden`} style={{ boxSizing: 'border-box', maxWidth: 'calc(100vw - 2rem)' }}>
                  {formatTime(timerState.timeLeft)}
                </div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge className={`${getSessionTypeColor()} text-primary-foreground text-xs sm:text-sm`}>
                    {getSessionTypeLabel()}
                  </Badge>
                </div>
                {/* Visual Cycle Progress - Only show during focus sessions */}
                {timerState.sessionType === 'focus' && (
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {Array.from({ length: settings.cyclesBeforeLongBreak }, (_, index) => {
                      const cycleNumber = index + 1;
                      const isCompleted = cycleNumber < timerState.currentCycle;
                      const isCurrent = cycleNumber === timerState.currentCycle && timerState.sessionType === 'focus';
                      
                      return (
                        <div
                          key={cycleNumber}
                          className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                            isCompleted
                              ? 'bg-primary border-primary shadow-lg shadow-primary/50'
                              : isCurrent
                              ? 'bg-gradient-to-br from-accent to-secondary border-accent shadow-md shadow-accent/40'
                              : 'bg-muted border-muted-foreground/30'
                          }`}
                          title={`Focus Cycle ${cycleNumber}${isCompleted ? ' (Completed)' : isCurrent ? ' (Current)' : ''}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-8 lg:mb-12 xl:mb-16">
                <Progress 
                  value={getProgress()} 
                  className="h-4 lg:h-6 mb-3 lg:mb-4"
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
              <div className="flex justify-center space-x-2 sm:space-x-4 mb-6">
                {!timerState.isRunning && !timerState.isPaused ? (
                  <Button
                    onClick={handleStartSession}
                    className={`px-8 py-4 text-lg font-orbitron font-bold hover:scale-105 transition-transform timer-control-button ${
                      timerState.sessionType === 'break' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white shadow-emerald-500/50'
                        : timerState.sessionType === 'longBreak'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-400 hover:to-pink-300 text-white shadow-purple-500/50'
                        : 'btn-primary'
                    }`}
                    style={timerState.sessionType !== 'focus' ? { boxShadow: `0 0 20px ${timerState.sessionType === 'break' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(168, 85, 247, 0.5)'}` } : {}}
                  >
                    <Play className="h-5 w-5 mr-2 button-icon" />
                    <span className="button-text">
                      {timerState.sessionType === 'break' ? 'START BREAK' : timerState.sessionType === 'longBreak' ? 'START LONG BREAK' : 'START'}
                    </span>
                  </Button>
                ) : timerState.isRunning ? (
                  <Button
                    onClick={pauseSession}
                    className="btn-secondary px-6 py-4 font-medium hover:scale-105 transition-transform timer-control-button"
                  >
                    <Pause className="h-4 w-4 mr-2 button-icon" />
                    <span className="button-text">PAUSE</span>
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSession}
                    className={`px-6 py-4 font-medium hover:scale-105 transition-transform timer-control-button ${
                      timerState.sessionType === 'break' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white'
                        : timerState.sessionType === 'longBreak'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-400 hover:to-pink-300 text-white'
                        : 'btn-primary'
                    }`}
                    style={timerState.sessionType !== 'focus' ? { boxShadow: `0 0 20px ${timerState.sessionType === 'break' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(168, 85, 247, 0.5)'}` } : {}}
                  >
                    <Play className="h-4 w-4 mr-2 button-icon" />
                    <span className="button-text">RESUME</span>
                  </Button>
                )}
                
                <Button
                  onClick={resetSession}
                  className="btn-tertiary px-6 py-4 font-medium hover:scale-105 transition-transform timer-control-button"
                >
                  <RotateCcw className="h-4 w-4 mr-2 button-icon" />
                  <span className="button-text">RESET</span>
                </Button>
                
                <Button
                  onClick={endSession}
                  className="btn-danger px-6 py-4 font-medium hover:scale-105 transition-transform timer-control-button"
                >
                  <Square className="h-4 w-4 mr-2 button-icon" />
                  <span className="button-text">END</span>
                </Button>
              </div>

              {/* Quick Settings */}
              <div className="flex justify-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className={`settings-button ${
                    settings.soundsEnabled 
                      ? 'text-muted-foreground hover:text-accent' 
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                  title={settings.soundsEnabled ? 'Sound On - Click to mute' : 'Sound Off - Click to enable'}
                >
                  {settings.soundsEnabled ? (
                    <Volume2 className="h-4 w-4 mr-1 button-icon" />
                  ) : (
                    <VolumeX className="h-4 w-4 mr-1 button-icon" />
                  )}
                  <span className="button-text">
                    {settings.soundsEnabled ? 'Sound On' : 'Sound Off'}
                  </span>
                </Button>
                
                {/* GlitchRun Button */}
                {canPlayGlitchRun() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGlitchRun}
                    className={`relative settings-button ${
                      !canPlayGlitchRun() 
                        ? 'text-muted-foreground/50 cursor-not-allowed' 
                        : 'text-muted-foreground hover:text-accent'
                    }`}
                    disabled={!canPlayGlitchRun()}
                    title={
                      timerState.sessionType === 'focus' && glitchRunUsedThisSession
                        ? 'GlitchRun used this focus session'
                        : 'Play GlitchRun - Quick 10s dopamine boost!'
                    }
                  >
                    <Gamepad2 className="h-4 w-4 mr-1 button-icon" />
                    <span className="button-text">GlitchRun</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Current Intention - Enhanced Retro Style */}
          {timerState.currentIntention.task && (
            <Card className="neon-border glass-morphism relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10 opacity-60"></div>
              <CardContent className="p-4 sm:p-6 relative z-10 mobile-padding-md">
                <div className="mb-4 sm:mb-6">
                  <h3 className="section-title text-base sm:text-lg text-secondary flex items-center font-orbitron font-bold">
                    <div className="relative mr-3">
                      <Lightbulb className="h-6 w-6 text-accent animate-pulse" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
                      <div className="absolute inset-0 animate-ping">
                        <div className="h-6 w-6 border-2 border-transparent border-t-accent/40 rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                      CURRENT FOCUS
                    </span>
                  </h3>
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent to-transparent mt-2 opacity-60"></div>
                </div>
                
                <div className="space-y-3 sm:space-y-5">
                  {/* Task Section */}
                  <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                    <div className="flex items-start space-x-3">
                      <div className="relative mt-1">
                        <Target className="h-5 w-5 text-primary animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping opacity-75"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-tech-mono text-primary font-bold uppercase mb-2 tracking-wider mobile-xs-text">
                          TARGET OBJECTIVE
                        </div>
                        <div className="text-xs sm:text-sm text-foreground font-medium leading-relaxed bg-black/20 p-2 sm:p-3 rounded-lg border border-white/10 mobile-text-sm">
                          {timerState.currentIntention.task}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why Section */}
                  {timerState.currentIntention.why && (
                    <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-r from-secondary/15 to-accent/10 border border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                      <div className="flex items-start space-x-3">
                        <div className="relative mt-1">
                          <Heart className="h-5 w-5 text-secondary animate-pulse" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                          <div className="absolute -inset-1 bg-secondary/20 rounded-full animate-ping opacity-50"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-tech-mono text-secondary font-bold uppercase mb-2 tracking-wider">
                            MOTIVATION CORE
                          </div>
                          <div className="text-sm text-foreground font-medium leading-relaxed bg-black/20 p-3 rounded-lg border border-white/10 italic">
                            "{timerState.currentIntention.why}"
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Animated circuit decoration */}
                <div className="absolute top-2 right-2 opacity-15">
                  <div className="flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 h-1 bg-accent rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-2 right-2 flex items-center space-x-2 opacity-60">
                  <div className="w-2 h-2 bg-accent rounded-full animate-ping"></div>
                  <span className="text-xs font-tech-mono text-accent uppercase">ACTIVE</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Progress - Retro Style */}
          <Card className="neon-border glass-morphism relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 opacity-50"></div>
            <CardContent className="p-6 relative z-10">
              <h3 className="section-title text-lg mb-6 text-secondary flex items-center font-orbitron font-bold">
                <TrendingUp className="h-5 w-5 mr-2 text-accent animate-pulse" />
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  TODAY'S PROGRESS
                </span>
              </h3>
              <div className="space-y-4">
                {/* Cycles completed */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Target className="h-6 w-6 text-primary animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-sm font-tech-mono text-secondary font-medium">CYCLES COMPLETED</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-orbitron font-black text-primary neon-text">
                      {todayCompletedCycles}
                    </span>
                  </div>
                </div>

                {/* Focus time */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20 hover:border-accent/40 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Clock className="h-6 w-6 text-accent animate-bounce" />
                      <div className="absolute inset-0 animate-spin">
                        <div className="h-6 w-6 border-2 border-transparent border-t-accent/30 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-sm font-tech-mono text-secondary font-medium">FOCUS TIME</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xl font-orbitron font-black text-accent">
                      {Math.floor(todayCompletedCycles * settings.focusDuration / 60)}
                    </span>
                    <span className="text-xs text-accent font-tech-mono">H</span>
                    <span className="text-xl font-orbitron font-black text-accent ml-2">
                      {todayCompletedCycles * settings.focusDuration % 60}
                    </span>
                    <span className="text-xs text-accent font-tech-mono">M</span>
                  </div>
                </div>

                {/* Streak */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Flame className="h-6 w-6 text-secondary animate-pulse" style={{ filter: 'drop-shadow(0 0 10px currentColor)' }} />
                      <div className="absolute -inset-1 bg-secondary/20 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-sm font-tech-mono text-secondary font-medium">STREAK</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-orbitron font-black text-secondary neon-text">1</span>
                    <span className="text-xs text-muted-foreground font-tech-mono">DAY</span>
                    <div className="flex space-x-1 ml-2">
                      {[...Array(3)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-1 h-4 bg-secondary/60 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Retro circuit pattern decoration */}
              <div className="absolute bottom-2 right-2 opacity-10">
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 h-1 bg-primary rounded-full animate-ping"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>

      <IntentionModal
        open={showIntentionModal}
        onOpenChange={setShowIntentionModal}
        onSubmit={handleIntentionSet}
      />

      <GlitchRun
        isOpen={showGlitchRun}
        onClose={handleGlitchRunClose}
      />

      {/* Loading Screen for Timer Start - COMMENTED OUT
      <LoadingScreen
        isLoading={showTimerLoading}
        loadingType="timer-start"
        duration={1500}
        onComplete={() => setShowTimerLoading(false)}
      />

      Pixel Transition Effect - COMMENTED OUT
      <PixelTransition
        isActive={showTransition}
        onComplete={() => setShowTransition(false)}
        direction="in"
        pattern="blocks"
      />
      */}
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer;
