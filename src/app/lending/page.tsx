'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, CheckCircle, Clock, Gift, Mail, Truck, XCircle } from 'lucide-react';
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

interface ClaimNotification {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  claimerName: string;
  claimerUsername: string;
  claimerEmail: string;
  claimedAt: string;
  timeRemaining: number;
}

interface BorrowRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  borrowerId: string;
  borrowerName: string;
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'approved';
  requestedAt: string;
  message?: string;
}

export default function LendingPage() {
  const { user } = useAuth();
  const { currentMood, getMoodClasses } = useMood();
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [lentBooks, setLentBooks] = useState<Book[]>([]);
  const [claimNotifications, setClaimNotifications] = useState<ClaimNotification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BorrowRequest[]>([]);
  const [isLoadingBorrowed, setIsLoadingBorrowed] = useState(true);
  const [isLoadingLent, setIsLoadingLent] = useState(true);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const moodClasses = getMoodClasses();

  useEffect(() => {
    if (user?.id) {
      loadBorrowedBooks();
      loadLentBooks();
      loadClaimNotifications();
      loadPendingRequests();
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

  const loadClaimNotifications = async () => {
    try {
      setIsLoadingClaims(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/books/claimed-notifications', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setClaimNotifications(result.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load claim notifications:', error);
    } finally {
      setIsLoadingClaims(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const response = await fetch(`/api/borrow/requests?userId=${user?.id}`);

      if (response.ok) {
        const result = await response.json();
        // Filter for incoming pending requests only
        const incoming = result.requests.filter(
          (req: BorrowRequest) => req.ownerId === user?.id && req.status === 'pending'
        );
        setPendingRequests(incoming);
      }
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: string, bookTitle: string) => {
    const dueDate = prompt(`Approve request for "${bookTitle}"\n\nEnter due date (YYYY-MM-DD):`);
    if (!dueDate) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/borrow/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'approve',
          dueDate
        })
      });

      if (response.ok) {
        alert('✅ Request approved!');
        loadPendingRequests();
        loadLentBooks();
      } else {
        const error = await response.json();
        alert(`❌ ${error.error || 'Failed to approve'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    if (!confirm('Deny this borrow request?')) return;

    try {
      const response = await fetch(`/api/borrow/requests/${requestId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Request declined');
        loadPendingRequests();
      } else {
        alert('Failed to decline request');
      }
    } catch (error) {
      console.error('Error denying request:', error);
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

          {/* CLAIMS INBOX - THE MISSING PIECE! */}
          {isLoadingClaims ? (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${moodClasses.accentColor}-600 mx-auto`}></div>
              <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading claims...</p>
            </div>
          ) : claimNotifications.length > 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Gift className="w-6 h-6 text-amber-600" />
                  <h2 className="text-xl font-bold text-amber-900">
                    Claims Inbox ({claimNotifications.length})
                  </h2>
                </div>
                <Badge variant="warning">Action Required</Badge>
              </div>
              <p className="text-amber-700 mb-4">
                These people have claimed your free books! Contact them to arrange pickup/delivery.
              </p>

              <div className="space-y-3">
                {claimNotifications.map((claim) => (
                  <div
                    key={claim.bookId}
                    className="bg-white p-4 rounded-xl shadow-md border-l-4 border-l-amber-500"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          📚 {claim.bookTitle}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">by {claim.bookAuthor}</p>

                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-medium text-sm">
                                {claim.claimerName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{claim.claimerName}</p>
                              <p className="text-xs text-gray-500">@{claim.claimerUsername}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${claim.claimerEmail}`} className="hover:underline text-blue-600">
                              {claim.claimerEmail}
                            </a>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Claimed {new Date(claim.claimedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-amber-600 font-medium">
                            <span>⏰ {claim.timeRemaining}h remaining</span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            window.location.href = `/library`;
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1 text-sm"
                        >
                          <Truck className="w-4 h-4" />
                          <span>View in Library</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                <p className="text-xs text-amber-800">
                  💡 <strong>Tip:</strong> Go to your Library page to mark books as "Handed Off" once you've given them to the claimer.
                </p>
              </div>
            </div>
          ) : null}

          {/* PENDING BORROW REQUESTS */}
          {isLoadingRequests ? (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${moodClasses.accentColor}-600 mx-auto`}></div>
              <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading requests...</p>
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-purple-900">
                    Pending Borrow Requests ({pendingRequests.length})
                  </h2>
                </div>
                <Badge variant="warning">Action Required</Badge>
              </div>
              <p className="text-purple-700 mb-4">
                Friends want to borrow these books from you!
              </p>

              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white p-4 rounded-xl shadow-md border-l-4 border-l-purple-500"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          📖 {request.bookTitle}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">by {request.bookAuthor}</p>

                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {request.borrowerName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{request.borrowerName}</p>
                            <p className="text-xs text-gray-500">
                              Requested {new Date(request.requestedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-purple-300">
                            <p className="text-xs text-gray-600 italic">"{request.message}"</p>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => handleApproveRequest(request.id, request.bookTitle)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDenyRequest(request.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1 text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <p className="text-xs text-purple-800">
                  💡 <strong>Tip:</strong> When approving, you'll set a due date for the book return.
                </p>
              </div>
            </div>
          ) : null}

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