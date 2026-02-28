'use client';

import { useState } from 'react';

interface ConceptImage {
  id: string;
  storage_path: string;
  resolution: string | null;
  signedUrl: string | null;
}

interface ConceptViewerProps {
  images: ConceptImage[];
}

export function ConceptViewer({ images }: ConceptViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="rounded-lg border bg-gray-100 p-8 text-center text-sm text-gray-500">
        No images generated yet.
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div>
      {/* Main Image */}
      <div className="mb-4 overflow-hidden rounded-lg border bg-gray-100">
        {selectedImage?.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selectedImage.signedUrl}
            alt="Concept"
            className="h-auto w-full"
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-500">
            Image unavailable
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                i === selectedIndex ? 'border-brand-500' : 'border-transparent'
              }`}
            >
              {img.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.signedUrl}
                  alt={`Concept ${i + 1}`}
                  className="h-16 w-16 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center bg-gray-200 text-xs text-gray-500">
                  {i + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Download */}
      {selectedImage?.signedUrl && (
        <div className="mt-4">
          <a
            href={selectedImage.signedUrl}
            download
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download {selectedImage.resolution ?? 'standard'} resolution
          </a>
        </div>
      )}
    </div>
  );
}
