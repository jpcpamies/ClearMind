import { Plus, Minus, Maximize } from "lucide-react";
import { Button } from "./button";

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
}

export default function ZoomControls({ zoom, onZoomChange, onResetView }: ZoomControlsProps) {
  const handleZoomIn = () => {
    console.log('🔍 Zoom in clicked');
    onZoomChange(Math.min(zoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    console.log('🔍 Zoom out clicked');
    onZoomChange(Math.max(zoom * 0.8, 0.3));
  };
  
  const handleResetClick = (e: React.MouseEvent) => {
    console.log('🎯 Reset view button clicked in ZoomControls');
    console.log('🎯 Event details:', e.currentTarget, e.target);
    console.log('🎯 onResetView function:', onResetView);
    
    e.preventDefault();
    e.stopPropagation();
    onResetView();
    console.log('🎯 onResetView called!');
  };

  return (
    <div 
      className="fixed bottom-5 right-5 z-floating frosted-glass-bg rounded-lg p-3"
    >
      <div className="flex items-center space-x-2">
        {/* Plus Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-zoom-in"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 rounded-lg bg-white hover:bg-gray-50 transition-colors text-black border border-gray-200"
        >
          <Plus className="w-4 h-4" />
        </Button>
        
        {/* Zoom Percentage Display */}
        <div className="px-3 py-1 text-xs font-medium text-center min-w-[48px] rounded-lg bg-white border border-gray-200 text-black">
          {Math.round(zoom * 100)}%
        </div>
        
        {/* Minus Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-zoom-out"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 rounded-lg bg-white hover:bg-gray-50 transition-colors text-black border border-gray-200"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        {/* Fit Button */}
        <Button
          variant="ghost"
          size="sm"
          data-testid="button-reset-view"
          onClick={handleResetClick}
          onMouseDown={(e) => console.log('🎯 Mouse down on fit button')}
          onMouseUp={(e) => console.log('🎯 Mouse up on fit button')}
          className="h-8 w-8 p-0 rounded-lg bg-white hover:bg-gray-50 transition-colors text-black border border-gray-200"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Maximize className="w-4 h-4" />
        </Button>
        
        {/* Temporary debug button */}
        <button
          onClick={() => {
            console.log('🔴 DEBUG: Raw button clicked!');
            console.log('🔴 Current zoom:', zoom);
            alert(`DEBUG clicked! Zoom: ${Math.round(zoom * 100)}%`);
            onResetView();
          }}
          style={{ 
            background: 'red', 
            color: 'white', 
            padding: '4px 8px', 
            border: 'none',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </div>
  );
}
