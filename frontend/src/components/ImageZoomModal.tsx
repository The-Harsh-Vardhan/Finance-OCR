import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCw, X, RefreshCw } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  title?: string;
  altText?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  title = 'Uploaded Bahi-Khata Scan',
  altText = 'Uploaded image full preview'
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const toggleBrowserFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsBrowserFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsBrowserFullscreen(false)).catch(() => {});
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Top Controls Header */}
      <div
        ref={containerRef}
        className="w-full max-w-6xl mx-auto flex items-center justify-between bg-slate-900/90 text-white px-4 py-3 rounded-2xl border border-slate-800 shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3">
          <span className="font-bold text-sm text-slate-100 truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
          <span className="bg-blue-600/30 text-blue-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-blue-500/30 hidden sm:inline-block">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="Zoom Out (-)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white transition-all active:scale-95"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset Zoom Button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset Zoom & Rotation"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all active:scale-95 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4.0}
            title="Zoom In (+)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white transition-all active:scale-95"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotate Button */}
          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1" />

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            title={isBrowserFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95 shadow-sm"
          >
            {isBrowserFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-all active:scale-95 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div
        className="flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-2 sm:my-4 overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 relative cursor-grab active:cursor-grabbing select-none"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`
          }}
        >
          <img
            src={imageSrc}
            alt={altText}
            className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl pointer-events-none"
          />
        </div>

        {/* Floating helper note */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/75 backdrop-blur text-slate-400 text-[11px] font-medium px-3 py-1 rounded-full border border-slate-800/80 shadow-lg pointer-events-none">
          Scroll to zoom • {zoom > 1 ? 'Drag to pan' : 'Use controls to zoom/rotate'}
        </div>
      </div>
    </div>
  );
};
