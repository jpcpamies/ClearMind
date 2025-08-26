import { Plus, Minus, Maximize } from "lucide-react";
import { Button } from "./button";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
}

export default function ZoomControls({ zoom, onZoomChange, onResetView }: ZoomControlsProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom * 0.8, 0.3));
  };

  return (
    <div className="glassmorphism rounded-lg p-2 card-shadow">
      <div className="flex flex-col space-y-1">
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-zoom-in"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-zoom-out"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <div className="border-t border-border my-1"></div>
        
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-reset-view"
          onClick={onResetView}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="text-xs text-center text-muted-foreground mt-2 px-1">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
