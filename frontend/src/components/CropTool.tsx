import React, { useState, useRef, useEffect } from 'react';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '9:16';

interface CropToolProps {
  imageWidth: number;
  imageHeight: number;
  onCropApply: (cropArea: CropArea) => void;
  onCropCancel: () => void;
}

type DragHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move' | null;

const CropTool: React.FC<CropToolProps> = ({ imageWidth, imageHeight, onCropApply, onCropCancel }) => {
  const [cropArea, setCropArea] = useState<CropArea>({
    x: imageWidth * 0.1,
    y: imageHeight * 0.1,
    width: imageWidth * 0.8,
    height: imageHeight * 0.8,
  });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea>(cropArea);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update crop area when aspect ratio changes
  useEffect(() => {
    if (aspectRatio === 'free') return;

    const ratios: Record<Exclude<AspectRatio, 'free'>, number> = {
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      '9:16': 9 / 16,
    };

    const ratio = ratios[aspectRatio];
    const centerX = cropArea.x + cropArea.width / 2;
    const centerY = cropArea.y + cropArea.height / 2;

    let newWidth = cropArea.width;
    let newHeight = cropArea.width / ratio;

    // If height exceeds image bounds, adjust based on height
    if (newHeight > imageHeight) {
      newHeight = imageHeight * 0.8;
      newWidth = newHeight * ratio;
    }

    // If width exceeds image bounds, adjust based on width
    if (newWidth > imageWidth) {
      newWidth = imageWidth * 0.8;
      newHeight = newWidth / ratio;
    }

    let newX = centerX - newWidth / 2;
    let newY = centerY - newHeight / 2;

    // Ensure crop area stays within image bounds
    newX = Math.max(0, Math.min(newX, imageWidth - newWidth));
    newY = Math.max(0, Math.min(newY, imageHeight - newHeight));

    setCropArea({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  }, [aspectRatio, imageWidth, imageHeight]);

  const handleMouseDown = (e: React.MouseEvent, handle: DragHandle) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop(cropArea);
  };

  const handleTouchStart = (e: React.TouchEvent, handle: DragHandle) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragHandle(handle);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setInitialCrop(cropArea);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragHandle) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      let newCrop = { ...initialCrop };

      if (dragHandle === 'move') {
        newCrop.x = Math.max(0, Math.min(initialCrop.x + deltaX, imageWidth - initialCrop.width));
        newCrop.y = Math.max(0, Math.min(initialCrop.y + deltaY, imageHeight - initialCrop.height));
      } else {
        // Handle resize based on handle position
        if (dragHandle.includes('l')) {
          const newX = Math.max(0, Math.min(initialCrop.x + deltaX, initialCrop.x + initialCrop.width - 50));
          newCrop.width = initialCrop.width + (initialCrop.x - newX);
          newCrop.x = newX;
        }
        if (dragHandle.includes('r')) {
          newCrop.width = Math.max(50, Math.min(initialCrop.width + deltaX, imageWidth - initialCrop.x));
        }
        if (dragHandle.includes('t')) {
          const newY = Math.max(0, Math.min(initialCrop.y + deltaY, initialCrop.y + initialCrop.height - 50));
          newCrop.height = initialCrop.height + (initialCrop.y - newY);
          newCrop.y = newY;
        }
        if (dragHandle.includes('b')) {
          newCrop.height = Math.max(50, Math.min(initialCrop.height + deltaY, imageHeight - initialCrop.y));
        }

        // Apply aspect ratio constraint
        if (aspectRatio !== 'free') {
          const ratios: Record<Exclude<AspectRatio, 'free'>, number> = {
            '1:1': 1,
            '4:3': 4 / 3,
            '16:9': 16 / 9,
            '9:16': 9 / 16,
          };
          const ratio = ratios[aspectRatio];

          if (dragHandle.includes('l') || dragHandle.includes('r')) {
            newCrop.height = newCrop.width / ratio;
            if (dragHandle.includes('t')) {
              newCrop.y = initialCrop.y + initialCrop.height - newCrop.height;
            }
          } else {
            newCrop.width = newCrop.height * ratio;
            if (dragHandle.includes('l')) {
              newCrop.x = initialCrop.x + initialCrop.width - newCrop.width;
            }
          }

          // Ensure crop stays within bounds
          if (newCrop.x + newCrop.width > imageWidth) {
            newCrop.width = imageWidth - newCrop.x;
            newCrop.height = newCrop.width / ratio;
          }
          if (newCrop.y + newCrop.height > imageHeight) {
            newCrop.height = imageHeight - newCrop.y;
            newCrop.width = newCrop.height * ratio;
          }
        }
      }

      setCropArea(newCrop);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !dragHandle) return;
      const touch = e.touches[0];
      handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragHandle, dragStart, initialCrop, imageWidth, imageHeight, aspectRatio]);

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
  };

  const handleApply = () => {
    onCropApply(cropArea);
  };

  const handleCancel = () => {
    onCropCancel();
  };

  return (
    <div className="absolute inset-0 z-10">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <mask id="cropMask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={cropArea.x}
                y={cropArea.y}
                width={cropArea.width}
                height={cropArea.height}
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="black" opacity="0.6" mask="url(#cropMask)" />
        </svg>
      </div>

      {/* Crop area with grid */}
      <div
        ref={containerRef}
        className="absolute"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
        }}
      >
        {/* Border */}
        <div className="absolute inset-0 border-2 border-white shadow-lg pointer-events-none" />

        {/* Rule of thirds grid */}
        <svg className="absolute inset-0 pointer-events-none z-5" width="100%" height="100%">
          <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="white" strokeWidth="1" opacity="0.5" />
        </svg>

        {/* Draggable area - fills the entire crop box */}
        <div
          className="absolute inset-0 cursor-move z-0"
          onMouseDown={(e) => {
            handleMouseDown(e, 'move');
          }}
          onTouchStart={(e) => {
            handleTouchStart(e, 'move');
          }}
        />

        {/* Drag handles */}
        {/* Corners */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-10"
          style={{ left: -8, top: -8 }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'tl'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'tl'); }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize z-10"
          style={{ right: -8, top: -8 }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'tr'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'tr'); }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize z-10"
          style={{ left: -8, bottom: -8 }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'bl'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'bl'); }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-10"
          style={{ right: -8, bottom: -8 }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'br'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'br'); }}
        />

        {/* Edges */}
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ns-resize z-10"
          style={{ left: '50%', top: -8, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 't'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 't'); }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ns-resize z-10"
          style={{ left: '50%', bottom: -8, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'b'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'b'); }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize z-10"
          style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'l'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'l'); }}
        />
        <div
          className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ew-resize z-10"
          style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'r'); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e, 'r'); }}
        />
      </div>

      {/* Control panel */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-xl rounded-xl p-3 shadow-2xl border border-slate-700/50 z-20">
        <div className="flex items-center gap-3">
          {/* Aspect ratio selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-300">Proporcje:</label>
            <select
              value={aspectRatio}
              onChange={(e) => handleAspectRatioChange(e.target.value as AspectRatio)}
              className="px-2 py-1 text-xs bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Swobodne</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleApply}
              className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Zastosuj
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropTool;

