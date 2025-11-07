'use client';

import React, { useState } from 'react';
import { ISBNScanner } from './ISBNScanner';
import { BookOpen, Camera, Loader2, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';

interface GoogleBookInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  imageLinks?: {
    thumbnail?: string;
  };
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: GoogleBookInfo;
  }>;
}

interface ScanToAddBookProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: () => void;
}

export function ScanToAddBook({ isOpen, onClose, onBookAdded }: ScanToAddBookProps) {
  const { user } = useAuth();
  const [showScanner, setShowScanner] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [bookData, setBookData] = useState<GoogleBookInfo | null>(null);
  const [isbn, setIsbn] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

  const handleISBNDetected = async (detectedISBN: string) => {
    setShowScanner(false);
    setIsbn(detectedISBN);
    setIsLoading(true);
    setError('');

    try {
      // Fetch book details from Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${detectedISBN}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch book details');
      }

      const data: GoogleBooksResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        setError('Book not found. You can add it manually instead.');
        setIsLoading(false);
        return;
      }

      const bookInfo = data.items[0].volumeInfo;
      setBookData(bookInfo);
    } catch (err) {
      console.error('Error fetching book details:', err);
      setError('Failed to fetch book details. Please try again or add manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async () => {
    if (!bookData || !user) return;

    setIsLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Extract publication year
      const publicationYear = bookData.publishedDate
        ? parseInt(bookData.publishedDate.split('-')[0])
        : undefined;

      const bookPayload = {
        title: bookData.title,
        author: bookData.authors?.join(', ') || 'Unknown Author',
        isbn: isbn,
        publisher: bookData.publisher,
        publicationYear: publicationYear,
        condition: condition,
        status: 'available',
        notes: ''
      };

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add book');
      }

      // Success!
      onBookAdded();
      handleClose();
    } catch (err: any) {
      console.error('Error adding book:', err);
      setError(err.message || 'Failed to add book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowScanner(true);
    setBookData(null);
    setIsbn('');
    setError('');
    setCondition('good');
    onClose();
  };

  const handleScanAgain = () => {
    setShowScanner(true);
    setBookData(null);
    setIsbn('');
    setError('');
  };

  if (!isOpen) return null;

  // Show scanner
  if (showScanner) {
    return (
      <ISBNScanner
        isOpen={isOpen}
        onClose={handleClose}
        onISBNDetected={handleISBNDetected}
      />
    );
  }

  // Show loading state
  if (isLoading && !bookData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
            <p className="text-amber-900 font-medium">Looking up book details...</p>
            <p className="text-sm text-amber-700 mt-2">ISBN: {isbn}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !bookData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Oops!</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleScanAgain}
                className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show book preview and confirmation
  if (bookData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <Check className="w-6 h-6" />
              <h2 className="text-xl font-bold">Book Found!</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Book Preview */}
          <div className="p-6">
            <div className="flex gap-6 mb-6">
              {/* Book Cover */}
              {bookData.imageLinks?.thumbnail ? (
                <img
                  src={bookData.imageLinks.thumbnail}
                  alt={bookData.title}
                  className="w-32 h-48 object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-32 h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg shadow-lg flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-amber-600" />
                </div>
              )}

              {/* Book Details */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-amber-950 mb-2">
                  {bookData.title}
                </h3>
                <p className="text-lg text-amber-800 mb-1">
                  by {bookData.authors?.join(', ') || 'Unknown Author'}
                </p>
                {bookData.publisher && (
                  <p className="text-sm text-amber-700">
                    {bookData.publisher}
                    {bookData.publishedDate && ` • ${bookData.publishedDate.split('-')[0]}`}
                  </p>
                )}
                <p className="text-sm text-amber-600 mt-2">ISBN: {isbn}</p>
              </div>
            </div>

            {/* Condition Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-amber-900 mb-2">
                Book Condition
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setCondition(cond)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      condition === cond
                        ? 'bg-amber-600 text-white shadow-lg scale-105'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleAddBook}
                disabled={isLoading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Add to Library</span>
                  </>
                )}
              </button>
              <button
                onClick={handleScanAgain}
                disabled={isLoading}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Scan Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
