'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Users, Plus, ArrowRight } from 'lucide-react';
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
  const { user } = useAuth();
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
