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

  // Create idea mutation
  const createIdeaMutation = useMutation({
    mutationFn: async (ideaData: any) => {
      const response = await apiRequest("POST", "/api/ideas", ideaData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setIsIdeaModalOpen(false);
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
    updateIdeaMutation.mutate({ id: ideaId, ...updates });
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
      <div className="w-screen h-screen flex items-center justify-center bg-canvas-bg">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-canvas-bg overflow-hidden">
      {/* Top Navigation Toggle */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
        <div className="glassmorphism rounded-lg p-1 card-shadow">
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
          <div className="absolute top-24 left-6 z-20">
            <FloatingSidebar
              groups={groups}
              onNewIdea={handleNewIdea}
              onTodoListOpen={handleTodoListOpen}
              onCreateGroup={createGroupMutation.mutate}
            />
          </div>

          {/* Canvas */}
          <div className="canvas-content absolute inset-0 pt-24 pl-80 pr-6 pb-6">
            <InfiniteCanvas
              ref={canvasRef}
              ideas={ideas}
              groups={groups}
              zoom={zoom}
              panOffset={panOffset}
              onIdeaUpdate={handleIdeaUpdate}
              onIdeaEdit={handleEditIdea}
            />
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 z-20">
            <ZoomControls
              zoom={zoom}
              onZoomChange={setZoom}
              onResetView={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
            />
          </div>
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
        onSubmit={createIdeaMutation.mutate}
        groups={groups}
        editingIdea={editingIdeaId ? ideas.find(i => i.id === editingIdeaId) : null}
        isLoading={createIdeaMutation.isPending}
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
