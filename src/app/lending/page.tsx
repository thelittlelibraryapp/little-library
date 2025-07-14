'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function LendingPage() {
  const { user } = useAuth();
  const { currentMood, getMoodClasses } = useMood();
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [lentBooks, setLentBooks] = useState<Book[]>([]);
  const [isLoadingBorrowed, setIsLoadingBorrowed] = useState(true);
  const [isLoadingLent, setIsLoadingLent] = useState(true);

  const moodClasses = getMoodClasses();

  useEffect(() => {
    if (user?.id) {
      loadBorrowedBooks();
      loadLentBooks();
    }
  }, [user?.id]);

  const loadBorrowedBooks = async () => {
    try {
      setIsLoadingBorrowed(true);
      // This would need a new API endpoint or modification to existing ones
      // For now, we'll use borrow requests that are approved
      const response = await fetch(`/api/borrow/requests?userId=${user?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter for books user is borrowing (approved requests where user is borrower)
        const userBorrowedBooks = data.requests
          .filter((req: any) => req.borrowerId === user?.id && req.status === 'approved')
          .map((req: any) => ({
            id: req.bookId,
            title: req.bookTitle,
            author: req.bookAuthor,
            status: 'borrowed',
            ownerName: req.ownerName,
            ownerId: req.ownerId,
            dueDate: req.dueDate,
            borrowedAt: req.requestedAt,
            addedAt: req.requestedAt
          }));
        
        setBorrowedBooks(userBorrowedBooks);
      }
    } catch (error) {
      console.error('Failed to load borrowed books:', error);
    } finally {
      setIsLoadingBorrowed(false);
    }
  };

  const loadLentBooks = async () => {
    try {
      setIsLoadingLent(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Get books from user's library that are currently borrowed
      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const books: Book[] = result.books || [];
        
        // Filter for books that are currently lent out
        const lentOutBooks = books.filter(book => 
          book.status === 'borrowed' || book.status === 'return_pending'
        );
        
        setLentBooks(lentOutBooks);
      }
    } catch (error) {
      console.error('Failed to load lent books:', error);
    } finally {
      setIsLoadingLent(false);
    }
  };

  const handleMarkAsReturned = async (bookId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${bookId}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        // Refresh both lists
        loadBorrowedBooks();
        loadLentBooks();
      } else {
        console.error('Failed to mark book as returned');
      }
    } catch (error) {
      console.error('Error marking book as returned:', error);
    }
  };

  const handleConfirmReturn = async (bookId: string, borrowerName: string, bookTitle: string) => {
    const isConfirmed = confirm(
      `Are you sure ${borrowerName} returned "${bookTitle}"?`
    );
    
    if (!isConfirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${bookId}/confirm-return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        // Refresh lent books list
        loadLentBooks();
      } else {
        console.error('Failed to confirm book return');
      }
    } catch (error) {
      console.error('Error confirming book return:', error);
    }
  };

  return (
    <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-bold ${moodClasses.textStyle}`}>Lending & Borrowing</h1>
              <p className={`${moodClasses.textStyle} opacity-70`}>Track your book exchanges with friends</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Books I'm Borrowing */}
            <div>
              <h2 className={`text-lg font-semibold ${moodClasses.textStyle} mb-4 flex items-center`}>
                <BookOpen className={`w-5 h-5 text-${moodClasses.accentColor}-600 mr-2`} />
                Books I'm Borrowing ({borrowedBooks.length})
              </h2>
              
              {isLoadingBorrowed ? (
                <div className="text-center py-8">
                  <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${moodClasses.accentColor}-600 mx-auto`}></div>
                  <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading borrowed books...</p>
                </div>
              ) : borrowedBooks.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
                  <BookOpen className={`w-16 h-16 text-${moodClasses.accentColor}-300 mx-auto mb-4 opacity-60`} />
                  <h3 className={`text-lg font-medium ${moodClasses.textStyle} mb-2`}>No borrowed books</h3>
                  <p className={`${moodClasses.textStyle} opacity-70`}>Books you're borrowing from friends will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {borrowedBooks.map((book) => (
                    <div key={book.id} className={`p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`font-medium ${moodClasses.textStyle} mb-1`}>{book.title}</h3>
                          <p className={`text-sm ${moodClasses.textStyle} opacity-60 mb-2`}>by {book.author}</p>
                          <p className={`text-sm ${moodClasses.textStyle} opacity-70 mb-2`}>
                            Borrowed from {(book as any).ownerName}
                          </p>
                          
                          {book.dueDate && (
                            <div className={`flex items-center text-sm ${moodClasses.textStyle} opacity-60 mb-3`}>
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(book.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className={`text-xs ${moodClasses.textStyle} opacity-40`}>
                            Borrowed {new Date(book.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <button
                            onClick={() => handleMarkAsReturned(book.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark as Returned</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Books I've Lent Out */}
            <div>
              <h2 className={`text-lg font-semibold ${moodClasses.textStyle} mb-4 flex items-center`}>
                <Users className="w-5 h-5 text-purple-600 mr-2" />
                Books I've Lent Out ({lentBooks.length})
              </h2>
              
              {isLoadingLent ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading lent books...</p>
                </div>
              ) : lentBooks.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
                  <Users className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-60" />
                  <h3 className={`text-lg font-medium ${moodClasses.textStyle} mb-2`}>No books lent out</h3>
                  <p className={`${moodClasses.textStyle} opacity-70`}>Books you've lent to friends will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lentBooks.map((book) => (
                    <div key={book.id} className={`p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle} ${
                      book.status === 'return_pending' ? `border-l-4 border-l-${moodClasses.accentColor}-500` : ''
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`font-medium ${moodClasses.textStyle} mb-1`}>{book.title}</h3>
                          <p className={`text-sm ${moodClasses.textStyle} opacity-60 mb-2`}>by {book.author}</p>
                          <p className={`text-sm ${moodClasses.textStyle} opacity-70 mb-2`}>
                            Lent to {book.borrowerName}
                          </p>
                          
                          {book.dueDate && (
                            <div className={`flex items-center text-sm ${moodClasses.textStyle} opacity-60 mb-2`}>
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(book.dueDate).toLocaleDateString()}
                            </div>
                          )}

                          {book.status === 'return_pending' && (
                            <div className={`flex items-center text-sm text-${moodClasses.accentColor}-600 mb-2`}>
                              <Clock className="w-4 h-4 mr-1" />
                              Return pending - please confirm if received
                            </div>
                          )}

                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              book.status === 'return_pending' ? `bg-${moodClasses.accentColor}-100 text-${moodClasses.accentColor}-700` : 
                              book.status === 'borrowed' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {book.status === 'return_pending' ? 'Return Pending' : 'Borrowed'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {book.status === 'return_pending' && (
                            <button
                              onClick={() => handleConfirmReturn(book.id, book.borrowerName || 'Unknown', book.title)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Confirm Return</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}