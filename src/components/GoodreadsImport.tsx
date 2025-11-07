'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';

interface GoodreadsImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedBook {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  personalRating?: number;
  readStatus?: 'want-to-read' | 'currently-reading' | 'read';
  readDate?: string;
  notes?: string;
  tags?: string[];
}

export function GoodreadsImport({ isOpen, onClose, onImportComplete }: GoodreadsImportProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedBooks, setParsedBooks] = useState<ParsedBook[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  const [errorSamples, setErrorSamples] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const parseCSV = (csvText: string): ParsedBook[] => {
    const lines = csvText.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty');
    }

    // Get headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Find column indices
    const getColumnIndex = (possibleNames: string[]) => {
      return possibleNames.map(name =>
        headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
      ).find(index => index !== -1) ?? -1;
    };

    const titleIdx = getColumnIndex(['title']);
    const authorIdx = getColumnIndex(['author']);
    const isbnIdx = getColumnIndex(['isbn13', 'isbn']);
    const publisherIdx = getColumnIndex(['publisher']);
    const yearIdx = getColumnIndex(['year published', 'publication year']);
    const ratingIdx = getColumnIndex(['my rating']);
    const shelfIdx = getColumnIndex(['exclusive shelf']);
    const readDateIdx = getColumnIndex(['date read']);
    const reviewIdx = getColumnIndex(['my review']);
    const notesIdx = getColumnIndex(['private notes']);
    const shelvesIdx = getColumnIndex(['bookshelves']);

    const books: ParsedBook[] = [];

    // Parse each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));

      // Extract book data
      const title = titleIdx >= 0 ? values[titleIdx] : '';
      const author = authorIdx >= 0 ? values[authorIdx] : '';

      if (!title || !author) continue; // Skip if no title/author

      const book: ParsedBook = {
        title,
        author,
      };

      // ISBN - handle both ISBN and ISBN13, prefer ISBN13
      // Goodreads exports ISBNs in Excel format: ="9781234567890"
      const cleanISBN = (value: string) => {
        // Remove Excel formula format: ="..." becomes just the number
        return value.replace(/^="|"$/g, '').replace(/[^0-9X]/gi, '');
      };

      // Try ISBN13 first (more accurate)
      const isbn13Idx = headers.findIndex(h => h.toLowerCase().includes('isbn13'));
      if (isbn13Idx >= 0 && values[isbn13Idx]) {
        const isbn = cleanISBN(values[isbn13Idx]);
        if (isbn.length === 13) {
          book.isbn = isbn;
        }
      }

      // Fall back to ISBN if ISBN13 not found
      if (!book.isbn && isbnIdx >= 0 && values[isbnIdx]) {
        const isbn = cleanISBN(values[isbnIdx]);
        if (isbn.length === 10 || isbn.length === 13) {
          book.isbn = isbn;
        }
      }

      // Publisher
      if (publisherIdx >= 0 && values[publisherIdx]) {
        book.publisher = values[publisherIdx];
      }

      // Publication Year
      if (yearIdx >= 0 && values[yearIdx]) {
        const year = parseInt(values[yearIdx]);
        if (!isNaN(year) && year > 1000 && year < 3000) {
          book.publicationYear = year;
        }
      }

      // Personal Rating (Goodreads uses 0-5, but 0 means unrated)
      if (ratingIdx >= 0 && values[ratingIdx]) {
        const rating = parseInt(values[ratingIdx]);
        if (!isNaN(rating) && rating > 0 && rating <= 5) {
          book.personalRating = rating;
        }
      }

      // Read Status (from Exclusive Shelf)
      if (shelfIdx >= 0 && values[shelfIdx]) {
        const shelf = values[shelfIdx].toLowerCase();
        if (shelf === 'to-read') book.readStatus = 'want-to-read';
        else if (shelf === 'currently-reading') book.readStatus = 'currently-reading';
        else if (shelf === 'read') book.readStatus = 'read';
      }

      // Read Date
      if (readDateIdx >= 0 && values[readDateIdx]) {
        book.readDate = values[readDateIdx];
      }

      // Notes (combine review and private notes)
      const notes: string[] = [];
      if (reviewIdx >= 0 && values[reviewIdx]) {
        notes.push(`Review: ${values[reviewIdx]}`);
      }
      if (notesIdx >= 0 && values[notesIdx]) {
        notes.push(values[notesIdx]);
      }
      if (notes.length > 0) {
        book.notes = notes.join('\n\n');
      }

      // Tags (from Bookshelves column)
      if (shelvesIdx >= 0 && values[shelvesIdx]) {
        book.tags = values[shelvesIdx].split(',').map(t => t.trim()).filter(Boolean);
      }

      books.push(book);
    }

    return books;
  };

  const handleParse = async () => {
    if (!file) return;

    setIsParsing(true);
    setError('');

    try {
      const text = await file.text();
      const books = parseCSV(text);

      if (books.length === 0) {
        throw new Error('No valid books found in CSV file');
      }

      setParsedBooks(books);
      setStep('preview');
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message || 'Failed to parse CSV file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!user || parsedBooks.length === 0) return;

    setIsImporting(true);
    setStep('importing');
    setError('');
    setImportProgress(0);

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Helper function to fetch genre from Google Books API
      const fetchGenreFromGoogle = async (isbn: string): Promise<string | undefined> => {
        if (!isbn) return undefined;

        try {
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
          );
          const data = await response.json();

          if (data.items && data.items[0]?.volumeInfo?.categories) {
            // Google Books returns categories array, take first one
            const category = data.items[0].volumeInfo.categories[0];

            // Map Google Books categories to our genre list
            const genreMapping: Record<string, string> = {
              'fiction': 'fiction',
              'literary fiction': 'fiction',
              'science fiction': 'science-fiction',
              'fantasy': 'fantasy',
              'mystery': 'mystery',
              'thriller': 'mystery',
              'romance': 'romance',
              'biography': 'biography',
              'autobiography': 'biography',
              'history': 'history',
              'self-help': 'self-help',
              'business': 'business',
              'non-fiction': 'non-fiction'
            };

            const lowerCategory = category.toLowerCase();
            for (const [key, value] of Object.entries(genreMapping)) {
              if (lowerCategory.includes(key)) {
                return value;
              }
            }

            // Default to non-fiction if we can't categorize
            return 'other';
          }
        } catch (error) {
          console.error('Error fetching genre from Google Books:', error);
        }
        return undefined;
      };

      // Import books one by one (show progress)
      for (let i = 0; i < parsedBooks.length; i++) {
        const book = parsedBooks[i];

        try {
          // Fetch genre from Google Books if ISBN exists and no genre from Goodreads
          let genre = book.genre;
          if (book.isbn && !genre) {
            genre = await fetchGenreFromGoogle(book.isbn);
          }

          const bookData = {
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: genre, // Include fetched or existing genre
            publisher: book.publisher,
            publicationYear: book.publicationYear,
            condition: 'good', // Default condition
            status: 'available', // Default status
            notes: book.notes,
            personalRating: book.personalRating,
            readStatus: book.readStatus,
            readDate: book.readDate,
            tags: book.tags?.join(', '),
            owned: false // Default to wishlist when importing from Goodreads
          };

          const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(bookData)
          });

          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMsg = `${book.title}: ${errorData.error || 'Unknown error'}`;

            // Collect first 5 errors to show in UI
            if (errors.length < 5) {
              errors.push(errorMsg);
            }

            console.error(`❌ Failed to import: ${book.title}`, {
              status: response.status,
              error: errorData,
              bookData
            });
          }
        } catch (err: any) {
          failedCount++;
          const errorMsg = `${book.title}: ${err.message || 'Network error'}`;

          // Collect first 5 errors to show in UI
          if (errors.length < 5) {
            errors.push(errorMsg);
          }

          console.error(`❌ Error importing ${book.title}:`, err);
        }

        // Update progress
        setImportProgress(Math.round(((i + 1) / parsedBooks.length) * 100));
      }

      setImportResults({ success: successCount, failed: failedCount });
      setErrorSamples(errors);
      setStep('complete');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import books');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (step === 'complete' && importResults.success > 0) {
      onImportComplete();
    }
    setFile(null);
    setParsedBooks([]);
    setStep('upload');
    setError('');
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6" />
            <h2 className="text-xl font-bold">Import from Goodreads</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Your Goodreads Export
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Go to Goodreads → My Books → Import/Export → Export Library
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                {file ? (
                  <div>
                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Click to upload CSV file
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      or drag and drop here
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file && (
                <button
                  onClick={handleParse}
                  disabled={isParsing}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Parsing CSV...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Parse File</span>
                    </>
                  )}
                </button>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  💡 What we'll import:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• Book titles and authors</li>
                  <li>• ISBNs (when available)</li>
                  <li>• Publication years and publishers</li>
                  <li>• Your ratings (1-5 stars)</li>
                  <li>• Read status (Want to Read, Currently Reading, Read)</li>
                  <li>• Reading dates</li>
                  <li>• Your reviews and notes</li>
                  <li>• Custom shelves as tags</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Import {parsedBooks.length} Books
                </h3>
                <p className="text-sm text-gray-600">
                  Review the books below and click "Import All" when ready
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-900">
                    Found {parsedBooks.length} books in your Goodreads export!
                  </p>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Title</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Author</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedBooks.slice(0, 50).map((book, idx) => (
                      <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{book.title}</td>
                        <td className="px-4 py-2 text-gray-600">{book.author}</td>
                        <td className="px-4 py-2">
                          {book.readStatus && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              book.readStatus === 'read' ? 'bg-green-100 text-green-700' :
                              book.readStatus === 'currently-reading' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {book.readStatus.replace('-', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {book.personalRating ? `⭐ ${book.personalRating}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedBooks.length > 50 && (
                  <div className="p-4 text-center text-sm text-gray-600 bg-gray-50">
                    ... and {parsedBooks.length - 50} more books
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Import All {parsedBooks.length} Books</span>
                </button>
                <button
                  onClick={() => setStep('upload')}
                  className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="space-y-6 text-center py-8">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Importing Books...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we add your books
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-lg font-medium text-gray-900">{importProgress}%</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="space-y-6 text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Import Complete!
                </h3>
                <p className="text-lg text-gray-600">
                  Successfully imported {importResults.success} books
                </p>
                {importResults.failed > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {importResults.failed} books failed to import
                  </p>
                )}
              </div>

              {/* Show error samples if any failed */}
              {errorSamples.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    ❌ Sample errors (first {errorSamples.length}):
                  </p>
                  <ul className="text-xs text-red-800 space-y-1">
                    {errorSamples.map((error, idx) => (
                      <li key={idx} className="font-mono">• {error}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-700 mt-3">
                    💡 Open browser console (F12) to see all errors in detail
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                View My Library
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
