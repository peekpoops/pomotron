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
  startTime: null,
};

export function useTimer() {
  const [timerState, setTimerState] = useLocalStorage<TimerState>('pomotron-timer-state', defaultTimerState);
  
  // Initialize settings first
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
    blockedSites: ['facebook.com', 'twitter.com', 'reddit.com', 'youtube.com', 'instagram.com'],
    showQuotes: true,
    soundsEnabled: true,
  });
  
  // Clean up timer state on mount to prevent session continuation
  useEffect(() => {
    // Don't interfere with the timer state at all on mount
    console.log('Component mounted - timer state:', { 
      isRunning: timerState.isRunning, 
      isPaused: timerState.isPaused, 
      timeLeft: timerState.timeLeft 
    });
  }, []); // Only run on mount
  const [sessions, setSessions] = useLocalStorage<Session[]>('pomotron-sessions', []);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeRef = useRef<number>(0);
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const { toast } = useToast();

  // Reset idle detection on user activity
  const resetIdleDetection = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleTimeRef.current = 0;
  }, []);

  // Start idle detection
  const startIdleDetection = useCallback(() => {
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    
    // Skip idle detection if timeout is 0 (disabled)
    if (settings.idleTimeout === 0) return;
    
    idleIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = (now - lastActivityRef.current) / 1000 / 60; // minutes
      
      if (timeSinceActivity >= settings.idleTimeout && timerState.isRunning && timerState.sessionType === 'focus') {
        toast({
          title: "Idle Detected",
          description: `You've been idle for ${settings.idleTimeout} minutes. Stay focused!`,
          duration: 5000,
        });
        playSound('idleNudge');
        resetIdleDetection();
      }
    }, 30000); // Check every 30 seconds
  }, [settings.idleTimeout, timerState.isRunning, timerState.sessionType, toast, resetIdleDetection]);

  // Stop idle detection
  const stopIdleDetection = useCallback(() => {
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    console.log('Timer effect triggered - isRunning:', timerState.isRunning, 'isPaused:', timerState.isPaused);
    if (timerState.isRunning && !timerState.isPaused) {
      console.log('Starting interval timer');
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeLeft = Math.max(0, prev.timeLeft - 1);
          console.log('Countdown tick:', newTimeLeft);
          
          if (newTimeLeft <= 0) {
            // Timer finished
            const isBreakNext = prev.sessionType === 'focus';
            const isLongBreak = prev.currentCycle >= settings.cyclesBeforeLongBreak && isBreakNext;
            
            let nextSessionType: 'focus' | 'break' | 'longBreak';
            let nextCycle = prev.currentCycle;
            
            if (isBreakNext) {
              nextSessionType = isLongBreak ? 'longBreak' : 'break';
              // Keep the same cycle during breaks - the cycle represents the focus session we just completed
            } else {
              nextSessionType = 'focus';
              if (prev.sessionType === 'longBreak') {
                nextCycle = 1; // Reset cycle after long break
              } else if (prev.sessionType === 'break') {
                nextCycle = prev.currentCycle + 1; // Increment cycle when starting new focus session after break
              }
            }
            
            // Save completed session
            if (prev.currentSessionId) {
              console.log('Completing session:', prev.currentSessionId, 'Session type:', prev.sessionType);
              // Use callback to avoid dependency issues
              setSessions(prevSessions => 
                prevSessions.map(s => 
                  s.id === prev.currentSessionId 
                    ? { ...s, endTime: new Date(), completed: true }
                    : s
                )
              );
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
            
            // Use ref to avoid dependency
            playSound('sessionComplete');
            
            // Handle website blocking
            if (nextSessionType === 'focus' && settings.websiteBlockingEnabled) {
              activateWebsiteBlocking(settings.blockedSites);
            } else {
              deactivateWebsiteBlocking();
            }
            
            toast({
              title: prev.sessionType === 'focus' ? 'Focus Session Complete!' : 'Break Complete!',
              description: nextSessionType === 'focus' ? 'Time for a break!' : 'Ready for the next focus session?',
              duration: 5000,
            });
            
            // Apply any pending timer config changes when session ends
            const pendingConfig = localStorage.getItem('pomotron-pending-timer-config');
            if (pendingConfig) {
              const parsedConfig = JSON.parse(pendingConfig);
              const currentSettings = JSON.parse(localStorage.getItem('pomotron-settings') || '{}');
              localStorage.setItem('pomotron-settings', JSON.stringify({
                ...currentSettings,
                ...parsedConfig,
              }));
              localStorage.removeItem('pomotron-pending-timer-config');
            }

            const newState = {
              ...prev,
              isRunning: false, // Always stop when session ends, regardless of autoStart
              isPaused: false,
              timeLeft: nextDuration,
              sessionType: nextSessionType,
              currentCycle: nextCycle,
              currentSessionId: undefined,
              currentIntention: nextSessionType === 'focus' ? { task: '', why: '' } : prev.currentIntention,
              startTime: null, // Always clear startTime when session ends
            };
            
            console.log('Session ended, timer stopped, new state:', newState);
            
            return newState;
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
      
      startIdleDetection();
    } else {
      console.log('Stopping interval timer');
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
  }, [timerState.isRunning, timerState.isPaused, settings.focusDuration, settings.breakDuration, settings.longBreakDuration, settings.cyclesBeforeLongBreak]);

  // Activity listeners for idle detection
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners to document for current tab activity
    events.forEach(event => {
      document.addEventListener(event, resetIdleDetection, true);
    });

    // Use Page Visibility API to detect when user switches tabs/windows
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to this tab, reset idle detection
        resetIdleDetection();
      }
    };

    // Use window focus/blur to detect when user switches windows
    const handleWindowFocus = () => {
      resetIdleDetection();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleDetection, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [resetIdleDetection]);

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

  // Update timer duration when settings change - only for stopped timers
  useEffect(() => {
    // Only update duration for stopped timers
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
      
      if (timerState.timeLeft !== newDuration) {
        setTimerState(prev => ({
          ...prev,
          timeLeft: newDuration,
        }));
      }
    }
  }, [settings.focusDuration, settings.breakDuration, settings.longBreakDuration, timerState.sessionType, timerState.isRunning, timerState.isPaused, timerState.timeLeft]);

  const startSession = useCallback((intention?: { task: string; why: string }) => {
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
      startTime: Date.now(),
    }));
    
    if (timerState.sessionType === 'focus' && settings.websiteBlockingEnabled) {
      activateWebsiteBlocking(settings.blockedSites);
    }
    
    playSound('start');
  }, [timerState, settings, setSessions]);

  const pauseSession = useCallback(() => {
    console.log('Pause button clicked');
    setTimerState(prev => {
      if (!prev.isRunning) {
        console.log('Timer not running, ignoring pause');
        return prev;
      }
      
      console.log('PAUSING - Before:', { isRunning: prev.isRunning, isPaused: prev.isPaused, timeLeft: prev.timeLeft });
      
      const newState = {
        ...prev,
        isRunning: false,
        isPaused: true,
        startTime: null,
      };
      
      console.log('PAUSING - After:', { isRunning: newState.isRunning, isPaused: newState.isPaused, timeLeft: newState.timeLeft });
      
      // Don't save to localStorage to avoid conflicts
      return newState;
    });
    
    deactivateWebsiteBlocking();
  }, []);

  const resumeSession = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isPaused) return prev;
      
      console.log('RESUMING - Before:', { isRunning: prev.isRunning, isPaused: prev.isPaused, timeLeft: prev.timeLeft });
      
      const newState = {
        ...prev,
        isRunning: true,
        isPaused: false,
        startTime: Date.now(),
      };
      
      // Save resumed state to localStorage immediately
      localStorage.setItem('pomotron-timer-state', JSON.stringify(newState));
      
      console.log('RESUMING - After:', { isRunning: newState.isRunning, isPaused: newState.isPaused, timeLeft: newState.timeLeft });
      return newState;
    });
    
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
    
    // Apply any pending timer config changes when session resets
    const pendingConfig = localStorage.getItem('pomotron-pending-timer-config');
    if (pendingConfig) {
      const parsedConfig = JSON.parse(pendingConfig);
      const currentSettings = JSON.parse(localStorage.getItem('pomotron-settings') || '{}');
      localStorage.setItem('pomotron-settings', JSON.stringify({
        ...currentSettings,
        ...parsedConfig,
      }));
      localStorage.removeItem('pomotron-pending-timer-config');
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
    
    const newTimerState = {
      ...timerState,
      isRunning: false,
      isPaused: false,
      timeLeft: duration,
      currentSessionId: undefined,
      startTime: null,
    };
    
    setTimerState(newTimerState);
    
    // Clear localStorage timer state immediately to prevent restoration
    localStorage.setItem('pomotron-timer-state', JSON.stringify(newTimerState));
    
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
    
    // Apply any pending timer config changes when session ends
    const pendingConfig = localStorage.getItem('pomotron-pending-timer-config');
    if (pendingConfig) {
      const parsedConfig = JSON.parse(pendingConfig);
      const currentSettings = JSON.parse(localStorage.getItem('pomotron-settings') || '{}');
      localStorage.setItem('pomotron-settings', JSON.stringify({
        ...currentSettings,
        ...parsedConfig,
      }));
      localStorage.removeItem('pomotron-pending-timer-config');
    }
    
    // Clear timer state completely and reset to focus session
    const newTimerState = {
      ...defaultTimerState,
      timeLeft: settings.focusDuration * 60,
      startTime: null,
      sessionType: 'focus' as const,
      currentCycle: 1,
      currentSessionId: undefined,
    };
    
    setTimerState(newTimerState);
    
    // Clear localStorage timer state immediately to prevent restoration
    localStorage.setItem('pomotron-timer-state', JSON.stringify(newTimerState));
    
    deactivateWebsiteBlocking();
    playSound('reset');
  }, [timerState.currentSessionId, settings.focusDuration, setSessions]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timerState,
    startSession,
    pauseSession,
    resumeSession,
    resetSession,
    endSession,
    formatTime,
    getProgress,
    sessions,
  };
}
