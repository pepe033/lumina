import React, { useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
import type { StickerLayer } from '../types';

interface StickerEditorProps {
  sticker: StickerLayer;
  onUpdate: (id: string, updates: Partial<StickerLayer>) => void;
  onDelete: (id: string) => void;
  isActive: boolean;
  setActive: () => void;
}

const StickerEditor: React.FC<StickerEditorProps> = ({ sticker, onUpdate, onDelete, isActive, setActive }) => {
  const { id, src, x, y, width, height, rotation, opacity } = sticker;
  const targetRef = useRef<HTMLDivElement>(null);

  // Track current transform state
  const transformRef = useRef({ x, y, width, height, rotation });

  // Update transform ref when props change
  useEffect(() => {
    transformRef.current = { x, y, width, height, rotation };
  }, [x, y, width, height, rotation]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width,
    height,
    transform: `rotate(${rotation}deg)`,
    opacity,
    pointerEvents: 'auto',
    cursor: isActive ? 'move' : 'pointer',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <>
      <div
        ref={targetRef}
        style={containerStyle}
        onClick={setActive}
        data-sticker-id={id}
      >
        <img src={src} alt="Sticker" style={imageStyle} draggable={false} />
        {isActive && (
          <button
            onClick={handleDelete}
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
      {isActive && targetRef.current && (
        <Moveable
          target={targetRef.current}
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
            target.style.height = `${height}px`;
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
            onUpdate(id, {
              x: transformRef.current.x,
              y: transformRef.current.y,
            });
          }}

          onResizeEnd={() => {
            onUpdate(id, {
              x: transformRef.current.x,
              y: transformRef.current.y,
              width: transformRef.current.width,
              height: transformRef.current.height,
            });
          }}

          onRotateEnd={() => {
            onUpdate(id, {
              rotation: transformRef.current.rotation,
            });
          }}

          renderDirections={['nw', 'ne', 'sw', 'se']}
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}

          // Styling
          className="moveable-sticker"
        />
      )}
    </>
  );
};

export default StickerEditor;
