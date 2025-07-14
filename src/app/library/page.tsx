'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddBookModal } from '@/components/AddBookModal';
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

export default function LibraryPage() {
  const { currentMood, getMoodClasses } = useMood();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  const moodClasses = getMoodClasses();

  // Fetch books on component mount
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

      console.log('Books fetched:', result.books);
      setBooks(result.books || []);

    } catch (error: any) {
      console.error('Fetch books error:', error);
      setError(error.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAdded = (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => 
      b.id === updatedBook.id ? updatedBook : b
    ));
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
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
      console.log('Book deleted successfully');

    } catch (error: any) {
      console.error('Delete book error:', error);
      setError(error.message || 'Failed to delete book');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <BookOpen className={`w-12 h-12 text-${moodClasses.accentColor}-600 mx-auto mb-4 animate-pulse`} />
              <p className={`${moodClasses.textStyle} opacity-70`}>Loading your books...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${moodClasses.textStyle}`}>My Library</h1>
              <p className={`${moodClasses.textStyle} opacity-70`}>Manage your book collection ({books.length} books)</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`${moodClasses.buttonStyle} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={() => setError('')}
                className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className={`p-6 rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-${moodClasses.accentColor}-400`} />
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border-2 border-${moodClasses.accentColor}-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${moodClasses.accentColor}-500 ${moodClasses.textStyle} placeholder-gray-400 bg-white/80 backdrop-blur-sm transition-all duration-200`}
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-3 border-2 border-${moodClasses.accentColor}-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${moodClasses.accentColor}-500 ${moodClasses.textStyle} bg-white/80 backdrop-blur-sm transition-all duration-200`}
              >
                <option value="all">All Books</option>
                <option value="available">Available</option>
                <option value="checked_out">Borrowed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map(book => (
                <div key={book.id} data-book-id={book.id} className="transition-all duration-300 hover:scale-105">
                  <BookCard 
                    book={book} 
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-8 text-center rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
              <BookOpen className={`w-16 h-16 text-${moodClasses.accentColor}-400 mx-auto mb-4 opacity-60`} />
              <h3 className={`text-lg font-semibold ${moodClasses.textStyle} mb-2`}>
                {searchTerm || filterStatus !== 'all' ? 'No books found' : 'No books yet'}
              </h3>
              <p className={`${moodClasses.textStyle} opacity-70 mb-4`}>
                {searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "Start building your library by adding your first book"
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`${moodClasses.buttonStyle} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 mx-auto`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Book</span>
                </button>
              )}
            </div>
          )}

          {/* Add Book Modal */}
          <AddBookModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onBookAdded={handleBookAdded}
          />

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
      </div>
    </div>
  );
}