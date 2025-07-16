'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { BookOpen, User, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(formData.email, formData.password);
      router.push('/'); // Redirect to dashboard after login
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-amber-600 hover:text-amber-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Little Library</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-amber-900">My Little Library</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-amber-800 mb-2">Welcome back!</h2>
          <p className="text-amber-700 opacity-80">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-amber-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-amber-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-amber-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-amber-400"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-amber-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-amber-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-amber-400"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-amber-400 disabled:to-orange-400 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-amber-700 opacity-80 text-sm">
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="font-medium text-amber-600 hover:text-amber-700 transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}