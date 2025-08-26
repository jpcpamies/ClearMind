import { useState, useCallback, useRef } from "react";

interface DragItem {
  id: string;
  type: string;
}

interface Position {
  x: number;
  y: number;
}

interface UseDragAndDropProps {
  onDrop: (itemId: string, position: Position) => void;
}

export function useDragAndDrop({ onDrop }: UseDragAndDropProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, item: DragItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    
    startPosition.current = { x: e.clientX, y: e.clientY };
    setDraggedItem(item);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedItem) return;

    const deltaX = Math.abs(e.clientX - startPosition.current.x);
    const deltaY = Math.abs(e.clientY - startPosition.current.y);
    
    // Start dragging only after moving 5 pixels (to avoid accidental drags)
    if (!isDragging && (deltaX > 5 || deltaY > 5)) {
      setIsDragging(true);
    }
  }, [draggedItem, isDragging]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggedItem && isDragging) {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      
      onDrop(draggedItem.id, newPosition);
    }
    
    setDraggedItem(null);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, [draggedItem, isDragging, dragOffset, onDrop]);

  return {
    draggedItem,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
