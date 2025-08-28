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
    <div 
      className="fixed bottom-5 right-5 z-[40]"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '8px 12px'
      }}
    >
      <div className="flex items-center space-x-2">
        {/* Plus Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-zoom-in"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 rounded-full hover:bg-white/20 transition-colors text-black"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Plus className="w-4 h-4 text-black" />
        </Button>
        
        {/* Zoom Percentage Display */}
        <div 
          className="px-3 py-1 text-xs font-medium text-center min-w-[48px] rounded-full text-black"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'black'
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
        
        {/* Minus Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-zoom-out"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 rounded-full hover:bg-white/20 transition-colors text-black"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Minus className="w-4 h-4 text-black" />
        </Button>
        
        {/* Fit Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-reset-view"
          onClick={onResetView}
          className="h-8 w-8 p-0 rounded-full hover:bg-white/20 transition-colors text-black"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <Maximize className="w-4 h-4 text-black" />
        </Button>
      </div>
    </div>
  );
}
