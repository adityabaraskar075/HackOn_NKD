'use client';

import React, { createContext, useState, useContext, useCallback, type PropsWithChildren } from 'react';

// Define the shape of the context data
interface QspContextType {
  qspBalance: number;
  addQsp: (amount: number) => void;
  deductQsp: (amount: number) => boolean; // Returns true if successful
  resetQsp: () => void;
}

// Create the context
const QspContext = createContext<QspContextType | undefined>(undefined);

// Create the provider component
export function QspProvider({ children }: PropsWithChildren) {
  const [qspBalance, setQspBalance] = useState(0); // Start with 0 rewards

  const addQsp = useCallback((amount: number) => {
    if (amount > 0) {
      setQspBalance(prev => prev + amount);
    }
  }, []);
  
  const deductQsp = useCallback((amount: number) => {
    if (amount > 0 && qspBalance >= amount) {
        setQspBalance(prev => prev - amount);
        return true;
    }
    return false;
  }, [qspBalance]);

  const resetQsp = useCallback(() => {
    setQspBalance(0);
  }, []);

  const value = { qspBalance, addQsp, deductQsp, resetQsp };

  return (
    <QspContext.Provider value={value}>
      {children}
    </QspContext.Provider>
  );
}

// Create a custom hook to use the context
export function useQsp() {
  const context = useContext(QspContext);
  if (context === undefined) {
    throw new Error('useQsp must be used within a QspProvider');
  }
  return context;
}
