import { useState, useCallback, useRef, useEffect } from "react";

interface DragState {
  isDragging: boolean;
  dragCardId: string | null;
  startMousePos: { x: number; y: number };
  startCanvasPos: { x: number; y: number };
  dragOffset: { x: number; y: number };
  selectedCards: Set<string>;
  initialCanvasPositions: Record<string, { x: number; y: number }>;
  persistentSelection: Set<string>;
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
  selectedIdeaIds?: Set<string>;
  onBulkDrop?: (updates: Array<{ id: string; canvasX: number; canvasY: number }>) => void;
  isSidebarCollapsed?: boolean;
}

const initialDragState: DragState = {
  isDragging: false,
  dragCardId: null,
  startMousePos: { x: 0, y: 0 },
  startCanvasPos: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  selectedCards: new Set(),
  initialCanvasPositions: {},
  persistentSelection: new Set(),
};

export function useEnhancedDrag({ 
  onDrop, 
  ideas, 
  zoom = 1, 
  panOffset = { x: 0, y: 0 },
  selectedIdeaIds = new Set(),
  onBulkDrop,
  isSidebarCollapsed = false
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
    // Account for sidebar offset when converting screen coords to canvas coords
    const sidebarOffset = isSidebarCollapsed ? 0 : 344; // 332px sidebar + 12px margin = 344px
    const adjustedScreenX = screenX - sidebarOffset;
    
    return {
      x: (adjustedScreenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom
    };
  }, [panOffset, zoom, isSidebarCollapsed]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    // Account for sidebar offset when converting canvas coords to screen coords
    const sidebarOffset = isSidebarCollapsed ? 0 : 344; // 332px sidebar + 12px margin = 344px
    
    return {
      x: canvasX * zoom + panOffset.x + sidebarOffset,
      y: canvasY * zoom + panOffset.y
    };
  }, [panOffset, zoom, isSidebarCollapsed]);

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
    const currentState = dragStateRef.current;
    
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
    let persistentSelection = new Set<string>();
    let initialCanvasPositions: Record<string, Position> = {};

    // Handle selection logic - use external selectedIdeaIds if available
    if (selectedIdeaIds.size > 0 && selectedIdeaIds.has(item.id)) {
      // Card is part of external selection (e.g., rectangle selection) - drag all selected
      selectedCards = new Set(selectedIdeaIds);
      persistentSelection = new Set(selectedIdeaIds);
    } else if (isMultiSelect) {
      // Multi-select: add to existing selection
      persistentSelection = new Set(currentState.persistentSelection);
      if (persistentSelection.has(item.id)) {
        persistentSelection.delete(item.id);
      } else {
        persistentSelection.add(item.id);
      }
      selectedCards = new Set(persistentSelection);
      selectedCards.add(item.id); // Always include the card being dragged
    } else {
      // Single select: replace selection unless clicking on already selected card
      if (currentState.persistentSelection.has(item.id) && currentState.persistentSelection.size > 1) {
        // Clicking on a card that's part of multi-selection - drag all selected
        selectedCards = new Set(currentState.persistentSelection);
        persistentSelection = new Set(currentState.persistentSelection);
      } else {
        // New single selection
        selectedCards.add(item.id);
        persistentSelection = new Set([item.id]);
      }
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

    // Apply selection visual state immediately
    document.querySelectorAll('.idea-card').forEach(card => {
      card.classList.remove('card-selected', 'card-multi-selected');
      // Reset z-index for all unselected cards
      const wrapper = card.parentElement;
      if (wrapper) {
        wrapper.style.zIndex = '';
      }
    });

    persistentSelection.forEach(cardId => {
      const cardElement = document.querySelector(`[data-testid="idea-card-${cardId}"]`);
      if (cardElement) {
        if (persistentSelection.size === 1) {
          cardElement.classList.add('card-selected');
        } else {
          cardElement.classList.add('card-multi-selected');
        }
        // Apply higher z-index to selected cards
        const wrapper = cardElement.parentElement;
        if (wrapper) {
          wrapper.style.zIndex = '10';
        }
      }
    });

    setDragState({
      isDragging: false,
      dragCardId: item.id,
      startMousePos: { x: e.clientX, y: e.clientY },
      startCanvasPos: canvasPos,
      dragOffset,
      selectedCards,
      initialCanvasPositions,
      persistentSelection
    });

    document.body.style.cursor = 'grabbing';
  }, [ideas, selectedIdeaIds]);

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentState = dragStateRef.current;
    if (!currentState.dragCardId) return;

    const deltaX = Math.abs(e.clientX - currentState.startMousePos.x);
    const deltaY = Math.abs(e.clientY - currentState.startMousePos.y);
    
    if (!currentState.isDragging && (deltaX > 5 || deltaY > 5)) {
      setDragState(prev => ({ ...prev, isDragging: true }));
      
      // Apply dragging visual state
      currentState.selectedCards.forEach(cardId => {
        const cardElement = document.querySelector(`[data-testid="idea-card-${cardId}"]`);
        if (cardElement) {
          cardElement.classList.add('card-dragging');
          // Apply z-index to the wrapper div for proper stacking (below UI elements)
          const wrapper = cardElement.parentElement;
          if (wrapper) {
            wrapper.style.zIndex = '15';
          }
        }
      });
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

        // Visual feedback is already applied via card-dragging class
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
        cardElement.classList.remove('card-dragging');
        // Keep selected cards with higher z-index (don't reset to empty)
        const wrapper = cardElement.parentElement;
        if (wrapper && currentState.persistentSelection.has(cardId)) {
          wrapper.style.zIndex = '10'; // Selected cards stay on top
        } else if (wrapper) {
          wrapper.style.zIndex = ''; // Only reset unselected cards
        }
      }
    });

    if (currentState.isDragging) {
      const finalScreenPos = {
        x: Math.round(e.clientX - currentState.dragOffset.x),
        y: Math.round(e.clientY - currentState.dragOffset.y)
      };
      const finalCanvasPos = screenToCanvas(finalScreenPos.x, finalScreenPos.y);

      // Collect all updates for bulk operation
      const bulkUpdates: Array<{ id: string; canvasX: number; canvasY: number }> = [];
      let hasSignificantMovement = false;

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
          hasSignificantMovement = true;
          bulkUpdates.push({
            id: cardId,
            canvasX: cardFinalPos.x,
            canvasY: cardFinalPos.y
          });
        }
      });

      // Use bulk update if available and there are multiple cards, otherwise use individual updates
      if (hasSignificantMovement) {
        if (onBulkDrop && currentState.selectedCards.size > 1) {
          onBulkDrop(bulkUpdates);
        } else {
          // Fallback to individual updates
          bulkUpdates.forEach(update => {
            debouncedSave(update.id, { x: update.canvasX, y: update.canvasY });
          });
        }
      }
    }

    // Reset drag state but maintain persistent selection
    setDragState(prev => ({
      ...initialDragState,
      persistentSelection: prev.persistentSelection
    }));
  }, [screenToCanvas, debouncedSave, onBulkDrop]);

  // Handle canvas click to clear selection
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking on canvas background (not on cards)
    if (e.target === e.currentTarget) {
      // Clear all selection visual states
      document.querySelectorAll('.idea-card').forEach(card => {
        card.classList.remove('card-selected', 'card-multi-selected');
        // Reset z-index when clearing selections
        const wrapper = card.parentElement;
        if (wrapper) {
          wrapper.style.zIndex = '';
        }
      });
      
      setDragState(prev => ({
        ...prev,
        persistentSelection: new Set()
      }));
    }
  }, []);

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
    persistentSelection: dragState.persistentSelection,
    handleMouseDown,
    handleTouchStart,
    handleCanvasClick,
    handleMouseMove: () => {},
    handleMouseUp: () => {},
    // Expose whether the current interaction was a drag (for preventing expansion)
    wasDragged: dragState.isDragging,
  };
}