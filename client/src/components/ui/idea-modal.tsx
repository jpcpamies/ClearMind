import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { X, Plus } from "lucide-react";
import type { Group, Idea } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const ideaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  groupId: z.string().optional(),
  canvasX: z.number().optional(),
  canvasY: z.number().optional(),
  completed: z.boolean().optional(),
});

type IdeaFormData = z.infer<typeof ideaFormSchema>;

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IdeaFormData) => void;
  groups: Group[];
  editingIdea?: Idea | null;
  isLoading?: boolean;
}

const presetColors = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" }
];

export default function IdeaModal({
  isOpen,
  onClose,
  onSubmit,
  groups,
  editingIdea,
  isLoading = false,
}: IdeaModalProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#8B5CF6");
  const [pendingGroupSelection, setPendingGroupSelection] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle ESC key for inline group creation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateGroup) {
        setShowCreateGroup(false);
        resetGroupForm();
      }
    };

    if (showCreateGroup) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showCreateGroup]);

  // Group creation mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await apiRequest("POST", "/api/groups", data);
      return response.json();
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      // Auto-select the newly created group
      form.setValue("groupId", newGroup.id);
      setPendingGroupSelection(newGroup.id);
      setShowCreateGroup(false);
      resetGroupForm();
      toast({
        title: "Success",
        description: `Group '${newGroup.name}' created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetGroupForm = () => {
    setGroupName("");
    setSelectedColor("#8B5CF6");
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    if (groupName.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Group name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupName.trim(),
      color: selectedColor,
    });
  };

  const form = useForm<IdeaFormData>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      groupId: "unassigned",
    },
  });

  useEffect(() => {
    if (editingIdea) {
      form.reset({
        title: editingIdea.title,
        description: editingIdea.description || "",
        priority: editingIdea.priority || "medium",
        groupId: editingIdea.groupId || "unassigned",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        priority: "medium",
        groupId: pendingGroupSelection || "unassigned",
      });
    }
    
    // Close group creation modal when idea modal closes
    if (!isOpen) {
      setShowCreateGroup(false);
      resetGroupForm();
      setPendingGroupSelection(null);
    }
  }, [editingIdea, form, isOpen, pendingGroupSelection]);

  const handleSubmit = (data: IdeaFormData) => {
    const submitData = {
      ...data,
      groupId: data.groupId === "unassigned" ? undefined : data.groupId,
      completed: false,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="idea-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="idea-modal-title">
              {editingIdea ? "Edit Idea" : "Create New Idea"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-close-idea-modal"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-idea-title"
                      placeholder="Enter idea title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="textarea-idea-description"
                      placeholder="Describe your idea..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-idea-group">
                        <SelectValue placeholder="Select a group..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <span>{group.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <button
                          type="button"
                          data-testid="button-create-new-group"
                          className="flex items-center space-x-2 w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 rounded-sm transition-colors"
                          onClick={() => setShowCreateGroup(true)}
                        >
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600 font-medium">Create New Group</span>
                        </button>
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-idea-priority">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="critical">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
                data-testid="button-cancel-idea"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="button-submit-idea"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : editingIdea ? "Update Idea" : "Create Idea"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      
      {/* Inline Group Creation Modal */}
      {showCreateGroup && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center" 
          style={{ zIndex: 1100 }} 
          data-testid="inline-group-creation-overlay"
          onClick={() => {
            setShowCreateGroup(false);
            resetGroupForm();
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-all duration-200 ease-out" 
            style={{ zIndex: 1101 }}
            data-testid="inline-group-creation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" data-testid="inline-group-modal-title">Create New Group</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-close-inline-group-modal"
                  onClick={() => {
                    setShowCreateGroup(false);
                    resetGroupForm();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Group Name */}
                <div className="space-y-2">
                  <Label htmlFor="inline-group-name">Group Name *</Label>
                  <Input
                    id="inline-group-name"
                    data-testid="input-inline-group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    disabled={createGroupMutation.isPending}
                    maxLength={100}
                  />
                </div>
                
                {/* Compact Color Picker */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        data-testid={`inline-color-${color.name.toLowerCase()}`}
                        className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-105 ${
                          selectedColor === color.value
                            ? "border-gray-900 ring-2 ring-gray-300"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setSelectedColor(color.value)}
                        disabled={createGroupMutation.isPending}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <span>{selectedColor}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateGroup(false);
                    resetGroupForm();
                  }}
                  className="flex-1"
                  disabled={createGroupMutation.isPending}
                  data-testid="button-cancel-inline-group"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateGroup}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={createGroupMutation.isPending}
                  data-testid="button-create-inline-group"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}