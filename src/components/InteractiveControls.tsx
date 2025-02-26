import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Undo,
  Redo,
  MousePointer,
  Hand,
  Palette,
} from "lucide-react";
import { ExportManager } from "@/lib/paintByNumbers/features/export";

interface InteractiveControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  canvas: HTMLCanvasElement | null;
  regions: any[];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToolChange: (tool: "select" | "pan" | "colorPicker") => void;
  currentTool: "select" | "pan" | "colorPicker";
}

export function InteractiveControls({
  zoom,
  onZoomChange,
  onReset,
  canvas,
  regions,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onToolChange,
  currentTool,
}: InteractiveControlsProps) {
  const [exportScale, setExportScale] = useState(2);
  const { print } = usePrintFormat();
  const [printOptions, setPrintOptions] = useState({
    highContrast: false,
    includeColorGuide: true,
    pageSize: "a4" as const,
    orientation: "portrait" as const,
  });

  const handleExport = async (format: "svg" | "png" | "pdf") => {
    if (!canvas) return;

    const exportManager = new ExportManager(canvas);
    const result = await exportManager.export(regions, {
      format,
      scale: exportScale,
      includeColorGuide: true,
      printFriendly: format === "pdf",
    });

    if (result instanceof Blob) {
      const url = URL.createObjectURL(result);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paint-by-numbers.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        {/* Tools */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentTool === "select" ? "default" : "outline"}
            size="icon"
            onClick={() => onToolChange("select")}
            title="Select Tool"
          >
            <MousePointer className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === "pan" ? "default" : "outline"}
            size="icon"
            onClick={() => onToolChange("pan")}
            title="Pan Tool"
          >
            <Hand className="w-4 h-4" />
          </Button>
          <Button
            variant={currentTool === "colorPicker" ? "default" : "outline"}
            size="icon"
            onClick={() => onToolChange("colorPicker")}
            title="Color Picker"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Slider
            value={[zoom * 100]}
            onValueChange={([value]) => onZoomChange(value / 100)}
            min={10}
            max={500}
            step={1}
            className="w-[200px]"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* History Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Export Controls */}
        <div className="flex items-center gap-2">
          <Label>Export:</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("svg")}
          >
            SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("png")}
          >
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => canvas && print(canvas, printOptions)}
          >
            Print
          </Button>
          <Slider
            value={[exportScale]}
            onValueChange={([value]) => setExportScale(value)}
            min={1}
            max={4}
            step={0.5}
            className="w-[100px]"
          />
          <Label className="text-xs text-gray-500">{exportScale}x</Label>
        </div>
      </div>
    </Card>
  );
}
