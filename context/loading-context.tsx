'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import LoadingOverlay from '@/components/loading-overlay';

interface LoadingContextType {
  isLoading: boolean;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const countRef = useRef(0);

  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    countRef.current += 1;
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      countRef.current = Math.max(0, countRef.current - 1);
      if (countRef.current === 0) {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, withLoading }}>
      {children}
      <LoadingOverlay visible={isLoading} />
    </LoadingContext.Provider>
  );
}
