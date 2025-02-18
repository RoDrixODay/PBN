import React from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Download } from "lucide-react";

interface ControlPanelProps {
  outlineThickness: number;
  showNumbers: boolean;
  fontSize: number;
  onOutlineThicknessChange: (value: number) => void;
  onShowNumbersChange: (value: boolean) => void;
  onFontSizeChange: (value: number) => void;
  onDownload: () => void;
  colorPalette?: string[];
}

const ControlPanel = ({
  outlineThickness = 2,
  showNumbers = true,
  fontSize = 12,
  onOutlineThicknessChange,
  onShowNumbersChange,
  onFontSizeChange,
  onDownload,
}: ControlPanelProps) => {
  return (
    <div className="flex items-center justify-between bg-white p-4 mb-4 rounded-lg shadow-sm">
      <div className="space-y-1">
        <Label htmlFor="outline-toggle">Outline Thickness</Label>
        <Slider
          id="outline-thickness"
          value={[outlineThickness]}
          onValueChange={([value]) => onOutlineThicknessChange(value)}
          max={5}
          min={1}
          step={0.5}
          className="w-[200px]"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="numbers-toggle">Show Numbers</Label>
        <Switch
          id="numbers-toggle"
          checked={showNumbers}
          onCheckedChange={onShowNumbersChange}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="font-size">Font Size</Label>
        <Slider
          id="font-size"
          value={[fontSize]}
          onValueChange={([value]) => onFontSizeChange(value)}
          max={24}
          min={8}
          step={1}
          className="w-[200px]"
        />
      </div>

      <Button className="flex items-center gap-2" onClick={onDownload}>
        <Download className="w-4 h-4" />
        Download PNG
      </Button>
    </div>
  );
};

export default ControlPanel;
