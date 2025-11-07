'use client';

import React, { useState, useEffect } from 'react';
import { Book, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Star, BookMarked, X, Calendar, Tag } from 'lucide-react';

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

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(book.status)}`}>
                  {getStatusLabel(book.status)}
                </span>
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
      {/* Wide, readable book spine */}
      <div
        className={`h-64 w-16 relative cursor-pointer transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-xl`}
        onClick={() => onClick(book)}
      >
        <div className={`h-full w-full bg-gradient-to-br ${gradient} rounded-sm shadow-md relative overflow-hidden border border-black/10`}>
          {/* Book binding edge */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black/30"></div>
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/30"></div>

          {/* Status indicator at top */}
          <div className="absolute top-2 left-0 right-0 text-center text-sm">
            {getStatusIndicator()}
          </div>

          {/* Rating stars */}
          {book.personalRating && book.personalRating > 0 && (
            <div className="absolute top-6 left-0 right-0 flex justify-center">
              {[...Array(book.personalRating)].map((_, i) => (
                <Star key={i} className="w-2 h-2 text-yellow-300 fill-yellow-300" />
              ))}
            </div>
          )}

          {/* Read status badge */}
          {book.readStatus && (
            <div className="absolute top-12 left-1 right-1">
              <div className={`text-xs rounded-full py-0.5 text-white text-center font-medium ${
                book.readStatus === 'read' ? 'bg-green-600/80' :
                book.readStatus === 'currently-reading' ? 'bg-blue-600/80' :
                'bg-amber-600/80'
              }`}>
                {book.readStatus === 'read' ? 'Read' :
                 book.readStatus === 'currently-reading' ? 'Reading' :
                 'Want'}
              </div>
            </div>
          )}

          {/* Title and author - HORIZONTAL text in center */}
          <div className="absolute inset-0 flex items-center justify-center p-1">
            <div className="text-center">
              <p className="text-[10px] leading-tight font-bold text-white text-shadow mb-1 break-words">
                {truncate(book.title, 40)}
              </p>
              <p className="text-[8px] leading-tight text-white/90 text-shadow break-words">
                {truncate(book.author, 25)}
              </p>
            </div>
          </div>

          {/* Genre label at bottom */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <div className="text-[8px] uppercase font-semibold text-white/70 tracking-wider">
              {book.genre?.substring(0, 8) || ''}
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
  const [currentPage, setCurrentPage] = useState(0);
  const [groupBy, setGroupBy] = useState<'none' | 'genre' | 'status' | 'rating'>('none');
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);

  const booksPerShelf = 12; // Show 12 books per shelf
  const shelvesPerPage = 3; // Show 3 shelves per page
  const booksPerPage = booksPerShelf * shelvesPerPage;

  // Group books if needed
  const groupedBooks = () => {
    let sorted = [...books];

    if (groupBy === 'genre') {
      sorted.sort((a, b) => (a.genre || 'zzz').localeCompare(b.genre || 'zzz'));
    } else if (groupBy === 'status') {
      sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    } else if (groupBy === 'rating') {
      sorted.sort((a, b) => (b.personalRating || 0) - (a.personalRating || 0));
    }

    return sorted;
  };

  const sortedBooks = groupedBooks();
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
  const startIdx = currentPage * booksPerPage;
  const endIdx = startIdx + booksPerPage;
  const currentBooks = sortedBooks.slice(startIdx, endIdx);

  // Group current books into shelves
  const shelves = [];
  for (let i = 0; i < currentBooks.length; i += booksPerShelf) {
    shelves.push(currentBooks.slice(i, i + booksPerShelf));
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value as any);
              setCurrentPage(0); // Reset to first page
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="genre">Genre</option>
            <option value="status">Status</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* Pagination */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing {startIdx + 1}-{Math.min(endIdx, sortedBooks.length)} of {sortedBooks.length}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              Page {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Shelves */}
      <div className="space-y-8">
        {shelves.map((shelfBooks, shelfIndex) => (
          <div key={shelfIndex} className="relative">
            {/* Shelf */}
            <div className="relative bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg p-4 shadow-lg">
              {/* Wood grain effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-transparent to-amber-900/20 rounded-lg"></div>

              {/* Books container */}
              <div className="flex items-end justify-start space-x-1 min-h-[280px] overflow-x-auto pb-4">
                {/* Left bookend */}
                <div className="flex-shrink-0 w-6 h-56 bg-gradient-to-b from-stone-600 to-stone-800 rounded-sm shadow-lg mr-2">
                  <div className="h-full w-full bg-gradient-to-r from-stone-500/20 to-stone-900/20 rounded-sm"></div>
                </div>

                {/* Books */}
                {shelfBooks.map((book) => (
                  <BookSpine
                    key={book.id}
                    book={book}
                    onClick={setSelectedBook}
                  />
                ))}

                {/* Fill empty slots with placeholders */}
                {[...Array(booksPerShelf - shelfBooks.length)].map((_, i) => (
                  <div key={`empty-${i}`} className="w-16 h-64 opacity-10">
                    <BookMarked className="w-full h-full text-white/30" />
                  </div>
                ))}

                {/* Right bookend */}
                <div className="flex-shrink-0 w-6 h-56 bg-gradient-to-b from-stone-600 to-stone-800 rounded-sm shadow-lg ml-2">
                  <div className="h-full w-full bg-gradient-to-r from-stone-900/20 to-stone-500/20 rounded-sm"></div>
                </div>
              </div>

              {/* Shelf edge */}
              <div className="absolute -bottom-2 left-0 right-0 h-4 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-lg"></div>
            </div>

            {/* Shelf label */}
            <div className="text-center mt-4">
              <span className="text-sm font-medium text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
                Shelf {currentPage * shelvesPerPage + shelfIndex + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {books.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg p-12 shadow-lg max-w-md mx-auto">
            <div className="text-amber-100">
              <Book className="w-16 h-16 mx-auto mb-4 opacity-60" />
              <h3 className="text-xl font-semibold mb-2">Empty Bookshelf</h3>
              <p className="text-sm opacity-80">Your books will appear here once you add them to your library.</p>
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
