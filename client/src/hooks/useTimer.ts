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
    showQuotes: true,
    soundsEnabled: true,
    motivationalQuotesEnabled: false,
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
  const pausedTimeRef = useRef<number>(0); // Track total paused time
  const timerStateRef = useRef(timerState); // Keep current timer state for idle detection
  const { toast } = useToast();

  // Update timer state ref whenever timer state changes
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

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
    
    console.log('Starting idle detection with timeout:', settings.idleTimeout, 'minutes');
    
    // Initialize last activity to now
    lastActivityRef.current = Date.now();
    
    // Track global activity events - Safari compatible
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'keypress', 'keyup', 'scroll', 'touchstart', 'touchmove', 'click', 'wheel'];
    
    // Activity handler that works across browser contexts
    const handleActivity = () => {
      const now = Date.now();
      console.log('Activity detected at:', new Date(now).toLocaleTimeString());
      resetIdleDetection();
    };

    // Add activity listeners to document (works for current tab)
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, handleActivity, { passive: false, capture: true });
    });

    // Add activity listeners to window for broader activity detection
    activityEvents.forEach(eventType => {
      window.addEventListener(eventType, handleActivity, { passive: true, capture: true });
    });

    // Track page visibility changes - continue idle detection across tabs
    const handleVisibilityChange = () => {
      console.log('Visibility changed, hidden:', document.hidden);
      
      if (!document.hidden) {
        // User returned to Pomotron tab - reset idle timer since switching tabs counts as activity
        console.log('User returned to Pomotron tab, resetting idle timer');
        resetIdleDetection();
      }
      // Don't pause idle detection when switching away - continue monitoring for true idleness
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track window focus/blur for cross-window activity detection
    // Only reset idle detection if user was actually idle before focusing
    const handleFocus = () => {
      const now = Date.now();
      const timeSinceActivity = (now - lastActivityRef.current) / 1000 / 60;
      console.log('Browser window focused after', timeSinceActivity.toFixed(2), 'minutes');
      
      // Only reset if this focus represents genuine activity (not just window switching)
      // If user just switched windows without being idle, don't reset the timer
      if (timeSinceActivity < 0.1) { // Less than 6 seconds means they were just switching
        console.log('Quick window switch detected, not resetting idle timer');
      } else {
        console.log('Window focus after idle period, resetting idle detection');
        resetIdleDetection();
      }
    };
    
    const handleBlur = () => {
      console.log('Browser window blurred, continuing idle detection');
      // Don't reset - continue monitoring for true idleness
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Store cleanup function for later use
    cleanupIdleDetectionRef.current = () => {
      activityEvents.forEach(eventType => {
        document.removeEventListener(eventType, handleActivity, true);
        window.removeEventListener(eventType, handleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
    
    // Check for idle more frequently for testing
    idleIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = (now - lastActivityRef.current) / 1000 / 60; // minutes
      
      // Get current timer state from ref to avoid stale closure issues
      const currentTimerState = timerStateRef.current;
      console.log(`Idle check - Time since activity: ${timeSinceActivity.toFixed(2)} minutes, Timer running: ${currentTimerState.isRunning}, Session: ${currentTimerState.sessionType}, Idle timeout: ${settings.idleTimeout}`);
      
      // Trigger idle detection during focus sessions when timer is running
      // Show notifications regardless of tab visibility - we want to detect true idleness
      if (timeSinceActivity >= settings.idleTimeout && 
          currentTimerState.isRunning &&
          currentTimerState.sessionType === 'focus') {
        console.log('Triggering idle notification! User idle for', timeSinceActivity.toFixed(2), 'minutes');
        
        // Show notification immediately regardless of tab visibility
        // This allows sound/notification to work as a nudge even when on other tabs
        console.log('Showing idle notification immediately');
        toast({
          title: "Idle Detected",
          description: `No activity detected for ${settings.idleTimeout} minutes. Still focused?`,
          duration: 6000,
        });
        playSound('idleNudge');
        resetIdleDetection();
      }
    }, 10000); // Check every 10 seconds for testing

  }, [settings.idleTimeout, toast, resetIdleDetection, stopIdleDetection, playSound]);

  // Timer countdown effect with precise timing
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      // Record the exact start time for precision
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          // Calculate elapsed time more precisely, accounting for paused time
          const currentTime = Date.now();
          const elapsedSeconds = Math.floor((currentTime - (startTimeRef.current || currentTime)) / 1000);
          const originalDuration = (() => {
            switch (prev.sessionType) {
              case 'focus': return settings.focusDuration * 60;
              case 'break': return settings.breakDuration * 60;
              case 'longBreak': return settings.longBreakDuration * 60;
            }
          })();
          
          // Account for paused time - subtract from original duration, not from timeLeft
          const totalElapsedSeconds = elapsedSeconds + pausedTimeRef.current;
          const preciseTimeLeft = Math.max(0, originalDuration - totalElapsedSeconds);
          
          if (preciseTimeLeft <= 0) {
            // Timer finished
            const isBreakNext = prev.sessionType === 'focus';
            const isLongBreak = prev.currentCycle >= settings.cyclesBeforeLongBreak && isBreakNext;
            
            let nextSessionType: 'focus' | 'break' | 'longBreak';
            let nextCycle = prev.currentCycle;
            
            if (isBreakNext) {
              nextSessionType = isLongBreak ? 'longBreak' : 'break';
            } else {
              nextSessionType = 'focus';
              if (prev.sessionType === 'longBreak') {
                nextCycle = 1; // Reset cycle after long break
              } else {
                nextCycle = prev.currentCycle + 1;
              }
            }
            
            // Save completed session
            if (prev.currentSessionId) {
              const sessionToUpdate = sessions.find(s => s.id === prev.currentSessionId);
              if (sessionToUpdate) {
                const updatedSession: Session = {
                  ...sessionToUpdate,
                  endTime: new Date(),
                  completed: true,
                };
                setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
              }
            }
            
            // Calculate next duration
            let nextDuration: number;
            switch (nextSessionType) {
              case 'focus':
                nextDuration = settings.focusDuration * 60;
                break;
              case 'break':
                nextDuration = settings.breakDuration * 60;
                break;
              case 'longBreak':
                nextDuration = settings.longBreakDuration * 60;
                break;
            }
            
            playSound('sessionComplete');
            
            // Handle website blocking
            if (nextSessionType === 'focus' && settings.websiteBlockingEnabled) {
              activateWebsiteBlocking(settings.blockedSites);
            } else {
              deactivateWebsiteBlocking();
            }
            
              toast({
                title:
                  prev.sessionType === 'focus'
                    ? '✅ Focus Session Complete!'
                    : '☕ Break Complete!',
                description:
                  prev.sessionType === 'focus'
                    ? 'Time for a break!'
                    : 'Ready for the next focus session?',
              })
;
            
            // Reset start time for next session
            startTimeRef.current = settings.autoStart ? Date.now() : null;
            
            return {
              ...prev,
              isRunning: settings.autoStart,
              timeLeft: nextDuration,
              sessionType: nextSessionType,
              currentCycle: nextCycle,
              currentSessionId: undefined,
              currentIntention: nextSessionType === 'focus' ? { task: '', why: '' } : prev.currentIntention,
            };
          }
          
          // Use precise timing instead of simple decrement
          return { ...prev, timeLeft: preciseTimeLeft };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset start time when timer stops
      startTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused, settings, sessions, setSessions, toast]);

  // Separate useEffect for idle detection management
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && timerState.sessionType === 'focus') {
      startIdleDetection();
    } else {
      stopIdleDetection();
    }
  }, [timerState.isRunning, timerState.isPaused, timerState.sessionType, startIdleDetection, stopIdleDetection]);

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
    pausedTimeRef.current = 0; // Reset paused time for new session
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
    // Calculate and store elapsed time before pausing
    if (startTimeRef.current) {
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
      pausedTimeRef.current += elapsedSeconds;
      startTimeRef.current = null;
    }
    
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
    
    deactivateWebsiteBlocking();
  }, []);

  const resumeSession = useCallback(() => {
    // Reset start time to current time when resuming
    startTimeRef.current = Date.now();
    
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
      // Calculate actual duration spent on this session
      const actualDuration = startTimeRef.current 
        ? Math.round((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000)
        : 0;
      
      setSessions(prev => prev.map(s => 
        s.id === timerState.currentSessionId 
          ? { 
              ...s, 
              endTime: new Date(), 
              completed: false,
              duration: Math.max(0, actualDuration) // Ensure duration is not negative
            }
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
    
    // Reset timing references
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    
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
      // Calculate actual duration spent on this session
      const actualDuration = startTimeRef.current 
        ? Math.round((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000)
        : 0;
      
      setSessions(prev => prev.map(s => 
        s.id === timerState.currentSessionId 
          ? { 
              ...s, 
              endTime: new Date(), 
              completed: false,
              duration: Math.max(0, actualDuration) // Ensure duration is not negative
            }
          : s
      ));
    }
    
    // Reset timing references
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    
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
