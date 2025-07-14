'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Users, Plus, Search, Coffee, Heart, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddBookModal } from '@/components/AddBookModal';
import { AlphaWarningCard } from '@/components/AlphaWarningCard';


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
          .slice(0, 5)
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
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <AlphaWarningCard />

          {/* Hero Welcome Section */}
          <div className="relative overflow-hidden">
            <div className={`p-8 border-0 shadow-2xl rounded-2xl transition-all duration-200 ${moodClasses.cardStyle}`}>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative">
                    <Coffee className={`w-8 h-8 text-${moodClasses.accentColor}-600`} />
                    <div className={`absolute -top-1 -right-1 w-3 h-3 bg-${moodClasses.accentColor}-400 rounded-full animate-pulse`}></div>
                  </div>
                  <div>
                    <h1 className={`text-3xl font-bold ${moodClasses.textStyle}`}>
                      {getGreeting()}, {user?.firstName}!
                    </h1>
                    <p className={`${moodClasses.textStyle} opacity-80 text-lg`}>
                      Welcome to your personal reading sanctuary
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-2">
                    <p className={`${moodClasses.textStyle} font-medium`}>Your Library at a Glance</p>
                    <p className={`${moodClasses.textStyle} opacity-70`}>
                      You have <span className={`font-semibold ${moodClasses.textStyle}`}>{stats.totalBooks}</span> books in your collection
                    </p>
                    <p className={`${moodClasses.textStyle} opacity-70`}>
                      <span className="font-semibold text-emerald-700">{stats.available}</span> ready to lend
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className={`${moodClasses.buttonStyle} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add New Book</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Decorative book spines */}
              <div className="absolute top-0 right-0 opacity-10">
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-4 h-24 bg-gradient-to-b ${
                      ['from-red-400 to-red-600', 'from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-purple-400 to-purple-600', 'from-orange-400 to-orange-600'][i-1]
                    } rounded-sm`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* TOTAL BOOKS CARD */}
            <div className={`p-6 group hover:scale-105 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl ${moodClasses.cardStyle}`}>
              <div className="text-center">
                <div className="relative mx-auto w-12 h-12 mb-4">
                  <BookOpen className={`w-12 h-12 text-${moodClasses.accentColor}-600 group-hover:text-${moodClasses.accentColor}-700 transition-colors`} />
                  <div className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-${moodClasses.accentColor}-400 to-orange-500 rounded-full flex items-center justify-center`}>
                    <Star className="w-2 h-2 text-white" />
                  </div>
                </div>
                <p className={`text-3xl font-bold bg-gradient-to-r from-${moodClasses.accentColor}-600 to-orange-600 bg-clip-text text-transparent`}>
                  {stats.totalBooks}
                </p>
                <p className="text-sm text-slate-600 font-medium">Total Books</p>
                <p className="text-xs text-slate-500 mt-1">Your collection</p>
              </div>
            </div>

            <div className={`p-6 group hover:scale-105 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl ${moodClasses.cardStyle}`}>
              <div className="text-center">
                <div className="relative mx-auto w-12 h-12 mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                    <Heart className="w-2 h-2 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {stats.available}
                </p>
                <p className="text-sm text-slate-600 font-medium">Available</p>
                <p className="text-xs text-slate-500 mt-1">Ready to share</p>
              </div>
            </div>

            <div className={`p-6 group hover:scale-105 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl ${moodClasses.cardStyle}`}>
              <div className="text-center">
                <div className="relative mx-auto w-12 h-12 mb-4">
                  <Clock className={`w-12 h-12 text-${moodClasses.accentColor}-600 group-hover:text-${moodClasses.accentColor}-700 transition-colors`} />
                  <div className={`absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-${moodClasses.accentColor}-400 to-yellow-500 rounded-full flex items-center justify-center`}>
                    <TrendingUp className="w-2 h-2 text-white" />
                  </div>
                </div>
                <p className={`text-3xl font-bold bg-gradient-to-r from-${moodClasses.accentColor}-600 to-yellow-600 bg-clip-text text-transparent`}>
                  {stats.borrowed}
                </p>
                <p className="text-sm text-slate-600 font-medium">Borrowed</p>
                <p className="text-xs text-slate-500 mt-1">Currently out</p>
              </div>
            </div>

            <div className={`p-6 group hover:scale-105 transition-all duration-300 rounded-2xl shadow-xl hover:shadow-2xl ${moodClasses.cardStyle}`}>
              <div className="text-center">
                <div className="relative mx-auto w-12 h-12 mb-4">
                  <Users className="w-12 h-12 text-purple-600 group-hover:text-purple-700 transition-colors" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-2 h-2 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stats.lending}
                </p>
                <p className="text-sm text-slate-600 font-medium">Lending</p>
                <p className="text-xs text-slate-500 mt-1">Sharing joy</p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`p-8 rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 ${moodClasses.buttonStyle} rounded-xl flex items-center justify-center`}>
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-xl font-semibold ${moodClasses.textStyle}`}>Quick Actions</h2>
              </div>
              <div className="space-y-4">
                <button
                  className={`w-full justify-start text-left group p-4 rounded-xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle} border-2 border-transparent hover:border-${moodClasses.accentColor}-200`}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${moodClasses.buttonStyle} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${moodClasses.textStyle}`}>Add New Book</p>
                      <p className={`text-xs ${moodClasses.textStyle} opacity-60`}>Expand your collection</p>
                    </div>
                  </div>
                </button>
                
                <button className={`w-full justify-start text-left group p-4 rounded-xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle} border-2 border-transparent hover:border-${moodClasses.accentColor}-200`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${moodClasses.textStyle}`}>Invite Friends</p>
                      <p className={`text-xs ${moodClasses.textStyle} opacity-60`}>Share the reading love</p>
                    </div>
                  </div>
                </button>
                
                <button className={`w-full justify-start text-left group p-4 rounded-xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle} border-2 border-transparent hover:border-${moodClasses.accentColor}-200`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${moodClasses.textStyle}`}>Browse Friends' Libraries</p>
                      <p className={`text-xs ${moodClasses.textStyle} opacity-60`}>Discover new reads</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className={`p-8 rounded-2xl shadow-xl bg-white/80 backdrop-blur-md border border-white/20`}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Recent Activity</h2>
              </div>
              
              {isLoadingActivity ? (
                <div className="text-center py-8">
                  <div className={`w-8 h-8 border-2 border-${moodClasses.accentColor}-600 border-t-transparent rounded-full animate-spin mx-auto`}></div>
                  <p className="text-slate-500 mt-2 text-sm">Loading activity...</p>
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-200">
                      <div className={`w-2 h-2 bg-gradient-to-r from-${moodClasses.accentColor}-500 to-orange-600 rounded-full mt-2 flex-shrink-0 animate-pulse`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{activity.message}</p>
                        <div className="flex items-center space-x-3 mt-1">
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
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No recent activity</p>
                  <p className="text-slate-400 text-xs mt-1">Your reading journey starts here</p>
                </div>
              )}
            </div>
          </div>

          {/* Inspirational Quote Section */}
          <div className={`p-8 text-center rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
            <div className="max-w-2xl mx-auto">
              <div className={`w-16 h-16 ${moodClasses.buttonStyle} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <blockquote className={`text-xl font-medium ${moodClasses.textStyle} mb-3`}>
                "A room without books is like a body without a soul."
              </blockquote>
              <p className={`${moodClasses.textStyle} opacity-70 text-sm`}>— Marcus Tullius Cicero</p>
            </div>
          </div>

          {/* Add Book Modal */}
          <AddBookModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onBookAdded={handleBookAdded}
          />
        </div>
      </div>
    </div>
  );
}