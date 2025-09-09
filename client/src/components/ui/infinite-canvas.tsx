import { forwardRef, useRef, useEffect, useState, useCallback } from "react";
import { useEnhancedDrag } from "@/hooks/use-enhanced-drag";
import IdeaCard from "./idea-card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, FolderOpen } from "lucide-react";
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
  onBulkDelete: () => void;
  onBulkGroupChange: (groupId: string) => void;
  onPanChange?: (offset: { x: number; y: number }) => void;
  onWheel?: (e: WheelEvent) => void;
}

const InfiniteCanvas = forwardRef<HTMLDivElement, InfiniteCanvasProps>(
  ({ ideas, groups, zoom, panOffset, selectedIdeaIds, onIdeaUpdate, onIdeaEdit, onIdeaDelete, onIdeaSelect, onBulkDelete, onBulkGroupChange, onPanChange, onWheel }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    
    // Sync the internal ref with the forwarded ref
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(canvasRef.current);
      } else if (ref) {
        ref.current = canvasRef.current;
      }
    }, [ref]);
    
    const { draggedItem, isDragging, selectedCards, persistentSelection, handleMouseDown, handleTouchStart, handleCanvasClick } = useEnhancedDrag({
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
    });

    // Canvas panning handlers
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
      // Handle selection clearing first
      handleCanvasClick(e);
      
      // Only start panning if clicking on empty canvas (not on cards)
      if (e.target === canvasRef.current && e.button === 0) {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }
    }, [handleCanvasClick]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
      if (isPanning && onPanChange) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        
        onPanChange({
          x: panOffset.x + deltaX,
          y: panOffset.y + deltaY,
        });
        
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    }, [isPanning, lastPanPoint, panOffset, onPanChange]);

    const handleCanvasMouseUp = useCallback(() => {
      setIsPanning(false);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !onWheel) return;

      const handleWheel = (e: WheelEvent) => {
        onWheel(e);
      };

      canvas.addEventListener("wheel", handleWheel, { passive: false });
      return () => canvas.removeEventListener("wheel", handleWheel);
    }, [onWheel]);

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
        className={`relative w-full h-full overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
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
              }}
            >
              <IdeaCard
                idea={idea}
                group={groups.find(g => g.id === idea.groupId)}
                color={getGroupColor(idea.groupId)}
                position={{ x: 0, y: 0 }} // Position is handled by the wrapper div
                isDragging={isDragging && draggedItem?.id === idea.id}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent canvas panning when dragging cards
                  
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
              />
            </div>
          );
        })}

        {/* Bulk Action Menu */}
        {bulkMenuPosition && selectedIdeaIds.size > 0 && (
          <div
            style={{
              position: 'absolute',
              left: bulkMenuPosition.x - 24, // Center the 48px wide button
              top: bulkMenuPosition.y - 24, // Center the 48px tall button
              zIndex: 1000,
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="button-bulk-actions"
                  variant="secondary"
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border hover:bg-accent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem
                  data-testid="button-bulk-delete"
                  onClick={onBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedIdeaIds.size} ideas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {groups.map((group) => (
                  <DropdownMenuItem
                    key={group.id}
                    data-testid={`button-bulk-move-to-${group.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => onBulkGroupChange(group.id)}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Move to {group.name}
                  </DropdownMenuItem>
                ))}
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
