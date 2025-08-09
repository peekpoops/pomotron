import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TimerState, Session, InsertSession, Settings } from '@/types';
import { playSound } from '@/lib/sounds';
import { activateWebsiteBlocking, deactivateWebsiteBlocking } from '@/lib/websiteBlocker';
import { useToast } from '@/hooks/use-toast';

const defaultTimerState: TimerState = {
  isRunning: false,
  isPaused: false,
  timeLeft: 1500,
  sessionType: 'focus',
  currentCycle: 1,
  currentIntention: { task: '', why: '' },
};

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>(defaultTimerState);
  const [settings] = useLocalStorage<Settings>('pomotron-settings', {
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
    blockedSites: ['facebook.com', 'twitter.com', 'reddit.com', 'youtube.com', 'instagram.com'],
    motivationalQuotesEnabled: false,
    soundsEnabled: true,
  });
  const [sessions, setSessions] = useLocalStorage<Session[]>('pomotron-sessions', []);

  // Initialize timer with correct duration from settings
  useEffect(() => {
    if (timerState.timeLeft === 1500) { // Only if still using default value
      const correctDuration = settings.focusDuration * 60;
      if (correctDuration !== 1500) {
        setTimerState(prev => ({
          ...prev,
          timeLeft: correctDuration
        }));
      }
    }
  }, [settings.focusDuration, timerState.timeLeft]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeRef = useRef<number>(0);
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Reset idle detection on user activity
  const resetIdleDetection = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleTimeRef.current = 0;
  }, []);

  // Store cleanup function reference
  const cleanupIdleDetectionRef = useRef<(() => void) | null>(null);

  // Stop idle detection
  const stopIdleDetection = useCallback(() => {
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
    // Clean up event listeners
    if (cleanupIdleDetectionRef.current) {
      cleanupIdleDetectionRef.current();
      cleanupIdleDetectionRef.current = null;
    }
  }, []);

  // Enhanced idle detection with throttled event handling for better performance
  const startIdleDetection = useCallback(() => {
    // Clean up any existing idle detection
    stopIdleDetection();
    
    // Don't start idle detection if it's disabled (idleTimeout = 0)
    if (settings.idleTimeout === 0) return;
    
    // Track global activity events with throttling to improve performance
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity updates to reduce excessive function calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return; // Skip if already throttled
      
      throttleTimeout = setTimeout(() => {
        resetIdleDetection();
        throttleTimeout = null;
      }, 1000); // Only update once per second max
    };

    // Add activity listeners with passive flag for better performance
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, handleActivity, { passive: true, capture: true });
    });

    // Track page visibility changes - if user switches tabs but comes back, reset idle timer
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        resetIdleDetection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track window focus changes - if user comes back to browser, reset idle timer
    const handleFocus = () => {
      resetIdleDetection();
    };
    window.addEventListener('focus', handleFocus);

    // Store cleanup function for later use
    cleanupIdleDetectionRef.current = () => {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
        throttleTimeout = null;
      }
      activityEvents.forEach(eventType => {
        document.removeEventListener(eventType, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    
    idleIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = (now - lastActivityRef.current) / 1000 / 60; // minutes
      
      // Only trigger idle detection during focus sessions and when timer is running
      if (timeSinceActivity >= settings.idleTimeout && timerState.isRunning && timerState.sessionType === 'focus') {
        // Additional check: only notify if page is currently visible
        // This prevents false positives when user is working in other apps
        if (!document.hidden) {
          toast({
            title: "Idle Detected",
            description: `No activity detected for ${settings.idleTimeout} minutes. Still focused?`,
            duration: 6000,
          });
          playSound('idleNudge');
        }
        resetIdleDetection();
      }
    }, 30000); // Reduced frequency to improve performance (30 seconds)

  }, [settings.idleTimeout, timerState.isRunning, timerState.sessionType, toast, resetIdleDetection, stopIdleDetection]);

  // Timer countdown effect - stable implementation
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      startIdleDetection();
      
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (!prev.isRunning || prev.isPaused) {
            return prev;
          }
          
          const newTimeLeft = Math.max(0, prev.timeLeft - 1);
          
          if (newTimeLeft <= 0) {
            // Timer finished - handle session completion
            const isBreakNext = prev.sessionType === 'focus';
            const isLongBreak = prev.currentCycle >= 4 && isBreakNext; // Use hardcoded value to avoid dependency
            
            let nextSessionType: 'focus' | 'break' | 'longBreak';
            let nextCycle = prev.currentCycle;
            
            if (isBreakNext) {
              nextSessionType = isLongBreak ? 'longBreak' : 'break';
            } else {
              nextSessionType = 'focus';
              nextCycle = prev.sessionType === 'longBreak' ? 1 : prev.currentCycle + 1;
            }
            
            // Save completed session
            if (prev.currentSessionId) {
              setSessions(currentSessions => {
                const sessionToUpdate = currentSessions.find(s => s.id === prev.currentSessionId);
                if (sessionToUpdate) {
                  const updatedSession: Session = {
                    ...sessionToUpdate,
                    endTime: new Date(),
                    completed: true,
                  };
                  return currentSessions.map(s => s.id === updatedSession.id ? updatedSession : s);
                }
                return currentSessions;
              });
            }
            
            // Calculate next duration
            let nextDuration: number;
            switch (nextSessionType) {
              case 'focus':
                nextDuration = 25 * 60; // 25 minutes
                break;
              case 'break':
                nextDuration = 5 * 60; // 5 minutes
                break;
              case 'longBreak':
                nextDuration = 15 * 60; // 15 minutes
                break;
            }
            
            // Handle side effects after state update
            setTimeout(() => {
              playSound('sessionComplete');
              
              toast({
                title: prev.sessionType === 'focus' ? '✅ Focus Session Complete!' : '☕ Break Complete!',
                description: prev.sessionType === 'focus' ? 'Time for a break!' : 'Ready for the next focus session?',
              });
              
              // Handle website blocking
              if (nextSessionType === 'focus') {
                activateWebsiteBlocking(['facebook.com', 'twitter.com', 'reddit.com', 'youtube.com', 'instagram.com']);
              } else {
                deactivateWebsiteBlocking();
              }
            }, 0);
            
            return {
              ...prev,
              isRunning: false, // Don't auto-start to prevent conflicts
              timeLeft: nextDuration,
              sessionType: nextSessionType,
              currentCycle: nextCycle,
              currentSessionId: undefined,
              currentIntention: nextSessionType === 'focus' ? { task: '', why: '' } : prev.currentIntention,
            };
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopIdleDetection();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused, setSessions, toast])

  // Update timer duration when settings change (only if timer is not running)
  useEffect(() => {
    if (!timerState.isRunning && !timerState.isPaused) {
      let newDuration: number;
      switch (timerState.sessionType) {
        case 'focus':
          newDuration = settings.focusDuration * 60;
          break;
        case 'break':
          newDuration = settings.breakDuration * 60;
          break;
        case 'longBreak':
          newDuration = settings.longBreakDuration * 60;
          break;
      }
      
      // Only update if the time left doesn't match the new duration (settings changed)
      if (timerState.timeLeft !== newDuration) {
        setTimerState(prev => ({
          ...prev,
          timeLeft: newDuration
        }));
      }
    }
  }, [settings.focusDuration, settings.breakDuration, settings.longBreakDuration, timerState.sessionType, timerState.isRunning, timerState.isPaused, timerState.timeLeft]);

  // Activity listeners for idle detection
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetIdleDetection, true);
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleDetection, true);
      });
    };
  }, [resetIdleDetection]);

  const startSession = useCallback((intention?: { task: string; why: string }) => {
    // Set precise start time when session begins
    startTimeRef.current = Date.now();
    const sessionId = crypto.randomUUID();
    const currentTime = new Date();
    
    const newSession: Session = {
      id: sessionId,
      task: intention?.task || '',
      why: intention?.why || '',
      startTime: currentTime,
      duration: timerState.sessionType === 'focus' ? settings.focusDuration * 60 : 
                 timerState.sessionType === 'break' ? settings.breakDuration * 60 : 
                 settings.longBreakDuration * 60,
      completed: false,
      sessionType: timerState.sessionType,
      cycleNumber: timerState.currentCycle,
    };
    
    setSessions(prev => [...prev, newSession]);
    
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentSessionId: sessionId,
      currentIntention: intention || prev.currentIntention,
    }));
    
    if (timerState.sessionType === 'focus' && settings.websiteBlockingEnabled) {
      activateWebsiteBlocking(settings.blockedSites);
    }
    
    playSound('start');
  }, [timerState, settings, setSessions]);

  const pauseSession = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
    
    deactivateWebsiteBlocking();
  }, []);

  const resumeSession = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
    
    if (timerState.sessionType === 'focus' && settings.websiteBlockingEnabled) {
      activateWebsiteBlocking(settings.blockedSites);
    }
    
    playSound('start');
  }, [timerState.sessionType, settings]);

  const resetSession = useCallback(() => {
    // Mark current session as incomplete if exists
    if (timerState.currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === timerState.currentSessionId 
          ? { ...s, endTime: new Date(), completed: false }
          : s
      ));
    }
    
    let duration: number;
    switch (timerState.sessionType) {
      case 'focus':
        duration = settings.focusDuration * 60;
        break;
      case 'break':
        duration = settings.breakDuration * 60;
        break;
      case 'longBreak':
        duration = settings.longBreakDuration * 60;
        break;
    }
    
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      timeLeft: duration,
      currentSessionId: undefined,
    }));
    
    deactivateWebsiteBlocking();
    playSound('reset');
  }, [timerState, settings, setSessions]);

  const endSession = useCallback(() => {
    // Mark current session as incomplete if exists
    if (timerState.currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === timerState.currentSessionId 
          ? { ...s, endTime: new Date(), completed: false }
          : s
      ));
    }
    
    setTimerState({
      ...defaultTimerState,
      timeLeft: settings.focusDuration * 60,
    });
    
    deactivateWebsiteBlocking();
    playSound('reset');
  }, [timerState.currentSessionId, settings.focusDuration, setSessions]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const getProgress = useCallback((): number => {
    let totalTime: number;
    switch (timerState.sessionType) {
      case 'focus':
        totalTime = settings.focusDuration * 60;
        break;
      case 'break':
        totalTime = settings.breakDuration * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakDuration * 60;
        break;
    }
    
    return ((totalTime - timerState.timeLeft) / totalTime) * 100;
  }, [timerState, settings]);

  return {
    timerState,
    startSession,
    pauseSession,
    resumeSession,
    resetSession,
    endSession,
    formatTime,
    getProgress,
    sessions, // Expose sessions for reactive updates
  };
}
