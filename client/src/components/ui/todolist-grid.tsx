import { MoreVertical, Plus } from "lucide-react";
import type { Group, Idea } from "@shared/schema";

interface TodoListGridProps {
  groups: Group[];
  ideas: Idea[];
  onTodoListOpen: (groupId: string) => void;
  onCreateTodoList: () => void;
}

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function TodoListGrid({ groups, ideas, onTodoListOpen, onCreateTodoList }: TodoListGridProps) {
  const getGroupStats = (groupId: string) => {
    const groupIdeas = ideas.filter(idea => idea.groupId === groupId);
    const stats: Record<string, number> = {};
    
    groupIdeas.forEach(idea => {
      const priority = idea.priority || 'medium';
      stats[priority] = (stats[priority] || 0) + 1;
    });

    return { total: groupIdeas.length, stats };
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-8">Todo Lists</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Notebook Card */}
        <div
          className="todo-list-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px dashed #D3D3D3",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={onCreateTodoList}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F0F6FF";
            e.currentTarget.style.borderColor = "#4285F4";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFFFFF";
            e.currentTarget.style.borderColor = "#D3D3D3";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "transparent",
              border: "2px solid #4285F4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Plus
              style={{
                width: "24px",
                height: "24px",
                color: "#4285F4",
              }}
            />
          </div>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "500",
              color: "#333",
              textAlign: "center",
              margin: 0,
            }}
          >
            Create TodoList
          </h3>
        </div>

        {/* Existing Group Cards */}
        {groups.map((group) => {
          const { total, stats } = getGroupStats(group.id);
          
          return (
            <div
              key={group.id}
              data-testid={`todolist-card-${group.id}`}
              className="todo-list-card cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
              style={{
                backgroundColor: "#F5F6FA",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                minHeight: "200px",
                position: "relative",
              }}
              onClick={() => onTodoListOpen(group.id)}
            >
              {/* Menu Button */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                }}
              >
                <MoreVertical
                  style={{
                    width: "16px",
                    height: "16px",
                    color: "#999",
                  }}
                />
              </div>

              {/* Color Dot Icon */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  marginBottom: "8px",
                }}
                className={getColorClass(group.color)}
              />

              {/* Title */}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#222",
                  marginTop: "8px",
                  marginBottom: "4px",
                }}
              >
                {group.name}
              </h3>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#666",
                  marginTop: "4px",
                  marginBottom: "16px",
                }}
              >
                {total} task{total !== 1 ? 's' : ''}
              </p>
              
              {/* Priority Stats */}
              <div className="space-y-2">
                {Object.entries(stats).map(([priority, count]) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${priorityColors[priority as keyof typeof priorityColors]}`} />
                    <span className="text-sm text-muted-foreground">
                      {count} {priority} priority
                    </span>
                  </div>
                ))}
                
                {total === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    No tasks yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
