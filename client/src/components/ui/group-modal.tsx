import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group } from "@shared/schema";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGroup?: Group | null;
}

const colorOptions = [
  { value: "purple", label: "Purple", color: "#8B5CF6" },
  { value: "blue", label: "Blue", color: "#3B82F6" },
  { value: "green", label: "Green", color: "#10B981" },
  { value: "orange", label: "Orange", color: "#F59E0B" },
];

export default function GroupModal({
  isOpen,
  onClose,
  editingGroup = null,
}: GroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes or editing group changes
  useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name);
      setSelectedColor(editingGroup.color);
    } else {
      setGroupName("");
      setSelectedColor("purple");
    }
  }, [editingGroup, isOpen]);

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await apiRequest("POST", "/api/groups", data);
      return response.json();
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      onClose();
      resetForm();
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

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string }) => {
      const response = await apiRequest("PUT", `/api/groups/${data.id}`, {
        name: data.name,
        color: data.color,
      });
      return response.json();
    },
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      onClose();
      resetForm();
      toast({
        title: "Success",
        description: `Group '${updatedGroup.name}' updated successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setGroupName("");
    setSelectedColor("purple");
  };

  const getHexColor = (colorName: string) => {
    const colorMap = {
      purple: "#8B5CF6",
      blue: "#3B82F6",
      green: "#10B981",
      orange: "#F59E0B",
    };
    return colorMap[colorName as keyof typeof colorMap] || "#8B5CF6";
  };

  const handleSubmit = () => {
    if (!groupName.trim()) return;

    if (groupName.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Group name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    if (groupName.trim().length > 100) {
      toast({
        title: "Validation Error",
        description: "Group name must be no more than 100 characters long",
        variant: "destructive",
      });
      return;
    }

    const hexColor = getHexColor(selectedColor);

    if (editingGroup) {
      updateGroupMutation.mutate({
        id: editingGroup.id,
        name: groupName.trim(),
        color: hexColor,
      });
    } else {
      createGroupMutation.mutate({
        name: groupName.trim(),
        color: hexColor,
      });
    }
  };

  const handleClose = () => {
    if (!createGroupMutation.isPending && !updateGroupMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  const isPending = createGroupMutation.isPending || updateGroupMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md z-[60]">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-xl">
            {editingGroup ? "Edit Group" : "Create New Group"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              data-testid="input-group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              disabled={isPending}
              maxLength={100}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label>Color</Label>
            <RadioGroup 
              value={selectedColor} 
              onValueChange={setSelectedColor}
              disabled={isPending}
            >
              <div className="grid grid-cols-2 gap-3">
                {colorOptions.map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={color.value} id={color.value} />
                    <Label 
                      htmlFor={color.value} 
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.color }}
                      />
                      <span>{color.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            data-testid="button-save-group"
            onClick={handleSubmit}
            disabled={!groupName.trim() || isPending}
          >
            {isPending 
              ? (editingGroup ? "Updating..." : "Creating...") 
              : (editingGroup ? "Update" : "Create")
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}