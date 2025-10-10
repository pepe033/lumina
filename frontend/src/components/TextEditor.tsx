import React, { useState, useRef, useEffect } from 'react';
import { TextLayer } from '../types';

interface TextEditorProps {
  layer: TextLayer;
  isActive: boolean;
  onUpdate: (updates: Partial<TextLayer>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  setActive: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  layer,
  isActive,
  onUpdate,
  onDelete,
  onDuplicate,
  setActive,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [rotationStart, setRotationStart] = useState({ angle: 0, centerX: 0, centerY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Handle click outside logic if needed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActive, isEditing]);

  // Double-click to edit
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) {
      setActive();
    }
    setIsEditing(true);
  };

  // Single click to select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive) {
      setActive();
    }
  };

  // Content change handler
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);
    const cursorPosition = range?.startOffset || 0;
    const currentNode = range?.startContainer;

    const newContent = e.currentTarget.textContent || '';
    onUpdate({ content: newContent });

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      if (contentRef.current && currentNode && selection && range) {
        try {
          // Find the text node and restore cursor position
          const textNodes = Array.from(contentRef.current.childNodes).filter(
            node => node.nodeType === Node.TEXT_NODE
          );

          if (textNodes.length > 0) {
            const targetNode = textNodes[0];
            const newRange = document.createRange();
            const safePosition = Math.min(cursorPosition, targetNode.textContent?.length || 0);
            newRange.setStart(targetNode, safePosition);
            newRange.setEnd(targetNode, safePosition);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } catch (error) {
          console.warn('Failed to restore cursor position:', error);
        }
      }
    });
  };

  // Blur handler - exit edit mode
  const handleBlur = () => {
    setIsEditing(false);
  };

  // ===== DRAG HANDLERS =====
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isActive) {
      setActive();
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - layer.x, y: e.clientY - layer.y });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      onUpdate({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragStart, layer.id, onUpdate]);

  // ===== RESIZE HANDLERS =====
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: layer.width,
      height: layer.height,
    });
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = layer.width;
      let newHeight = layer.height;
      let newX = layer.x;
      let newY = layer.y;

      // Handle different resize directions
      switch (isResizing) {
        case 'nw': // Top-left
          newWidth = Math.max(50, resizeStart.width - deltaX);
          newHeight = Math.max(30, resizeStart.height - deltaY);
          newX = layer.x + (layer.width - newWidth);
          newY = layer.y + (layer.height - newHeight);
          break;
        case 'ne': // Top-right
          newWidth = Math.max(50, resizeStart.width + deltaX);
          newHeight = Math.max(30, resizeStart.height - deltaY);
          newY = layer.y + (layer.height - newHeight);
          break;
        case 'sw': // Bottom-left
          newWidth = Math.max(50, resizeStart.width - deltaX);
          newHeight = Math.max(30, resizeStart.height + deltaY);
          newX = layer.x + (layer.width - newWidth);
          break;
        case 'se': // Bottom-right
          newWidth = Math.max(50, resizeStart.width + deltaX);
          newHeight = Math.max(30, resizeStart.height + deltaY);
          break;
        case 'n': // Top
          newHeight = Math.max(30, resizeStart.height - deltaY);
          newY = layer.y + (layer.height - newHeight);
          break;
        case 's': // Bottom
          newHeight = Math.max(30, resizeStart.height + deltaY);
          break;
        case 'w': // Left
          newWidth = Math.max(50, resizeStart.width - deltaX);
          newX = layer.x + (layer.width - newWidth);
          break;
        case 'e': // Right
          newWidth = Math.max(50, resizeStart.width + deltaX);
          break;
      }

      onUpdate({
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      });
    };

    const handleResizeEnd = () => {
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeStart, layer, onUpdate]);

  // ===== ROTATION HANDLERS =====
  const handleRotationStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);

    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    setRotationStart({
      angle: angle - layer.rotation,
      centerX,
      centerY,
    });
  };

  useEffect(() => {
    if (!isRotating) return;

    const handleRotationMove = (e: MouseEvent) => {
      const currentAngle = Math.atan2(
        e.clientY - rotationStart.centerY,
        e.clientX - rotationStart.centerX
      ) * (180 / Math.PI);

      let newRotation = currentAngle - rotationStart.angle;

      // Snap to 15-degree increments when Shift is held
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }

      // Normalize to -180 to 180
      while (newRotation > 180) newRotation -= 360;
      while (newRotation < -180) newRotation += 360;

      onUpdate({ rotation: newRotation });
    };

    const handleRotationEnd = () => {
      setIsRotating(false);
    };

    document.addEventListener('mousemove', handleRotationMove);
    document.addEventListener('mouseup', handleRotationEnd);

    return () => {
      document.removeEventListener('mousemove', handleRotationMove);
      document.removeEventListener('mouseup', handleRotationEnd);
    };
  }, [isRotating, rotationStart, layer.id, onUpdate]);

  // Build text styles
  const textStyle: React.CSSProperties = {
    fontSize: `${layer.fontSize}px`,
    fontFamily: layer.fontFamily,
    color: layer.color,
    fontWeight: layer.bold ? 'bold' : 'normal',
    fontStyle: layer.italic ? 'italic' : 'normal',
    textDecoration: layer.underline ? 'underline' : 'none',
    textAlign: layer.align,
    opacity: layer.opacity,
    WebkitTextStroke: layer.strokeWidth > 0 ? `${layer.strokeWidth}px ${layer.strokeColor}` : 'none',
    textShadow:
      layer.shadowBlur > 0 || layer.shadowX !== 0 || layer.shadowY !== 0
        ? `${layer.shadowX}px ${layer.shadowY}px ${layer.shadowBlur}px ${layer.shadowColor}`
        : 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    outline: 'none',
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${layer.x}px`,
    top: `${layer.y}px`,
    width: `${layer.width}px`,
    minHeight: `${layer.height}px`,
    transform: `rotate(${layer.rotation}deg)`,
    transformOrigin: 'center center',
    cursor: isDragging ? 'grabbing' : isActive ? 'move' : 'pointer',
    userSelect: isEditing ? 'text' : 'none',
    zIndex: isActive ? 1000 : 1,
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="text-layer-container"
    >
      {/* Main content area */}
      <div
        ref={contentRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={handleContentChange}
        onBlur={handleBlur}
        style={textStyle}
        className={`
          px-2 py-1 min-h-full
          ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${isEditing ? 'bg-white/10' : ''}
        `}
      >
        {layer.content}
      </div>

      {/* Control handles - only visible when active and not editing */}
      {isActive && !isEditing && (
        <>
          {/* Drag handle - top bar */}
          <div
            onMouseDown={handleDragStart}
            className="absolute -top-8 left-0 right-0 h-6 bg-blue-500/80 rounded-t cursor-move flex items-center justify-center text-white text-xs font-semibold"
            style={{ transform: `rotate(-${layer.rotation}deg)`, transformOrigin: 'bottom center' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Rotation handle - top center */}
          <div
            onMouseDown={handleRotationStart}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full cursor-pointer hover:bg-green-600 transition-colors flex items-center justify-center"
            title="Przeciągnij aby obrócić (Shift = co 15°)"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          {/* 8 Resize handles */}
          {/* Corners */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:scale-125 transition-transform"
          />

          {/* Sides */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-n-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 's')}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-s-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-w-resize hover:scale-125 transition-transform"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-e-resize hover:scale-125 transition-transform"
          />
        </>
      )}
    </div>
  );
};

export default TextEditor;

