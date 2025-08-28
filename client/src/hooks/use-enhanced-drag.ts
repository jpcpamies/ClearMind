import { useState, useCallback, useRef, useEffect } from "react";

interface DragState {
  isDragging: boolean;
  dragCardId: string | null;
  startMousePos: { x: number; y: number };
  startCanvasPos: { x: number; y: number };
  dragOffset: { x: number; y: number };
  selectedCards: Set<string>;
  initialCanvasPositions: Record<string, { x: number; y: number }>;
}

interface DragItem {
  id: string;
  type: string;
}

interface Position {
  x: number;
  y: number;
}

interface UseEnhancedDragProps {
  onDrop: (itemId: string, canvasPosition: Position) => void;
  ideas: Array<{ id: string; canvasX?: number | null; canvasY?: number | null }>;
  zoom?: number;
  panOffset?: { x: number; y: number };
}

const initialDragState: DragState = {
  isDragging: false,
  dragCardId: null,
  startMousePos: { x: 0, y: 0 },
  startCanvasPos: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  selectedCards: new Set(),
  initialCanvasPositions: {},
};

export function useEnhancedDrag({ 
  onDrop, 
  ideas, 
  zoom = 1, 
  panOffset = { x: 0, y: 0 } 
}: UseEnhancedDragProps) {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const dragStateRef = useRef<DragState>(dragState);
  const savePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update dragStateRef when dragState changes
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom
    };
  }, [panOffset, zoom]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom + panOffset.x,
      y: canvasY * zoom + panOffset.y
    };
  }, [panOffset, zoom]);

  // Debounced position save function
  const debouncedSave = useCallback((cardId: string, canvasPosition: Position) => {
    if (savePositionTimeoutRef.current) {
      clearTimeout(savePositionTimeoutRef.current);
    }
    
    savePositionTimeoutRef.current = setTimeout(() => {
      onDrop(cardId, canvasPosition);
    }, 150);
  }, [onDrop]);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent, item: DragItem) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();

    const isMultiSelect = e.ctrlKey || e.metaKey;
    
    // Find current idea and its canvas position
    const currentIdea = ideas.find(idea => idea.id === item.id);
    const canvasPos = { 
      x: currentIdea?.canvasX || 0, 
      y: currentIdea?.canvasY || 0 
    };

    // Get the card element to find its actual screen position
    const cardElement = e.currentTarget as HTMLElement;
    const wrapper = cardElement.parentElement;
    const rect = wrapper?.getBoundingClientRect();
    
    if (!rect) return;

    // Calculate the offset from mouse click to the card's top-left corner
    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    let selectedCards = new Set<string>();
    let initialCanvasPositions: Record<string, Position> = {};

    // Handle multi-selection
    if (isMultiSelect) {
      selectedCards = new Set(dragStateRef.current.selectedCards);
      selectedCards.add(item.id);
    } else {
      selectedCards.add(item.id);
    }

    // Store initial canvas positions for all selected cards
    selectedCards.forEach(cardId => {
      const cardIdea = ideas.find(idea => idea.id === cardId);
      if (cardIdea) {
        initialCanvasPositions[cardId] = {
          x: cardIdea.canvasX || 0,
          y: cardIdea.canvasY || 0
        };
      }
    });

    setDragState({
      isDragging: false,
      dragCardId: item.id,
      startMousePos: { x: e.clientX, y: e.clientY },
      startCanvasPos: canvasPos,
      dragOffset,
      selectedCards,
      initialCanvasPositions
    });

    document.body.style.cursor = 'grabbing';
  }, [ideas]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    if (!currentState.dragCardId) return;

    const deltaX = Math.abs(e.clientX - currentState.startMousePos.x);
    const deltaY = Math.abs(e.clientY - currentState.startMousePos.y);
    
    if (!currentState.isDragging && (deltaX > 5 || deltaY > 5)) {
      setDragState(prev => ({ ...prev, isDragging: true }));
    }

    if (currentState.isDragging) {
      const newScreenPos = {
        x: Math.round(e.clientX - currentState.dragOffset.x),
        y: Math.round(e.clientY - currentState.dragOffset.y)
      };

      const newCanvasPos = screenToCanvas(newScreenPos.x, newScreenPos.y);

      currentState.selectedCards.forEach(cardId => {
        const cardElement = document.querySelector(`[data-testid="idea-card-${cardId}"]`) as HTMLElement;
        if (!cardElement) return;

        let cardFinalScreenPos: Position;

        if (cardId === currentState.dragCardId) {
          cardFinalScreenPos = newScreenPos;
        } else {
          const initialPos = currentState.initialCanvasPositions[cardId];
          const primaryInitialPos = currentState.initialCanvasPositions[currentState.dragCardId!];
          
          if (initialPos && primaryInitialPos) {
            const relativeX = initialPos.x - primaryInitialPos.x;
            const relativeY = initialPos.y - primaryInitialPos.y;
            const cardFinalCanvasPos = {
              x: newCanvasPos.x + relativeX,
              y: newCanvasPos.y + relativeY
            };
            cardFinalScreenPos = canvasToScreen(cardFinalCanvasPos.x, cardFinalCanvasPos.y);
          } else {
            return;
          }
        }

        const wrapper = cardElement.parentElement;
        if (wrapper) {
          wrapper.style.left = `${cardFinalScreenPos.x}px`;
          wrapper.style.top = `${cardFinalScreenPos.y}px`;
        }

        cardElement.classList.add('dragging-card');
      });
    }
  }, [screenToCanvas, canvasToScreen]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    if (!currentState.dragCardId) return;

    document.body.style.cursor = '';

    currentState.selectedCards.forEach(cardId => {
      const cardElement = document.querySelector(`[data-testid="idea-card-${cardId}"]`) as HTMLElement;
      if (cardElement) {
        cardElement.classList.remove('dragging-card');
      }
    });

    if (currentState.isDragging) {
      const finalScreenPos = {
        x: Math.round(e.clientX - currentState.dragOffset.x),
        y: Math.round(e.clientY - currentState.dragOffset.y)
      };
      const finalCanvasPos = screenToCanvas(finalScreenPos.x, finalScreenPos.y);

      currentState.selectedCards.forEach(cardId => {
        let cardFinalPos: Position;

        if (cardId === currentState.dragCardId) {
          cardFinalPos = finalCanvasPos;
        } else {
          const initialPos = currentState.initialCanvasPositions[cardId];
          const primaryInitialPos = currentState.initialCanvasPositions[currentState.dragCardId!];
          
          if (initialPos && primaryInitialPos) {
            const relativeX = initialPos.x - primaryInitialPos.x;
            const relativeY = initialPos.y - primaryInitialPos.y;
            cardFinalPos = {
              x: finalCanvasPos.x + relativeX,
              y: finalCanvasPos.y + relativeY
            };
          } else {
            return;
          }
        }

        const initialPos = currentState.initialCanvasPositions[cardId];
        if (initialPos && (
          Math.abs(initialPos.x - cardFinalPos.x) > 1 || 
          Math.abs(initialPos.y - cardFinalPos.y) > 1
        )) {
          debouncedSave(cardId, cardFinalPos);
        }
      });
    }

    setDragState(initialDragState);
  }, [screenToCanvas, debouncedSave]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent, item: DragItem) => {
    const touch = e.touches[0];
    const mouseEvent = {
      button: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      currentTarget: e.currentTarget,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
      ctrlKey: false,
      metaKey: false
    } as any;
    
    handleMouseDown(mouseEvent, item);
  }, [handleMouseDown]);

  const handleGlobalTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    } as MouseEvent;
    
    handleGlobalMouseMove(mouseEvent);
  }, [handleGlobalMouseMove]);

  const handleGlobalTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY
    } as MouseEvent;
    
    handleGlobalMouseUp(mouseEvent);
  }, [handleGlobalMouseUp]);

  // Event listener management
  useEffect(() => {
    if (dragState.dragCardId) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: true });
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
        document.body.style.cursor = '';
      };
    }
  }, [dragState.dragCardId, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalTouchMove, handleGlobalTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }
      document.body.style.cursor = '';
    };
  }, []);

  return {
    draggedItem: dragState.dragCardId ? { id: dragState.dragCardId, type: "idea" } : null,
    isDragging: dragState.isDragging,
    selectedCards: dragState.selectedCards,
    handleMouseDown,
    handleTouchStart,
    handleMouseMove: () => {},
    handleMouseUp: () => {},
  };
}