'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
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
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [lentBooks, setLentBooks] = useState<Book[]>([]);
  const [isLoadingBorrowed, setIsLoadingBorrowed] = useState(true);
  const [isLoadingLent, setIsLoadingLent] = useState(true);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Lending & Borrowing</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Books I'm Borrowing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
              Books I'm Borrowing ({borrowedBooks.length})
            </h2>
            
            {isLoadingBorrowed ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading borrowed books...</p>
              </div>
            ) : borrowedBooks.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowed books</h3>
                <p className="text-gray-600">Books you're borrowing from friends will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {borrowedBooks.map((book) => (
                  <Card key={book.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Borrowed from {(book as any).ownerName}
                        </p>
                        
                        {book.dueDate && (
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {new Date(book.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400">
                          Borrowed {new Date(book.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button 
                          size="sm" 
                          variant="primary"
                          onClick={() => handleMarkAsReturned(book.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as Returned
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Books I've Lent Out */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              Books I've Lent Out ({lentBooks.length})
            </h2>
            
            {isLoadingLent ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading lent books...</p>
              </div>
            ) : lentBooks.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books lent out</h3>
                <p className="text-gray-600">Books you've lent to friends will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {lentBooks.map((book) => (
                  <Card key={book.id} className={`p-4 ${
                    book.status === 'return_pending' ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Lent to {book.borrowerName}
                        </p>
                        
                        {book.dueDate && (
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {new Date(book.dueDate).toLocaleDateString()}
                          </div>
                        )}

                        {book.status === 'return_pending' && (
                          <div className="flex items-center text-sm text-blue-600 mb-2">
                            <Clock className="w-4 h-4 mr-1" />
                            Return pending - please confirm if received
                          </div>
                        )}

                        <Badge variant={
                          book.status === 'return_pending' ? 'info' : 
                          book.status === 'borrowed' ? 'warning' : 'default'
                        }>
                          {book.status === 'return_pending' ? 'Return Pending' : 'Borrowed'}
                        </Badge>
                      </div>
                      
                      <div className="ml-4">
                        {book.status === 'return_pending' && (
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleConfirmReturn(book.id, book.borrowerName || 'Unknown', book.title)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirm Return
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}