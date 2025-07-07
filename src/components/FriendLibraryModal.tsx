'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { BookCard } from './BookCard';

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  bookCount: number;
  availableBooks: number;
  friendshipDate: string;
}

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

interface FriendLibraryModalProps {
  friend: Friend | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FriendLibraryModal({ friend, isOpen, onClose }: FriendLibraryModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'author'>('added');

  useEffect(() => {
    if (friend && isOpen) {
      loadFriendBooks();
    }
  }, [friend, isOpen]);

  const loadFriendBooks = async () => {
    if (!friend) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/books/user/${friend.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Failed to load friend books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort and filter books
  const sortedAndFilteredBooks = books
    .filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'added':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{friend?.firstName}'s Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No available books</h3>
            <p className="text-gray-600">{friend?.firstName} has no books available for borrowing right now.</p>
          </div>
        ) : (
          <>
            {/* Search and Sort Bar */}
            <div className="mb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'added' | 'title' | 'author')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="added">Newest First</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
              </select>
            </div>

            {/* Books Grid - NOW USING ENHANCED BOOKCARD */}
            {sortedAndFilteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books match your search</h3>
                <p className="text-gray-600">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedAndFilteredBooks.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    isOwner={false}  // CRITICAL: Tell component this is friend's view
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}