'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Users, Plus, ArrowRight, Heart, Share2, Bell, Sparkles, Mail, Globe } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { AddBookModal } from '@/components/AddBookModal';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  publicationYear?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  status: 'available' | 'checked_out' | 'overdue' | 'borrowed' | 'return_pending';
  addedAt: string;
  borrower?: string;
  dueDate?: string;
  borrowedBy?: string;
  borrowerName?: string;
  is_free_to_good_home?: boolean;
  delivery_method?: 'pickup' | 'mail' | 'both';
  claimed_by_user_id?: string;
  claimed_at?: string;
  claim_expires_at?: string;
  transfer_status?: 'none' | 'pending' | 'completed';
  transfer_id?: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentMood, getMoodClasses } = useMood();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const [stats, setStats] = useState({
    totalBooks: 0,
    available: 0,
    borrowed: 0,
    lending: 0
  });

  const moodClasses = getMoodClasses();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const books: Book[] = result.books || [];

        const totalBooks = books.length;
        const available = books.filter((book: Book) => book.status === 'available').length;
        const borrowed = books.filter((book: Book) => book.status === 'borrowed' || book.status === 'checked_out').length;
        const lending = books.filter((book: Book) => book.borrowedBy).length;

        setStats({ totalBooks, available, borrowed, lending });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  // Load recent activity
  const loadRecentActivity = async () => {
    try {
      setIsLoadingActivity(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/borrow/requests?userId=${user?.id}`);

      if (response.ok) {
        const result = await response.json();
        const requests = result.requests || [];

        const activities = requests
          .slice(0, 3)
          .map((request: any) => {
            if (request.borrowerId === user?.id) {
              return {
                id: request.id,
                type: 'request_sent',
                message: `You requested "${request.bookTitle}" from ${request.ownerName}`,
                time: getTimeAgo(request.requestedAt),
                status: request.status
              };
            } else {
              return {
                id: request.id,
                type: 'request_received',
                message: `${request.borrowerName} requested "${request.bookTitle}"`,
                time: getTimeAgo(request.requestedAt),
                status: request.status
              };
            }
          });

        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d ago';
    return `${diffInDays}d ago`;
  };

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, [user?.id]);

  const handleBookAdded = (newBook: Book) => {
    console.log('Book added to dashboard:', newBook);
    loadDashboardStats();
  };

  // Landing Page for Visitors
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Navigation Bar */}
          <nav className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-7 h-7 text-amber-600" />
                  <span className="text-xl font-bold text-amber-900">My Little Library</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-amber-700 hover:text-amber-900 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    Get Started Free
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text */}
              <div>
                <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Free Forever</span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold text-amber-950 mb-6 leading-tight">
                  Share books with friends, build community
                </h1>

                <p className="text-xl text-amber-800 mb-8 leading-relaxed">
                  The easiest way to lend books to friends, share your collection, and keep track of what's out there.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-amber-50 text-amber-900 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-amber-200"
                  >
                    <span>See How It Works</span>
                  </a>
                </div>

                <div className="flex items-center space-x-6 text-sm text-amber-700">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Always free</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Easy setup</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-amber-200/50 backdrop-blur-sm">
                  {/* Mock Library View */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-amber-900">My Library</h3>
                      <span className="text-sm text-amber-600 font-medium">12 books</span>
                    </div>

                    {/* Mock Book Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "available" },
                        { title: "1984", author: "George Orwell", status: "lent" },
                        { title: "To Kill a Mockingbird", author: "Harper Lee", status: "available" },
                        { title: "Pride and Prejudice", author: "Jane Austen", status: "available" }
                      ].map((book, i) => (
                        <div key={i} className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/50">
                          <div className="w-full h-24 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg mb-3 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                          <p className="font-medium text-amber-900 text-sm line-clamp-1">{book.title}</p>
                          <p className="text-xs text-amber-700 opacity-70 line-clamp-1">{book.author}</p>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${book.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                              {book.status === 'available' ? 'Available' : 'Lent to friend'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-amber-200/50 animate-bounce">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">New request!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-amber-950 mb-4">Everything you need to share books</h2>
              <p className="text-xl text-amber-700">Simple, powerful features designed for book lovers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-200/50 hover:shadow-xl transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-amber-950 mb-2">Manage Your Library</h3>
                <p className="text-amber-700">
                  Add books easily, track what you own, and organize your collection in beautiful grid or shelf views.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-200/50 hover:shadow-xl transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-purple-950 mb-2">Lend to Friends</h3>
                <p className="text-purple-700">
                  Friends can browse your library and request to borrow books. You approve, set due dates, and track returns.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl border border-emerald-200/50 hover:shadow-xl transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-950 mb-2">Give Books Away</h3>
                <p className="text-emerald-700">
                  Mark books as "free to good home" and share a public link. Perfect for decluttering and spreading the love of reading!
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-200/50 hover:shadow-xl transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-950 mb-2">Share Publicly</h3>
                <p className="text-blue-700">
                  Get a shareable link to your free books page. Post to Facebook, email to friends, or share however you like!
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-200/50 hover:shadow-xl transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-orange-950 mb-2">Get Notified</h3>
                <p className="text-orange-700">
                  Never miss a request! Get notifications when friends want to borrow, books are claimed, or returns are due.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-8 rounded-2xl border border-pink-200/50 hover:shadow-xl transition-all duration-200">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-pink-950 mb-2">Mood Themes</h3>
                <p className="text-pink-700">
                  Choose from 7 beautiful themes to personalize your library. From cozy to energetic, find your vibe!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-amber-950 mb-4">How it works</h2>
              <p className="text-xl text-amber-700">Get started in minutes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-semibold text-amber-950 mb-3">Create Your Account</h3>
                <p className="text-amber-700">
                  Sign up free in seconds. No credit card required, no hidden fees, ever.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-semibold text-amber-950 mb-3">Add Your Books</h3>
                <p className="text-amber-700">
                  Enter your books manually or scan ISBN codes. Build your digital library in minutes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-semibold text-amber-950 mb-3">Start Sharing</h3>
                <p className="text-amber-700">
                  Invite friends, lend books, or share your free books with the world. It's that easy!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to start sharing books?
            </h2>
            <p className="text-xl text-amber-50 mb-8">
              Join My Little Library today and connect with friends through the books you love.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center space-x-2 bg-white hover:bg-amber-50 text-amber-900 px-8 py-4 rounded-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-200 hover:scale-105"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-amber-100 mt-4 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-white font-semibold underline hover:no-underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-amber-950 text-amber-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                  <span className="text-lg font-bold text-white">My Little Library</span>
                </div>
                <p className="text-amber-300 text-sm">
                  Share books with friends, build community, and keep the joy of reading alive.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                  <li><Link href="/auth/login" className="hover:text-white transition-colors">Log In</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Connect</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>mylittlelibrary.app</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-amber-800 mt-8 pt-8 text-center text-sm text-amber-400">
              <p>&copy; 2025 My Little Library. Made with ❤️ for book lovers.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-800 opacity-70">Loading...</p>
        </div>
      </div>
    );
  }

  // Dashboard for logged-in users
  return (
    <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Hero Section - Clean & Minimal */}
        <div className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2">
            {getGreeting()}, {user?.firstName}
          </h1>
          <p className="text-lg text-slate-600">
            Welcome back to your library
          </p>
        </div>

        {/* Stats Grid - Clean Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          <Link href="/library" className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <BookOpen className="w-8 h-8 text-slate-400 mb-3" />
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalBooks}</p>
              <p className="text-sm text-slate-600">Total Books</p>
            </div>
          </Link>

          <Link href="/library" className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.available}</p>
              <p className="text-sm text-slate-600">Available</p>
            </div>
          </Link>

          <Link href="/lending" className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <Clock className="w-8 h-8 text-amber-500 mb-3" />
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.borrowed}</p>
              <p className="text-sm text-slate-600">Borrowed</p>
            </div>
          </Link>

          <Link href="/lending" className="group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <Users className="w-8 h-8 text-purple-500 mb-3" />
              <p className="text-3xl font-bold text-slate-900 mb-1">{stats.lending}</p>
              <p className="text-sm text-slate-600">Lending</p>
            </div>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Actions</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`${moodClasses.buttonStyle} text-white p-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-between group`}
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-semibold">Add Book</p>
                      <p className="text-sm opacity-90">Grow your collection</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <Link href="/library">
                  <button className="w-full bg-slate-100 text-slate-700 p-6 rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-6 h-6" />
                      <div className="text-left">
                        <p className="font-semibold">View Library</p>
                        <p className="text-sm opacity-70">Browse your books</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>

                <Link href="/friends">
                  <button className="w-full bg-slate-100 text-slate-700 p-6 rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6" />
                      <div className="text-left">
                        <p className="font-semibold">Friends</p>
                        <p className="text-sm opacity-70">Manage connections</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>

                <Link href="/lending">
                  <button className="w-full bg-slate-100 text-slate-700 p-6 rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-6 h-6" />
                      <div className="text-left">
                        <p className="font-semibold">Lending</p>
                        <p className="text-sm opacity-70">Track requests</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <Link href="/lending" className="text-sm text-slate-500 hover:text-slate-700">View all</Link>
            </div>

            {isLoadingActivity ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed">{activity.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-slate-500">{activity.time}</p>
                        {activity.status && (
                          <Badge variant={
                            activity.status === 'approved' ? 'success' :
                            activity.status === 'declined' ? 'danger' : 'warning'
                          }>
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className={`lg:hidden fixed bottom-20 right-6 ${moodClasses.buttonStyle} text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-30 flex items-center justify-center`}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBookAdded={handleBookAdded}
      />
    </div>
  );
}
