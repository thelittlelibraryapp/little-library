import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'cozy' | 'glass' | 'warm';
}

export const Card = ({ children, className = '', variant = 'default' }: CardProps) => {
  const variants = {
    default: 'bg-white rounded-2xl shadow-lg border border-slate-200/50',
    elevated: 'bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/50 hover:border-slate-300/50',
    cozy: 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 rounded-2xl shadow-lg border border-amber-200/50 backdrop-blur-sm',
    glass: 'bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20',
    warm: 'bg-gradient-to-br from-stone-50 to-amber-50 rounded-2xl shadow-lg border border-stone-200/50'
  };

  return (
    <div className={`${variants[variant]} transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
};