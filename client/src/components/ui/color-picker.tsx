import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS } from "@shared/schema";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handlePresetColorSelect = (color: string) => {
    setCustomColor(color);
    onChange(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  const handleCustomColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  };

  const rgb = hexToRgb(customColor);

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-3 block">Color</Label>
      
      {/* Live Preview */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
          style={{ backgroundColor: value }}
          data-testid="color-preview"
        />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Preview: {value.toUpperCase()}
        </span>
      </div>
      
      {/* Predefined Color Palette */}
      <div className="mb-4">
        <Label className="text-xs text-gray-500 mb-2 block">Predefined Colors</Label>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              data-testid={`color-preset-${color}`}
              className="relative w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={{ backgroundColor: color }}
              onClick={() => handlePresetColorSelect(color)}
            >
              {value === color && (
                <Check 
                  className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-lg"
                  data-testid="color-selected-check"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom Color Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-500">Custom Color</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="button-toggle-custom-picker"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
          >
            {showCustomPicker ? "Hide" : "Custom"}
          </Button>
        </div>
        
        {showCustomPicker && (
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {/* HTML5 Color Input */}
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                data-testid="color-wheel-input"
              />
              <div className="flex-1">
                <Label className="text-xs text-gray-500 mb-1 block">Hex Value</Label>
                <Input
                  type="text"
                  value={customColor}
                  onChange={handleCustomColorInput}
                  onBlur={() => {
                    // Validate and format hex color
                    const hex = customColor.startsWith('#') ? customColor : `#${customColor}`;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                      setCustomColor(hex);
                      onChange(hex);
                    }
                  }}
                  placeholder="#FF0000"
                  className="text-sm font-mono"
                  data-testid="input-hex-color"
                />
              </div>
            </div>
            
            {/* RGB Values Display */}
            {rgb && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>RGB Values:</div>
                <div className="font-mono grid grid-cols-3 gap-2">
                  <span>R: {rgb.r}</span>
                  <span>G: {rgb.g}</span>
                  <span>B: {rgb.b}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}