import React, { useState } from "react";
import { FilledLayersControls } from "./FilledLayersControls";
import { StrokedLayersControls } from "./StrokedLayersControls";
import { Card } from "./ui/card";
import {
  Diamond,
  Image as ImageIcon,
  PenTool,
  FileImage,
  Layers,
  Square,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  processOverlapMode,
  processMergeMode,
  processNoOverlapMode,
  processSingleMode,
} from "@/lib/imageProcessing/filledLayersModes";
import {
  processHeavyStrokeMode,
  processMediumStrokeMode,
  processThinStrokeMode,
  processCenterlineMode,
  processEnhancedOutlineMode,
  processCartoonOutlineMode,
} from "@/lib/imageProcessing/strokedLayersModes";

export type ImageType =
  | "clipart"
  | "photo"
  | "sketch"
  | "drawing"
  | "filled"
  | "stroked";

interface ImageTypeSelectorProps {
  selectedType: ImageType;
  onTypeSelect: (type: ImageType) => void;
  detailLevel?: number;
  onDetailLevelChange?: (level: number) => void;
}

const detailLevels = [
  { value: 7, label: "Maximum (Default)" },
  { value: 6, label: "Ultra" },
  { value: 5, label: "Very High" },
  { value: 4, label: "High" },
  { value: 3, label: "Medium" },
  { value: 2, label: "Low" },
  { value: 1, label: "Minimum" },
];

const imageTypes = [
  {
    id: "clipart",
    icon: Diamond,
    label: "Clipart",
    description: "Few Colors",
    showDetailLevel: true,
    group: "input",
  },
  {
    id: "photo",
    icon: ImageIcon,
    label: "Photo",
    description: "Many Colors",
    showDetailLevel: true,
    group: "input",
  },
  {
    id: "sketch",
    icon: PenTool,
    label: "Sketch",
    description: "Grayscale",
    showDetailLevel: true,
    group: "input",
  },
  {
    id: "drawing",
    icon: FileImage,
    label: "Drawing",
    description: "Black / White",
    showDetailLevel: true,
    group: "input",
  },
  {
    id: "filled",
    icon: Layers,
    label: "Filled Layers",
    description: "Color filled vector elements",
    showDetailLevel: true,
  },
  {
    id: "stroked",
    icon: Square,
    label: "Stroked Layers",
    description: "Color bordered vector elements",
    showDetailLevel: true,
  },
] as const;

const ImageTypeSelector = ({
  selectedType,
  onTypeSelect,
  detailLevel = 3,
  onDetailLevelChange,
}: ImageTypeSelectorProps) => {
  const selectedTypeData = imageTypes.find((type) => type.id === selectedType);

  const handleOverlapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Select filled type and trigger processing
    onTypeSelect("filled");

    // Get the canvas and apply overlap processing
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear any existing processing
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Apply overlap algorithm
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const width = canvas.width;
          const height = canvas.height;

          // Extract and sort colors by frequency
          const colorMap = new Map<
            string,
            { color: number[]; count: number }
          >();
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${r},${g},${b}`;

            if (!colorMap.has(key)) {
              colorMap.set(key, { color: [r, g, b], count: 1 });
            } else {
              colorMap.get(key)!.count++;
            }
          }

          // Create and stack color layers
          const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 32)
            .map(([_, value]) => value.color);

          ctx.clearRect(0, 0, width, height);
          sortedColors.forEach((color) => {
            const layerCanvas = document.createElement("canvas");
            layerCanvas.width = width;
            layerCanvas.height = height;
            const layerCtx = layerCanvas.getContext("2d")!;
            const layerData = ctx.createImageData(width, height);

            for (let i = 0; i < data.length; i += 4) {
              if (
                Math.abs(data[i] - color[0]) < 30 &&
                Math.abs(data[i + 1] - color[1]) < 30 &&
                Math.abs(data[i + 2] - color[2]) < 30
              ) {
                layerData.data[i] = color[0];
                layerData.data[i + 1] = color[1];
                layerData.data[i + 2] = color[2];
                layerData.data[i + 3] = 255;
              }
            }

            layerCtx.putImageData(layerData, 0, 0);
            ctx.drawImage(layerCanvas, 0, 0);
          });
        };
        img.src = canvas.toDataURL();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        {/* Left side - Input Types */}
        <div className="flex-1">
          <div className="flex gap-2">
            <div className="flex flex-col gap-2 w-12 pt-16">
              <p className="text-xs text-gray-500 -rotate-90 transform origin-top-left translate-y-6">
                STEP 0
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-1">
              {imageTypes
                .filter((type) => type.group === "input")
                .map((type) => (
                  <Card
                    key={type.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                      selectedType === type.id && "ring-2 ring-primary",
                    )}
                    onClick={() => onTypeSelect(type.id as ImageType)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <type.icon className="w-6 h-6" />
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-500">
                          {type.description}
                        </div>
                      </div>
                      <Select
                        value={detailLevel.toString()}
                        onValueChange={(value) =>
                          onDetailLevelChange?.(Number(value))
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <div className="flex items-center justify-between w-full">
                            <span>Detail Level</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {detailLevels.map((level) => (
                            <SelectItem
                              key={level.value}
                              value={level.value.toString()}
                            >
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        {/* Right side - Layer Types */}
        <div className="flex-1">
          <div className="flex gap-2">
            <div className="grid grid-cols-2 gap-2 flex-1">
              {imageTypes
                .filter((type) => !type.group)
                .map((type) => (
                  <Card
                    key={type.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                      selectedType === type.id && "ring-2 ring-primary",
                    )}
                    onClick={() => onTypeSelect(type.id as ImageType)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <type.icon className="w-6 h-6" />
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-gray-500">
                          {type.description}
                        </div>
                      </div>
                      {type.id === "filled" && (
                        <FilledLayersControls
                          onModeSelect={(mode) => {
                            // Select filled type first
                            onTypeSelect("filled");

                            // Apply the selected processing mode
                            const canvas = document.querySelector("canvas");
                            if (!canvas) return;

                            const ctx = canvas.getContext("2d");
                            if (!ctx) return;

                            const img = new Image();
                            img.onload = () => {
                              ctx.clearRect(0, 0, canvas.width, canvas.height);
                              ctx.drawImage(img, 0, 0);

                              const imageData = ctx.getImageData(
                                0,
                                0,
                                canvas.width,
                                canvas.height,
                              );
                              const data = imageData.data;
                              const width = canvas.width;
                              const height = canvas.height;

                              // Process based on selected mode
                              switch (mode) {
                                case "overlap":
                                  processOverlapMode(ctx, data, width, height);
                                  break;
                                case "merge":
                                  processMergeMode(ctx, data, width, height);
                                  break;
                                case "noOverlap":
                                  processNoOverlapMode(
                                    ctx,
                                    data,
                                    width,
                                    height,
                                  );
                                  break;
                                case "single":
                                  processSingleMode(ctx, data, width, height);
                                  break;
                              }
                            };
                            img.src = canvas.toDataURL();
                          }}
                          selectedMode="overlap"
                        />
                      )}
                      {type.id === "stroked" && (
                        <StrokedLayersControls
                          onModeSelect={(mode) => {
                            // Select stroked type first
                            onTypeSelect("stroked");

                            // Store the selected mode and apply it
                            const canvas = document.querySelector("canvas");
                            if (!canvas) return;

                            // Get the parent component's applyStrokeMode function
                            const imageUploadZone = document.querySelector(
                              '[data-component="ImageUploadZone"]',
                            );
                            if (imageUploadZone) {
                              const applyStrokeModeEvent = new CustomEvent(
                                "applyStrokeMode",
                                {
                                  detail: { mode },
                                },
                              );
                              imageUploadZone.dispatchEvent(
                                applyStrokeModeEvent,
                              );
                            } else {
                              // Fallback if custom event doesn't work
                              const ctx = canvas.getContext("2d");
                              if (!ctx) return;

                              const img = new Image();
                              img.onload = () => {
                                ctx.clearRect(
                                  0,
                                  0,
                                  canvas.width,
                                  canvas.height,
                                );
                                ctx.drawImage(img, 0, 0);

                                const imageData = ctx.getImageData(
                                  0,
                                  0,
                                  canvas.width,
                                  canvas.height,
                                );
                                const data = imageData.data;
                                const width = canvas.width;
                                const height = canvas.height;

                                // Process based on selected mode
                                switch (mode) {
                                  case "heavy":
                                    processHeavyStrokeMode(
                                      ctx,
                                      data,
                                      width,
                                      height,
                                    );
                                    break;
                                  case "medium":
                                    processMediumStrokeMode(
                                      ctx,
                                      data,
                                      width,
                                      height,
                                    );
                                    break;
                                  case "thin":
                                    processThinStrokeMode(
                                      ctx,
                                      data,
                                      width,
                                      height,
                                    );
                                    break;
                                  case "centerline":
                                    processCenterlineMode(
                                      ctx,
                                      data,
                                      width,
                                      height,
                                    );
                                    break;
                                }
                              };
                              img.src = canvas.toDataURL();
                            }
                          }}
                          selectedMode="medium"
                        />
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageTypeSelector;
