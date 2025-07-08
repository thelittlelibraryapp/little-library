'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function AlphaWarningCard() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alpha-dashboard-warning-dismissed') !== 'true';
    }
    return true;
  });

  const dismissCard = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('alpha-dashboard-warning-dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="p-6 bg-red-50 border-red-200 border-2 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              ⚠️ Alpha Build Notice
            </h3>
            <div className="text-red-700 space-y-2">
              <p className="font-medium">This is an early development version with the following limitations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Data Loss Risk:</strong> Your books and friend connections may be deleted during updates</li>
                <li><strong>Feature Instability:</strong> Some functions may not work as expected</li>
                <li><strong>Frequent Changes:</strong> Interface and functionality will change without notice</li>
                <li><strong>No Data Backup:</strong> We do not guarantee data preservation</li>
              </ul>
              <p className="text-sm font-medium mt-3">
                📋 <strong>Recommendation:</strong> Use this for testing and feedback only. Do not rely on this for important book cataloging yet.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={dismissCard}
          className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0"
          title="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}