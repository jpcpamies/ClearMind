import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, List, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, Idea } from "@shared/schema";

interface CreateTodoListModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  ideas: Idea[];
}

export default function CreateTodoListModal({
  isOpen,
  onClose,
  categories,
  ideas,
}: CreateTodoListModalProps) {
  const [todoListName, setTodoListName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [creationType, setCreationType] = useState<"empty" | "import">("empty");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create TodoList mutation
  const createTodoListMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      categoryId?: string;
      importIdeas: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/groups", {
        name: data.name,
        color: getRandomColor(),
        categoryId: data.categoryId,
        importIdeas: data.importIdeas,
      });
      return response.json();
    },
    onSuccess: (newGroup) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      
      // Close modal and reset form
      onClose();
      resetForm();
      
      toast({
        title: "Success",
        description: `TodoList '${newGroup.name}' created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create TodoList. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getRandomColor = () => {
    const colors = ["purple", "blue", "green", "orange"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const resetForm = () => {
    setTodoListName("");
    setSelectedCategory("");
    setCreationType("empty");
  };

  const handleSubmit = () => {
    if (!todoListName.trim()) return;

    if (todoListName.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "TodoList name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    if (todoListName.trim().length > 100) {
      toast({
        title: "Validation Error", 
        description: "TodoList name must be no more than 100 characters long",
        variant: "destructive",
      });
      return;
    }

    createTodoListMutation.mutate({
      name: todoListName.trim(),
      categoryId: creationType === "import" ? selectedCategory : undefined,
      importIdeas: creationType === "import" && !!selectedCategory,
    });
  };

  const handleClose = () => {
    if (!createTodoListMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || "#8B5CF6";
  };

  const getSelectedCategoryIdeas = () => {
    if (!selectedCategory) return [];
    return ideas.filter(idea => idea.categoryId === selectedCategory);
  };

  const selectedCategoryIdeas = getSelectedCategoryIdeas();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Create New TodoList</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={createTodoListMutation.isPending}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* TodoList Name */}
          <div className="space-y-2">
            <Label htmlFor="todolist-name">TodoList Name *</Label>
            <Input
              id="todolist-name"
              data-testid="input-todolist-name"
              value={todoListName}
              onChange={(e) => setTodoListName(e.target.value)}
              placeholder="Enter TodoList name..."
              disabled={createTodoListMutation.isPending}
              maxLength={100}
            />
          </div>

          {/* Creation Type */}
          <div className="space-y-3">
            <Label>Creation Type</Label>
            <RadioGroup 
              value={creationType} 
              onValueChange={(value) => setCreationType(value as "empty" | "import")}
              disabled={createTodoListMutation.isPending}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="empty" id="empty" />
                <Label htmlFor="empty" className="flex items-center space-x-2 cursor-pointer">
                  <List className="w-4 h-4" />
                  <span>Create empty TodoList</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="import" id="import" />
                <Label htmlFor="import" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  <span>Import ideas from selected category</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Category Selection */}
          {creationType === "import" && (
            <div className="space-y-2">
              <Label>Select Category</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                disabled={createTodoListMutation.isPending}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preview */}
              {selectedCategory && (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    {selectedCategoryIdeas.length > 0 ? (
                      <>
                        <strong>{selectedCategoryIdeas.length}</strong> idea{selectedCategoryIdeas.length !== 1 ? 's' : ''} will be converted to tasks
                        <br />
                        <span className="text-xs">Tasks will be set to Medium priority by default</span>
                      </>
                    ) : (
                      <span>No ideas found in this category</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createTodoListMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            data-testid="button-create-todolist"
            onClick={handleSubmit}
            disabled={
              !todoListName.trim() || 
              createTodoListMutation.isPending ||
              (creationType === "import" && !selectedCategory)
            }
          >
            {createTodoListMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}