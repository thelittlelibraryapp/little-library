'use client';

import React, { useState } from 'react';
import { Book, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Star, BookMarked } from 'lucide-react';

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

const BookSpine: React.FC<BookSpineProps> = ({ book, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

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
        onClick={() => setShowMenu(!showMenu)}
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

      {/* Action menu */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          ></div>

          {/* Menu */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 w-48">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-3 bg-gray-50 border-b">
                <h5 className="font-semibold text-sm text-gray-900 leading-tight">{book.title}</h5>
                <p className="text-xs text-gray-600 mt-0.5">by {book.author}</p>
                {book.personalRating && (
                  <div className="flex items-center mt-1">
                    {[...Array(book.personalRating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(book);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600" />
                <span>Edit Book</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${book.title}"?`)) {
                    onDelete(book.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center space-x-2 text-sm text-red-600 transition-colors border-t"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Book</span>
              </button>
            </div>
          </div>
        </>
      )}
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
                    onEdit={onEdit}
                    onDelete={onDelete}
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
    </div>
  );
};
