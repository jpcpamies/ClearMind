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
import GroupModal from "./group-modal";

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



export default function IdeaModal({
  isOpen,
  onClose,
  onSubmit,
  groups,
  editingIdea,
  isLoading = false,
}: IdeaModalProps) {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const { toast } = useToast();







  const handleGroupModalClose = () => {
    setShowCreateGroupModal(false);
  };

  const handleGroupCreated = (newGroup: Group) => {
    // Auto-select the newly created group
    form.setValue("groupId", newGroup.id);
    setShowCreateGroupModal(false);
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
        groupId: "unassigned",
      });
    }
    
    // Close group modal when idea modal closes
    if (!isOpen) {
      setShowCreateGroupModal(false);
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-md"
          data-testid="idea-modal"
        >
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCreateGroupModal(true);
                          }}
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
    </Dialog>
    
    {/* Reuse the existing GroupModal component */}
    <GroupModal 
      isOpen={showCreateGroupModal}
      onClose={handleGroupModalClose}
      editingGroup={null}
      onGroupCreated={handleGroupCreated}
    />
  </>
  );
}