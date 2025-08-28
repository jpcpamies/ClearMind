import { useState } from "react";
import { Plus, MoreHorizontal, Edit2, Trash2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import logoUrl from "@assets/logo-clearming_1756234542415.png";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  if (isCollapsed) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200"
          data-testid="button-expand-sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 left-4 z-50 w-80 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src={logoUrl} 
              alt="Clear Mind Logo" 
              className="w-8 h-8 rounded-lg"
              data-testid="logo"
            />
            <span className="text-lg font-semibold text-gray-800">Clear Mind</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0"
            data-testid="button-collapse-sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mb-6">
          <Button
            onClick={onNewIdea}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-new-idea"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Idea
          </Button>
          <Button
            onClick={handleNewGroup}
            variant="outline"
            className="flex-1"
            data-testid="button-new-group"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Groups</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {groups.length}
          </span>
        </div>

        {/* Groups List */}
        <div className="max-h-96 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No groups created yet.</p>
              <p className="text-xs mt-1">Click + to create your first group.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  data-testid={`group-item-${group.id}`}
                  className="group-item p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                        data-testid={`group-color-dot-${group.id}`}
                      />
                      <span className="font-medium text-gray-900">{group.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                        {getIdeaCount(group.id)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-group-menu-${group.id}`}
                            className="h-6 w-6 p-0 bg-white hover:bg-gray-50 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditGroup(group)}
                            data-testid={`button-edit-group-${group.id}`}
                          >
                            <Edit2 className="mr-2 h-3 w-3" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-red-600"
                            data-testid={`button-delete-group-${group.id}`}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}