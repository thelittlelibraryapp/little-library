'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Grid, Library, Share2, Filter, Camera, FileText } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { AddBookModal } from '@/components/AddBookModal';
import { EditBookModal } from '@/components/EditBookModal';
import { BookCard } from '@/components/BookCard';
import { Bookshelf } from '@/components/Bookshelf';
import { ScanToAddBook } from '@/components/ScanToAddBook';
import { GoodreadsImport } from '@/components/GoodreadsImport';

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
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'shelf' | 'grid'>('grid');
  const [isUpdatingGenres, setIsUpdatingGenres] = useState(false);

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

  const handleBookScanned = () => {
    // Refresh the books list after scanning
    fetchBooks();
  };

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks(prev => prev.map(b =>
      b.id === updatedBook.id ? updatedBook : b
    ));
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

  const handleUpdateMissingGenres = async () => {
    if (!confirm('This will automatically fetch genres from Google Books for all books missing genre information. This may take a few minutes. Continue?')) {
      return;
    }

    setIsUpdatingGenres(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/books/update-genres', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update genres');
      }

      alert(`Genre update complete!\n\nUpdated: ${result.updatedCount} books\nFailed: ${result.failedCount} books\nTotal processed: ${result.totalProcessed} books`);

      // Refresh the books list
      await fetchBooks();

    } catch (error: any) {
      console.error('Genre update error:', error);
      alert(`Error updating genres: ${error.message}`);
    } finally {
      setIsUpdatingGenres(false);
    }
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

  const filterOptions = [
    { value: 'all', label: 'All', count: books.length },
    { value: 'available', label: 'Available', count: books.filter(b => b.status === 'available').length },
    { value: 'checked_out', label: 'Borrowed', count: books.filter(b => b.status === 'checked_out').length },
    { value: 'overdue', label: 'Overdue', count: books.filter(b => b.status === 'overdue').length },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${moodClasses.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your books...</p>
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
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-1">My Library</h1>
              <p className="text-slate-600">{books.length} books in your collection</p>
            </div>
            <div className="hidden lg:flex items-center space-x-3">
              {freeToGoodHomeCount > 0 && (
                <button
                  onClick={shareMyFreeBooks}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share Free Books ({freeToGoodHomeCount})</span>
                </button>
              )}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Import from Goodreads</span>
              </button>
              <button
                onClick={handleUpdateMissingGenres}
                disabled={isUpdatingGenres}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Automatically fetch missing genres from Google Books"
              >
                <FileText className="w-5 h-5" />
                <span>{isUpdatingGenres ? 'Updating...' : 'Update Genres'}</span>
              </button>
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Scan Book</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`${moodClasses.buttonStyle} text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2`}
              >
                <Plus className="w-5 h-5" />
                <span>Add Book</span>
              </button>
            </div>
          </div>

          {/* Free Books Quick Banner */}
          {freeToGoodHomeCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {freeToGoodHomeCount} book{freeToGoodHomeCount !== 1 ? 's' : ''} marked as free
                    </p>
                    <p className="text-sm text-slate-600">Share on Facebook to let friends claim them</p>
                  </div>
                </div>
                <button
                  onClick={shareMyFreeBooks}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 lg:hidden"
                >
                  Share
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter Bar - Sticky */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-0 lg:top-0 z-20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1">
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
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white shadow-sm text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('shelf')}
                    className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-all ${
                      viewMode === 'shelf'
                        ? 'bg-white shadow-sm text-slate-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    <span className="hidden sm:inline">Shelf</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    filterStatus === option.value
                      ? `${moodClasses.buttonStyle} text-white shadow-md`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
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
          <div>
            {viewMode === 'grid' ? (
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
              <Bookshelf
                books={filteredBooks}
                onEdit={handleEditBook}
                onDelete={handleDeleteBook}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No books found' : 'No books yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start building your library by adding your first book'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`${moodClasses.buttonStyle} text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all`}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Your First Book
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Buttons (Mobile) */}
      <button
        onClick={() => setIsScanModalOpen(true)}
        className="lg:hidden fixed bottom-36 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-30 flex items-center justify-center"
      >
        <Camera className="w-6 h-6" />
      </button>
      <button
        onClick={() => setIsAddModalOpen(true)}
        className={`lg:hidden fixed bottom-20 right-6 ${moodClasses.buttonStyle} text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-30 flex items-center justify-center`}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Goodreads Import Modal */}
      <GoodreadsImport
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          fetchBooks();
          setIsImportModalOpen(false);
        }}
      />

      {/* Scan Book Modal */}
      <ScanToAddBook
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onBookAdded={handleBookScanned}
      />

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
  );
}
