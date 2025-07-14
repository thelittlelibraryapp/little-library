// ===== src/contexts/MoodContext.tsx =====
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MoodTheme, MOOD_THEMES } from '@/components/MoodSelector';

interface MoodContextType {
  currentMood: MoodTheme;
  setMood: (mood: MoodTheme) => void;
  getMoodClasses: () => {
    background: string;
    cardStyle: string;
    buttonStyle: string;
    textStyle: string;
    accentColor: string;
  };
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const MoodProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentMood, setCurrentMood] = useState<MoodTheme>(MOOD_THEMES[0]); // Default to cozy
  const [isClient, setIsClient] = useState(false);

  // Load saved mood from localStorage only on client
  useEffect(() => {
    setIsClient(true);
    const savedMoodId = localStorage.getItem('library-mood');
    if (savedMoodId) {
      const savedMood = MOOD_THEMES.find(mood => mood.id === savedMoodId);
      if (savedMood) {
        setCurrentMood(savedMood);
      }
    }
  }, []);

  const setMood = (mood: MoodTheme) => {
    setCurrentMood(mood);
    if (isClient) {
      localStorage.setItem('library-mood', mood.id);
    }
  };

  const getMoodClasses = () => ({
    background: `bg-gradient-to-br ${currentMood.background}`,
    cardStyle: currentMood.cardStyle,
    buttonStyle: currentMood.buttonStyle,
    textStyle: currentMood.textStyle,
    accentColor: currentMood.accentColor,
  });

  return (
    <MoodContext.Provider value={{
      currentMood,
      setMood,
      getMoodClasses
    }}>
      {children}
    </MoodContext.Provider>
  );
};

export const useMood = () => {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
};