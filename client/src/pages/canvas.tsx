import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import InfiniteCanvas from "@/components/ui/infinite-canvas";
import FloatingSidebar from "@/components/ui/floating-sidebar";
import TodoListGrid from "@/components/ui/todolist-grid";
import IdeaModal from "@/components/ui/idea-modal";
import TodoListModal from "@/components/ui/todolist-modal";
import CreateTodoListModal from "@/components/modals/CreateTodoListModal";
import ZoomControls from "@/components/ui/zoom-controls";
import { useCanvas } from "@/hooks/use-canvas";
import type { Idea, Group } from "@shared/schema";

type View = "canvas" | "todolist";

export default function Canvas() {
  const [currentView, setCurrentView] = useState<View>("canvas");
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isCreateTodoModalOpen, setIsCreateTodoModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [isInitialPositioned, setIsInitialPositioned] = useState(false);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canvasRef, zoom, setZoom, panOffset, setPanOffset, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd } = useCanvas();

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

  // Get current viewport center for new cards with random offset
  const getViewportCenter = () => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for sidebar occupied space (320px width + 12px left margin = 332px)
    const sidebarOccupiedSpace = 332;
    const effectiveWidth = rect.width - sidebarOccupiedSpace;
    
    // Calculate the actual center of visible canvas area
    const viewportCenterX = (effectiveWidth / 2) + sidebarOccupiedSpace;
    const viewportCenterY = rect.height / 2;
    
    // Convert screen coordinates to canvas coordinates
    // From infinite-canvas: screenX = canvasX * zoom + panOffset.x
    // So: canvasX = (screenX - panOffset.x) / zoom
    const canvasCenterX = (viewportCenterX - panOffset.x) / zoom;
    const canvasCenterY = (viewportCenterY - panOffset.y) / zoom;
    
    // Add slight random offset to avoid overlapping
    const randomOffsetX = (Math.random() - 0.5) * 100; // ±50px
    const randomOffsetY = (Math.random() - 0.5) * 100; // ±50px
    
    return { 
      x: canvasCenterX + randomOffsetX, 
      y: canvasCenterY + randomOffsetY 
    };
  };

  // Initialize canvas positioning when ideas load
  useEffect(() => {
    if (!ideasLoading && !isInitialPositioned && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      
      // Account for sidebar occupied space (320px width + 12px left margin = 332px)
      const sidebarOccupiedSpace = 332;
      const effectiveWidth = rect.width - sidebarOccupiedSpace;
      const viewportCenterX = (effectiveWidth / 2) + sidebarOccupiedSpace;
      const viewportCenterY = rect.height / 2;
      
      if (ideas.length > 0) {
        // Center on existing cards
        const bounds = calculateCardsBounds(ideas);
        
        if (bounds) {
          console.log('Card bounds:', bounds);
          console.log('Viewport center:', { viewportCenterX, viewportCenterY });
          
          // Calculate pan offset to center the cards
          // From infinite-canvas: screenX = canvasX * zoom + panOffset.x
          // So for center: viewportCenterX = bounds.centerX * zoom + panOffset.x
          // Therefore: panOffset.x = viewportCenterX - bounds.centerX * zoom
          const offsetX = viewportCenterX - bounds.centerX * zoom;
          const offsetY = viewportCenterY - bounds.centerY * zoom;
          
          console.log('Setting pan offset:', { offsetX, offsetY });
          
          setPanOffset({
            x: offsetX,
            y: offsetY
          });
        }
      } else {
        // No cards exist, center canvas at origin (0,0)
        // To show origin at center: 0 * zoom + panOffset.x = viewportCenterX
        // So: panOffset.x = viewportCenterX
        setPanOffset({
          x: viewportCenterX,
          y: viewportCenterY
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      // Only show toast for non-position updates (avoid notifications when dragging)
      if (!('canvasX' in variables) && !('canvasY' in variables)) {
        toast({
          title: "Success",
          description: "Idea updated successfully",
        });
      }
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

  const handleIdeaSelect = (ideaId: string, isCtrlPressed: boolean) => {
    if (isCtrlPressed) {
      // Multi-select mode
      const newSelected = new Set(selectedIdeaIds);
      if (newSelected.has(ideaId)) {
        newSelected.delete(ideaId);
      } else {
        newSelected.add(ideaId);
      }
      setSelectedIdeaIds(newSelected);
    } else {
      // Single select or clear selection
      if (selectedIdeaIds.size > 0) {
        setSelectedIdeaIds(new Set());
      }
    }
  };

  const handleBulkDelete = () => {
    const ideaIds = Array.from(selectedIdeaIds);
    Promise.all(ideaIds.map(id => apiRequest("DELETE", `/api/ideas/${id}`)))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
        setSelectedIdeaIds(new Set());
        toast({
          title: "Success",
          description: `Deleted ${ideaIds.length} ideas successfully`,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to delete some ideas",
          variant: "destructive",
        });
      });
  };

  const handleBulkGroupChange = (groupId: string) => {
    const ideaIds = Array.from(selectedIdeaIds);
    Promise.all(ideaIds.map(id => apiRequest("PUT", `/api/ideas/${id}`, { groupId })))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
        setSelectedIdeaIds(new Set());
        toast({
          title: "Success",
          description: `Updated ${ideaIds.length} ideas successfully`,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to update some ideas",
          variant: "destructive",
        });
      });
  };

  const handleTodoListOpen = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsTodoModalOpen(true);
  };

  const handleViewSwitch = (view: View) => {
    setCurrentView(view);
  };

  const handleResetView = () => {
    console.log('🎯 Fit to canvas button clicked!');
    
    if (!canvasRef.current) {
      console.log('❌ No canvas ref available');
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    console.log('📐 Canvas dimensions:', rect);
    
    // Calculate actual sidebar occupied space by finding the floating sidebar
    // Look for the specific sidebar by its unique class combination
    const sidebarElement = document.querySelector('.fixed.top-3.left-3.bottom-3.z-floating.w-80');
    let sidebarOccupiedSpace = 332; // fallback
    
    if (sidebarElement) {
      const sidebarRect = sidebarElement.getBoundingClientRect();
      sidebarOccupiedSpace = sidebarRect.right; // Distance from left edge to right edge of sidebar
      console.log('🔍 Actual sidebar occupied space:', sidebarOccupiedSpace, 'px');
      console.log('🔍 Sidebar rect:', sidebarRect);
    } else {
      console.log('⚠️ Could not find sidebar element, using fallback:', sidebarOccupiedSpace, 'px');
      // Let's also list all elements with z-floating to debug
      const floatingElements = document.querySelectorAll('.z-floating');
      console.log('🔍 Found', floatingElements.length, 'floating elements:', floatingElements);
    }
    
    const effectiveWidth = rect.width - sidebarOccupiedSpace;
    const viewportCenterX = (effectiveWidth / 2) + sidebarOccupiedSpace;
    const viewportCenterY = rect.height / 2;
    
    console.log('🎯 Viewport center:', { viewportCenterX, viewportCenterY });
    console.log('📱 Current zoom:', zoom);
    console.log('🎮 Current pan offset:', panOffset);
    
    // Always set zoom to 100% (1.0) FIRST, then calculate positioning
    console.log('⚡ Setting zoom to 1.0');
    setZoom(1);
    
    // Use setTimeout to ensure zoom update is applied before calculating positions
    setTimeout(() => {
      console.log('⏰ Timeout callback - recalculating positions with new zoom');
      
      if (ideas.length > 0) {
      console.log('🃏 Found', ideas.length, 'cards');
      console.log('🃏 Card positions:', ideas.map(idea => ({ 
        id: idea.id, 
        title: idea.title, 
        canvasX: idea.canvasX, 
        canvasY: idea.canvasY 
      })));
      
      // Center on existing cards with correct transformation
      const bounds = calculateCardsBounds(ideas);
      console.log('📊 Card bounds:', bounds);
      
      if (bounds) {
        // Transform formula: screenPos = canvasPos * zoom + panOffset
        // We want the center of all cards to appear at viewportCenter
        // So: viewportCenter = bounds.center * zoom + panOffset
        // Therefore: panOffset = viewportCenter - bounds.center * zoom
        const offsetX = viewportCenterX - bounds.centerX;
        const offsetY = viewportCenterY - bounds.centerY;
        
        console.log('🎯 Calculated new pan offset:', { offsetX, offsetY });
        console.log('🎯 Setting pan offset...');
        setPanOffset({ x: offsetX, y: offsetY });
        console.log('✅ Pan offset set!');
        }
      } else {
        console.log('📭 No cards found, centering origin');
        // Center the origin (0,0) in the viewport
        setPanOffset({ x: viewportCenterX, y: viewportCenterY });
      }
    }, 100); // Wait 100ms for zoom state to update
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
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-floating">
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
          <div className="absolute top-3 left-3 z-floating">
            <FloatingSidebar
              onNewIdea={handleNewIdea}
              onTodoListOpen={handleTodoListOpen}
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
              selectedIdeaIds={selectedIdeaIds}
              onIdeaUpdate={handleIdeaUpdate}
              onIdeaEdit={handleEditIdea}
              onIdeaDelete={handleIdeaDelete}
              onIdeaSelect={handleIdeaSelect}
              onBulkDelete={handleBulkDelete}
              onBulkGroupChange={handleBulkGroupChange}
              onPanChange={setPanOffset}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Zoom Controls - now positioned internally */}
          <ZoomControls
            zoom={zoom}
            onZoomChange={setZoom}
            onResetView={handleResetView}
          />
        </>
      ) : (
        <div className="pt-24 px-8 pb-8">
          <TodoListGrid
            groups={groups}
            ideas={ideas}
            onTodoListOpen={handleTodoListOpen}
            onCreateTodoList={() => setIsCreateTodoModalOpen(true)}
          />
        </div>
      )}

      {/* Modals */}
      <IdeaModal
        isOpen={isIdeaModalOpen}
        onClose={() => {
          setIsIdeaModalOpen(false);
          setEditingIdeaId(null);
        }}
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

      <CreateTodoListModal
        isOpen={isCreateTodoModalOpen}
        onClose={() => setIsCreateTodoModalOpen(false)}
        groups={groups}
        ideas={ideas}
      />
    </div>
  );
}
