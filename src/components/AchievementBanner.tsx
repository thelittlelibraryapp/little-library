'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Gift, X } from 'lucide-react';

interface Achievement {
  id: string;
  type: string;
  name: string;
  icon: string;
  description: string;
  points: number;
  unlockedAt: string;
}

interface AchievementBannerProps {
  achievements: Achievement[];
}

export function AchievementBanner({ achievements }: AchievementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (achievements.length === 0) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [achievements.length]);

  if (!isVisible || achievements.length === 0) return null;

  const currentAchievement = achievements[currentIndex];

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-6 relative overflow-hidden">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{currentAchievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Achievement Unlocked!</span>
          </div>
          <h3 className="font-bold">{currentAchievement.name}</h3>
          <p className="text-sm opacity-90">{currentAchievement.description}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Gift className="w-3 h-3" />
            <span className="text-xs">+{currentAchievement.points} points</span>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}