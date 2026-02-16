import React, { useState, useRef } from 'react';
import { ZoomIn } from 'lucide-react';

const ImageMagnifier = ({ 
  src, 
  alt, 
  magnifierSize = 180,
  zoomLevel = 2.5,
  className = ""
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;

    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // Calculate cursor position relative to image
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    // Set magnifier position (centered on cursor)
    setMagnifierPosition({
      x: e.clientX - left - magnifierSize / 2,
      y: e.clientY - top - magnifierSize / 2
    });
    
    // Set background position for zoom effect
    setCursorPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setShowMagnifier(true);
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Image */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-auto object-cover cursor-zoom-in"
        draggable={false}
      />
      
      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <ZoomIn className="w-4 h-4" />
        <span>Hover to zoom</span>
      </div>

      {/* Magnifier lens */}
      {showMagnifier && (
        <div
          className="absolute pointer-events-none border-4 border-white shadow-2xl rounded-full"
          style={{
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
            left: `${magnifierPosition.x}px`,
            top: `${magnifierPosition.y}px`,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${cursorPosition.x}% ${cursorPosition.y}%`,
            backgroundRepeat: 'no-repeat',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)'
          }}
        />
      )}
    </div>
  );
};

export default ImageMagnifier;
