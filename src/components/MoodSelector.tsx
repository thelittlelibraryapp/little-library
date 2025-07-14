// ===== src/components/MoodSelector.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Coffee, Flower, Zap, Heart, Sparkles } from 'lucide-react';

export type MoodTheme = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  background: string;
  cardStyle: string;
  buttonStyle: string;
  textStyle: string;
  accentColor: string;
  decorativeElements: string;
};

const MOOD_THEMES: MoodTheme[] = [
  {
    id: 'cozy',
    name: 'Cozy Library',
    icon: <Coffee className="w-4 h-4" />,
    description: 'Warm autumn vibes',
    background: 'from-amber-50 via-orange-50 to-yellow-50',
    cardStyle: 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-amber-200/50',
    buttonStyle: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
    textStyle: 'text-amber-900',
    accentColor: 'amber',
    decorativeElements: 'from-amber-200/20 to-orange-300/20'
  },
  {
    id: 'midnight',
    name: 'Midnight Study',
    icon: <Moon className="w-4 h-4" />,
    description: 'Dark academia aesthetic',
    background: 'from-slate-900 via-purple-900 to-slate-900',
    cardStyle: 'bg-gradient-to-br from-slate-800/90 to-purple-900/90 border-purple-500/30',
    buttonStyle: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
    textStyle: 'text-purple-100',
    accentColor: 'purple',
    decorativeElements: 'from-purple-500/20 to-indigo-500/20'
  },
  {
    id: 'sunrise',
    name: 'Morning Glow',
    icon: <Sun className="w-4 h-4" />,
    description: 'Fresh morning energy',
    background: 'from-rose-50 via-orange-50 to-amber-50',
    cardStyle: 'bg-gradient-to-br from-rose-50/90 to-orange-50/90 border-rose-200/50',
    buttonStyle: 'bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600',
    textStyle: 'text-rose-900',
    accentColor: 'rose',
    decorativeElements: 'from-rose-300/20 to-orange-300/20'
  },
  {
    id: 'forest',
    name: 'Forest Retreat',
    icon: <Flower className="w-4 h-4" />,
    description: 'Natural tranquility',
    background: 'from-emerald-50 via-green-50 to-teal-50',
    cardStyle: 'bg-gradient-to-br from-emerald-50/90 to-green-50/90 border-emerald-200/50',
    buttonStyle: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    textStyle: 'text-emerald-900',
    accentColor: 'emerald',
    decorativeElements: 'from-emerald-300/20 to-teal-300/20'
  },
  {
    id: 'electric',
    name: 'Electric Dreams',
    icon: <Zap className="w-4 h-4" />,
    description: 'Vibrant cyber vibes',
    background: 'from-cyan-50 via-blue-50 to-indigo-50',
    cardStyle: 'bg-gradient-to-br from-cyan-50/90 to-blue-50/90 border-cyan-200/50',
    buttonStyle: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700',
    textStyle: 'text-cyan-900',
    accentColor: 'cyan',
    decorativeElements: 'from-cyan-300/20 to-blue-300/20'
  },
  {
    id: 'romance',
    name: 'Romance Novel',
    icon: <Heart className="w-4 h-4" />,
    description: 'Soft romantic feels',
    background: 'from-pink-50 via-rose-50 to-red-50',
    cardStyle: 'bg-gradient-to-br from-pink-50/90 to-rose-50/90 border-pink-200/50',
    buttonStyle: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700',
    textStyle: 'text-pink-900',
    accentColor: 'pink',
    decorativeElements: 'from-pink-300/20 to-rose-300/20'
  },
  {
    id: 'mystical',
    name: 'Mystical Realm',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Magical fantasy vibes',
    background: 'from-violet-50 via-purple-50 to-fuchsia-50',
    cardStyle: 'bg-gradient-to-br from-violet-50/90 to-purple-50/90 border-violet-200/50',
    buttonStyle: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
    textStyle: 'text-violet-900',
    accentColor: 'violet',
    decorativeElements: 'from-violet-300/20 to-purple-300/20'
  }
];

interface MoodSelectorProps {
  onMoodChange: (mood: MoodTheme) => void;
  currentMood: MoodTheme;
}

export const MoodSelector = ({ onMoodChange, currentMood }: MoodSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Mood Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${currentMood.buttonStyle} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline text-sm font-medium">{currentMood.name}</span>
        <span className="sm:hidden text-sm font-medium">Mood</span>
      </button>

      {/* Mood Options Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 z-50 p-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Choose Your Mood</h3>
              <p className="text-sm text-gray-600">Transform your library's vibe</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {MOOD_THEMES.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => {
                    onMoodChange(mood);
                    setIsOpen(false);
                  }}
                  className={`group relative p-4 rounded-xl transition-all duration-300 hover:scale-105 border-2 ${
                    currentMood.id === mood.id 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${mood.background.split(' ').slice(1).join(' ').replace(/from-|via-|to-/g, '').split('-').map(c => {
                      const colorMap: Record<string, string> = {
                        'amber': '#fef3c7',
                        'orange': '#fed7aa', 
                        'yellow': '#fef3c7',
                        'slate': '#f1f5f9',
                        'purple': '#f3e8ff',
                        'rose': '#ffe4e6',
                        'emerald': '#ecfdf5',
                        'green': '#f0fdf4',
                        'teal': '#f0fdfa',
                        'cyan': '#ecfeff',
                        'blue': '#eff6ff',
                        'indigo': '#eef2ff',
                        'pink': '#fdf2f8',
                        'red': '#fef2f2',
                        'violet': '#f5f3ff',
                        'fuchsia': '#fdf4ff'
                      };
                      return colorMap[c] || '#ffffff';
                    }).join(', ')})`,
                  }}
                >
                  {/* Selected indicator */}
                  {currentMood.id === mood.id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${mood.buttonStyle.split(' ')[1]} ${mood.buttonStyle.split(' ')[2]} flex items-center justify-center text-white`}>
                      {mood.icon}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm text-gray-800">{mood.name}</p>
                      <p className="text-xs text-gray-600">{mood.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 text-center">
                ✨ Moods change your background, colors, and overall vibe instantly!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { MOOD_THEMES };