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
  onGroupCreated?: (group: Group) => void;
}

const presetColors = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Emerald", value: "#059669" },
  { name: "Yellow", value: "#FCD34D" },
  { name: "Lime", value: "#84CC16" },
  { name: "Rose", value: "#F43F5E" },
];

export default function GroupModal({
  isOpen,
  onClose,
  editingGroup = null,
  onGroupCreated,
}: GroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#8B5CF6");
  const [customColor, setCustomColor] = useState("");
  const [colorMode, setColorMode] = useState<"preset" | "custom">("preset");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes or editing group changes
  useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name);
      setSelectedColor(editingGroup.color);
      // Check if the color is a preset or custom
      const isPreset = presetColors.some(preset => preset.value === editingGroup.color);
      if (isPreset) {
        setColorMode("preset");
      } else {
        setColorMode("custom");
        setCustomColor(editingGroup.color);
      }
    } else {
      setGroupName("");
      setSelectedColor("#8B5CF6");
      setCustomColor("");
      setColorMode("preset");
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
      if (onGroupCreated) {
        onGroupCreated(newGroup);
      }
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
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/groups/${id}`, updateData);
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
    setSelectedColor("#8B5CF6");
    setCustomColor("");
    setColorMode("preset");
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

    const finalColor = colorMode === "custom" ? customColor : selectedColor;

    if (!finalColor) {
      toast({
        title: "Validation Error",
        description: "Please select or enter a color",
        variant: "destructive",
      });
      return;
    }

    if (editingGroup) {
      updateGroupMutation.mutate({
        id: editingGroup.id,
        name: groupName.trim(),
        color: finalColor,
      });
    } else {
      createGroupMutation.mutate({
        name: groupName.trim(),
        color: finalColor,
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
      <DialogContent className="max-w-md z-[1100]" style={{ zIndex: 1100 }}>
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

          {/* Color Selection Mode */}
          <div className="space-y-3">
            <Label>Color Selection</Label>
            <RadioGroup 
              value={colorMode} 
              onValueChange={(value: "preset" | "custom") => setColorMode(value)}
              disabled={isPending}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="preset" id="preset" />
                <Label htmlFor="preset" className="cursor-pointer">Preset Colors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">Custom Color</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preset Colors */}
          {colorMode === "preset" && (
            <div className="space-y-3">
              <Label>Choose a Color</Label>
              <div className="grid grid-cols-4 gap-3">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    data-testid={`color-${color.name.toLowerCase()}`}
                    className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedColor === color.value
                        ? "border-gray-900 ring-2 ring-gray-300"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    disabled={isPending}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: selectedColor }}
                />
                <span>{selectedColor}</span>
              </div>
            </div>
          )}

          {/* Custom Color */}
          {colorMode === "custom" && (
            <div className="space-y-3">
              <Label htmlFor="custom-color">Custom Color</Label>
              <div className="space-y-2">
                <Input
                  id="custom-color"
                  data-testid="input-custom-color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="e.g., #FF5733, rgb(255,87,51), red, hsl(9,100%,60%)"
                  disabled={isPending}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={customColor.startsWith('#') ? customColor : '#8B5CF6'}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    disabled={isPending}
                    data-testid="color-picker"
                  />
                  <span className="text-sm text-gray-500">Or use the color picker</span>
                </div>
                {customColor && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: customColor }}
                    />
                    <span>Preview: {customColor}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Supported formats:</strong></p>
                <p>• Hex: #FF5733, #f57</p>
                <p>• RGB: rgb(255, 87, 51)</p>
                <p>• HSL: hsl(9, 100%, 60%)</p>
                <p>• Named: red, blue, emerald</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !groupName.trim()}
              data-testid="button-submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isPending
                ? (editingGroup ? "Updating..." : "Creating...")
                : (editingGroup ? "Update" : "Create")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}