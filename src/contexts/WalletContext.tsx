'use client';

import React, { createContext, useState, useContext, useCallback, type PropsWithChildren } from 'react';

// Define the shape of the context data
interface WalletContextType {
  balance: number;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => boolean; // Returns true if successful
}

// Create the context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Create the provider component
export function WalletProvider({ children }: PropsWithChildren) {
  const [balance, setBalance] = useState(40.00); // Initial mock balance

  const addBalance = useCallback((amount: number) => {
    if (amount > 0) {
      setBalance(prev => prev + amount);
    }
  }, []);
  
  const deductBalance = useCallback((amount: number) => {
    if (amount > 0 && balance >= amount) {
        setBalance(prev => prev - amount);
        return true;
    }
    return false;
  }, [balance]);

  const value = { balance, addBalance, deductBalance };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Create a custom hook to use the context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
