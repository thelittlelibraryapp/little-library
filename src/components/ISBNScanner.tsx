'use client';

import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { X, Camera, Loader2 } from 'lucide-react';

interface ISBNScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onISBNDetected: (isbn: string) => void;
}

export function ISBNScanner({ isOpen, onClose, onISBNDetected }: ISBNScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner when modal closes
      Quagga.stop();
      return;
    }

    if (!scannerRef.current) return;

    setIsInitializing(true);
    setError('');

    // Initialize Quagga barcode scanner
    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment', // Use back camera on mobile
            aspectRatio: { min: 1, max: 2 }
          }
        },
        decoder: {
          readers: [
            'ean_reader', // EAN-13 (most common for books)
            'ean_8_reader', // EAN-8
            'upc_reader', // UPC
            'code_128_reader' // Code 128 (some ISBNs)
          ],
          debug: {
            drawBoundingBox: true,
            showFrequency: false,
            drawScanline: true,
            showPattern: false
          }
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10
      },
      (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          setError('Failed to access camera. Please check permissions.');
          setIsInitializing(false);
          return;
        }

        console.log('Quagga initialized successfully');
        setIsInitializing(false);
        Quagga.start();
      }
    );

    // Detect barcode
    Quagga.onDetected((result) => {
      if (result.codeResult && result.codeResult.code) {
        const code = result.codeResult.code;
        console.log('Barcode detected:', code);

        // Validate ISBN format (10 or 13 digits)
        if (/^\d{10}(\d{3})?$/.test(code)) {
          Quagga.stop();
          onISBNDetected(code);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      Quagga.stop();
    };
  }, [isOpen, onISBNDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="w-6 h-6" />
            <h2 className="text-xl font-bold">Scan ISBN Barcode</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {isInitializing && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
                  <p className="text-amber-800">Initializing camera...</p>
                </div>
              )}

              {/* Scanner viewport */}
              <div
                ref={scannerRef}
                className={`relative bg-black rounded-lg overflow-hidden ${
                  isInitializing ? 'hidden' : 'block'
                }`}
                style={{ minHeight: '400px' }}
              >
                {/* Overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="border-4 border-amber-500 rounded-lg w-64 h-32 shadow-lg"></div>
                </div>
              </div>

              {!isInitializing && (
                <div className="mt-6 text-center space-y-2">
                  <p className="text-amber-900 font-medium">
                    Point your camera at the ISBN barcode
                  </p>
                  <p className="text-sm text-amber-700">
                    The barcode is usually on the back cover near the price
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
