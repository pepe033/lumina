import React, { useRef, useEffect } from 'react';
import { Filter, FILTERS } from '../constants/filters';

interface FilterGalleryProps {
  originalImage: HTMLImageElement | null;
  activeFilterId: string;
  onFilterSelect: (filter: Filter) => void;
}

const FilterGallery: React.FC<FilterGalleryProps> = ({ originalImage, activeFilterId, onFilterSelect }) => {
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});

  // Generate thumbnails for each filter
  useEffect(() => {
    if (!originalImage) return;

    FILTERS.forEach((filter) => {
      const canvas = canvasRefs.current[filter.id];
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set thumbnail size
      const thumbSize = 80;
      canvas.width = thumbSize;
      canvas.height = thumbSize;

      // Calculate aspect ratio
      const scale = Math.min(thumbSize / originalImage.width, thumbSize / originalImage.height);
      const width = originalImage.width * scale;
      const height = originalImage.height * scale;
      const x = (thumbSize - width) / 2;
      const y = (thumbSize - height) / 2;

      // Draw image
      ctx.clearRect(0, 0, thumbSize, thumbSize);
      ctx.drawImage(originalImage, x, y, width, height);

      // Apply filter preview
      const imageData = ctx.getImageData(0, 0, thumbSize, thumbSize);
      const data = imageData.data;

      const adj = filter.adjustments;

      // Apply basic filter
      if (adj.filter === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
      } else if (adj.filter === 'sepia') {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
          data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
          data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
        }
      } else if (adj.filter === 'vintage') {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = Math.min(255, (0.393 * r + 0.769 * g + 0.189 * b) * 0.8);
          data[i + 1] = Math.min(255, (0.349 * r + 0.686 * g + 0.168 * b) * 0.8);
          data[i + 2] = Math.min(255, (0.272 * r + 0.534 * g + 0.131 * b) * 0.6);
        }
      }

      // Apply basic adjustments for preview
      const brightness = (adj.brightness || 0) / 100;
      const contrast = (adj.contrast || 0) / 100;
      const saturation = (adj.saturation || 0) / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Saturation
        if (saturation !== 0 && adj.filter !== 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const satFactor = 1 + saturation;
          r = gray + (r - gray) * satFactor;
          g = gray + (g - gray) * satFactor;
          b = gray + (b - gray) * satFactor;
        }

        // Brightness
        if (brightness !== 0) {
          const brightFactor = 1 + brightness;
          r *= brightFactor;
          g *= brightFactor;
          b *= brightFactor;
        }

        // Contrast
        if (contrast !== 0) {
          const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imageData, 0, 0);
    });
  }, [originalImage]);

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Filtry</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterSelect(filter)}
            className={`flex-shrink-0 transition-all duration-200 ${
              activeFilterId === filter.id
                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800'
                : 'hover:ring-2 hover:ring-slate-600 hover:ring-offset-2 hover:ring-offset-slate-800'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-20 h-20 rounded-lg overflow-hidden bg-slate-700/50 border-2 transition-all ${
                  activeFilterId === filter.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-slate-600/50 hover:border-slate-500'
                }`}
              >
                <canvas
                  ref={(el) => {
                    canvasRefs.current[filter.id] = el;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  activeFilterId === filter.id ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {filter.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterGallery;
