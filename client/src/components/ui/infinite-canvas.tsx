import { forwardRef, useRef, useEffect } from "react";
import { useDragAndDrop } from "@/hooks/use-drag-and-drop";
import IdeaCard from "./idea-card";
import type { Idea, Group } from "@shared/schema";

interface InfiniteCanvasProps {
  ideas: Idea[];
  groups: Group[];
  zoom: number;
  panOffset: { x: number; y: number };
  onIdeaUpdate: (ideaId: string, updates: Partial<Idea>) => void;
  onIdeaEdit: (ideaId: string) => void;
}

const InfiniteCanvas = forwardRef<HTMLDivElement, InfiniteCanvasProps>(
  ({ ideas, groups, zoom, panOffset, onIdeaUpdate, onIdeaEdit }, ref) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const { draggedItem, isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDragAndDrop({
      onDrop: (itemId, newPosition) => {
        onIdeaUpdate(itemId, { canvasX: newPosition.x, canvasY: newPosition.y });
      },
    });

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

    return (
      <div
        ref={canvasRef}
        data-testid="infinite-canvas"
        className="relative w-full h-full overflow-hidden cursor-move"
        style={{
          transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            group={groups.find(g => g.id === idea.groupId)}
            color={getGroupColor(idea.groupId)}
            position={{ x: idea.canvasX || 0, y: idea.canvasY || 0 }}
            isDragging={isDragging && draggedItem?.id === idea.id}
            onMouseDown={(e) => handleMouseDown(e, { id: idea.id, type: "idea" })}
            onEdit={() => onIdeaEdit(idea.id)}
            onUpdate={(updates) => onIdeaUpdate(idea.id, updates)}
          />
        ))}
      </div>
    );
  }
);

InfiniteCanvas.displayName = "InfiniteCanvas";

export default InfiniteCanvas;
