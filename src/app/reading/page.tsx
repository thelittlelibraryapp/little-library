'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Star, Calendar, Filter, Search, BookMarked } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { BookCard } from '@/components/BookCard';
import { EditBookModal } from '@/components/EditBookModal';

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
  // Reading tracking fields
  personalRating?: number | null;
  readStatus?: 'want-to-read' | 'currently-reading' | 'read' | null;
  readDate?: string | null;
  readingNotes?: string | null;
  tags?: string | null;
}

export default function ReadingPage() {
  const { user } = useAuth();
  const { currentMood, getMoodClasses } = useMood();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'want-to-read' | 'currently-reading' | 'read'>('all');
  const [error, setError] = useState('');

  const moodClasses = getMoodClasses();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch books');
      }

      setBooks(result.books || []);

    } catch (error: any) {
      console.error('Fetch books error:', error);
      setError(error.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks(prev => prev.map(b =>
      b.id === updatedBook.id ? updatedBook : b
    ));
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete book');
      }

      setBooks(prev => prev.filter(book => book.id !== bookId));

    } catch (error: any) {
      console.error('Delete book error:', error);
      setError(error.message || 'Failed to delete book');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.readStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const wantToReadCount = books.filter(b => b.readStatus === 'want-to-read').length;
  const currentlyReadingCount = books.filter(b => b.readStatus === 'currently-reading').length;
  const readCount = books.filter(b => b.readStatus === 'read').length;
  const totalTracked = wantToReadCount + currentlyReadingCount + readCount;

  const filterOptions = [
    { value: 'all' as const, label: 'All Tracked', count: totalTracked, color: 'bg-slate-600' },
    { value: 'want-to-read' as const, label: 'Want to Read', count: wantToReadCount, color: 'bg-blue-600' },
    { value: 'currently-reading' as const, label: 'Currently Reading', count: currentlyReadingCount, color: 'bg-green-600' },
    { value: 'read' as const, label: 'Read', count: readCount, color: 'bg-purple-600' },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${moodClasses.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your reading list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <BookMarked className="w-8 h-8 text-slate-900" />
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">My Reading</h1>
              </div>
              <p className="text-slate-600">Track what you want to read, are reading, and have read</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Tracked</p>
                  <p className="text-3xl font-bold text-slate-900">{totalTracked}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">Want to Read</p>
                  <p className="text-3xl font-bold text-blue-900">{wantToReadCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookMarked className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">Currently Reading</p>
                  <p className="text-3xl font-bold text-green-900">{currentlyReadingCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 mb-1">Read</p>
                  <p className="text-3xl font-bold text-purple-900">{readCount}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-0 lg:top-0 z-20">
            <div className="flex flex-col space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterStatus(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      filterStatus === option.value
                        ? `${option.color} text-white shadow-md`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Books Display */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookMarked className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No books found' : 'No tracked books yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start tracking books by editing them and setting a reading status'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBook(null);
        }}
        book={editingBook}
        onBookUpdated={handleBookUpdated}
      />
    </div>
  );
}
