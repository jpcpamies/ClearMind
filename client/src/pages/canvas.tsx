import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InfiniteCanvas from "@/components/ui/infinite-canvas";
import FloatingSidebar from "@/components/ui/floating-sidebar";
import TodoListGrid from "@/components/ui/todolist-grid";
import IdeaModal from "@/components/ui/idea-modal";
import TodoListModal from "@/components/ui/todolist-modal";
import ZoomControls from "@/components/ui/zoom-controls";
import { useCanvas } from "@/hooks/use-canvas";
import type { Idea, Group } from "@shared/schema";

type View = "canvas" | "todolist";

export default function Canvas() {
  const [currentView, setCurrentView] = useState<View>("canvas");
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [isInitialPositioned, setIsInitialPositioned] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canvasRef, zoom, setZoom, panOffset, setPanOffset } = useCanvas();

  // Fetch ideas and groups
  const { data: ideas = [], isLoading: ideasLoading } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  // Calculate center point of all existing cards
  const calculateCardsBounds = (ideas: Idea[]) => {
    if (ideas.length === 0) return null;
    
    const positions = ideas.map(idea => ({
      x: idea.canvasX || 0,
      y: idea.canvasY || 0
    }));
    
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  // Get current viewport center for new cards
  const getViewportCenter = () => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;
    
    // Convert screen coordinates to canvas coordinates
    const canvasCenterX = (viewportCenterX / zoom) - panOffset.x;
    const canvasCenterY = (viewportCenterY / zoom) - panOffset.y;
    
    return { x: canvasCenterX, y: canvasCenterY };
  };

  // Initialize canvas positioning when ideas load
  useEffect(() => {
    if (!ideasLoading && !isInitialPositioned && ideas.length > 0) {
      const bounds = calculateCardsBounds(ideas);
      
      if (bounds && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const viewportCenterX = rect.width / 2;
        const viewportCenterY = rect.height / 2;
        
        // Calculate offset to center the cards with padding
        const padding = 200;
        const offsetX = viewportCenterX / zoom - bounds.centerX;
        const offsetY = viewportCenterY / zoom - bounds.centerY;
        
        setPanOffset({
          x: offsetX,
          y: offsetY
        });
      }
      
      setIsInitialPositioned(true);
    } else if (!ideasLoading && !isInitialPositioned && ideas.length === 0) {
      // No cards exist, center at origin
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const viewportCenterX = rect.width / 2;
        const viewportCenterY = rect.height / 2;
        
        setPanOffset({
          x: viewportCenterX / zoom,
          y: viewportCenterY / zoom
        });
      }
      setIsInitialPositioned(true);
    }
  }, [ideas, ideasLoading, isInitialPositioned, zoom, canvasRef, setPanOffset]);

  // Create idea mutation
  const createIdeaMutation = useMutation({
    mutationFn: async (ideaData: any) => {
      const response = await apiRequest("POST", "/api/ideas", ideaData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Idea created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create idea",
        variant: "destructive",
      });
    },
  });

  // Update idea mutation
  const updateIdeaMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const response = await apiRequest("PUT", `/api/ideas/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Idea updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update idea",
        variant: "destructive",
      });
    },
  });

  // Delete idea mutation
  const deleteIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const response = await apiRequest("DELETE", `/api/ideas/${ideaId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Idea deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete idea",
        variant: "destructive",
      });
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const response = await apiRequest("POST", "/api/groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Group created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const handleIdeaUpdate = (ideaId: string, updates: Partial<Idea>) => {
    // Find the current idea to preserve its canvas position
    const currentIdea = ideas.find(idea => idea.id === ideaId);
    const updatesWithPosition = {
      ...updates,
      // Preserve canvas coordinates if not explicitly updating them
      canvasX: updates.canvasX !== undefined ? updates.canvasX : currentIdea?.canvasX,
      canvasY: updates.canvasY !== undefined ? updates.canvasY : currentIdea?.canvasY,
    };
    updateIdeaMutation.mutate({ id: ideaId, ...updatesWithPosition });
  };

  const handleIdeaDelete = (ideaId: string) => {
    deleteIdeaMutation.mutate(ideaId);
  };

  // Handle modal submission - CREATE or UPDATE based on editing state
  const handleIdeaModalSubmit = (data: any) => {
    if (editingIdeaId) {
      // EDITING: Update existing idea
      updateIdeaMutation.mutate({ id: editingIdeaId, ...data });
    } else {
      // CREATING: Create new idea at viewport center
      const viewportCenter = getViewportCenter();
      const newIdeaData = {
        ...data,
        canvasX: viewportCenter.x,
        canvasY: viewportCenter.y
      };
      createIdeaMutation.mutate(newIdeaData);
    }
    setIsIdeaModalOpen(false);
  };

  const handleNewIdea = () => {
    setEditingIdeaId(null);
    setIsIdeaModalOpen(true);
  };

  const handleEditIdea = (ideaId: string) => {
    setEditingIdeaId(ideaId);
    setIsIdeaModalOpen(true);
  };

  const handleTodoListOpen = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsTodoModalOpen(true);
  };

  const handleViewSwitch = (view: View) => {
    setCurrentView(view);
  };

  if (ideasLoading || groupsLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Top Navigation Toggle */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="frosted-glass-bg rounded-lg p-1">
          <div className="flex space-x-1">
            <button
              data-testid="button-canvas-view"
              onClick={() => handleViewSwitch("canvas")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                currentView === "canvas"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Canvas
            </button>
            <button
              data-testid="button-todolist-view"
              onClick={() => handleViewSwitch("todolist")}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                currentView === "todolist"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              TodoList
            </button>
          </div>
        </div>
      </div>

      {currentView === "canvas" ? (
        <>
          {/* Left Floating Sidebar */}
          <div className="absolute top-3 left-3 z-20">
            <FloatingSidebar
              groups={groups}
              onNewIdea={handleNewIdea}
              onTodoListOpen={handleTodoListOpen}
              onCreateGroup={createGroupMutation.mutate}
            />
          </div>

          {/* Canvas - Full screen background */}
          <div className="canvas-content absolute inset-0">
            <InfiniteCanvas
              ref={canvasRef}
              ideas={ideas}
              groups={groups}
              zoom={zoom}
              panOffset={panOffset}
              onIdeaUpdate={handleIdeaUpdate}
              onIdeaEdit={handleEditIdea}
              onIdeaDelete={handleIdeaDelete}
              onPanChange={setPanOffset}
            />
          </div>

          {/* Zoom Controls - now positioned internally */}
          <ZoomControls
            zoom={zoom}
            onZoomChange={setZoom}
            onResetView={() => {
              setZoom(1);
              setPanOffset({ x: 0, y: 0 });
            }}
          />
        </>
      ) : (
        <div className="pt-24 px-8 pb-8">
          <TodoListGrid
            groups={groups}
            ideas={ideas}
            onTodoListOpen={handleTodoListOpen}
          />
        </div>
      )}

      {/* Modals */}
      <IdeaModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        onSubmit={handleIdeaModalSubmit}
        groups={groups}
        editingIdea={editingIdeaId ? ideas.find(i => i.id === editingIdeaId) : null}
        isLoading={editingIdeaId ? updateIdeaMutation.isPending : createIdeaMutation.isPending}
      />

      <TodoListModal
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        groupId={selectedGroupId}
        group={selectedGroupId ? groups.find(g => g.id === selectedGroupId) || null : null}
        ideas={selectedGroupId ? ideas.filter(i => i.groupId === selectedGroupId) : []}
        onIdeaUpdate={handleIdeaUpdate}
      />
    </div>
  );
}
