import { forwardRef, useRef, useEffect, useState, useCallback } from "react";
import { useEnhancedDrag } from "@/hooks/use-enhanced-drag";
import IdeaCard from "./idea-card";
import type { Idea, Group, Category } from "@shared/schema";

interface InfiniteCanvasProps {
  ideas: Idea[];
  groups: Group[];
  categories: Category[];
  zoom: number;
  panOffset: { x: number; y: number };
  onIdeaUpdate: (ideaId: string, updates: Partial<Idea>) => void;
  onIdeaEdit: (ideaId: string) => void;
  onIdeaDelete: (ideaId: string) => void;
  onPanChange?: (offset: { x: number; y: number }) => void;
}

const InfiniteCanvas = forwardRef<HTMLDivElement, InfiniteCanvasProps>(
  ({ ideas, groups, categories, zoom, panOffset, onIdeaUpdate, onIdeaEdit, onIdeaDelete, onPanChange }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
    
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
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        // Zoom functionality would be handled by parent component
      };

      canvas.addEventListener("wheel", handleWheel, { passive: false });
      return () => canvas.removeEventListener("wheel", handleWheel);
    }, []);

    const getGroupColor = (groupId: string | null) => {
      if (!groupId) return "unassigned";
      const group = groups.find(g => g.id === groupId);
      return group?.color || "unassigned";
    };

    const getCategoryColor = (categoryId: string | null) => {
      if (!categoryId) return null;
      const category = categories.find(c => c.id === categoryId);
      return category?.color || null;
    };

    // Group ideas by category for visual grouping effects
    const groupedIdeas = ideas.reduce((acc, idea) => {
      const categoryId = idea.categoryId || "uncategorized";
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(idea);
      return acc;
    }, {} as Record<string, typeof ideas>);

    // Calculate center points for category groups to show subtle background circles
    const getCategoryGroupCenter = (categoryIdeas: typeof ideas) => {
      if (categoryIdeas.length < 2) return null;
      
      const positions = categoryIdeas.map(idea => ({
        x: (idea.canvasX || 0) * zoom + panOffset.x,
        y: (idea.canvasY || 0) * zoom + panOffset.y
      }));
      
      const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
      const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
      
      // Calculate radius based on the spread of ideas
      const maxDistance = Math.max(...positions.map(pos => 
        Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2))
      ));
      
      return {
        x: centerX,
        y: centerY,
        radius: Math.max(150, maxDistance + 50) // Minimum radius of 150px
      };
    };

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

        {/* Category grouping visual effects - subtle background circles */}
        {Object.entries(groupedIdeas).map(([categoryId, categoryIdeas]) => {
          if (categoryId === "uncategorized" || categoryIdeas.length < 2) return null;
          
          const groupCenter = getCategoryGroupCenter(categoryIdeas);
          if (!groupCenter) return null;
          
          const category = categories.find(c => c.id === categoryId);
          if (!category) return null;
          
          return (
            <div
              key={`category-group-${categoryId}`}
              className="absolute pointer-events-none"
              style={{
                left: groupCenter.x - groupCenter.radius,
                top: groupCenter.y - groupCenter.radius,
                width: groupCenter.radius * 2,
                height: groupCenter.radius * 2,
                borderRadius: '50%',
                backgroundColor: `${category.color}10`, // Very subtle background
                border: `2px solid ${category.color}20`, // Subtle border
                zIndex: -5,
              }}
              data-testid={`category-group-${categoryId}`}
            />
          );
        })}

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
                category={categories.find(c => c.id === idea.categoryId)}
                color={getGroupColor(idea.groupId)}
                categoryColor={getCategoryColor(idea.categoryId)}
                position={{ x: 0, y: 0 }} // Position is handled by the wrapper div
                isDragging={isDragging && draggedItem?.id === idea.id}
                onMouseDown={(e) => {
                  e.stopPropagation(); // Prevent canvas panning when dragging cards
                  handleMouseDown(e, { id: idea.id, type: "idea" });
                }}
                onTouchStart={(e) => handleTouchStart(e, { id: idea.id, type: "idea" })}
                isSelected={selectedCards.has(idea.id)}
                onEdit={() => onIdeaEdit(idea.id)}
                onUpdate={(updates) => onIdeaUpdate(idea.id, updates)}
                onDelete={() => onIdeaDelete(idea.id)}
              />
            </div>
          );
        })}
      </div>
    );
  }
);

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
