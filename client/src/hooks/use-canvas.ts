import { useRef, useState, useCallback } from "react";

export function useCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [touchDistance, setTouchDistance] = useState(0);
  const [touchCenter, setTouchCenter] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.ctrlKey) { // Middle button or Ctrl+click for panning
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom,
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Determine zoom factor - support both wheel and trackpad
    let zoomFactor;
    if (e.ctrlKey) {
      // Trackpad pinch gesture (comes with ctrlKey)
      zoomFactor = e.deltaY > 0 ? 0.95 : 1.05; // Smaller increments for smoother pinch
    } else {
      // Regular mouse wheel
      zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    }
    
    // Update zoom range to 25% - 400%
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 4);
    
    if (newZoom === zoom) return; // No change needed
    
    // Zoom towards mouse position
    const zoomRatio = newZoom / zoom;
    setPanOffset(prev => ({
      x: prev.x - (mouseX / zoom) * (zoomRatio - 1),
      y: prev.y - (mouseY / zoom) * (zoomRatio - 1),
    }));
    
    setZoom(newZoom);
  }, [zoom]);

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setTouchDistance(distance);
      setTouchCenter(center);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && touchDistance > 0) {
      e.preventDefault();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);
      
      // Calculate zoom based on distance change
      const distanceRatio = newDistance / touchDistance;
      const newZoom = Math.min(Math.max(zoom * distanceRatio, 0.25), 4);
      
      if (newZoom !== zoom) {
        // Zoom towards touch center
        const centerX = newCenter.x - rect.left;
        const centerY = newCenter.y - rect.top;
        
        const zoomRatio = newZoom / zoom;
        setPanOffset(prev => ({
          x: prev.x - (centerX / zoom) * (zoomRatio - 1),
          y: prev.y - (centerY / zoom) * (zoomRatio - 1),
        }));
        
        setZoom(newZoom);
      }
      
      setTouchDistance(newDistance);
      setTouchCenter(newCenter);
    }
  }, [zoom, touchDistance]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      setTouchDistance(0);
    }
  }, []);

  return {
    canvasRef,
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
