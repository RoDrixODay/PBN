import React from "react";
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
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleOverlapClick}
                            className="w-6 h-6 bg-gray-900 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Overlap - Stack colors in order of frequency"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Select filled type and trigger processing with FULL overlap
                              onTypeSelect("filled");

                              const canvas = document.querySelector("canvas");
                              if (canvas) {
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
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

                                    // Extract and sort colors with FULL overlap
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
                                        colorMap.set(key, {
                                          color: [r, g, b],
                                          count: 1,
                                        });
                                      } else {
                                        colorMap.get(key)!.count++;
                                      }
                                    }

                                    const sortedColors = Array.from(
                                      colorMap.entries(),
                                    )
                                      .sort((a, b) => b[1].count - a[1].count)
                                      .slice(0, 32)
                                      .map(([_, value]) => value.color);

                                    ctx.clearRect(0, 0, width, height);

                                    // Apply FULL overlap - larger tolerance and more aggressive merging
                                    sortedColors.forEach((color) => {
                                      const layerCanvas =
                                        document.createElement("canvas");
                                      layerCanvas.width = width;
                                      layerCanvas.height = height;
                                      const layerCtx =
                                        layerCanvas.getContext("2d")!;
                                      const layerData = ctx.createImageData(
                                        width,
                                        height,
                                      );

                                      for (let i = 0; i < data.length; i += 4) {
                                        // Increased color tolerance for more aggressive merging
                                        if (
                                          Math.abs(data[i] - color[0]) < 60 &&
                                          Math.abs(data[i + 1] - color[1]) <
                                            60 &&
                                          Math.abs(data[i + 2] - color[2]) < 60
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
                            }}
                            className="w-6 h-6 bg-gray-700 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Merge - Same as Overlap but with FULL overlap parameter"
                          />
                          <button
                            className="w-6 h-6 bg-gray-500 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Coming soon"
                          />
                          <button
                            className="w-6 h-6 bg-gray-300 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Coming soon"
                          />
                        </div>
                      )}
                      {type.id === "stroked" && (
                        <div className="flex gap-2 mt-2">
                          <div className="w-6 h-6 border-4 border-gray-900 rounded" />
                          <div className="w-6 h-6 border-3 border-gray-700 rounded" />
                          <div className="w-6 h-6 border-2 border-gray-500 rounded" />
                          <div className="w-6 h-6 border border-gray-300 rounded" />
                        </div>
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
