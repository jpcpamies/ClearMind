import { useState } from "react";
import { Plus, MoreHorizontal, Edit2, Trash2, Upload, ChevronLeft, Menu } from "lucide-react";
import logoUrl from "@assets/logo-clearming_1756380749140.png";
import { Button } from "./button";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@shared/schema";
import GroupModal from "./group-modal";

interface FloatingSidebarProps {
  onNewIdea: () => void;
  onTodoListOpen?: (groupId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function FloatingSidebar({
  onNewIdea,
  onTodoListOpen,
  isCollapsed,
  onToggleCollapse,
}: FloatingSidebarProps) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch groups and ideas
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ["/api/ideas"],
  });

  // Get idea count for each group
  const getIdeaCount = (groupId: string) => {
    return (ideas as any[]).filter((idea: any) => idea.groupId === groupId).length;
  };

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("DELETE", `/api/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting group:", error);
      toast({
        title: "Error", 
        description: "Failed to delete group",
        variant: "destructive",
      });
    },
  });

  const handleNewGroup = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group?")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroup(null);
  };

  // Import JSON file mutation
  const importDataMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/import-data", data);
    },
    onSuccess: () => {
      toast({
        title: "Import successful",
        description: "Data has been imported successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
    },
    onError: (error) => {
      console.error("Import failed:", error);
      toast({
        title: "Import failed",
        description: "Failed to import data. Please check your file format.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        importDataMutation.mutate(jsonData);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "The uploaded file contains invalid JSON.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const getColorClass = (color: string) => {
    // Return the color as-is since it's now a flexible CSS color value
    return color || "#8B5CF6";
  };

  const isValidColor = (color: string) => {
    // Create a temporary element to test if the color is valid
    const testElement = document.createElement("div");
    testElement.style.color = color;
    return testElement.style.color !== "";
  };

  return (
    <>
      {/* Collapsed Toggle Button */}
      {isCollapsed && (
        <div 
          className="fixed z-floating"
          style={{ 
            top: '14px',
            left: '14px',
            transition: "all 0.3s ease-in-out" 
          }}
        >
          <Button
            onClick={onToggleCollapse}
            variant="outline"
            size="sm"
            className="w-12 h-12 p-0 bg-white/30 border-white/40 rounded-xl hover:bg-white/40"
            style={{
              backdropFilter: "blur(20px) saturate(180%) contrast(110%) brightness(100%)"
            }}
            data-testid="button-expand-sidebar"
            title="Expand sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </Button>
        </div>
      )}

      {/* Main Sidebar */}
      <div 
        className="fixed top-3 left-3 bottom-3 z-floating w-80 bg-white/30 rounded-2xl border border-white/40 p-3 flex flex-col"
        style={{
          backdropFilter: "blur(20px) saturate(180%) contrast(110%) brightness(100%)",
          transform: isCollapsed ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 0.3s ease-in-out"
        }}
      >
        {/* Collapse Button */}
        <div className="absolute top-3 right-3">
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-white/20"
            data-testid="button-collapse-sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Header with 140px spacing from top */}
        <div className="pt-[140px] mb-8">
          <img 
            src={logoUrl} 
            alt="ClearMind Logo" 
            className="w-[140px] h-auto mb-4"
            data-testid="logo"
          />
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Hello Demo User</h2>
          <p className="text-sm text-gray-600">What ideas do you have today?</p>
        </div>

        {/* Import JSON File */}
        <div className="mb-4">
          <label 
            htmlFor="json-import" 
            className="flex items-center justify-center w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            data-testid="import-file-area"
          >
            <Upload className="w-4 h-4 mr-2 text-gray-600" />
            <span className="text-sm text-gray-600">Import JSON file</span>
            <Input
              id="json-import"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-import-file"
              disabled={importDataMutation.isPending}
            />
          </label>
          {importDataMutation.isPending && (
            <p className="text-xs text-gray-500 mt-1 text-center">Processing...</p>
          )}
        </div>

        {/* New Idea Button */}
        <Button
          onClick={onNewIdea}
          className="w-full mb-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 rounded-xl"
          data-testid="button-new-idea"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Idea
        </Button>

        {/* Idea Groups Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">IDEA GROUPS</h3>
            <Button
              onClick={handleNewGroup}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-600 hover:text-gray-900"
              data-testid="button-new-group"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Groups List */}
          <div className="space-y-2">
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No groups created yet.</p>
                <p className="text-xs mt-1">Click + to create your first group.</p>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  data-testid={`group-item-${group.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer group border border-white/20"
                  onClick={() => onTodoListOpen?.(group.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getColorClass(group.color) }}
                      data-testid={`group-color-dot-${group.id}`}
                    />
                    <span className="font-medium text-gray-900 text-sm">{group.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 px-2 py-1 min-w-[20px] text-center">
                      {getIdeaCount(group.id)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-group-menu-${group.id}`}
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3 h-3 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => handleEditGroup(group)}
                          data-testid={`button-edit-group-${group.id}`}
                          className="text-sm"
                        >
                          <Edit2 className="mr-2 h-3 w-3" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-600 text-sm"
                          data-testid={`button-delete-group-${group.id}`}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={handleCloseGroupModal}
        editingGroup={editingGroup}
      />
    </>
  );
}