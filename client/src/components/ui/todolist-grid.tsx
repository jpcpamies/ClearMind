import type { Group, Idea } from "@shared/schema";

interface TodoListGridProps {
  groups: Group[];
  ideas: Idea[];
  onTodoListOpen: (groupId: string) => void;
}

const priorityColors = {
  low: "bg-gray-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

export default function TodoListGrid({ groups, ideas, onTodoListOpen }: TodoListGridProps) {
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
      
      {groups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No todo lists created yet.</p>
          <p className="text-muted-foreground text-sm mt-2">Switch to Canvas view to create groups and ideas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const { total, stats } = getGroupStats(group.id);
            
            return (
              <div
                key={group.id}
                data-testid={`todolist-card-${group.id}`}
                className="todo-list-card bg-card border border-border rounded-lg p-6 card-shadow hover:card-shadow-lg transition-all cursor-pointer"
                onClick={() => onTodoListOpen(group.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${getColorClass(group.color)}`} />
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {total} task{total !== 1 ? 's' : ''}
                  </span>
                </div>
                
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
      )}
    </div>
  );
}
