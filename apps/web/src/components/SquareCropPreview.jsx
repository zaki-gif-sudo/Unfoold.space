import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Move } from 'lucide-react';

const SquareCropPreview = forwardRef(({ src }, ref) => {
  const containerRef = useRef(null);
  const imgNaturalRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const [renderState, setRenderState] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const nat = { w: img.naturalWidth, h: img.naturalHeight };
      imgNaturalRef.current = nat;
      const cs = containerRef.current?.offsetWidth || 150;
      const scale = Math.max(cs / nat.w, cs / nat.h);
      const off = { x: (cs - nat.w * scale) / 2, y: (cs - nat.h * scale) / 2 };
      offsetRef.current = off;
      setRenderState({ nat, offset: off, scale, cs });
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = cx - dragStart.current.x;
      const dy = cy - dragStart.current.y;
      const nat = imgNaturalRef.current;
      const cs = containerRef.current?.offsetWidth || 150;
      if (!nat) return;
      const s = Math.max(cs / nat.w, cs / nat.h);
      const nx = Math.min(0, Math.max(cs - nat.w * s, dragStart.current.ox + dx));
      const ny = Math.min(0, Math.max(cs - nat.h * s, dragStart.current.oy + dy));
      const off = { x: nx, y: ny };
      offsetRef.current = off;
      setRenderState(prev => prev ? { ...prev, offset: off } : null);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleDown = (e) => {
    e.preventDefault();
    dragging.current = true;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: cx, y: cy, ox: offsetRef.current.x, oy: offsetRef.current.y };
  };

  useImperativeHandle(ref, () => ({
    getCroppedBlob: () => new Promise((resolve) => {
      const nat = imgNaturalRef.current;
      if (!nat || !containerRef.current) { resolve(null); return; }
      const cs = containerRef.current.offsetWidth;
      const s = Math.max(cs / nat.w, cs / nat.h);
      const srcX = -offsetRef.current.x / s;
      const srcY = -offsetRef.current.y / s;
      const srcSize = cs / s;
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, 1080, 1080);
        canvas.toBlob(resolve, 'image/jpeg', 0.92);
      };
      img.src = src;
    })
  }), [src]);

  const isDraggable = renderState && (
    (renderState.nat.w * renderState.scale > renderState.cs + 1) ||
    (renderState.nat.h * renderState.scale > renderState.cs + 1)
  );

  return (
    <div
      ref={containerRef}
      className={`w-full aspect-square overflow-hidden rounded-lg relative select-none touch-none ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onMouseDown={isDraggable ? handleDown : undefined}
      onTouchStart={isDraggable ? handleDown : undefined}
    >
      {!renderState ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : (
        <>
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              width: renderState.nat.w * renderState.scale,
              height: renderState.nat.h * renderState.scale,
              left: renderState.offset.x,
              top: renderState.offset.y,
            }}
          />
          {isDraggable && (
            <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1 pointer-events-none">
              <Move size={10} />
            </div>
          )}
        </>
      )}
    </div>
  );
});

SquareCropPreview.displayName = 'SquareCropPreview';

export default SquareCropPreview;
