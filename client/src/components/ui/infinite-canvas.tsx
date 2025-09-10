import { forwardRef, useRef, useEffect, useState, useCallback } from "react";
import { useEnhancedDrag } from "@/hooks/use-enhanced-drag";
import IdeaCard from "./idea-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, FolderOpen, Plus } from "lucide-react";
import type { Idea, Group } from "@shared/schema";

interface InfiniteCanvasProps {
  ideas: Idea[];
  groups: Group[];
  zoom: number;
  panOffset: { x: number; y: number };
  selectedIdeaIds: Set<string>;
  onIdeaUpdate: (ideaId: string, updates: Partial<Idea>) => void;
  onIdeaEdit: (ideaId: string) => void;
  onIdeaDelete: (ideaId: string) => void;
  onIdeaSelect: (ideaId: string, isCtrlPressed: boolean) => void;
  onBulkSelect?: (ideaIds: string[]) => void;
  onBulkUpdate?: (updates: Array<{ id: string; canvasX: number; canvasY: number }>) => void;
  onBulkDelete: () => void;
  onBulkGroupChange: (groupId: string) => void;
  onNewGroup: () => void;
  onPanChange?: (offset: { x: number; y: number }) => void;
  onWheel?: (e: WheelEvent) => void;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
}

const InfiniteCanvas = forwardRef<HTMLDivElement, InfiniteCanvasProps>(
  ({ ideas, groups, zoom, panOffset, selectedIdeaIds, onIdeaUpdate, onIdeaEdit, onIdeaDelete, onIdeaSelect, onBulkSelect, onBulkUpdate, onBulkDelete, onBulkGroupChange, onNewGroup, onPanChange, onWheel, onTouchStart, onTouchMove, onTouchEnd }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
    const [isModifierPressed, setIsModifierPressed] = useState(false);
    
    // Sync the internal ref with the forwarded ref
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(canvasRef.current);
      } else if (ref) {
        ref.current = canvasRef.current;
      }
    }, [ref]);

    // Keyboard modifier detection
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.metaKey || e.ctrlKey) {
          setIsModifierPressed(true);
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.metaKey && !e.ctrlKey) {
          setIsModifierPressed(false);
        }
      };

      const handleWindowBlur = () => {
        setIsModifierPressed(false);
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('blur', handleWindowBlur);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleWindowBlur);
      };
    }, []);
    
    const { draggedItem, isDragging, selectedCards, persistentSelection, handleMouseDown, handleTouchStart, handleCanvasClick, wasDragged } = useEnhancedDrag({
      onDrop: (itemId, canvasPosition) => {
        // Position is already in canvas coordinates, no conversion needed
        onIdeaUpdate(itemId, { 
          canvasX: canvasPosition.x, 
          canvasY: canvasPosition.y 
        });
      },
      ideas,
      zoom,
      panOffset,
      selectedIdeaIds,
      onBulkDrop: onBulkUpdate,
    });

    // Handle card expansion - only expand if not dragged
    const handleCardExpand = useCallback((ideaId: string, wasReallyDragged: boolean = false) => {
      // Don't expand if this was a drag operation
      if (wasReallyDragged) {
        return;
      }
      setExpandedCardId(current => current === ideaId ? null : ideaId);
    }, []);

    // Rectangle intersection detection with improved debugging
    const getCardsInRectangle = useCallback((startX: number, startY: number, endX: number, endY: number) => {
      // Normalize rectangle coordinates (handle any drag direction)
      const rectLeft = Math.min(startX, endX);
      const rectRight = Math.max(startX, endX);
      const rectTop = Math.min(startY, endY);
      const rectBottom = Math.max(startY, endY);
      
      
      const intersectingCards: typeof ideas = [];
      
      ideas.forEach(idea => {
        // Calculate card position in screen coordinates
        const cardLeft = (idea.canvasX || 0) * zoom + panOffset.x;
        const cardTop = (idea.canvasY || 0) * zoom + panOffset.y;
        const cardRight = cardLeft + (256 * zoom); // Card width scaled
        const cardBottom = cardTop + (180 * zoom); // Card height scaled
        
        // Improved intersection detection algorithm
        const intersects = (
          cardLeft < rectRight &&    // Card left edge is left of rectangle right edge
          cardRight > rectLeft &&    // Card right edge is right of rectangle left edge
          cardTop < rectBottom &&    // Card top edge is above rectangle bottom edge
          cardBottom > rectTop       // Card bottom edge is below rectangle top edge
        );
        
        
        if (intersects) {
          intersectingCards.push(idea);
        }
      });
      
      
      return intersectingCards;
    }, [ideas, zoom, panOffset]);

    // Canvas panning handlers
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
      // Handle selection clearing first
      handleCanvasClick(e);
      
      // Clear multi-selection when clicking on empty canvas
      if (e.target === canvasRef.current && selectedIdeaIds.size > 0) {
        // Clear the selectedIdeaIds state by calling the selection handler with no ctrl key
        onIdeaSelect('', false); // This will clear the selection
      }
      
      // Contract expanded card if clicking outside of it
      if (expandedCardId && e.target === canvasRef.current) {
        setExpandedCardId(null);
      }
      
      // Only handle if clicking on empty canvas (not on cards)
      if (e.target === canvasRef.current && e.button === 0) {
        const isModifier = e.ctrlKey || e.metaKey;
        
        if (isModifier) {
          // Convert screen coordinates to canvas-relative coordinates
          const canvasRect = canvasRef.current.getBoundingClientRect();
          const canvasRelativeX = e.clientX - canvasRect.left;
          const canvasRelativeY = e.clientY - canvasRect.top;
          
          
          // Start rectangle selection when modifier is pressed
          setIsSelecting(true);
          setSelectionStart({ x: e.clientX, y: e.clientY });
          setSelectionEnd({ x: e.clientX, y: e.clientY });
          e.preventDefault();
        } else if (!isModifier) {
          // Start panning
          setIsPanning(true);
          setLastPanPoint({ x: e.clientX, y: e.clientY });
          e.preventDefault();
        }
      }
    }, [handleCanvasClick, expandedCardId, selectedIdeaIds, onIdeaSelect]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
      if (isSelecting) {
        // Update selection rectangle
        setSelectionEnd({ x: e.clientX, y: e.clientY });
        
        // Note: We'll handle the actual selection on mouse up to avoid excessive updates
      } else if (isPanning && onPanChange) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        
        onPanChange({
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY,
        });
        
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    }, [isSelecting, isPanning, lastPanPoint, panOffset, onPanChange, selectionStart, getCardsInRectangle, onIdeaSelect]);

    const handleCanvasMouseUp = useCallback(() => {
      if (isSelecting) {
        // Finalize rectangle selection
        const selectedCards = getCardsInRectangle(
          selectionStart.x, selectionStart.y,
          selectionEnd.x, selectionEnd.y
        );
        
        
        // Apply rectangle selection using bulk selection if available
        if (selectedCards.length > 0) {
          const cardIds = selectedCards.map(idea => idea.id);
          
          if (onBulkSelect) {
            // Use bulk selection method if available
            onBulkSelect(cardIds);
          } else {
            // Fallback to individual selection (with potential toggle issues)
            selectedCards.forEach(idea => {
              onIdeaSelect(idea.id, true);
            });
          }
        }
        
        setIsSelecting(false);
      }
      
      setIsPanning(false);
    }, [isSelecting, selectionStart, selectionEnd, getCardsInRectangle, onIdeaSelect]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        if (onWheel) onWheel(e);
      };

      const handleTouchStart = (e: TouchEvent) => {
        if (onTouchStart) onTouchStart(e);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (onTouchMove) onTouchMove(e);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (onTouchEnd) onTouchEnd(e);
      };

      canvas.addEventListener("wheel", handleWheel, { passive: false });
      canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
      
      return () => {
        canvas.removeEventListener("wheel", handleWheel);
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }, [onWheel, onTouchStart, onTouchMove, onTouchEnd]);

    const getGroupColor = (groupId: string | null) => {
      if (!groupId) return "unassigned";
      const group = groups.find(g => g.id === groupId);
      return group?.color || "unassigned";
    };

    // Calculate the center position of selected cards for the bulk menu
    const getBulkMenuPosition = () => {
      if (selectedIdeaIds.size === 0) return null;
      
      const selectedIdeas = ideas.filter(idea => selectedIdeaIds.has(idea.id));
      if (selectedIdeas.length === 0) return null;
      
      const positions = selectedIdeas.map(idea => ({
        x: (idea.canvasX || 0) * zoom + panOffset.x,
        y: (idea.canvasY || 0) * zoom + panOffset.y
      }));
      
      const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
      const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
      
      return { x: avgX, y: avgY };
    };

    const bulkMenuPosition = getBulkMenuPosition();



    return (
      <div
        ref={canvasRef}
        data-testid="infinite-canvas"
        className={`relative w-full h-full overflow-hidden ${
          isPanning ? 'cursor-grabbing' : 
          isSelecting ? 'cursor-crosshair' :
          isModifierPressed ? 'cursor-crosshair' : 
          'cursor-grab'
        }`}
        style={{
          transition: 'transform 0.1s ease-out'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Dynamic background grid - extends beyond viewport */}
        <div
          className="absolute"
          style={{
            left: '-50vw',
            top: '-50vh', 
            width: '200vw',
            height: '200vh',
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            zIndex: -10,
          }}
        />


        {ideas.map((idea) => {
          // Transform canvas coordinates to screen coordinates with proper zoom and pan
          const canvasX = idea.canvasX || 0;
          const canvasY = idea.canvasY || 0;
          const screenX = canvasX * zoom + panOffset.x;
          const screenY = canvasY * zoom + panOffset.y;
          
          return (
            <div
              key={idea.id}
              style={{
                position: 'absolute',
                left: screenX,
                top: screenY,
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
                zIndex: expandedCardId === idea.id ? 999 : 'auto',
              }}
            >
              <IdeaCard
                idea={idea}
                group={groups.find(g => g.id === idea.groupId)}
                groups={groups}
                color={getGroupColor(idea.groupId)}
                position={{ x: 0, y: 0 }} // Position is handled by the wrapper div
                isDragging={isDragging && draggedItem?.id === idea.id}
                isExpanded={expandedCardId === idea.id}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent canvas panning when dragging cards
                  
                  // Don't handle dragging if card is expanded
                  if (expandedCardId === idea.id) {
                    return;
                  }
                  
                  // Handle Cmd+Click for multi-selection
                  if (e.metaKey || e.ctrlKey) {
                    onIdeaSelect(idea.id, true);
                    return;
                  }
                  
                  // Clear selection if not Cmd+clicking
                  if (selectedIdeaIds.size > 0) {
                    onIdeaSelect(idea.id, false);
                  }
                  
                  handleMouseDown(e, { id: idea.id, type: "idea" });
                }}
                onTouchStart={(e) => handleTouchStart(e, { id: idea.id, type: "idea" })}
                isSelected={selectedCards.has(idea.id) || selectedIdeaIds.has(idea.id)}
                onEdit={() => onIdeaEdit(idea.id)}
                onUpdate={(updates) => onIdeaUpdate(idea.id, updates)}
                onDelete={() => onIdeaDelete(idea.id)}
                onExpand={() => handleCardExpand(idea.id)}
                isModifierPressed={isModifierPressed}
                onCreateGroup={() => {}} // TODO: Implement group creation
              />
            </div>
          );
        })}

        {/* Selection Rectangle */}
        {isSelecting && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selectionStart.x, selectionEnd.x),
              top: Math.min(selectionStart.y, selectionEnd.y),
              width: Math.abs(selectionEnd.x - selectionStart.x),
              height: Math.abs(selectionEnd.y - selectionStart.y),
              border: '2px dashed #3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              zIndex: 500,
            }}
            data-testid="selection-rectangle"
          />
        )}

        {/* Bulk Action Menu */}
        {bulkMenuPosition && selectedIdeaIds.size > 0 && (
          <div
            style={{
              position: 'absolute',
              left: bulkMenuPosition.x - 24, // Center the 48px wide button
              top: bulkMenuPosition.y - 24, // Center the 48px tall button
              zIndex: 1100, // Higher z-index to appear above cards
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="button-bulk-actions"
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg border hover:bg-white/95"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 shadow-lg">
                <DropdownMenuItem
                  data-testid="button-bulk-delete"
                  onClick={onBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedIdeaIds.size} selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Nested dropdown for Move to Group */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent" data-testid="button-bulk-move-to-group">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Move to Group
                      <svg className="ml-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48 shadow-lg">
                    {groups.map((group) => (
                      <DropdownMenuItem
                        key={group.id}
                        data-testid={`button-bulk-move-to-${group.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => onBulkGroupChange(group.id)}
                      >
                        <div 
                          className="mr-2 h-3 w-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="button-bulk-create-group"
                      onClick={onNewGroup}
                      className="text-primary focus:text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  }
);

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
