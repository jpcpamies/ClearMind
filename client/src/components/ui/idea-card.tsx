import { useState } from "react";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import type { Idea, Group } from "@shared/schema";

interface IdeaCardProps {
  idea: Idea;
  group?: Group;
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
}: IdeaCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  const descriptionColor = isGrouped ? "#E6E6E6" : "#666666";

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
      onMouseDown={isExpanded ? undefined : onMouseDown}
      onTouchStart={isExpanded ? undefined : onTouchStart}
      onClick={handleCardClick}
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

      <div className="flex justify-between items-center">
        <span 
          className="group-label rounded-full cursor-pointer"
          style={{
            fontSize: "12px",
            padding: "2px 8px",
            backgroundColor: tagBgColor,
            color: tagTextColor,
            borderRadius: "20px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {group ? group.name : "Unassigned"}
        </span>
        <span 
          className="priority-label rounded-full cursor-pointer"
          style={{
            fontSize: "12px", 
            padding: "2px 8px",
            backgroundColor: tagBgColor,
            color: tagTextColor,
            borderRadius: "20px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)}
        </span>
      </div>
    </div>
  );
}
