'use client';

import React, { useState, useEffect, use } from 'react';
import { Heart, Share2, BookOpen, User, ArrowLeft, ExternalLink, Facebook, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { PublicBookCard } from '@/components/PublicBookCard';
import Link from 'next/link';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  publicationYear?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  delivery_method?: 'pickup' | 'mail' | 'both';
  addedAt: string;
}

interface UserInfo {
  id: string;
  firstName: string;
  username: string;
}

interface PublicFreeBooksPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function PublicFreeBooksPage({ params }: PublicFreeBooksPageProps) {
  const { user } = useAuth();
  const resolvedParams = use(params);
  const [books, setBooks] = useState<Book[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadPublicBooks();
  }, [resolvedParams.username]);

  const loadPublicBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/public/users/${resolvedParams.username}/free-books`);
      const data = await response.json();

      if (response.ok) {
        setBooks(data.books);
        setUserInfo(data.user);
      } else {
        setError(data.error || 'Failed to load books');
      }
    } catch (error) {
      console.error('Failed to load public books:', error);
      setError('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimBook = async (bookId: string) => {
    if (!user) {
      // Not logged in - show signup modal
      setSelectedBookId(bookId);
      setShowSignupModal(true);
      return;
    }

    // User is logged in - proceed with claim
    try {
      const response = await fetch(`/api/books/${bookId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (response.ok) {
        alert('Claim submitted! The book owner will review your request.');
        // Optionally refresh the books to show updated status
        loadPublicBooks();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to claim book');
      }
    } catch (error) {
      console.error('Failed to claim book:', error);
      alert('Failed to claim book');
    }
  };

  const shareToFacebook = () => {
    const url = window.location.href;
    const text = `Check out ${userInfo?.firstName}'s free books! 📚`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowMobileMenu(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    setShowMobileMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-amber-800 opacity-70">Loading free books...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-amber-400 mx-auto mb-4 opacity-60" />
              <h2 className="text-xl font-semibold text-amber-900 mb-2">User not found</h2>
              <p className="text-amber-700 opacity-70 mb-6">{error}</p>
              <Link 
                href="/"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to My Little Library</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Streamlined Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header - Simplified */}
          <div className="flex items-center justify-between py-3 md:hidden">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-bold text-amber-900">My Little Library</span>
            </div>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-amber-100 transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-amber-700" />
              ) : (
                <Menu className="w-5 h-5 text-amber-700" />
              )}
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between py-4">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-amber-600" />
                <span className="text-xl font-bold text-amber-900">My Little Library</span>
              </div>
              <div className="w-px h-6 bg-amber-300"></div>
              <div className="text-lg font-semibold text-amber-800">
                {userInfo?.firstName}'s Free Books
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={shareToFacebook}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Facebook className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              <button
                onClick={copyLink}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Link</span>
              </button>

              {!user && (
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t border-amber-200/50 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <Facebook className="w-4 h-4" />
                <span>Share on Facebook</span>
              </button>
              
              <button
                onClick={copyLink}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 font-medium text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Link</span>
              </button>

              {!user && (
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all duration-200 font-medium text-sm"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Compact Welcome Section */}
          <div className="text-center">
            {/* Mobile: Compact Banner */}
            <div className="md:hidden">
              <h1 className="text-xl font-bold text-amber-900 mb-2">
                📚 {userInfo?.firstName}'s Free Books ({books.length})
              </h1>
              <p className="text-amber-700 opacity-80 text-sm px-4 mb-4">
                Browse and claim books looking for new homes
                {!user && ' • Sign up to claim'}
              </p>
            </div>

            {/* Desktop: Full Banner */}
            <div className="hidden md:block">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-4">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <span className="font-medium text-amber-900">Free to Good Homes</span>
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
              
              <h1 className="text-3xl font-bold text-amber-900 mb-2">
                {userInfo?.firstName} is sharing {books.length} book{books.length !== 1 ? 's' : ''}!
              </h1>
              
              <p className="text-amber-700 opacity-80 max-w-2xl mx-auto">
                Browse through this collection of books looking for new homes.
                {!user && ' Create a free account to claim any books you want!'}
              </p>
            </div>
          </div>

          {/* Books Grid - Mobile Optimized */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {books.map((book) => (
                <PublicBookCard
                  key={book.id}
                  book={book}
                  onClaim={handleClaimBook}
                  isLoggedIn={!!user}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 px-4">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-amber-400 mx-auto mb-4 opacity-60" />
              <h2 className="text-lg md:text-xl font-semibold text-amber-900 mb-2">No books available</h2>
              <p className="text-amber-700 opacity-70 text-sm md:text-base">
                {userInfo?.firstName} doesn't have any books marked as "free to good home" right now.
              </p>
            </div>
          )}

          {/* Footer CTA - Mobile Optimized */}
          {!user && books.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 text-center">
              <h2 className="text-lg md:text-2xl font-bold text-amber-900 mb-3 md:mb-4">
                Want to claim a book?
              </h2>
              <p className="text-amber-700 opacity-80 mb-4 md:mb-6 max-w-2xl mx-auto text-sm md:text-base">
                Create your free My Little Library account to claim books and share your own collection.
              </p>
              <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:gap-4 md:justify-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Create Free Account</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-amber-800 px-6 py-3 md:px-8 md:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 font-medium border border-amber-200"
                >
                  <span>Already have an account?</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <Heart className="w-12 h-12 text-red-500 fill-red-500 mx-auto mb-4" />
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                Create account to claim this book
              </h2>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Join My Little Library to claim books and share your own collection with friends.
              </p>
              <div className="flex flex-col space-y-3">
                <Link
                  href="/auth/signup"
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium transition-all duration-200"
                >
                  Already have an account? Sign In
                </Link>
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}