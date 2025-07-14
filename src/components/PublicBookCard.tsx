'use client';

import React, { useState } from 'react';
import { Heart, User, Calendar, Package, MapPin } from 'lucide-react';

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

interface PublicBookCardProps {
  book: Book;
  onClaim: (bookId: string) => void;
  isLoggedIn: boolean;
}

export const PublicBookCard = ({ book, onClaim, isLoggedIn }: PublicBookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-emerald-100 text-emerald-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryIcon = () => {
    switch (book.delivery_method) {
      case 'pickup': return <MapPin className="w-3 h-3" />;
      case 'mail': return <Package className="w-3 h-3" />;
      case 'both': return <Package className="w-3 h-3" />;
      default: return <MapPin className="w-3 h-3" />;
    }
  };

  const getDeliveryText = () => {
    switch (book.delivery_method) {
      case 'pickup': return 'Pickup only';
      case 'mail': return 'Can mail';
      case 'both': return 'Pickup or mail';
      default: return 'Pickup';
    }
  };

  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/20 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Book Cover Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-center p-4">
          <div className="text-lg font-bold leading-tight mb-1 line-clamp-3">
            {book.title}
          </div>
          <div className="text-sm opacity-90 line-clamp-2">
            by {book.author}
          </div>
        </div>
        
        {/* Floating Heart Icon */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Book Details */}
      <div className="p-4 space-y-3">
        {/* Title and Author */}
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">
            by {book.author}
          </p>
        </div>

        {/* Book Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {book.publicationYear && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{book.publicationYear}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {getDeliveryIcon()}
            <span>{getDeliveryText()}</span>
          </div>
        </div>

        {/* Condition Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(book.condition)}`}>
            {book.condition} condition
          </span>
          
          {book.genre && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {book.genre}
            </span>
          )}
        </div>

        {/* Notes */}
        {book.notes && (
          <div className="text-xs text-gray-600 italic line-clamp-2">
            "{book.notes}"
          </div>
        )}

        {/* Claim Button */}
        <button
          onClick={() => onClaim(book.id)}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            isLoggedIn
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
          }`}
        >
          {isLoggedIn ? (
            <span className="flex items-center justify-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>I want this!</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4" />
              <span>Sign up to claim</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};