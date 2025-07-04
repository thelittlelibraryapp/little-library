'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from './AuthForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
return <>{children}</>;
  //if (!user) {
  //  return <AuthForm />;
 // }

//  return <>{children}</>;
}