import React, { useState } from "react";
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

const ControlPanel = (props: ControlPanelProps) => {
  const [outlineThickness, setOutlineThickness] = useState(
    props.outlineThickness || 0.5,
  );
  const [showNumbers, setShowNumbers] = useState(props.showNumbers || true);
  const [fontSize, setFontSize] = useState(props.fontSize || 12);

  const handleOutlineThicknessChange = (value: number) => {
    setOutlineThickness(value);
    props.onOutlineThicknessChange(value);

    // If we have a canvas with a paint-by-numbers image, update it
    const canvas = document.querySelector("canvas");
    const imageUploadZone = document.querySelector(
      '[data-component="ImageUploadZone"]',
    );
    if (canvas && imageUploadZone) {
      // Trigger the paint-by-numbers processing with the new thickness
      const applyStrokeModeEvent = new CustomEvent("applyStrokeMode", {
        detail: { mode: "single" },
      });
      imageUploadZone.dispatchEvent(applyStrokeModeEvent);
    }
  };

  const handleShowNumbersChange = (value: boolean) => {
    setShowNumbers(value);
    props.onShowNumbersChange(value);
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    props.onFontSizeChange(value);
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 mb-4 rounded-lg shadow-sm">
      <div className="space-y-1">
        <Label htmlFor="outline-toggle">Outline Thickness</Label>
        <Slider
          id="outline-thickness"
          value={[outlineThickness]}
          onValueChange={([value]) => handleOutlineThicknessChange(value)}
          max={5}
          min={1}
          step={0.5}
          className="w-[200px]"
          data-outline-thickness={outlineThickness}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="numbers-toggle">Show Numbers</Label>
        <Switch
          id="numbers-toggle"
          checked={showNumbers}
          onCheckedChange={handleShowNumbersChange}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="font-size">Font Size</Label>
        <Slider
          id="font-size"
          value={[fontSize]}
          onValueChange={([value]) => handleFontSizeChange(value)}
          max={24}
          min={8}
          step={1}
          className="w-[200px]"
        />
      </div>

      <Button className="flex items-center gap-2" onClick={props.onDownload}>
        <Download className="w-4 h-4" />
        Download PNG
      </Button>
    </div>
  );
};

export default ControlPanel;
