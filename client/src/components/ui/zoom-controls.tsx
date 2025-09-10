import { Plus, Minus, Maximize, Grid3X3, LayoutList, MousePointer2 } from "lucide-react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";

export type SortMode = 'free' | 'grid' | 'byGroup';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  sortMode?: SortMode;
  onSortModeChange?: (mode: SortMode) => void;
}

export default function ZoomControls({ zoom, onZoomChange, onResetView, sortMode = 'free', onSortModeChange }: ZoomControlsProps) {
  const handleZoomIn = () => {
    console.log('🔍 Zoom in clicked');
    onZoomChange(Math.min(zoom * 1.2, 4)); // Max 400%
  };

  const handleZoomOut = () => {
    console.log('🔍 Zoom out clicked');
    onZoomChange(Math.max(zoom * 0.8, 0.25)); // Min 25%
  };
  
  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResetView();
  };

  const getSortIcon = () => {
    switch (sortMode) {
      case 'grid': return Grid3X3;
      case 'byGroup': return LayoutList;
      default: return MousePointer2;
    }
  };

  const getSortLabel = () => {
    switch (sortMode) {
      case 'grid': return 'Grid';
      case 'byGroup': return 'By Group';
      default: return 'Free';
    }
  };

  return (
    <div 
      className="fixed bottom-5 right-5 z-floating frosted-glass-bg rounded-lg p-3"
    >
      <div className="flex items-center space-x-2">
        {/* Sort By Dropdown */}
        {onSortModeChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-testid="button-sort-mode"
                className="h-8 px-3 rounded-lg bg-white hover:bg-gray-50 transition-colors text-black border border-gray-200 flex items-center gap-2"
              >
                {(() => {
                  const Icon = getSortIcon();
                  return <Icon className="w-4 h-4" />;
                })()}
                <span className="text-xs font-medium">{getSortLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={() => onSortModeChange('free')}
                className="flex items-center gap-2"
              >
                <MousePointer2 className="w-4 h-4" />
                Free
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortModeChange('grid')}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Grid
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortModeChange('byGroup')}
                className="flex items-center gap-2"
              >
                <LayoutList className="w-4 h-4" />
                By Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
        <div className="px-3 py-1 text-xs font-medium text-center min-w-[48px] rounded-lg bg-white border border-gray-200 text-black transition-all duration-200">
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
      </div>
    </div>
  );
}
