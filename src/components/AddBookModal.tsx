'use client';

import React, { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

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

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: (book: Book) => void;
}

export function AddBookModal({ isOpen, onClose, onBookAdded }: AddBookModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    publicationYear: '',
    condition: 'good',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [error, setError] = useState('');
  const lookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const genreOptions = [
    { value: 'fiction', label: 'Fiction' },
    { value: 'non-fiction', label: 'Non-Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'romance', label: 'Romance' },
    { value: 'science-fiction', label: 'Science Fiction' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'biography', label: 'Biography' },
    { value: 'history', label: 'History' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

  // Google Books API lookup function
  const fetchBookDataFromISBN = async (isbn: string) => {
    try {
      setIsLookingUp(true);
      setError('');

      // Clean ISBN (remove hyphens/spaces)
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      
      if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
        throw new Error('Please enter a valid 10 or 13 digit ISBN');
      }

      // Call Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}&maxResults=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch book data');
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error('No book found with this ISBN');
      }

      const book = data.items[0].volumeInfo;
      const filledFields: string[] = [];

      // Auto-populate form data (only if fields are empty)
      const updates: any = {};

      if (book.title && !formData.title) {
        updates.title = book.title;
        filledFields.push('title');
      }

      if (book.authors && book.authors.length > 0 && !formData.author) {
        updates.author = book.authors.join(', ');
        filledFields.push('author');
      }

      if (book.publishedDate && !formData.publicationYear) {
        const year = new Date(book.publishedDate).getFullYear();
        if (!isNaN(year)) {
          updates.publicationYear = year.toString();
          filledFields.push('publicationYear');
        }
      }

      if (book.categories && book.categories.length > 0 && !formData.genre) {
        const category = book.categories[0].toLowerCase();
        
        // Map Google Books categories to our genre options
        const genreMap: { [key: string]: string } = {
          'fiction': 'fiction',
          'biography': 'biography',
          'history': 'history',
          'science': 'science-fiction',
          'business': 'business',
          'self-help': 'self-help',
          'technology': 'technology',
          'computers': 'technology',
          'mystery': 'mystery',
          'romance': 'romance',
          'fantasy': 'fantasy'
        };

        const mappedGenre = Object.keys(genreMap).find(key => 
          category.includes(key)
        );

        if (mappedGenre) {
          updates.genre = genreMap[mappedGenre];
          filledFields.push('genre');
        }
      }

      // Update form data
      setFormData(prev => ({ ...prev, ...updates }));
      setAutoFilledFields(filledFields);

      console.log('Book data fetched successfully:', book);

    } catch (error: any) {
      console.error('ISBN lookup error:', error);
      setError(error.message || 'Failed to fetch book data');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleISBNChange = (value: string) => {
    setFormData(prev => ({ ...prev, isbn: value }));
    setAutoFilledFields([]); // Clear auto-fill indicators when ISBN changes
  };

  // Manual lookup button handler
  const handleManualLookup = () => {
    if (formData.isbn.trim()) {
      fetchBookDataFromISBN(formData.isbn.trim());
    }
  };

  const startBarcodeScanner = () => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera access is not available on this device. Please enter ISBN manually.');
      return;
    }

    // Detect if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Initialize scanner with specific camera settings
    const initScanner = (deviceId: string | null = null, useFacingMode: boolean = false) => {
      // Create scanner modal
      const scannerModal = document.createElement('div');
      scannerModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
      scannerModal.innerHTML = `
        <div class="relative w-full max-w-md mx-4">
          <div class="bg-white p-4 rounded-t-lg">
            <h3 class="text-lg font-semibold text-center text-gray-900">Scan Barcode</h3>
            <p class="text-sm text-gray-600 text-center">Position barcode in the center</p>
          </div>
          <div id="scanner-container" class="relative bg-black h-96">
            <video id="scanner-video" class="w-full h-full object-cover" autoplay playsinline muted></video>
            <div class="absolute inset-0 border-2 border-red-500 m-8 rounded-lg pointer-events-none"></div>
          </div>
          <div class="bg-white p-4 rounded-b-lg text-center">
            <p class="text-sm text-gray-600">Click outside to cancel or press Escape</p>
          </div>
        </div>
      `;

      document.body.appendChild(scannerModal);

      // Track if we've already detected a barcode to prevent multiple detections
      let hasDetected = false;

      // FIXED: Create centralized cleanup function
      const cleanup = () => {
        try {
          if ((window as any).Quagga) {
            (window as any).Quagga.stop();
          }
        } catch (e: any) {
          console.log('Quagga cleanup error:', e);
        }
        if (document.body.contains(scannerModal)) {
          document.body.removeChild(scannerModal);
        }
      };

      // FIXED: Simple event delegation - background click only
      scannerModal.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        
        // If clicking the background (but not the modal content)
        if (target === scannerModal) {
          cleanup();
        }
      });

      // FIXED: Add escape key handler
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Initialize Quagga with specific camera settings
      const initQuagga = async () => {
        try {
          const Quagga = (await import('quagga')).default;
          
          let constraints: any;
          
          if (useFacingMode) {
            // Mobile: Use facingMode for rear camera
            constraints = {
              width: 320,
              height: 240,
              facingMode: "environment"
            };
          } else if (deviceId) {
            // Desktop: Use specific device ID
            constraints = {
              width: 320,
              height: 240,
              deviceId: { exact: deviceId }
            };
          } else {
            // Fallback: Use default with environment preference
            constraints = {
              width: 320,
              height: 240,
              facingMode: "environment"
            };
          }
          
          Quagga.init({
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: document.querySelector('#scanner-container'),
              constraints: constraints
            },
            locator: {
              patchSize: "medium",
              halfSample: true
            },
            numOfWorkers: 2,
            decoder: {
              readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader"]
            },
            locate: true
          }, (err: any) => {
            if (err) {
              console.error('Scanner initialization failed:', err);
              alert('Camera access failed. Please ensure you have granted camera permissions and try again.');
              cleanup();
              return;
            }
            console.log('Scanner initialized successfully');
            Quagga.start();
          });

          // Handle barcode detection - FIXED to prevent multiple detections
          Quagga.onDetected((result: any) => {
            // Prevent multiple detections
            if (hasDetected) return;
            hasDetected = true;
            
            const code = result.codeResult.code;
            console.log('Barcode detected:', code);
            
            // Stop scanner and cleanup
            cleanup();
            document.removeEventListener('keydown', handleEscape);
            
            // Set ISBN and trigger lookup ONCE
            setFormData(prev => ({ ...prev, isbn: code }));
            
            // Use a longer delay to ensure state is set
            setTimeout(() => {
              fetchBookDataFromISBN(code);
            }, 500);
          });
        } catch (error) {
          console.error('Error initializing scanner:', error);
          alert('Scanner not available. Please enter ISBN manually.');
          cleanup();
        }
      };

      // Initialize Quagga after DOM is ready
      initQuagga();
    };

    // Show camera selection for desktop
    const showCameraSelection = (cameras: MediaDeviceInfo[]) => {
      const selectionModal = document.createElement('div');
      selectionModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
      
      const cameraOptions = cameras.map((camera: MediaDeviceInfo, index: number) => 
        `<button class="camera-option block w-full p-3 mb-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" data-device-id="${camera.deviceId}">
          ${camera.label || `Camera ${index + 1}`}
        </button>`
      ).join('');
      
      selectionModal.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold text-center text-gray-900 mb-4">Choose Camera</h3>
          <div class="space-y-2">
            ${cameraOptions}
          </div>
          <button id="cancel-camera-selection" class="block w-full p-3 mt-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      `;
      
      document.body.appendChild(selectionModal);
      
      // FIXED: Use event delegation for camera selection too
      selectionModal.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target && target.classList.contains('camera-option')) {
          const deviceId = target.getAttribute('data-device-id');
          document.body.removeChild(selectionModal);
          initScanner(deviceId, false);
        } else if (target && (target.id === 'cancel-camera-selection' || target === selectionModal)) {
          document.body.removeChild(selectionModal);
        }
      });
    };

    // Main logic
    if (isMobile) {
      // On mobile, directly start with rear camera
      initScanner(null, true);
    } else {
      // On desktop, show camera selection if multiple cameras
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const cameras = devices.filter(device => device.kind === 'videoinput');
          
          if (cameras.length <= 1) {
            initScanner(); // Use default camera
          } else {
            showCameraSelection(cameras); // Show selection for multiple cameras
          }
        })
        .catch(err => {
          console.error('Error getting cameras:', err);
          initScanner(); // Fallback to default
        });
    }
  };

  const handleBarcodeDetected = (isbn: string) => {
    console.log('Barcode detected:', isbn); // Debug log
    
    // Set ISBN only once
    setFormData(prev => ({ ...prev, isbn }));
    
    // Clear any existing timeout to prevent multiple calls
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }
    
    // Set a single timeout for lookup
    lookupTimeoutRef.current = setTimeout(() => {
      console.log('Triggering lookup for ISBN:', isbn); // Debug log
      fetchBookDataFromISBN(isbn);
      lookupTimeoutRef.current = null;
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        genre: formData.genre || undefined,
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        condition: formData.condition,
        notes: formData.notes.trim() || undefined
      };

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bookData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add book');
      }

      onBookAdded(result.book);
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        genre: '',
        publicationYear: '',
        condition: 'good',
        notes: ''
      });
      setAutoFilledFields([]);
      onClose();

    } catch (error: any) {
      console.error('Add book error:', error);
      setError(error.message || 'Failed to add book');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add New Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Auto-fill success message */}
          {autoFilledFields.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                📚 Auto-filled {autoFilledFields.join(', ')} from ISBN lookup! You can edit any field.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ISBN Field with Lookup AND Scanner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => handleISBNChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="978-0-123456-78-9"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={startBarcodeScanner}
                  className="whitespace-nowrap"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Scan
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleManualLookup}
                  disabled={!formData.isbn.trim() || isLookingUp}
                  className="whitespace-nowrap"
                >
                  {isLookingUp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Looking up...
                    </>
                  ) : (
                    <>📚 Lookup</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Scan barcode or enter ISBN manually - we'll auto-fill book details from Google Books
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                  {autoFilledFields.includes('title') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                  {autoFilledFields.includes('author') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre
                  {autoFilledFields.includes('genre') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select genre</option>
                  {genreOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publication Year
                  {autoFilledFields.includes('publicationYear') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicationYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="2023"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Any additional notes about this book..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Book'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}