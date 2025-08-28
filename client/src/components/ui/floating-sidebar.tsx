import { useState } from "react";
import { Plus, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import logoUrl from "@assets/logo-clearming_1756380749140.png";
import { Button } from "./button";
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
}

export default function FloatingSidebar({
  onNewIdea,
  onTodoListOpen,
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

  const getColorClass = (color: string) => {
    // If it's already a hex color, return it
    if (color.startsWith("#")) {
      return color;
    }
    
    // Otherwise, convert from color name to hex
    const colorMap = {
      purple: "#8B5CF6",
      blue: "#3B82F6", 
      green: "#10B981",
      orange: "#F59E0B",
    };
    return colorMap[color as keyof typeof colorMap] || "#8B5CF6";
  };

  return (
    <>
      <div className="fixed top-3 left-3 bottom-3 z-50 w-80 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-3 flex flex-col">
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
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
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
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full min-w-[20px] text-center">
                      {getIdeaCount(group.id)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-group-menu-${group.id}`}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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