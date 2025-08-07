import { useState, useEffect } from 'react';
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
  { text: "Pursue what catches your heart, not what catches your eyes.", author: "Roy T. Bennett" },
  { text: "Start each day with a positive thought and a grateful heart.", author: "Roy T. Bennett" },
  { text: "Life is about accepting the challenges along the way, choosing to keep moving forward, and savoring the journey.", author: "Roy T. Bennett" },
  { text: "Be brave to stand for what you believe in even if you stand alone.", author: "Roy T. Bennett" },
  { text: "Do not fear failure but rather fear not trying.", author: "Roy T. Bennett" },
  { text: "You never change your life until you step out of your comfort zone; change begins at the end of your comfort zone.", author: "Roy T. Bennett" },
  { text: "Do what you love, love what you do, and with all your heart give yourself to it.", author: "Roy T. Bennett" },
  { text: "Once you realize you deserve a bright future, letting go of your dark past is the best choice you will ever make.", author: "Roy T. Bennett" },
  { text: "If you believe very strongly in something, stand up and fight for it.", author: "Roy T. Bennett" },
  { text: "You cannot change anyone, but you can be the reason someone changes.", author: "Roy T. Bennett" },
  { text: "If you hang out with chickens, you're going to cluck and if you hang out with eagles, you're going to fly.", author: "Steve Maraboli" },
  { text: "To have what you have never had, you have to do what you have never done.", author: "Roy T. Bennett" },
  { text: "You are the average of the five people you spend the most time with.", author: "Jim Rohn" },
  { text: "You have to accept whatever comes, and the only important thing is that you meet it with the best you have to give.", author: "Eleanor Roosevelt" },
  { text: "Great leaders create more leaders, not followers.", author: "Roy T. Bennett" },
  { text: "In the end, you have to choose whether or not to trust someone.", author: "Sophie Kinsella" },
  { text: "If you don't give up on something you truly believe in, you will find a way.", author: "Roy T. Bennett" },
  { text: "Rejection is an opportunity for your selection.", author: "Bernard Branson" },
  { text: "Be the positive impact on the lives of others.", author: "Roy T. Bennett" },
  { text: "Discipline your mind to see the good in every situation and look on the best side of every event.", author: "Roy T. Bennett" },
  { text: "What you stay focused on will grow.", author: "Roy T. Bennett" },
  { text: "Don't wait for things to happen. Make them happen.", author: "Roy T. Bennett" },
  { text: "When things do not go your way, remember that every challenge — every adversity — contains within it the seeds of opportunity and growth.", author: "Roy T. Bennett" },
  { text: "You learn something valuable from all of the significant events and people, but you never touch your true potential until you challenge yourself to go beyond imposed limitations.", author: "Roy T. Bennett" },
  { text: "Gratitude builds a bridge to abundance.", author: "Roy T. Bennett" },
  { text: "You were put on this earth to achieve your greatest self, to live out your purpose, and to do it courageously.", author: "Steve Maraboli" },
  { text: "My past has not defined me, destroyed me, deterred me, or defeated me; it has only strengthened me.", author: "Steve Maraboli" },
  { text: "Don't wait for the right moment to start, start and make each moment right.", author: "Roy T. Bennett" },
  { text: "One resolution I have made, and try always to keep, is this: 'To rise above little things'.", author: "John Burroughs" },
  { text: "Good people see the good and bring out the best in other people.", author: "Roy T. Bennett" },
  { text: "You were born to stand out, stop trying to fit in.", author: "Roy T. Bennett" },
  { text: "You are essentially who you create yourself to be and all that occurs in your life is the result of your own making.", author: "Stephen Richards" },
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
  const [availableQuotes, setAvailableQuotes] = useLocalStorage<typeof motivationalQuotes>('pomotron-available-quotes', [...motivationalQuotes]);
  const [usedQuotes, setUsedQuotes] = useLocalStorage<typeof motivationalQuotes>('pomotron-used-quotes', []);

  // Initialize the first quote if we haven't set one yet
  useEffect(() => {
    if (availableQuotes.length === motivationalQuotes.length && usedQuotes.length === 0) {
      getNextQuote();
    }
  }, []);

  const getNextQuote = () => {
    // If no available quotes, reset the cycle
    if (availableQuotes.length === 0) {
      setAvailableQuotes([...motivationalQuotes]);
      setUsedQuotes([]);
      // Select from freshly reset quotes
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      const selectedQuote = motivationalQuotes[randomIndex];
      setCurrentQuote(selectedQuote);
      setAvailableQuotes(motivationalQuotes.filter((_, index) => index !== randomIndex));
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
              <div className="flex justify-center">
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
          {/* Current Intention - Only show if user has started and entered text */}
          {timerState.currentIntention.task && (
            <Card className="neon-border glass-morphism">
              <CardContent className="p-6">
                <h3 className="section-title text-lg mb-4 text-secondary flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Current Intention
                </h3>
                <div className="space-y-2">
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


        </div>
      </div>

      <IntentionModal
        open={showIntentionModal}
        onOpenChange={setShowIntentionModal}
        onSubmit={handleIntentionSet}
      />
    </div>
  );
}
