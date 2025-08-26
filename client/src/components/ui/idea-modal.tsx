import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { X } from "lucide-react";
import type { Group, Idea } from "@shared/schema";

const ideaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  groupId: z.string().optional(),
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
  }, [editingIdea, form]);

  const handleSubmit = (data: IdeaFormData) => {
    const submitData = {
      ...data,
      groupId: data.groupId === "unassigned" ? null : data.groupId || null,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
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
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="button-submit-idea"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : editingIdea ? "Update Idea" : "Create Idea"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
