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
import { CategoryModal } from "@/components/modals/CategoryModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";

interface FloatingSidebarProps {
  onNewIdea: () => void;
  onTodoListOpen?: (groupId: string) => void; // Legacy - maintained for compatibility
}

export default function FloatingSidebar({
  onNewIdea,
  onTodoListOpen,
}: FloatingSidebarProps) {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories and ideas
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ["/api/ideas"],
  });

  // Get idea count for each category
  const getIdeaCount = (categoryId: string) => {
    return (ideas as any[]).filter((idea: any) => idea.categoryId === categoryId).length;
  };

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest("DELETE", `/api/categories/${categoryId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ideas"] });
      toast({
        title: "Success",
        description: "Category deleted successfully. Ideas moved to General category.",
      });
    },
    onError: (error) => {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.name === "General") {
      toast({
        title: "Cannot Delete",
        description: "The General category cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete "${category.name}"? All ideas will be moved to the General category.`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <>
      {/* Collapsed sidebar - show toggle button */}
      {isCollapsed && (
        <div className="fixed left-4 top-4 z-[40] animate-fadeIn">
          <Button
            onClick={() => setIsCollapsed(false)}
            className="frosted-glass-bg border-0 p-4 rounded-lg shadow-lg hover:bg-white/30 transition-all"
            data-testid="button-show-sidebar"
          >
            <PanelLeftOpen className="w-6 h-6 text-black" />
          </Button>
        </div>
      )}

      {/* Main sidebar */}
      <div 
        className={`frosted-glass-bg rounded-lg p-3 w-[400px] animate-slideUp transition-all duration-300 ease-in-out ${
          isCollapsed ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
        }`} 
        style={{height: 'calc(100vh - 24px)'}}
      >
        {/* Collapse button */}
        <div className="absolute top-3 left-3 z-10">
          <Button
            onClick={() => setIsCollapsed(true)}
            variant="ghost"
            size="sm"
            className="p-1 hover:bg-white/20 rounded transition-all"
            data-testid="button-collapse-sidebar"
          >
            <PanelLeftClose className="w-6 h-6 text-black" />
          </Button>
        </div>

        {/* Logo */}
        <div className="mt-[140px] mb-4">
          <img 
            src={logoUrl} 
            alt="ClearMind Logo" 
            className="w-[140px] h-auto"
          />
        </div>

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-base font-medium text-gray-900 mb-1">
            Hello Jordi Pamies
          </h2>
          <p className="text-sm text-gray-500">
            What ideas do you have today?
          </p>
        </div>

        {/* New Idea Button */}
        <Button
          data-testid="button-new-idea"
          onClick={onNewIdea}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg mb-6 flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Idea</span>
        </Button>

        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900 font-semibold text-sm uppercase tracking-wide">
              Categories
            </h3>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-create-category"
              className="h-6 w-6 p-0"
              onClick={handleNewCategory}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Category List */}
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No categories created yet.</p>
              <p className="text-xs mt-1">Click + to create your first category.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  data-testid={`category-item-${category.id}`}
                  className="category-item p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                        data-testid={`category-color-dot-${category.id}`}
                      />
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                        {getIdeaCount(category.id)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-category-menu-${category.id}`}
                            className="h-6 w-6 p-0 bg-white hover:bg-gray-50 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditCategory(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit2 className="mr-2 h-3 w-3" />
                            Edit Category
                          </DropdownMenuItem>
                          {category.name !== "General" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteCategory(category)}
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete Category
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        category={editingCategory}
      />
    </>
  );
}