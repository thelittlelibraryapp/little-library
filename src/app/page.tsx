'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Users, Plus, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddBookModal } from '@/components/AddBookModal';
import { AlphaWarningCard } from '@/components/AlphaWarningCard';
import { EditBookModal } from '@/components/EditBookModal';
import { BookCard } from '@/components/BookCard';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  
  const [stats, setStats] = useState({
    totalBooks: 0,
    available: 0,
    borrowed: 0,
    lending: 0
  });

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Fetch books data
      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const books: Book[] = result.books || [];
        
        // Calculate real stats
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

      // Fetch borrow requests to show activity
      const response = await fetch(`/api/borrow/requests?userId=${user?.id}`);
      
      if (response.ok) {
        const result = await response.json();
        const requests = result.requests || [];
        
        // Transform requests into activity items
        const activities = requests
          .slice(0, 5) // Show only 5 most recent
          .map((request: any) => {
            if (request.borrowerId === user?.id) {
              // Outgoing request
              return {
                id: request.id,
                type: 'request_sent',
                message: `You requested "${request.bookTitle}" from ${request.ownerName}`,
                time: getTimeAgo(request.requestedAt),
                status: request.status
              };
            } else {
              // Incoming request
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

  // Helper function for time formatting
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

  // Load data on mount
  useEffect(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, [user?.id]);

  const handleBookAdded = (newBook: Book) => {
    console.log('Book added to dashboard:', newBook);
    // Refresh stats when a new book is added
    loadDashboardStats();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <AlphaWarningCard />

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome, {user?.firstName}! 📚
          </h1>
          <p className="text-blue-100">
            Your personal library is ready. You have {stats.available} books available to lend.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
              <p className="text-sm text-gray-600">Total Books</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.borrowed}</p>
              <p className="text-sm text-gray-600">Borrowed</p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.lending}</p>
              <p className="text-sm text-gray-600">Lending</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Book
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Invite Friends
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Search className="w-4 h-4 mr-2" />
                Browse Friends' Libraries
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {isLoadingActivity ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">{activity.time}</p>
                        {activity.status && (
                          <Badge variant={activity.status === 'approved' ? 'success' : activity.status === 'declined' ? 'danger' : 'warning'}>
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </Card>
        </div>

        {/* Add Book Modal */}
        <AddBookModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onBookAdded={handleBookAdded}
        />
      </div>
    </div>
  );
}