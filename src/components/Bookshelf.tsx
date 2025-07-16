'use client';

import React, { useState, useEffect } from 'react';
import { Book, Edit, Trash2, ExternalLink, Clock, User, Star, Heart, MoreHorizontal } from 'lucide-react';

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
}

interface BookSpineProps {
  book: BookData;
  onEdit: (book: BookData) => void;
  onDelete: (bookId: string) => void;
  index: number;
}

const getGenreColor = (genre?: string) => {
  const colors = {
    'fiction': ['from-blue-500 to-blue-700', 'from-blue-600 to-blue-800'],
    'non-fiction': ['from-green-500 to-green-700', 'from-green-600 to-green-800'],
    'mystery': ['from-purple-500 to-purple-700', 'from-purple-600 to-purple-800'],
    'romance': ['from-pink-500 to-pink-700', 'from-pink-600 to-pink-800'],
    'sci-fi': ['from-cyan-500 to-cyan-700', 'from-cyan-600 to-cyan-800'],
    'fantasy': ['from-indigo-500 to-indigo-700', 'from-indigo-600 to-indigo-800'],
    'horror': ['from-red-500 to-red-700', 'from-red-600 to-red-800'],
    'biography': ['from-amber-500 to-amber-700', 'from-amber-600 to-amber-800'],
    'history': ['from-orange-500 to-orange-700', 'from-orange-600 to-orange-800'],
    'science': ['from-teal-500 to-teal-700', 'from-teal-600 to-teal-800'],
    'cookbook': ['from-yellow-500 to-yellow-700', 'from-yellow-600 to-yellow-800'],
    'poetry': ['from-rose-500 to-rose-700', 'from-rose-600 to-rose-800'],
    'self-help': ['from-emerald-500 to-emerald-700', 'from-emerald-600 to-emerald-800'],
    'children': ['from-violet-500 to-violet-700', 'from-violet-600 to-violet-800'],
    'classic': ['from-stone-500 to-stone-700', 'from-stone-600 to-stone-800'],
  };
  
  const genreKey = genre?.toLowerCase() || 'fiction';
  const colorSet = colors[genreKey as keyof typeof colors] || colors.fiction;
  return colorSet[Math.floor(Math.random() * colorSet.length)];
};

const getBookHeight = (index: number) => {
  const heights = ['h-32', 'h-36', 'h-40', 'h-44', 'h-48', 'h-52'];
  return heights[index % heights.length];
};

const getBookWidth = (title: string) => {
  const lengths = title.length;
  if (lengths < 15) return 'w-8';
  if (lengths < 25) return 'w-10';
  if (lengths < 35) return 'w-12';
  return 'w-14';
};

const BookSpine: React.FC<BookSpineProps> = ({ book, onEdit, onDelete, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const height = getBookHeight(index);
  const width = getBookWidth(book.title);
  const gradient = getGenreColor(book.genre);
  
  const getStatusColor = () => {
    switch (book.status) {
      case 'available': return 'bg-green-500';
      case 'checked_out': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'borrowed': return 'bg-blue-500';
      case 'return_pending': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="relative group">
      <div
        className={`${height} ${width} relative cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowMenu(!showMenu)}
      >
        {/* Book spine */}
        <div className={`h-full w-full bg-gradient-to-b ${gradient} rounded-t-sm shadow-lg relative overflow-hidden`}>
          {/* Book binding edges */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20"></div>
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
          
          {/* Status indicator */}
          <div className={`absolute top-2 right-1 w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          
          {/* Free to good home indicator */}
          {book.is_free_to_good_home && (
            <div className="absolute top-4 right-1">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
          )}
          
          {/* Book spine text - improved vertical layout */}
          <div className="p-2 h-full flex flex-col justify-between text-white">
            <div className="flex-1 flex items-center justify-center">
              <div className="transform -rotate-90 text-center">
                <div className="text-xs font-bold mb-1 text-shadow-sm">
                  {truncateText(book.title, 20)}
                </div>
                <div className="text-xs opacity-80 text-shadow-sm">
                  {truncateText(book.author, 15)}
                </div>
              </div>
            </div>
            
            {/* Genre label at bottom */}
            <div className="text-xs opacity-70 text-center mt-auto transform rotate-90">
              {book.genre?.slice(0, 6) || 'Book'}
            </div>
          </div>
          
          {/* Highlight overlay */}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/10 to-transparent"></div>
          
          {/* Book texture */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        </div>
        
        {/* Book shadow */}
        <div className="absolute -bottom-2 left-1 right-1 h-2 bg-black/20 rounded-full blur-sm"></div>
      </div>

      {/* Mobile-friendly hover tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 hidden md:block">
          <div className="bg-black/90 text-white p-3 rounded-lg shadow-xl max-w-xs">
            <h4 className="font-bold text-sm mb-1">{book.title}</h4>
            <p className="text-xs opacity-80 mb-2">by {book.author}</p>
            <div className="flex items-center space-x-2 text-xs flex-wrap">
              <span className={`px-2 py-1 rounded-full text-white ${getStatusColor()}`}>
                {book.status}
              </span>
              {book.genre && (
                <span className="px-2 py-1 bg-gray-600 rounded-full">
                  {book.genre}
                </span>
              )}
            </div>
            {book.notes && (
              <p className="text-xs opacity-70 mt-2 italic">"{book.notes}"</p>
            )}
          </div>
        </div>
      )}

      {/* Action menu - improved for mobile */}
      {showMenu && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[150px]">
            <div className="p-2 bg-gray-50 border-b">
              <h5 className="font-semibold text-sm text-gray-800 truncate">{book.title}</h5>
              <p className="text-xs text-gray-600 truncate">by {book.author}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(book);
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Book</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(book.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-2 text-sm text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Book</span>
            </button>
          </div>
        </div>
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
  const [booksPerShelf, setBooksPerShelf] = useState(8);
  
  useEffect(() => {
    const updateBooksPerShelf = () => {
      setBooksPerShelf(window.innerWidth < 768 ? 6 : 8);
    };
    
    updateBooksPerShelf();
    window.addEventListener('resize', updateBooksPerShelf);
    
    return () => window.removeEventListener('resize', updateBooksPerShelf);
  }, []);
  
  const shelves = [];
  
  // Group books into shelves
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf));
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.relative')) {
        // Close any open menus - this is a simplified approach
        // In a real app, you'd manage this state more carefully
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div key={shelfIndex} className="relative">
          {/* Shelf background */}
          <div className="relative bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg p-4 shadow-lg">
            {/* Wood grain effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-transparent to-amber-900/20 rounded-lg"></div>
            
            {/* Books container - mobile optimized */}
            <div className="flex items-end justify-start space-x-1 min-h-[200px] overflow-x-auto pb-4">
              {/* Left bookend */}
              <div className="flex-shrink-0 w-4 md:w-6 h-40 md:h-48 bg-gradient-to-b from-stone-600 to-stone-800 rounded-sm shadow-lg mr-2">
                <div className="h-full w-full bg-gradient-to-r from-stone-500/20 to-stone-900/20 rounded-sm"></div>
              </div>
              
              {/* Books */}
              {shelfBooks.map((book, bookIndex) => (
                <BookSpine
                  key={book.id}
                  book={book}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  index={shelfIndex * booksPerShelf + bookIndex}
                />
              ))}
              
              {/* Right bookend */}
              <div className="flex-shrink-0 w-4 md:w-6 h-40 md:h-48 bg-gradient-to-b from-stone-600 to-stone-800 rounded-sm shadow-lg ml-2">
                <div className="h-full w-full bg-gradient-to-r from-stone-900/20 to-stone-500/20 rounded-sm"></div>
              </div>
            </div>
            
            {/* Shelf edge */}
            <div className="absolute -bottom-2 left-0 right-0 h-3 md:h-4 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-lg shadow-lg"></div>
          </div>
          
          {/* Shelf label */}
          <div className="text-center mt-4">
            <span className="text-xs md:text-sm font-medium text-amber-800 bg-amber-50 px-2 py-1 md:px-3 md:py-1 rounded-full">
              Shelf {shelfIndex + 1}
            </span>
          </div>
        </div>
      ))}
      
      {/* Empty shelf message */}
      {books.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg p-8 shadow-lg max-w-md mx-auto">
            <div className="text-amber-100 mb-4">
              <Book className="w-12 h-12 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-semibold mb-2">Empty Bookshelf</h3>
              <p className="text-sm opacity-80">Your books will appear here once you add them to your library.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};