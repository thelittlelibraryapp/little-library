// ===== src/components/ui/textarea.tsx =====
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'cozy' | 'warm';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: 'border-slate-300 focus:border-amber-500 focus:ring-amber-500/20',
      cozy: 'border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 bg-amber-50/50',
      warm: 'border-stone-300 focus:border-stone-500 focus:ring-stone-500/20 bg-stone-50/50'
    };

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-xl border ${variants[variant]} focus:outline-none focus:ring-2 text-slate-900 placeholder-slate-400 transition-all duration-200 shadow-sm resize-none ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';