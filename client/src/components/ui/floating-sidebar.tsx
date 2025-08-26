import { useState } from "react";
import { Plus, MoreHorizontal, Edit2, List, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./dialog";
import { useQuery } from "@tanstack/react-query";
import type { Group } from "@shared/schema";

interface FloatingSidebarProps {
  groups: Group[];
  onNewIdea: () => void;
  onTodoListOpen: (groupId: string) => void;
  onCreateGroup: (groupData: any) => void;
}

const colorOptions = [
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
];

export default function FloatingSidebar({
  groups,
  onNewIdea,
  onTodoListOpen,
  onCreateGroup,
}: FloatingSidebarProps) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState("purple");

  // Get idea counts for each group
  const { data: ideas = [] } = useQuery({
    queryKey: ["/api/ideas"],
  });

  const getIdeaCount = (groupId: string) => {
    return (ideas as any[]).filter((idea: any) => idea.groupId === groupId).length;
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) return;

    onCreateGroup({
      name: groupName,
      color: groupColor,
    });

    setGroupName("");
    setGroupColor("purple");
    setIsCreateGroupOpen(false);
  };

  const getColorClass = (color: string) => {
    const colorMap = {
      purple: "bg-purple-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      orange: "bg-orange-500",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-purple-500";
  };

  return (
    <div className="frosted-glass-sidebar p-6 w-72 animate-slideUp">
      {/* New Idea Button */}
      <Button
        data-testid="button-new-idea"
        onClick={onNewIdea}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg mb-6 flex items-center justify-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>New Idea</span>
      </Button>

      {/* Idea Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            Idea Groups
          </h3>
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-create-group"
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    data-testid="input-group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="group-color">Color</Label>
                  <Select value={groupColor} onValueChange={setGroupColor}>
                    <SelectTrigger data-testid="select-group-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${color.color}`} />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateGroupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-submit-group"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                >
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Group List */}
        {groups.length === 0 ? (
          <div className="text-center py-8 text-white/80">
            <p className="text-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>No groups created yet.</p>
            <p className="text-xs mt-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Click + to create your first group.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                data-testid={`group-item-${group.id}`}
                className="frosted-glass-group-item p-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full ${getColorClass(group.color)} flex items-center justify-center`}>
                      <div className="w-3 h-3 rounded-full bg-white/30" />
                    </div>
                    <span className="font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                      {group.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white bg-white/20 px-2 py-1 rounded backdrop-blur-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                      {getIdeaCount(group.id)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-group-menu-${group.id}`}
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4 text-white/80" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-3 w-3" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`button-update-todolist-${group.id}`}
                          onClick={() => onTodoListOpen(group.id)}
                        >
                          <List className="mr-2 h-3 w-3" />
                          Update TodoList
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
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
  );
}
