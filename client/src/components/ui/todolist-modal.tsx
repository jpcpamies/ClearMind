import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Flag, List, MoreHorizontal, Check, Trash } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group, Idea, TodoSection } from "@shared/schema";

interface TodoListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  group: Group | null;
  ideas: Idea[];
  onIdeaUpdate: (ideaId: string, updates: Partial<Idea>) => void;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const sectionIcons = {
  "High Priority": Flag,
  "General Tasks": List,
};

export default function TodoListModal({
  isOpen,
  onClose,
  groupId,
  group,
  ideas,
  onIdeaUpdate,
}: TodoListModalProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newSectionName, setNewSectionName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle ESC key for closing confirmation dialog
  useEscapeKey(() => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    }
  }, showDeleteConfirm);

  // Fetch todo sections for this group
  const { data: todoSections = [] } = useQuery<TodoSection[]>({
    queryKey: ["/api/groups", groupId, "todo-sections"],
    enabled: !!groupId,
  });

  // Create new task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/ideas", taskData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      setNewTaskText("");
      setNewTaskPriority("medium");
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: any) => {
      const response = await apiRequest("POST", "/api/todo-sections", sectionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "todo-sections"] });
      setNewSectionName("");
      toast({
        title: "Success",
        description: "Section created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest("DELETE", `/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Failed to delete TodoList");
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate groups and ideas queries to refresh sidebar
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      
      // Close modal
      onClose();
      
      toast({
        title: "Success",
        description: "TodoList deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete TodoList. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTaskText.trim() || !groupId) return;

    createTaskMutation.mutate({
      title: newTaskText,
      priority: newTaskPriority,
      groupId,
      canvasX: Math.random() * 400,
      canvasY: Math.random() * 400,
    });
  };

  const handleCreateSection = () => {
    if (!newSectionName.trim() || !groupId) return;

    createSectionMutation.mutate({
      groupId,
      name: newSectionName,
      order: todoSections.length,
    });
  };

  const handleTaskToggle = (ideaId: string, completed: boolean) => {
    onIdeaUpdate(ideaId, { completed });
  };

  const handleDeleteTodoList = () => {
    if (!groupId) return;
    setShowDeleteConfirm(false);
    deleteGroupMutation.mutate(groupId);
  };

  const getColorClass = (color: string) => {
    // Return the color as-is since it's now a flexible CSS color value
    return color || "#8B5CF6";
  };

  // Group ideas by priority for default sections
  const highPriorityIdeas = ideas.filter(idea => idea.priority === "high" || idea.priority === "critical");
  const generalIdeas = ideas.filter(idea => idea.priority === "low" || idea.priority === "medium");

  if (!group) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: getColorClass(group.color) }}
            />
            <DialogTitle className="text-xl">{group.name}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Section Creation */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-new-section"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Create a new section..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateSection();
                }
              }}
            />
            <Button
              data-testid="button-create-section"
              onClick={handleCreateSection}
              size="sm"
              disabled={!newSectionName.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-6">
          {/* High Priority Section */}
          {highPriorityIdeas.length > 0 && (
            <div className="section">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-red-500" />
                  <span>High Priority</span>
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit Section</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Section</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 ml-6">
                {highPriorityIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    data-testid={`todo-task-${idea.id}`}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={idea.completed || false}
                      onCheckedChange={(checked) => handleTaskToggle(idea.id, !!checked)}
                      className="rounded"
                    />
                    <span className={`flex-1 text-foreground ${idea.completed ? 'line-through opacity-60' : ''}`}>
                      {idea.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${priorityColors[(idea.priority || 'medium') as keyof typeof priorityColors]}`}>
                      {(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Tasks Section */}
          {generalIdeas.length > 0 && (
            <div className="section">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground flex items-center space-x-2">
                  <List className="w-4 h-4 text-blue-500" />
                  <span>General Tasks</span>
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit Section</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Section</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 ml-6">
                {generalIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    data-testid={`todo-task-${idea.id}`}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={idea.completed || false}
                      onCheckedChange={(checked) => handleTaskToggle(idea.id, !!checked)}
                      className="rounded"
                    />
                    <span className={`flex-1 text-foreground ${idea.completed ? 'line-through opacity-60' : ''}`}>
                      {idea.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${priorityColors[(idea.priority || 'medium') as keyof typeof priorityColors]}`}>
                      {(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Sections */}
          {todoSections.map((section) => (
            <div key={section.id} className="section">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{section.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit Section</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Section</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="ml-6">
                <p className="text-sm text-muted-foreground">Custom section tasks will appear here</p>
              </div>
            </div>
          ))}

          {ideas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tasks in this todolist yet.</p>
              <p className="text-sm mt-1">Create a task below to get started.</p>
            </div>
          )}
        </div>

        {/* Add New Task */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-new-task"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Create a new task..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateTask();
                }
              }}
            />
            <Select value={newTaskPriority} onValueChange={(value: any) => setNewTaskPriority(value)}>
              <SelectTrigger className="w-32" data-testid="select-new-task-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button
              data-testid="button-create-task"
              onClick={handleCreateTask}
              size="sm"
              disabled={!newTaskText.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm">
              Export TodoList
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              data-testid="button-delete-todolist"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteGroupMutation.isPending}
            >
              <Trash className="w-3 h-3 mr-1" />
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete TodoList"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Sync Priority: High</span>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    
    {/* Confirmation AlertDialog using proper layering */}
    <AlertDialog 
      open={showDeleteConfirm} 
      onOpenChange={setShowDeleteConfirm}
      onEscapeKeyDown={() => setShowDeleteConfirm(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete TodoList</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete '{group?.name}'?
            <br />
            <span className="text-destructive font-medium">This action cannot be undone.</span>
            {ideas.length > 0 && (
              <span className="block mt-2">
                All {ideas.length} task{ideas.length !== 1 ? 's' : ''} in this TodoList will be unassigned and moved back to the canvas.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            data-testid="button-confirm-delete"
            onClick={handleDeleteTodoList}
            disabled={deleteGroupMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}