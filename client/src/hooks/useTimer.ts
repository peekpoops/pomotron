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
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.timeLeft <= 1) {
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
              title: prev.sessionType === 'focus' ? 'Focus Session Complete!' : 'Break Complete!',
              description: nextSessionType === 'focus' ? 'Time for a break!' : 'Ready for the next focus session?',
              duration: 5000,
            });
            
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
          
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      
      startIdleDetection();
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
  }, [timerState.isRunning, timerState.isPaused, settings, sessions, setSessions, toast, startIdleDetection, stopIdleDetection]);

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

  // Update timer duration when settings change - applies immediately regardless of timer state
  useEffect(() => {
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
    
    // For stopped timers, update to full new duration
    if (!timerState.isRunning && !timerState.isPaused) {
      if (timerState.timeLeft !== newDuration) {
        setTimerState(prev => ({
          ...prev,
          timeLeft: newDuration,
        }));
      }
    }
    // For running timers, adjust proportionally to maintain progress
    else if (timerState.isRunning || timerState.isPaused) {
      const currentProgress = getProgress();
      const adjustedTimeLeft = Math.round(newDuration * (1 - currentProgress / 100));
      
      if (adjustedTimeLeft !== timerState.timeLeft && adjustedTimeLeft > 0) {
        setTimerState(prev => ({
          ...prev,
          timeLeft: adjustedTimeLeft,
        }));
      }
    }
  }, [settings.focusDuration, settings.breakDuration, settings.longBreakDuration, timerState.sessionType, timerState.isRunning, timerState.isPaused, timerState.timeLeft, getProgress]);

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
