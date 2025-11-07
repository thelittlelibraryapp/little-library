'use client';

import React, { useState, useEffect } from 'react';
import { Book, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Star, BookMarked, X, Calendar, Tag, Grid3x3, Columns3, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BookData {
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
  personalRating?: number | null;
  readStatus?: 'want-to-read' | 'currently-reading' | 'read' | null;
  readDate?: string | null;
  readingNotes?: string | null;
  tags?: string | null;
  owned?: boolean;
}

interface BookSpineProps {
  book: BookData;
  onClick: (book: BookData) => void;
}

interface BookDetailModalProps {
  book: BookData;
  onClose: () => void;
  onEdit: (book: BookData) => void;
  onDelete: (bookId: string) => void;
}

const getGenreColor = (genre?: string) => {
  const colors = {
    'fiction': 'from-blue-500 to-blue-700',
    'non-fiction': 'from-green-500 to-green-700',
    'mystery': 'from-purple-500 to-purple-700',
    'romance': 'from-pink-500 to-pink-700',
    'science-fiction': 'from-cyan-500 to-cyan-700',
    'fantasy': 'from-indigo-500 to-indigo-700',
    'history': 'from-orange-500 to-orange-700',
    'self-help': 'from-emerald-500 to-emerald-700',
    'business': 'from-amber-500 to-amber-700',
    'other': 'from-slate-500 to-slate-700',
  };

  const genreKey = genre?.toLowerCase() || 'other';
  return colors[genreKey as keyof typeof colors] || colors.other;
};

// Book Grid Card Component
interface BookGridCardProps {
  book: BookData;
  onClick: (book: BookData) => void;
  onToggleOwnership: (bookId: string, owned: boolean) => void;
}

const BookGridCard: React.FC<BookGridCardProps> = ({ book, onClick, onToggleOwnership }) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isTogglingOwnership, setIsTogglingOwnership] = useState(false);
  const gradient = getGenreColor(book.genre);

  useEffect(() => {
    const fetchCover = async () => {
      if (!book.isbn) return;

      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`
        );
        const data = await response.json();

        if (data.items && data.items[0]?.volumeInfo?.imageLinks) {
          const imageLinks = data.items[0].volumeInfo.imageLinks;
          setCoverUrl(imageLinks.thumbnail || imageLinks.smallThumbnail);
        }
      } catch (error) {
        console.error('Error fetching cover:', error);
      }
    };

    fetchCover();
  }, [book.isbn]);

  const handleToggleOwnership = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    setIsTogglingOwnership(true);
    try {
      await onToggleOwnership(book.id, !book.owned);
    } finally {
      setIsTogglingOwnership(false);
    }
  };

  return (
    <div
      className="group relative cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10"
    >
      <div className="relative aspect-[2/3] rounded-md overflow-hidden shadow-md hover:shadow-xl" onClick={() => onClick(book)}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-2`}>
            <p className="text-white text-xs font-bold text-center mb-1 line-clamp-3">
              {book.title}
            </p>
            <p className="text-white/80 text-[10px] text-center line-clamp-2">
              {book.author}
            </p>
          </div>
        )}

        {/* Owned badge */}
        {book.owned && (
          <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        )}

        {/* Rating stars */}
        {book.personalRating && book.personalRating > 0 && (
          <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5 bg-black/40 backdrop-blur-sm rounded py-0.5">
            {[...Array(book.personalRating)].map((_, i) => (
              <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        )}

        {/* Ownership toggle button - appears on hover */}
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleOwnership}
            disabled={isTogglingOwnership}
            className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
              book.owned
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:opacity-50`}
            title={book.owned ? 'Remove from owned' : 'Mark as owned'}
          >
            {isTogglingOwnership ? '...' : book.owned ? 'Owned' : 'Own?'}
          </button>
        </div>
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {book.title}
      </div>
    </div>
  );
};

// Book Detail Modal Component
const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose, onEdit, onDelete }) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loadingCover, setLoadingCover] = useState(true);

  useEffect(() => {
    const fetchCover = async () => {
      if (!book.isbn) {
        setLoadingCover(false);
        return;
      }

      try {
        // Try Google Books API
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`
        );
        const data = await response.json();

        if (data.items && data.items[0]?.volumeInfo?.imageLinks) {
          // Get the highest quality image available
          const imageLinks = data.items[0].volumeInfo.imageLinks;
          const coverImage = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.thumbnail;
          setCoverUrl(coverImage);
        }
      } catch (error) {
        console.error('Error fetching book cover:', error);
      } finally {
        setLoadingCover(false);
      }
    };

    fetchCover();
  }, [book.isbn]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'checked_out': return 'Checked Out';
      case 'overdue': return 'Overdue';
      case 'borrowed': return 'Borrowed';
      case 'return_pending': return 'Return Pending';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'borrowed': return 'bg-purple-100 text-purple-800';
      case 'return_pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        <div className="p-6">
          <div className="flex gap-6">
            {/* Book Cover */}
            <div className="flex-shrink-0">
              {loadingCover ? (
                <div className="w-48 h-72 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg animate-pulse flex items-center justify-center">
                  <Book className="w-16 h-16 text-gray-400" />
                </div>
              ) : coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-48 h-72 object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className={`w-48 h-72 bg-gradient-to-br ${getGenreColor(book.genre)} rounded-lg shadow-lg flex items-center justify-center p-4`}>
                  <div className="text-center">
                    <Book className="w-16 h-16 text-white/80 mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">{book.title}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{book.title}</h2>
              <p className="text-lg text-gray-600 mb-4">by {book.author}</p>

              {/* Status Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(book.status)}`}>
                  {getStatusLabel(book.status)}
                </span>
                {book.owned && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    I Own This
                  </span>
                )}
                {!book.owned && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    ♡ Wishlist
                  </span>
                )}
                {book.is_free_to_good_home && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
                    🎁 Free to Good Home
                  </span>
                )}
              </div>

              {/* Reading Tracker */}
              {(book.personalRating || book.readStatus) && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Your Reading Progress</h3>
                  {book.personalRating && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-blue-800">Rating:</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < book.personalRating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {book.readStatus && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-blue-800">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        book.readStatus === 'read' ? 'bg-green-600 text-white' :
                        book.readStatus === 'currently-reading' ? 'bg-blue-600 text-white' :
                        'bg-amber-600 text-white'
                      }`}>
                        {book.readStatus === 'read' ? 'Read' :
                         book.readStatus === 'currently-reading' ? 'Currently Reading' :
                         'Want to Read'}
                      </span>
                    </div>
                  )}
                  {book.readDate && (
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-blue-800" />
                      <span className="text-sm text-blue-800">
                        Read on {new Date(book.readDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Book Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {book.isbn && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ISBN</p>
                    <p className="text-sm font-medium text-gray-900">{book.isbn}</p>
                  </div>
                )}
                {book.genre && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Genre</p>
                    <p className="text-sm font-medium text-gray-900">{book.genre}</p>
                  </div>
                )}
                {book.publicationYear && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Published</p>
                    <p className="text-sm font-medium text-gray-900">{book.publicationYear}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Condition</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{book.condition}</p>
                </div>
              </div>

              {/* Tags */}
              {book.tags && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tags</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {book.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(book.notes || book.readingNotes) && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {book.readingNotes || book.notes}
                  </div>
                </div>
              )}

              {/* Borrower Info */}
              {book.borrowerName && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-900">
                    <strong>Borrowed by:</strong> {book.borrowerName}
                  </p>
                  {book.dueDate && (
                    <p className="text-sm text-amber-800 mt-1">
                      <strong>Due:</strong> {new Date(book.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              onClick={() => {
                onEdit(book);
                onClose();
              }}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Edit className="w-5 h-5" />
              Edit Book
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                  onDelete(book.id);
                  onClose();
                }
              }}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BookSpine: React.FC<BookSpineProps> = ({ book, onClick }) => {
  const gradient = getGenreColor(book.genre);

  // Create consistent random sizes based on book ID
  const getBookDimensions = (id: string) => {
    // Use book ID to seed random-like values (consistent per book)
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Height variations: 48-72 (192px-288px in h-units)
    const heights = ['h-48', 'h-52', 'h-56', 'h-60', 'h-64', 'h-72'];
    const heightClass = heights[hash % heights.length];

    // Width variations: 12-20 (48px-80px in w-units)
    const widths = ['w-12', 'w-14', 'w-16', 'w-18', 'w-20'];
    const widthClass = widths[(hash * 3) % widths.length];

    return { heightClass, widthClass };
  };

  const { heightClass, widthClass } = getBookDimensions(book.id);

  const getStatusIndicator = () => {
    if (book.is_free_to_good_home) return '🎁';
    switch (book.status) {
      case 'available': return '✓';
      case 'checked_out': return '📖';
      case 'overdue': return '⚠';
      case 'borrowed': return '🔄';
      case 'return_pending': return '⏳';
      default: return '';
    }
  };

  const truncate = (text: string, max: number) => {
    if (text.length <= max) return text;
    return text.substring(0, max - 3) + '...';
  };

  return (
    <div className="relative group">
      {/* Book spine with random dimensions */}
      <div
        className={`${heightClass} ${widthClass} relative cursor-pointer transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-xl`}
        onClick={() => onClick(book)}
      >
        <div className={`h-full w-full bg-gradient-to-br ${gradient} rounded-sm shadow-md relative overflow-hidden border border-black/10`}>
          {/* Book binding edge */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black/30"></div>
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/30"></div>

          {/* Status indicator at top */}
          <div className="absolute top-1 left-0 right-0 text-center text-xs">
            {getStatusIndicator()}
          </div>

          {/* Rating stars */}
          {book.personalRating && book.personalRating > 0 && (
            <div className="absolute top-5 left-0 right-0 flex justify-center gap-0.5">
              {[...Array(book.personalRating)].map((_, i) => (
                <Star key={i} className="w-2 h-2 text-yellow-300 fill-yellow-300" />
              ))}
            </div>
          )}

          {/* Title and author - HORIZONTAL text in center */}
          <div className="absolute inset-0 flex items-center justify-center px-1 py-2">
            <div className="text-center">
              <p className="text-[9px] leading-tight font-bold text-white drop-shadow-md mb-0.5 break-words line-clamp-3">
                {book.title}
              </p>
              <p className="text-[7px] leading-tight text-white/90 drop-shadow-sm break-words line-clamp-2">
                {book.author}
              </p>
            </div>
          </div>

          {/* Genre label at bottom */}
          <div className="absolute bottom-1 left-0 right-0 text-center">
            <div className="text-[7px] uppercase font-semibold text-white/60 tracking-wide">
              {book.genre?.substring(0, 10) || ''}
            </div>
          </div>

          {/* Highlight effect */}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

interface BookshelfProps {
  books: BookData[];
  onEdit: (book: BookData) => void;
  onDelete: (bookId: string) => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({ books, onEdit, onDelete }) => {
  const [groupBy, setGroupBy] = useState<'none' | 'genre' | 'status' | 'rating' | 'reading-status'>('reading-status');
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const [viewType, setViewType] = useState<'shelf' | 'grid'>('grid'); // Default to grid view
  const [ownershipFilter, setOwnershipFilter] = useState<'owned' | 'all' | 'wishlist'>('owned'); // Default to owned only

  const booksPerShelf = 15; // More books per shelf for natural look

  // Filter books by ownership
  const getFilteredBooks = () => {
    if (ownershipFilter === 'owned') {
      return books.filter(b => b.owned === true);
    } else if (ownershipFilter === 'wishlist') {
      return books.filter(b => !b.owned || b.owned === false);
    }
    return books; // 'all'
  };

  const filteredBooks = getFilteredBooks();

  // Toggle ownership handler
  const handleToggleOwnership = async (bookId: string, owned: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Please sign in to update book ownership');
        return;
      }

      // Find the book in our current list to get all its data
      const book = books.find(b => b.id === bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      // Send all required fields along with the ownership update
      const response = await fetch(`/api/books/${bookId}`, {
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
          owned: owned
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update ownership');
      }

      // Trigger a refresh by calling onEdit with updated book data
      const result = await response.json();
      if (result.book) {
        onEdit(result.book);
      }
    } catch (error) {
      console.error('Error toggling ownership:', error);
      alert('Failed to update book ownership');
    }
  };

  // Group books if needed
  const groupedBooks = () => {
    let sorted = [...filteredBooks];

    if (groupBy === 'genre') {
      sorted.sort((a, b) => (a.genre || 'zzz').localeCompare(b.genre || 'zzz'));
    } else if (groupBy === 'status') {
      sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    } else if (groupBy === 'rating') {
      sorted.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
    } else if (groupBy === 'reading-status') {
      // Sort by reading status: want-to-read, currently-reading, read, then untracked
      const statusOrder: Record<string, number> = {
        'want-to-read': 1,
        'currently-reading': 2,
        'read': 3,
      };
      sorted.sort((a, b) => {
        const aOrder = a.readStatus ? statusOrder[a.readStatus] || 999 : 999;
        const bOrder = b.readStatus ? statusOrder[b.readStatus] || 999 : 999;
        return aOrder - bOrder;
      });
    }

    return sorted;
  };

  const sortedBooks = groupedBooks();

  // Group all books into shelves with section headers
  interface ShelfSection {
    books: BookData[];
    sectionHeader?: string;
    sectionCount?: number;
  }

  const shelves: ShelfSection[] = [];

  if (groupBy === 'reading-status') {
    // Create separate sections for each reading status
    const wantToRead = sortedBooks.filter(b => b.readStatus === 'want-to-read');
    const currentlyReading = sortedBooks.filter(b => b.readStatus === 'currently-reading');
    const read = sortedBooks.filter(b => b.readStatus === 'read');
    const untracked = sortedBooks.filter(b => !b.readStatus);

    // Add shelves for each section
    const addShelves = (books: BookData[], header: string) => {
      if (books.length > 0) {
        const totalCount = books.length;
        for (let i = 0; i < books.length; i += booksPerShelf) {
          const isFirstShelf = i === 0;
          shelves.push({
            books: books.slice(i, i + booksPerShelf),
            sectionHeader: isFirstShelf ? header : undefined,
            sectionCount: isFirstShelf ? totalCount : undefined,
          });
        }
      }
    };

    addShelves(wantToRead, '📚 Want to Read');
    addShelves(currentlyReading, '📖 Currently Reading');
    addShelves(read, '✅ Read');
    addShelves(untracked, '📗 Untracked');
  } else {
    // Show all books without pagination
    for (let i = 0; i < sortedBooks.length; i += booksPerShelf) {
      shelves.push({ books: sortedBooks.slice(i, i + booksPerShelf) });
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewType('grid')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewType === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewType('shelf')}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                viewType === 'shelf'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Columns3 className="w-4 h-4" />
              Shelf
            </button>
          </div>

          {/* Total count */}
          <div className="text-sm text-gray-600">
            {sortedBooks.length} {sortedBooks.length === 1 ? 'book' : 'books'}
            {viewType === 'shelf' && ` • ${shelves.length} ${shelves.length === 1 ? 'shelf' : 'shelves'}`}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Ownership Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <button
              onClick={() => setOwnershipFilter('owned')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                ownershipFilter === 'owned'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✓ Owned ({books.filter(b => b.owned === true).length})
            </button>
            <button
              onClick={() => setOwnershipFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                ownershipFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({books.length})
            </button>
            <button
              onClick={() => setOwnershipFilter('wishlist')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                ownershipFilter === 'wishlist'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ♡ Wishlist ({books.filter(b => !b.owned || b.owned === false).length})
            </button>
          </div>

          {/* Group by (only show in shelf view) */}
          {viewType === 'shelf' && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Group by:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="reading-status">Reading Status</option>
                <option value="genre">Genre</option>
                <option value="status">Availability</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid View */}
      {viewType === 'grid' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {sortedBooks.map((book) => (
            <BookGridCard
              key={book.id}
              book={book}
              onClick={setSelectedBook}
              onToggleOwnership={handleToggleOwnership}
            />
          ))}
        </div>
      )}

      {/* Shelf View */}
      {viewType === 'shelf' && (
        <div className="space-y-8">
          {shelves.map((shelf, shelfIndex) => (
            <div key={shelfIndex} className="relative">
              {/* Section Header */}
              {shelf.sectionHeader && (
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-transparent py-3 px-4 rounded-lg border-l-4 border-amber-600">
                    {shelf.sectionHeader}
                    {shelf.sectionCount && (
                      <span className="text-sm font-normal text-gray-600">
                        ({shelf.sectionCount} {shelf.sectionCount === 1 ? 'book' : 'books'})
                      </span>
                    )}
                  </h3>
                </div>
              )}

              {/* Shelf */}
              <div className="relative bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg p-4 shadow-lg">
                {/* Wood grain effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-transparent to-amber-900/20 rounded-lg"></div>

                {/* Books container - natural shelf look */}
                <div className="flex items-end justify-start space-x-1 min-h-[320px] overflow-x-auto pb-4 px-2">
                  {/* Left bookend */}
                  <div className="flex-shrink-0 w-8 h-60 bg-gradient-to-b from-stone-600 to-stone-800 rounded-sm shadow-lg mr-3">
                    <div className="h-full w-full bg-gradient-to-r from-stone-500/20 to-stone-900/20 rounded-sm"></div>
                  </div>

                  {/* Books - naturally varying sizes */}
                  {shelf.books.map((book) => (
                    <BookSpine
                      key={book.id}
                      book={book}
                      onClick={setSelectedBook}
                    />
                  ))}

                  {/* Right bookend */}
                  <div className="flex-shrink-0 w-8 h-60 bg-gradient-to-b from-stone-600 to-stone-800 rounded-sm shadow-lg ml-3">
                    <div className="h-full w-full bg-gradient-to-r from-stone-900/20 to-stone-500/20 rounded-sm"></div>
                  </div>
                </div>

                {/* Shelf edge */}
                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredBooks.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-12 shadow-lg max-w-md mx-auto">
            <div className="text-gray-700">
              <Book className="w-16 h-16 mx-auto mb-4 opacity-60" />
              <h3 className="text-xl font-semibold mb-2">
                {ownershipFilter === 'owned' ? 'No Owned Books' : ownershipFilter === 'wishlist' ? 'No Wishlist Books' : 'No Books'}
              </h3>
              <p className="text-sm opacity-80">
                {ownershipFilter === 'owned'
                  ? 'Mark books as owned to see them here.'
                  : ownershipFilter === 'wishlist'
                  ? 'Books not marked as owned will appear here.'
                  : 'Your books will appear here once you add them to your library.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};
