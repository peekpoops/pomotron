import { useState, useEffect, useCallback, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { useLocalStorage } from './useLocalStorage';
import { TimerState, Session, InsertSession, Settings } from '@/types';
import { playSound } from '@/lib/sounds';

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

    theme: 'starcourt',

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
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0); // Track total paused time
  const { toast } = useToast();





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
              currentIntention: prev.currentIntention,
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



  const startSession = useCallback((intention?: { task: string; why: string }) => {
    return Sentry.startSpan(
      {
        op: "pomodoro.session.start",
        name: `Start ${timerState.sessionType} session`,
      },
      (span) => {
        try {
          // Set precise start time when session begins
          startTimeRef.current = Date.now();
          pausedTimeRef.current = 0; // Reset paused time for new session
          const sessionId = crypto.randomUUID();
          const currentTime = new Date();
          
          const sessionDuration = timerState.sessionType === 'focus' ? settings.focusDuration * 60 : 
                       timerState.sessionType === 'break' ? settings.breakDuration * 60 : 
                       settings.longBreakDuration * 60;
          
          // Add attributes to the span
          span.setAttribute("session.type", timerState.sessionType);
          span.setAttribute("session.duration", sessionDuration);
          span.setAttribute("session.cycle", timerState.currentCycle);
          span.setAttribute("session.has_intention", !!(intention?.task));
          
          const newSession: Session = {
            id: sessionId,
            task: intention?.task || '',
            why: intention?.why || '',
            startTime: currentTime,
            duration: sessionDuration,
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
          
          playSound('start');
          
          Sentry.logger.info("Pomodoro session started", {
            sessionType: timerState.sessionType,
            duration: sessionDuration,
            cycle: timerState.currentCycle,
            hasIntention: !!(intention?.task)
          });
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  }, [timerState, settings, setSessions]);

  const pauseSession = useCallback(() => {
    return Sentry.startSpan(
      {
        op: "pomodoro.session.pause",
        name: "Pause session",
      },
      (span) => {
        try {
          // Calculate and store elapsed time before pausing
          if (startTimeRef.current) {
            const currentTime = Date.now();
            const elapsedSeconds = Math.floor((currentTime - startTimeRef.current) / 1000);
            pausedTimeRef.current += elapsedSeconds;
            startTimeRef.current = null;
            
            span.setAttribute("elapsed_seconds", elapsedSeconds);
            span.setAttribute("total_paused_time", pausedTimeRef.current);
          }
          
          setTimerState(prev => ({
            ...prev,
            isRunning: false,
            isPaused: true,
          }));
          
          Sentry.logger.info("Pomodoro session paused", {
            sessionType: timerState.sessionType,
            timeRemaining: timerState.timeLeft
          });
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  }, [timerState]);

  const resumeSession = useCallback(() => {
    // Reset start time to current time when resuming
    startTimeRef.current = Date.now();
    
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
    
    playSound('start');
  }, [timerState.sessionType, settings]);

  const resetSession = useCallback(() => {
    // Don't mark session as complete when resetting - just reset the timer
    // This preserves the current session and intention
    
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
      // Keep currentSessionId and currentIntention intact
    }));
    
    playSound('reset');
  }, [timerState.sessionType, settings]);

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
