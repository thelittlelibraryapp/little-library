import React from 'react';

interface BadgeProps {
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'cozy' | 'warm';
}

export const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    cozy: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300',
    warm: 'bg-gradient-to-r from-stone-100 to-amber-100 text-stone-800 border border-stone-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variants[variant]} shadow-sm`}>
      {children}
    </span>
  );
};