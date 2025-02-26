import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { ZoomIn, ZoomOut, RotateCcw, Download, Share2 } from "lucide-react";
import { ExportManager } from "@/lib/paintByNumbers/features/export";

interface CanvasControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
  canvas: HTMLCanvasElement | null;
  regions: any[];
}

// @deprecated Use InteractiveControls instead
export function CanvasControls({
  zoom,
  onZoomChange,
  onReset,
  canvas,
  regions,
}: CanvasControlsProps) {
  const handleExport = async (format: "svg" | "png" | "pdf") => {
    if (!canvas) return;

    const exportManager = new ExportManager(canvas);
    const result = await exportManager.export(regions, {
      format,
      scale: 2,
      includeColorGuide: true,
      printFriendly: format === "pdf",
    });

    // Handle the exported file
    if (result instanceof Blob) {
      const url = URL.createObjectURL(result);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paint-by-numbers.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (typeof result === "string" && format === "svg") {
      const blob = new Blob([result], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "paint-by-numbers.svg";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
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
            onClick={() => handleExport("pdf")}
          >
            PDF
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
