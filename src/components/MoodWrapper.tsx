'use client';

import React, { useEffect } from 'react';
import { useMood } from '@/contexts/MoodContext';

export const MoodWrapper = ({ children }: { children: React.ReactNode }) => {
  const { currentMood } = useMood();

  useEffect(() => {
    document.documentElement.setAttribute('data-mood', currentMood.id);
  }, [currentMood.id]);

  return <>{children}</>;
};