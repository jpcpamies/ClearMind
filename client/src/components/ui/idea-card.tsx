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
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<Idea>) => void;
}

const colorStyles = {
  purple: "group-purple text-white",
  blue: "group-blue text-white", 
  green: "group-green text-white",
  orange: "group-orange text-white",
  unassigned: "group-unassigned text-gray-800",
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
  onMouseDown,
  onTouchStart,
  onEdit,
  onUpdate,
}: IdeaCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cardStyle = colorStyles[color as keyof typeof colorStyles] || colorStyles.unassigned;
  const priorityStyle = priorityColors[idea.priority as keyof typeof priorityColors] || priorityColors.medium;

  const isGrouped = color !== 'unassigned';
  const menuIconColor = isGrouped ? "#FFFFFF" : "#999999";
  const tagBgColor = isGrouped ? "rgba(255,255,255,0.2)" : "#F3F4F6";
  const tagTextColor = isGrouped ? "#FFFFFF" : "#555555";
  const titleColor = isGrouped ? "#FFFFFF" : "#1A1A1A";
  const descriptionColor = isGrouped ? "#E6E6E6" : "#666666";

  return (
    <div
      data-testid={`idea-card-${idea.id}`}
      className={`idea-card absolute cursor-move select-none transition-transform hover:scale-105 ${cardStyle} ${
        isDragging ? "z-50 rotate-2" : "z-10"
      } ${isSelected ? "ring-2 ring-blue-400 ring-opacity-50" : ""}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: "256px",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
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
              onClick={() => onUpdate({ completed: true })}
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
          className="mb-3 line-clamp-2"
          style={{
            fontSize: "12px",
            fontWeight: "400",
            color: descriptionColor,
          }}
        >
          {idea.description}
        </p>
      )}

      <div className="flex justify-between items-center">
        <span 
          className="rounded-full"
          style={{
            fontSize: "12px",
            padding: "2px 8px",
            backgroundColor: tagBgColor,
            color: tagTextColor,
            borderRadius: "20px",
          }}
        >
          {group ? group.name : "Unassigned"}
        </span>
        <span 
          className="rounded-full"
          style={{
            fontSize: "12px", 
            padding: "2px 8px",
            backgroundColor: tagBgColor,
            color: tagTextColor,
            borderRadius: "20px",
          }}
        >
          {(idea.priority || 'medium').charAt(0).toUpperCase() + (idea.priority || 'medium').slice(1)}
        </span>
      </div>
    </div>
  );
}
