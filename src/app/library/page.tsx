'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Edit, Trash2, Share2, ExternalLink, Copy, Grid, Library, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddBookModal } from '@/components/AddBookModal';
import { EditBookModal } from '@/components/EditBookModal';
import { BookCard } from '@/components/BookCard';
import { Bookshelf } from '@/components/Bookshelf';

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
  const { user } = useAuth();
  const { currentMood, getMoodClasses } = useMood();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'shelf' | 'grid'>('shelf');

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

  const shareMyFreeBooks = () => {
    if (!user?.username) {
      alert('Username not found. Please contact support.');
      return;
    }

    const freeBooks = books.filter(book => book.is_free_to_good_home);
    if (freeBooks.length === 0) {
      alert('You don\'t have any books marked as "free to good home" yet. Mark some books as free to share them!');
      return;
    }

    const shareUrl = `${window.location.origin}/public/${user.username}`;
    const shareText = `Check out my free books! 📚 I'm giving away ${freeBooks.length} book${freeBooks.length !== 1 ? 's' : ''} to good homes.`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    
    // Also open Facebook share dialog
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    alert('Link copied to clipboard! Facebook share dialog opened.');
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const freeToGoodHomeCount = books.filter(book => book.is_free_to_good_home).length;

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="space-y-6">
          {/* Mobile-Optimized Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="text-center md:text-left">
              <h1 className={`text-2xl md:text-3xl font-bold ${moodClasses.textStyle}`}>My Library</h1>
              <p className={`${moodClasses.textStyle} opacity-70 text-sm md:text-base`}>
                Manage your book collection ({books.length} books)
              </p>
            </div>
            
            {/* Mobile actions */}
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-3">
              {freeToGoodHomeCount > 0 && (
                <button
                  onClick={shareMyFreeBooks}
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 text-sm md:text-base"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden md:inline">Share My Free Books ({freeToGoodHomeCount})</span>
                  <span className="md:hidden">Share Free Books ({freeToGoodHomeCount})</span>
                </button>
              )}
              
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`w-full md:w-auto ${moodClasses.buttonStyle} text-white px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 text-sm md:text-base`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </button>
            </div>
          </div>

          {/* Share Free Books Banner - Mobile Optimized */}
          {freeToGoodHomeCount > 0 && (
            <div className={`p-4 md:p-6 rounded-2xl shadow-xl border-l-4 border-l-blue-500 ${moodClasses.cardStyle}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1">
                  <h3 className={`text-base md:text-lg font-semibold ${moodClasses.textStyle} mb-2`}>
                    📚 You have {freeToGoodHomeCount} book{freeToGoodHomeCount !== 1 ? 's' : ''} marked as "Free to Good Home"
                  </h3>
                  <p className={`${moodClasses.textStyle} opacity-70 mb-3 text-sm md:text-base`}>
                    Share your collection on Facebook and let friends claim books directly - no more managing comments!
                  </p>
                  <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                    💡 Perfect for posting: "Cleaning out my bookshelf! Click to see what's available"
                  </div>
                </div>
                <div className="md:ml-6">
                  <button
                    onClick={shareMyFreeBooks}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 text-sm md:text-base"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share on Facebook</span>
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Search, Filters, and View Toggle */}
          <div className={`p-4 md:p-6 rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-${moodClasses.accentColor}-400`} />
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 md:py-3 border-2 border-${moodClasses.accentColor}-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${moodClasses.accentColor}-500 ${moodClasses.textStyle} placeholder-gray-400 bg-white/80 backdrop-blur-sm transition-all duration-200 text-sm md:text-base`}
                  />
                </div>
              </div>
              
              {/* Filters and View Toggle */}
              <div className="flex space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`px-3 py-2 md:px-4 md:py-3 border-2 border-${moodClasses.accentColor}-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${moodClasses.accentColor}-500 ${moodClasses.textStyle} bg-white/80 backdrop-blur-sm transition-all duration-200 text-sm md:text-base`}
                >
                  <option value="all">All Books</option>
                  <option value="available">Available</option>
                  <option value="checked_out">Borrowed</option>
                  <option value="overdue">Overdue</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('shelf')}
                    className={`px-3 py-2 md:px-4 md:py-3 flex items-center space-x-2 transition-all duration-200 ${
                      viewMode === 'shelf' 
                        ? `bg-${moodClasses.accentColor}-600 text-white` 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    <span className="hidden md:inline">Shelf</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 md:px-4 md:py-3 flex items-center space-x-2 transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? `bg-${moodClasses.accentColor}-600 text-white` 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span className="hidden md:inline">Grid</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Books Display */}
          {filteredBooks.length > 0 ? (
            <div className="transition-all duration-500">
              {viewMode === 'shelf' ? (
                <div className="overflow-x-auto">
                  <Bookshelf
                    books={filteredBooks}
                    onEdit={handleEditBook}
                    onDelete={handleDeleteBook}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
              )}
            </div>
          ) : (
            <div className={`p-8 text-center rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
              <BookOpen className={`w-16 h-16 text-${moodClasses.accentColor}-400 mx-auto mb-4 opacity-60`} />
              <h3 className={`text-lg font-semibold ${moodClasses.textStyle} mb-2`}>
                {searchTerm || filterStatus !== 'all' ? 'No books found' : 'No books yet'}
              </h3>
              <p className={`${moodClasses.textStyle} opacity-70 mb-4 text-sm md:text-base`}>
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