'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Gift, Trophy, XCircle, Truck, CheckCircle, BookOpen, User, Star, BookMarked } from 'lucide-react';
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
  // Reading tracking fields
  personalRating?: number | null;
  readStatus?: 'want-to-read' | 'currently-reading' | 'read' | null;
  readDate?: string | null;
  readingNotes?: string | null;
  tags?: string | null;
  // Ownership field
  owned?: boolean;
}

interface BookCardProps {
  book: Book;
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: string) => void;
  isOwner?: boolean;
  friendOwnerId?: string;  // For borrow requests when viewing friend's library
  friendOwnerName?: string;  // For borrow requests when viewing friend's library
  onRequestSuccess?: () => void;  // Callback after successful request
}

export function BookCard({ book, onEdit, onDelete, isOwner = true, friendOwnerId, friendOwnerName, onRequestSuccess }: BookCardProps) {
  const { user } = useAuth();
  const [isUpdatingFreeStatus, setIsUpdatingFreeStatus] = useState(false);
  const [isUpdatingOwnership, setIsUpdatingOwnership] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [claimerInfo, setClaimerInfo] = useState<{
    name: string;
    username: string;
    email: string;
  } | null>(null);
  
  // Enhanced Book interface (these fields should be in your Book type)
  const isFreeToGoodHome = book.is_free_to_good_home || false;
  const deliveryMethod = book.delivery_method || 'pickup';
  const claimedByUserId = book.claimed_by_user_id;
  const claimedAt = book.claimed_at;
  const claimExpiresAt = book.claim_expires_at;
  
  // Check if book is claimed and not expired
  const isClaimed = claimedByUserId && claimExpiresAt && new Date(claimExpiresAt) > new Date();
  const isClaimedByCurrentUser = claimedByUserId === user?.id;
  
  // Check for pending transfer from the database
  const transferStatus = book.transfer_status || 'none';

  // DEBUG LOG - ADD THIS TEMPORARILY
  console.log('DEBUG - Book:', book.title, {
    isClaimedByCurrentUser,
    transferStatus: book.transfer_status,
    claimedByUserId: book.claimed_by_user_id,
    currentUserId: user?.id
  });
  
  // Fetch claimer info if book is claimed and user is owner
  useEffect(() => {
    if (isClaimed && claimedByUserId && isOwner) {
      fetchClaimerInfo();
    }
  }, [isClaimed, claimedByUserId, isOwner]);

  const fetchClaimerInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/users/${claimedByUserId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setClaimerInfo({
          name: `${userData.first_name} ${userData.last_name}`.trim(),
          username: userData.username,
          email: userData.email
        });
      }
    } catch (error) {
      console.error('Error fetching claimer info:', error);
    }
  };
  
  // Calculate time remaining for claim
  const getTimeRemaining = () => {
    if (!claimExpiresAt) return null;
    const now = new Date();
    const expires = new Date(claimExpiresAt);
    const hoursLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    return hoursLeft > 0 ? hoursLeft : 0;
  };

  const handleToggleFreeStatus = async () => {
    if (!isOwner) return;

    setIsUpdatingFreeStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/toggle-free`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFreeToGoodHome: !isFreeToGoodHome,
          deliveryMethod: deliveryMethod
        })
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error toggling free status:', error);
    } finally {
      setIsUpdatingFreeStatus(false);
    }
  };

  const handleToggleOwnership = async () => {
    if (!isOwner) return;

    setIsUpdatingOwnership(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please sign in to update book ownership');
        return;
      }

      // Send all required fields along with the ownership update
      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          condition: book.condition,
          isbn: book.isbn,
          genre: book.genre,
          publicationYear: book.publicationYear,
          notes: book.notes,
          personalRating: book.personalRating,
          readStatus: book.readStatus,
          readDate: book.readDate,
          readingNotes: book.readingNotes,
          tags: book.tags,
          owned: !book.owned  // Toggle the ownership
        })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error('Failed to update ownership');
      }
    } catch (error) {
      console.error('Error toggling ownership:', error);
      alert('Failed to update book ownership');
    } finally {
      setIsUpdatingOwnership(false);
    }
  };

  const handleClaimBook = async () => {
    if (isOwner || isClaimed) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error claiming book:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseClaim = async () => {
    if (!isClaimedByCurrentUser) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/release-claim`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Claim released successfully');
        window.location.reload();
      } else {
        console.error('Failed to release claim');
      }
    } catch (error) {
      console.error('Error releasing claim:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkHandedOff = async () => {
    if (!isOwner || !isClaimed) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/mark-handed-off`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Marked "${result.book_title}" as handed off! The claimer can now confirm receipt.`);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error marking as handed off:', error);
      alert('Failed to mark book as handed off');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!isClaimedByCurrentUser) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/confirm-received`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`🎉 Transfer complete! "${result.book_title}" is now in your library!`);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
      alert('Failed to confirm receipt');
    } finally {
      setIsLoading(false);
    }
  };

  // Your existing functions (keep these from your current BookCard)
  const handleMarkAsReturned = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to mark book as returned');
      }
    } catch (error) {
      console.error('Error marking book as returned:', error);
    }
  };

  const handleConfirmReturn = async () => {
    const isConfirmed = confirm(
      `Are you sure ${book.borrowerName} returned "${book.title}"?`
    );

    if (!isConfirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/confirm-return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to confirm book return');
      }
    } catch (error) {
      console.error('Error confirming book return:', error);
    }
  };

  const handleRequestToBorrow = async () => {
    if (!friendOwnerId || !user?.id) {
      alert('Unable to create request. Please try again.');
      return;
    }

    const message = prompt(`Add a message for ${friendOwnerName} (optional):`);
    if (message === null) return; // User cancelled

    setIsLoading(true);
    try {
      const response = await fetch('/api/borrow/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: book.id,
          ownerId: friendOwnerId,
          borrowerId: user.id,
          message: message || undefined
        })
      });

      if (response.ok) {
        alert(`✅ Request sent to ${friendOwnerName}!\n\nThey'll be notified and can approve your request.`);
        if (onRequestSuccess) {
          onRequestSuccess();
        }
      } else {
        const error = await response.json();
        alert(`❌ ${error.error || 'Failed to send request'}`);
      }
    } catch (error) {
      console.error('Error requesting book:', error);
      alert('Failed to send borrow request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDeliveryIcon = () => {
    switch (deliveryMethod) {
      case 'mail': return '📮';
      case 'both': return '📮🏠';
      case 'pickup':
      default: return '🏠';
    }
  };

  const getReadingStatusBadge = () => {
    if (!book.readStatus) return null;

    switch (book.readStatus) {
      case 'want-to-read':
        return (
          <Badge variant="default" className="bg-blue-600 text-white">
            <BookMarked className="w-3 h-3 mr-1" />
            Want to Read
          </Badge>
        );
      case 'currently-reading':
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            <BookOpen className="w-3 h-3 mr-1" />
            Reading
          </Badge>
        );
      case 'read':
        return (
          <Badge variant="default" className="bg-purple-600 text-white">
            <Star className="w-3 h-3 mr-1" />
            Read
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderStarRating = () => {
    if (!book.personalRating) return null;

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= (book.personalRating || 0)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = () => {
    if (isFreeToGoodHome) {
      if (isClaimed) {
        return (
          <Badge variant="default">
            🎯 Claimed ({getTimeRemaining()}h left)
          </Badge>
        );
      }
      return (
        <Badge variant="success">
          🎁 Free to Good Home {getDeliveryIcon()}
        </Badge>
      );
    }

    // Original status badges for non-free books
    switch (book.status) {
      case 'available':
        return <Badge variant="success">📚 Available</Badge>;
      case 'borrowed':
        return <Badge variant="default">📖 Borrowed</Badge>;
      case 'checked_out':
        return <Badge variant="default">📖 Checked Out</Badge>;
      case 'return_pending':
        return <Badge variant="info">📋 Return Pending</Badge>;
      case 'overdue':
        return <Badge variant="danger">⚠️ Overdue</Badge>;
      default:
        return <Badge variant="default">{book.status}</Badge>;
    }
  };

  // Determine states
  const isBorrower = book.borrowedBy === user?.username;

  return (
    <Card className={`p-4 hover:shadow-md transition-all ${
      isFreeToGoodHome ? 'ring-2 ring-green-400 bg-green-50' : ''
    } ${isClaimed ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
      
      {/* Free to Good Home Banner */}
      {isFreeToGoodHome && (
        <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium text-sm">
              🎁 Free to Good Home!
            </span>
            <span className="text-green-600 text-xs">
              {getDeliveryIcon()} {deliveryMethod === 'both' ? 'Pickup or Mail' : 
                deliveryMethod === 'mail' ? 'Will Mail' : 'Pickup Only'}
            </span>
          </div>
          
          {isClaimed && (
            <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-1 rounded">
              {isOwner && claimerInfo 
                ? `Claimed by ${claimerInfo.name} (@${claimerInfo.username}) - ${getTimeRemaining()} hours remaining.`
                : isClaimedByCurrentUser 
                  ? `You claimed this book! ${getTimeRemaining()} hours remaining.`
                  : `Claimed by someone else. ${getTimeRemaining()} hours remaining.`
              }
            </div>
          )}
        </div>
      )}

      {/* OWNER DETAILED CLAIM INFO */}
      {isOwner && isClaimed && claimerInfo && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                🎯 Claimed by {claimerInfo.name} (@{claimerInfo.username})
              </p>
              <p className="text-xs text-blue-700 mt-1">
                📧 Contact: {claimerInfo.email}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ⏰ Expires in {getTimeRemaining()} hours
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600">
                {getDeliveryIcon()} {deliveryMethod}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Book Info */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{book.title}</h3>
          <p className="text-gray-600">{book.author}</p>
          {book.genre && (
            <p className="text-sm text-gray-500 capitalize">{book.genre.replace('-', ' ')}</p>
          )}
          {book.publicationYear && (
            <p className="text-sm text-gray-500">{book.publicationYear}</p>
          )}

          {/* Reading Status & Rating */}
          {(book.readStatus || book.personalRating) && (
            <div className="flex items-center space-x-2 mt-2">
              {getReadingStatusBadge()}
              {renderStarRating()}
            </div>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex justify-between items-center text-sm mb-3">
        <span className={`font-medium capitalize ${getConditionColor(book.condition)}`}>
          {book.condition} condition
        </span>
        <span className="text-gray-500">
          Added {new Date(book.addedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Display borrower info for regular borrowed books */}
      {(book.status === 'borrowed' || book.status === 'return_pending') && book.borrowerName && (
        <div className={`p-2 rounded border mb-3 ${
          book.status === 'return_pending' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <p className={`text-sm ${
            book.status === 'return_pending' ? 'text-blue-800' : 'text-yellow-800'
          }`}>
            <span className="font-medium">
              {book.status === 'return_pending' ? 'Return pending from:' : 'Borrowed by:'}
            </span> {book.borrowerName}
          </p>
          {book.dueDate && (
            <p className={`text-sm ${
              book.status === 'return_pending' ? 'text-blue-800' : 'text-yellow-800'
            }`}>
              <span className="font-medium">Due:</span> {new Date(book.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {book.notes && (
        <div className="text-sm text-gray-600 mb-3 italic">
          "{book.notes}"
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-2 pt-3 border-t">

        {/* Ownership Toggle (Owner Only) */}
        {isOwner && (
          <Button
            size="sm"
            variant={book.owned ? "success" : "secondary"}
            onClick={handleToggleOwnership}
            disabled={isUpdatingOwnership}
            className="flex-1"
          >
            {isUpdatingOwnership ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-1" />
            )}
            {book.owned ? '✓ I Own This' : 'Mark as Owned'}
          </Button>
        )}

        {/* Free to Good Home Toggle (Owner Only) */}
        {isOwner && !isClaimed && (
          <Button
            size="sm"
            variant={isFreeToGoodHome ? "success" : "secondary"}
            onClick={handleToggleFreeStatus}
            disabled={isUpdatingFreeStatus}
            className="flex-1"
          >
            {isUpdatingFreeStatus ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            ) : (
              <Gift className="w-4 h-4 mr-1" />
            )}
            {isFreeToGoodHome ? 'Remove from Free' : 'Free to Good Home'}
          </Button>
        )}

        {/* Claim Button (Non-owners) */}
        {!isOwner && isFreeToGoodHome && !isClaimed && (
          <Button 
            size="sm" 
            variant="success"
            onClick={handleClaimBook}
            className="flex-1 animate-pulse"
            disabled={isLoading}
          >
            <Trophy className="w-4 h-4 mr-1" />
            Claim This Book!
          </Button>
        )}

        {/* Release Claim Button */}
        {isClaimedByCurrentUser && (
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleReleaseClaim}
            className="flex-1"
            disabled={isLoading}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Release Claim
          </Button>
        )}

        {/* OWNER: Mark as Handed Off Button */}
        {isOwner && isClaimed && transferStatus !== 'completed' && (
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleMarkHandedOff}
            disabled={isLoading}
            className="flex-1"
          >
            <Truck className="w-4 h-4 mr-1" />
            Mark as Handed Off
          </Button>
        )}

        {/* CLAIMER: Confirm Received Button */}
        {isClaimedByCurrentUser && transferStatus === 'pending' && (
          <Button
            size="sm"
            variant="success"
            onClick={handleConfirmReceived}
            disabled={isLoading}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm I Received It
          </Button>
        )}

        {/* REQUEST TO BORROW BUTTON - THE MISSING PIECE! */}
        {!isOwner && !isFreeToGoodHome && book.status === 'available' && friendOwnerId && (
          <Button
            size="sm"
            variant="default"
            onClick={handleRequestToBorrow}
            disabled={isLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            ) : (
              <BookOpen className="w-4 h-4 mr-1" />
            )}
            Request to Borrow
          </Button>
        )}

        {/* Original Edit/Delete Buttons (Available books only) */}
        {isOwner && !isFreeToGoodHome && book.status === 'available' && (
          <>
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={() => onEdit(book)} className="flex-1">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}

            {onDelete && (
              <Button size="sm" variant="danger" onClick={() => onDelete(book.id)} className="flex-1">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </>
        )}

        {/* Regular borrower actions */}
        {isBorrower && book.status === 'borrowed' && (
          <Button
            onClick={handleMarkAsReturned}
            variant="secondary"
            size="sm"
            className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            Mark as Returned
          </Button>
        )}

        {/* Owner actions for regular borrowed books */}
        {isOwner && book.status === 'return_pending' && (
          <Button
            onClick={handleConfirmReturn}
            variant="secondary"
            size="sm"
            className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            Confirm Return
          </Button>
        )}
      </div>
    </Card>
  );
}