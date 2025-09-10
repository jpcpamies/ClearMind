import { useState } from "react";
import { MoreHorizontal, Edit, Trash, Plus } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./dropdown-menu";
import type { Idea, Group } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface IdeaCardProps {
  idea: Idea;
  group?: Group;
  groups: Group[];
  color: string;
  position: { x: number; y: number };
  isDragging: boolean;
  isSelected: boolean;
  isExpanded?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<Idea>) => void;
  onDelete: () => void;
  onExpand?: () => void;
  onCreateGroup?: (name: string) => void;
}

const getCardStyle = (color: string) => {
  if (color === 'unassigned') {
    return {
      backgroundColor: '#FFFFFF',
      color: '#1A1A1A',
      isGrouped: false,
    };
  }
  return {
    backgroundColor: color || '#8B5CF6',
    color: '#FFFFFF',
    isGrouped: true,
  };
};

const priorityColors = {
  low: "text-gray-600",
  medium: "text-gray-600", 
  high: "text-gray-600",
  critical: "text-gray-600",
};

export default function IdeaCard({
  idea,
  group,
  groups,
  color,
  position,
  isDragging,
  isSelected,
  isExpanded = false,
  onMouseDown,
  onTouchStart,
  onEdit,
  onUpdate,
  onDelete,
  onExpand,
  onCreateGroup,
}: IdeaCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{x: number, y: number} | null>(null);
  const [wasDragged, setWasDragged] = useState(false);
  const queryClient = useQueryClient();

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Handle group change
  const handleGroupChange = async (groupId: string) => {
    try {
      await apiRequest('PUT', `/api/ideas/${idea.id}`, { groupId: groupId === 'unassigned' ? null : groupId });
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      setIsGroupDropdownOpen(false);
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  // Handle priority change
  const handlePriorityChange = async (priority: string) => {
    try {
      await apiRequest('PUT', `/api/ideas/${idea.id}`, { priority });
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['/api/ideas'] });
      setIsPriorityDropdownOpen(false);
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  // Handle new group creation
  const handleCreateNewGroup = () => {
    const groupName = prompt('Enter group name:');
    if (groupName && groupName.trim() && onCreateGroup) {
      onCreateGroup(groupName.trim());
      setIsGroupDropdownOpen(false);
    }
  };

  // Close all dropdowns when opening another
  const closeAllDropdowns = () => {
    setIsGroupDropdownOpen(false);
    setIsPriorityDropdownOpen(false);
    setIsMenuOpen(false);
  };

  // Handle mouse down to track potential dragging
  const handleMouseDownWithTracking = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setWasDragged(false);
    onMouseDown(e);
  };

  // Handle mouse up to detect if dragging occurred
  const handleMouseUpWithTracking = (e: React.MouseEvent) => {
    if (mouseDownPos) {
      const deltaX = Math.abs(e.clientX - mouseDownPos.x);
      const deltaY = Math.abs(e.clientY - mouseDownPos.y);
      const dragThreshold = 5; // pixels
      
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setWasDragged(true);
      }
    }
    setMouseDownPos(null);
  };

  // Handle card expansion - avoid menu dots, group label, and priority label
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractiveElement = 
      target.closest('[data-testid^="button-idea-menu"]') || // Menu dots
      target.closest('.group-label') || // Group label
      target.closest('.priority-label') || // Priority label
      target.closest('button') || // Any button
      target.closest('[role="menuitem"]'); // Menu items
    
    if (!isInteractiveElement && onExpand) {
      e.stopPropagation();
      // Pass drag detection info to expansion handler
      onExpand();
    }
  };

  const cardStyleData = getCardStyle(color);
  const priorityStyle = priorityColors[idea.priority as keyof typeof priorityColors] || priorityColors.medium;

  const isGrouped = cardStyleData.isGrouped;
  const menuIconColor = isGrouped ? "#FFFFFF" : "#999999";
  const tagBgColor = isGrouped ? "rgba(255,255,255,0.2)" : "#F3F4F6";
  const tagTextColor = isGrouped ? "#FFFFFF" : "#555555";
  const titleColor = isGrouped ? "#FFFFFF" : "#1A1A1A";
  const descriptionColor = isGrouped ? "#FFFFFF" : "#666666";

  return (
    <div
      data-testid={`idea-card-${idea.id}`}
      className={`idea-card select-none transition-all duration-300 ease-out ${
        isExpanded ? 'cursor-pointer' : 'cursor-move'
      }`}
      style={{
        width: isExpanded ? "400px" : "256px",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: isExpanded 
          ? "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.1)" 
          : "0 2px 6px rgba(0,0,0,0.08)",
        paddingLeft: "16px",
        backgroundColor: cardStyleData.backgroundColor,
        color: cardStyleData.color,
        transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
        zIndex: isExpanded ? 1000 : 'auto',
        position: 'relative',
        maxHeight: isExpanded ? 'none' : '180px',
        overflow: isExpanded ? 'visible' : 'hidden',
      }}
      onMouseDown={isExpanded ? undefined : handleMouseDownWithTracking}
      onMouseUp={handleMouseUpWithTracking}
      onTouchStart={isExpanded ? undefined : onTouchStart}
      onClick={wasDragged ? undefined : handleCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 
          className="font-semibold leading-tight pr-2"
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: titleColor,
          }}
        >
          {idea.title}
        </h4>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-testid={`button-idea-menu-${idea.id}`}
              className="h-6 w-6 p-0 hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal 
                style={{
                  width: "16px",
                  height: "16px",
                  color: menuIconColor,
                }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              data-testid={`button-edit-idea-${idea.id}`}
              onClick={onEdit}
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid={`button-delete-idea-${idea.id}`}
              onClick={onDelete}
              className="text-destructive"
            >
              <Trash className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {idea.description && (
        <p 
          className={`mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}
          style={{
            fontSize: "12px",
            fontWeight: "400",
            color: descriptionColor,
            lineHeight: "1.4",
            maxHeight: isExpanded ? 'none' : '32px',
            overflow: isExpanded ? 'visible' : 'hidden',
          }}
        >
          {idea.description}
        </p>
      )}

      <div className="flex justify-between items-center gap-2">
        {/* Group Dropdown */}
        <DropdownMenu open={isGroupDropdownOpen} onOpenChange={setIsGroupDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <span 
              className="group-label rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink"
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                backgroundColor: tagBgColor,
                color: tagTextColor,
                borderRadius: "20px",
                maxWidth: "120px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
                display: "inline-block",
              }}
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setIsGroupDropdownOpen(true);
              }}
              data-testid={`group-label-${idea.id}`}
              title={group ? group.name : "Unassigned"} // Tooltip for full text
            >
              {group ? (
                <div className="flex items-center gap-1" style={{ minWidth: 0 }}>
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: group.color }}
                  />
                  <span 
                    style={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      minWidth: 0,
                    }}
                  >
                    {group.name}
                  </span>
                </div>
              ) : (
                "Unassigned"
              )}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 z-[2000]"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuItem
              onClick={() => handleGroupChange('unassigned')}
              data-testid="group-option-unassigned"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                Unassigned
              </div>
            </DropdownMenuItem>
            {groups?.map((groupOption) => (
              <DropdownMenuItem
                key={groupOption.id}
                onClick={() => handleGroupChange(groupOption.id)}
                data-testid={`group-option-${groupOption.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={group?.id === groupOption.id ? 'bg-accent' : ''}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: groupOption.color }}
                  />
                  {groupOption.name}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleCreateNewGroup}
              data-testid="create-new-group"
              className="text-blue-600"
            >
              <Plus className="mr-2 h-3 w-3" />
              Create New Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Priority Dropdown */}
        <DropdownMenu open={isPriorityDropdownOpen} onOpenChange={setIsPriorityDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <span 
              className="priority-label rounded-full cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              style={{
                fontSize: "12px", 
                padding: "2px 8px",
                backgroundColor: tagBgColor,
                color: tagTextColor,
                borderRadius: "20px",
                maxWidth: "80px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden",
                display: "inline-block",
              }}
              onClick={(e) => {
                e.stopPropagation();
                closeAllDropdowns();
                setIsPriorityDropdownOpen(true);
              }}
              data-testid={`priority-label-${idea.id}`}
              title={(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)}
            >
              {(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-32 z-[2000]"
            side="bottom"
            sideOffset={4}
          >
            {priorities.map((priorityOption) => (
              <DropdownMenuItem
                key={priorityOption.value}
                onClick={() => handlePriorityChange(priorityOption.value)}
                data-testid={`priority-option-${priorityOption.value}`}
                className={(idea.priority || 'medium') === priorityOption.value ? 'bg-accent' : ''}
              >
                {priorityOption.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
