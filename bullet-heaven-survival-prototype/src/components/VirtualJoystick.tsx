import React, { useRef, useState, useEffect } from 'react';
import { Vector2 } from '../game/types';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState<Vector2>({ x: 0, y: 0 });
  const [origin, setOrigin] = useState<Vector2>({ x: 0, y: 0 });
  
  // Settings
  const MAX_RADIUS = 50; // Max stick distance

  const handleStart = (clientX: number, clientY: number) => {
    setActive(true);
    setOrigin({ x: clientX, y: clientY });
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!active) return;

    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and clamp
    let moveX = dx;
    let moveY = dy;
    
    if (distance > MAX_RADIUS) {
      const angle = Math.atan2(dy, dx);
      moveX = Math.cos(angle) * MAX_RADIUS;
      moveY = Math.sin(angle) * MAX_RADIUS;
    }

    setPosition({ x: moveX, y: moveY });
    
    // Send normalized vector (-1 to 1)
    onMove(moveX / MAX_RADIUS, moveY / MAX_RADIUS);
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  // Mouse Handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => active && handleEnd();

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = () => handleEnd();

  return (
    <div 
      ref={containerRef}
      className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 touch-none select-none flex items-center justify-center"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute w-2 h-2 bg-white/50 rounded-full" />
      <div 
        className="w-12 h-12 bg-blue-500/80 rounded-full shadow-lg"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: active ? 'none' : 'transform 0.1s ease-out'
        }}
      />
    </div>
  );
};
