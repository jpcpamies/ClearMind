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
  onMouseDown: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<Idea>) => void;
}

const colorStyles = {
  purple: "group-purple text-white",
  blue: "group-blue text-white",
  green: "group-green text-white",
  orange: "group-orange text-white",
  unassigned: "group-unassigned text-foreground",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function IdeaCard({
  idea,
  group,
  color,
  position,
  isDragging,
  onMouseDown,
  onEdit,
  onUpdate,
}: IdeaCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cardStyle = colorStyles[color as keyof typeof colorStyles] || colorStyles.unassigned;
  const priorityStyle = priorityColors[idea.priority as keyof typeof priorityColors] || priorityColors.medium;

  return (
    <div
      data-testid={`idea-card-${idea.id}`}
      className={`idea-card absolute w-64 p-4 rounded-lg card-shadow cursor-move select-none transition-transform hover:scale-105 ${cardStyle} ${
        isDragging ? "z-50 rotate-2" : "z-10"
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseDown={onMouseDown}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm leading-tight pr-2">{idea.title}</h4>
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-testid={`button-idea-menu-${idea.id}`}
              className="h-6 w-6 p-0 hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
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
        <p className="text-xs mb-3 opacity-90 line-clamp-2">{idea.description}</p>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs px-2 py-1 rounded bg-white/20">
          {group ? group.name : "Unassigned"}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${priorityStyle}`}>
          {idea.priority?.charAt(0).toUpperCase() + idea.priority?.slice(1)} Priority
        </span>
      </div>
    </div>
  );
}
