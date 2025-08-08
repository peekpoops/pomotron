import { useState, useCallback } from 'react';

type LoadingType = 'initial' | 'timer-start' | 'data-sync' | 'transition';

interface LoadingState {
  isLoading: boolean;
  type: LoadingType;
  duration: number;
}

export function useLoading() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    type: 'initial',
    duration: 3000
  });

  const startLoading = useCallback((
    type: LoadingType = 'initial',
    duration: number = 3000
  ) => {
    setLoadingState({
      isLoading: true,
      type,
      duration
    });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  const showInitialLoading = useCallback((duration = 3000) => {
    startLoading('initial', duration);
  }, [startLoading]);

  const showTimerStartLoading = useCallback((duration = 1500) => {
    startLoading('timer-start', duration);
  }, [startLoading]);

  const showDataSyncLoading = useCallback((duration = 2000) => {
    startLoading('data-sync', duration);
  }, [startLoading]);

  const showTransitionLoading = useCallback((duration = 1000) => {
    startLoading('transition', duration);
  }, [startLoading]);

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    showInitialLoading,
    showTimerStartLoading,
    showDataSyncLoading,
    showTransitionLoading
  };
}