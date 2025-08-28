import { useState, useCallback, useRef, useEffect } from "react";

interface DragState {
  isDragging: boolean;
  dragCardId: string | null;
  startPos: { x: number; y: number };
  offset: { x: number; y: number };
  initialPositions: Record<string, { x: number; y: number }>;
  currentPositions: Record<string, { x: number; y: number }>;
  dragElements: Record<string, HTMLElement>;
  velocity: { x: number; y: number };
  lastMousePos: { x: number; y: number };
  selectedCards: Set<string>;
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
  onDrop: (itemId: string, position: Position) => void;
  ideas: Array<{ id: string; canvasX?: number | null; canvasY?: number | null }>;
  zoom?: number;
  panOffset?: { x: number; y: number };
}

const initialDragState: DragState = {
  isDragging: false,
  dragCardId: null,
  startPos: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  initialPositions: {},
  currentPositions: {},
  dragElements: {},
  velocity: { x: 0, y: 0 },
  lastMousePos: { x: 0, y: 0 },
  selectedCards: new Set(),
};

export function useEnhancedDrag({ onDrop, ideas, zoom = 1, panOffset = { x: 0, y: 0 } }: UseEnhancedDragProps) {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const dragStateRef = useRef<DragState>(dragState);
  const animationFrameRef = useRef<number | null>(null);
  const savePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragPerformanceRef = useRef({
    lastUpdateTime: 0,
    frameCount: 0,
    targetFPS: 60
  });

  // Update dragStateRef when dragState changes
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Debounced position save function
  const debouncedSave = useCallback((cardId: string, position: Position) => {
    if (savePositionTimeoutRef.current) {
      clearTimeout(savePositionTimeoutRef.current);
    }
    
    savePositionTimeoutRef.current = setTimeout(() => {
      onDrop(cardId, position);
    }, 300);
  }, [onDrop]);

  // Calculate velocity-based effects
  const calculateDynamicEffects = (velocity: { x: number; y: number }) => {
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const maxSpeed = 20;
    const normalizedSpeed = Math.min(speed / maxSpeed, 1);
    
    return {
      rotation: Math.min(velocity.x * 0.1, 5), // Max 5 degrees
      scale: 1.02 + (normalizedSpeed * 0.03), // Scale from 1.02 to 1.05
    };
  };

  // Smooth drag animation with requestAnimationFrame
  const updateDragPositions = useCallback((mouseX: number, mouseY: number) => {
    const currentTime = performance.now();
    const deltaTime = currentTime - dragPerformanceRef.current.lastUpdateTime;
    
    // Performance throttling to 60fps
    if (deltaTime < 16.67) return;
    
    const currentState = dragStateRef.current;
    if (!currentState.isDragging || !currentState.dragCardId) return;

    // Cancel previous frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Calculate velocity
    const velocity = {
      x: (mouseX - currentState.lastMousePos.x) / (deltaTime / 16.67),
      y: (mouseY - currentState.lastMousePos.y) / (deltaTime / 16.67)
    };

    const effects = calculateDynamicEffects(velocity);

    animationFrameRef.current = requestAnimationFrame(() => {
      // Update primary dragged card
      const primaryCardElement = currentState.dragElements[currentState.dragCardId!];
      if (primaryCardElement) {
        const newX = Math.round(mouseX - currentState.offset.x);
        const newY = Math.round(mouseY - currentState.offset.y);
        
        const transform = `translate(${newX}px, ${newY}px) rotate(${effects.rotation}deg) scale(${effects.scale})`;
        primaryCardElement.style.transform = transform;
        
        // Update current position for saving later
        setDragState(prev => ({
          ...prev,
          currentPositions: {
            ...prev.currentPositions,
            [currentState.dragCardId!]: { x: newX, y: newY }
          },
          velocity,
          lastMousePos: { x: mouseX, y: mouseY }
        }));
      }

      // Update any selected cards maintaining relative positions
      currentState.selectedCards.forEach(cardId => {
        if (cardId !== currentState.dragCardId && currentState.dragElements[cardId]) {
          const element = currentState.dragElements[cardId];
          const initialPos = currentState.initialPositions[cardId];
          const primaryInitialPos = currentState.initialPositions[currentState.dragCardId!];
          
          if (initialPos && primaryInitialPos) {
            const relativeX = initialPos.x - primaryInitialPos.x;
            const relativeY = initialPos.y - primaryInitialPos.y;
            const newX = Math.round((mouseX - currentState.offset.x) + relativeX);
            const newY = Math.round((mouseY - currentState.offset.y) + relativeY);
            
            const transform = `translate(${newX}px, ${newY}px) rotate(${effects.rotation * 0.7}deg) scale(${effects.scale * 0.95})`;
            element.style.transform = transform;
          }
        }
      });

      dragPerformanceRef.current.lastUpdateTime = currentTime;
      dragPerformanceRef.current.frameCount++;
    });
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, item: DragItem) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const isMultiSelect = e.ctrlKey || e.metaKey;
    
    // Find current idea position and convert to screen coordinates
    const currentIdea = ideas.find(idea => idea.id === item.id);
    const canvasPos = { 
      x: currentIdea?.canvasX || 0, 
      y: currentIdea?.canvasY || 0 
    };
    const currentScreenPos = {
      x: canvasPos.x * zoom + panOffset.x,
      y: canvasPos.y * zoom + panOffset.y
    };

    // Calculate precise offset from mouse to card's current screen position
    const offset = {
      x: e.clientX - currentScreenPos.x,
      y: e.clientY - currentScreenPos.y,
    };

    let selectedCards = new Set<string>();
    let initialPositions: Record<string, Position> = {};
    let dragElements: Record<string, HTMLElement> = {};

    // Handle multi-selection
    if (isMultiSelect) {
      selectedCards = new Set(dragStateRef.current.selectedCards);
      selectedCards.add(item.id);
    } else {
      selectedCards.add(item.id);
    }

    // Store initial positions and elements for all selected cards (in screen coordinates)
    selectedCards.forEach(cardId => {
      const cardIdea = ideas.find(idea => idea.id === cardId);
      if (cardIdea) {
        initialPositions[cardId] = {
          x: (cardIdea.canvasX || 0) * zoom + panOffset.x,
          y: (cardIdea.canvasY || 0) * zoom + panOffset.y
        };
      }
      
      // Find card element
      const cardElement = document.querySelector(`[data-testid="idea-card-${cardId}"]`) as HTMLElement;
      if (cardElement) {
        dragElements[cardId] = cardElement;
        // Apply dragging class with immediate visual feedback
        cardElement.classList.add('dragging-card');
      }
    });

    setDragState({
      isDragging: false, // Will be set to true on first movement
      dragCardId: item.id,
      startPos: { x: e.clientX, y: e.clientY },
      offset,
      initialPositions,
      currentPositions: { ...initialPositions },
      dragElements,
      velocity: { x: 0, y: 0 },
      lastMousePos: { x: e.clientX, y: e.clientY },
      selectedCards
    });

    // Set cursor to grabbing
    document.body.style.cursor = 'grabbing';
  }, [ideas]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    if (!currentState.dragCardId) return;

    const deltaX = Math.abs(e.clientX - currentState.startPos.x);
    const deltaY = Math.abs(e.clientY - currentState.startPos.y);
    
    // Start dragging only after moving 5 pixels
    if (!currentState.isDragging && (deltaX > 5 || deltaY > 5)) {
      setDragState(prev => ({ ...prev, isDragging: true }));
    }

    if (currentState.isDragging) {
      updateDragPositions(e.clientX, e.clientY);
    }
  }, [updateDragPositions]);

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    if (!currentState.dragCardId) return;

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset cursor
    document.body.style.cursor = '';

    // Remove dragging classes and reset transforms
    Object.values(currentState.dragElements).forEach(element => {
      element.classList.remove('dragging-card');
      // Reset transform to final position without effects
      const cardId = element.getAttribute('data-testid')?.replace('idea-card-', '');
      if (cardId && currentState.currentPositions[cardId]) {
        const pos = currentState.currentPositions[cardId];
        element.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      }
    });

    // Save positions to database with debouncing
    if (currentState.isDragging) {
      Object.entries(currentState.currentPositions).forEach(([cardId, position]) => {
        if (currentState.initialPositions[cardId]?.x !== position.x || 
            currentState.initialPositions[cardId]?.y !== position.y) {
          debouncedSave(cardId, position);
        }
      });
    }

    // Reset drag state
    setDragState(initialDragState);
  }, [debouncedSave]);

  // Touch event handlers for mobile support
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
    e.preventDefault(); // Prevent scrolling
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
      // Add global event listeners
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      document.addEventListener('mouseup', handleGlobalMouseUp, { passive: true });
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });

      return () => {
        // Cleanup
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
        
        // Reset cursor
        document.body.style.cursor = '';
        
        // Cancel any pending animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [dragState.dragCardId, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalTouchMove, handleGlobalTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    draggedItem: dragState.dragCardId ? { id: dragState.dragCardId, type: "idea" } : null,
    isDragging: dragState.isDragging,
    selectedCards: dragState.selectedCards,
    handleMouseDown,
    handleTouchStart,
    // Expose empty handlers for canvas (events are handled globally)
    handleMouseMove: () => {},
    handleMouseUp: () => {},
  };
}