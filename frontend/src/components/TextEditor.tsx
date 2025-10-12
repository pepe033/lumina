import React, { useState, useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track current transform state
  const transformRef = useRef({ x: layer.x, y: layer.y, width: layer.width, height: layer.height, rotation: layer.rotation });

  // Update transform ref when props change
  useEffect(() => {
    transformRef.current = { x: layer.x, y: layer.y, width: layer.width, height: layer.height, rotation: layer.rotation };
  }, [layer.x, layer.y, layer.width, layer.height, layer.rotation]);

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
    lineHeight: 1.2,
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x,
    top: layer.y,
    width: layer.width,
    minHeight: layer.height,
    transform: `rotate(${layer.rotation}deg)`,
    transformOrigin: 'center center',
    cursor: isActive && !isEditing ? 'move' : 'pointer',
    userSelect: isEditing ? 'text' : 'none',
    zIndex: isActive ? 1000 : 1,
    pointerEvents: 'auto',
  };

  return (
    <>
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

        {/* Delete button when active */}
        {isActive && !isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 20,
              height: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              fontSize: '12px',
              fontWeight: 'bold',
              lineHeight: 1,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Moveable handles - only when active and not editing */}
      {isActive && !isEditing && containerRef.current && (
        <Moveable
          target={containerRef.current}
          draggable={true}
          resizable={true}
          rotatable={true}
          keepRatio={false}
          origin={false}

          onDrag={({ target, left, top }) => {
            transformRef.current.x = left;
            transformRef.current.y = top;
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
          }}

          onResize={({ target, width, height, drag }) => {
            transformRef.current.width = width;
            transformRef.current.height = height;
            transformRef.current.x = drag.left;
            transformRef.current.y = drag.top;

            target.style.width = `${width}px`;
            target.style.minHeight = `${height}px`;
            target.style.left = `${drag.left}px`;
            target.style.top = `${drag.top}px`;
          }}

          onRotate={({ target, transform }) => {
            // Extract rotation from transform string
            const match = transform.match(/rotate\(([-\d.]+)deg\)/);
            if (match) {
              transformRef.current.rotation = parseFloat(match[1]);
            }
            target.style.transform = transform;
          }}

          onDragEnd={() => {
            onUpdate({
              x: transformRef.current.x,
              y: transformRef.current.y,
            });
          }}

          onResizeEnd={() => {
            onUpdate({
              x: transformRef.current.x,
              y: transformRef.current.y,
              width: transformRef.current.width,
              height: transformRef.current.height,
            });
          }}

          onRotateEnd={() => {
            onUpdate({
              rotation: transformRef.current.rotation,
            });
          }}

          renderDirections={['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e']}
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
        />
      )}
    </>
  );
};

export default TextEditor;

