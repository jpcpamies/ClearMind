import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCategorySchema, type Category } from "@shared/schema";
import { z } from "zod";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null; // null for create, Category object for edit
}

const categoryFormSchema = insertCategorySchema.extend({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
});

export function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = !!category;
  
  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setColor(category.color);
      } else {
        setName("");
        setColor("#6366f1");
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: z.infer<typeof categoryFormSchema>) => {
      const response = await apiRequest("POST", "/api/categories", categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (categoryData: z.infer<typeof categoryFormSchema>) => {
      const response = await apiRequest("PUT", `/api/categories/${category!.id}`, categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const categoryData = categoryFormSchema.parse({ name: name.trim(), color });
      
      if (isEditing) {
        updateCategoryMutation.mutate(categoryData);
      } else {
        createCategoryMutation.mutate(categoryData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const isPending = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="category-modal">
        <DialogHeader>
          <DialogTitle data-testid="category-modal-title">
            {isEditing ? "Edit Category" : "Create New Category"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              data-testid="input-category-name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500" data-testid="error-category-name">
                {errors.name}
              </p>
            )}
          </div>

          {/* Color Picker */}
          <ColorPicker
            value={color}
            onChange={setColor}
            className="space-y-2"
          />
          {errors.color && (
            <p className="text-sm text-red-500" data-testid="error-category-color">
              {errors.color}
            </p>
          )}

          {/* Live Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Label className="text-sm text-gray-500 mb-2 block">Preview</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: color }}
                data-testid="category-preview-dot"
              />
              <span className="text-sm font-medium" data-testid="category-preview-name">
                {name || "Category Name"}
              </span>
              <span className="text-xs text-gray-500">
                (0 ideas)
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              data-testid="button-cancel-category"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              data-testid="button-save-category"
            >
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}