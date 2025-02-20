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
                            onClick={(e) => {
                              e.stopPropagation();
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

                                    // Step 1: Quantize colors and create initial regions
                                    const colorMap = new Map<
                                      string,
                                      { color: number[]; pixels: Set<number> }
                                    >();
                                    const minRegionSize = 100; // Minimum area of 10px²

                                    for (let y = 0; y < height; y++) {
                                      for (let x = 0; x < width; x++) {
                                        const i = (y * width + x) * 4;
                                        const r = Math.round(data[i] / 32) * 32;
                                        const g =
                                          Math.round(data[i + 1] / 32) * 32;
                                        const b =
                                          Math.round(data[i + 2] / 32) * 32;
                                        const key = `${r},${g},${b}`;

                                        if (!colorMap.has(key)) {
                                          colorMap.set(key, {
                                            color: [r, g, b],
                                            pixels: new Set([y * width + x]),
                                          });
                                        } else {
                                          colorMap
                                            .get(key)!
                                            .pixels.add(y * width + x);
                                        }
                                      }
                                    }

                                    // Step 2: Filter out small regions and merge them with neighbors
                                    const finalRegions = new Map<
                                      string,
                                      { color: number[]; pixels: Set<number> }
                                    >();
                                    for (const [
                                      key,
                                      region,
                                    ] of colorMap.entries()) {
                                      if (region.pixels.size >= minRegionSize) {
                                        finalRegions.set(key, region);
                                      } else {
                                        // Merge small regions with the most similar neighbor
                                        for (const pixel of region.pixels) {
                                          const x = pixel % width;
                                          const y = Math.floor(pixel / width);
                                          let bestMatch = null;
                                          let minDiff = Infinity;

                                          // Check neighbors
                                          for (const [
                                            nKey,
                                            nRegion,
                                          ] of finalRegions.entries()) {
                                            const diff = Math.sqrt(
                                              Math.pow(
                                                region.color[0] -
                                                  nRegion.color[0],
                                                2,
                                              ) +
                                                Math.pow(
                                                  region.color[1] -
                                                    nRegion.color[1],
                                                  2,
                                                ) +
                                                Math.pow(
                                                  region.color[2] -
                                                    nRegion.color[2],
                                                  2,
                                                ),
                                            );
                                            if (diff < minDiff) {
                                              minDiff = diff;
                                              bestMatch = nKey;
                                            }
                                          }

                                          if (bestMatch) {
                                            finalRegions
                                              .get(bestMatch)!
                                              .pixels.add(pixel);
                                          }
                                        }
                                      }
                                    }

                                    // Step 3: Create non-overlapping shapes
                                    const outputData = new Uint8ClampedArray(
                                      data.length,
                                    );
                                    for (const region of finalRegions.values()) {
                                      for (const pixel of region.pixels) {
                                        const i = pixel * 4;
                                        outputData[i] = region.color[0];
                                        outputData[i + 1] = region.color[1];
                                        outputData[i + 2] = region.color[2];
                                        outputData[i + 3] = 255;
                                      }
                                    }

                                    // Apply the result
                                    ctx.putImageData(
                                      new ImageData(outputData, width, height),
                                      0,
                                      0,
                                    );
                                  };
                                  img.src = canvas.toDataURL();
                                }
                              }
                            }}
                            className="w-6 h-6 bg-gray-500 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="No Overlap - Vectorize with non-overlapping shapes"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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

                                    // Step 1: Quantize colors
                                    const colorMap = new Map<
                                      string,
                                      { color: number[]; count: number }
                                    >();
                                    for (let i = 0; i < data.length; i += 4) {
                                      const r = Math.round(data[i] / 32) * 32;
                                      const g =
                                        Math.round(data[i + 1] / 32) * 32;
                                      const b =
                                        Math.round(data[i + 2] / 32) * 32;
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

                                    // Step 2: Sort colors by frequency and take top N colors
                                    const sortedColors = Array.from(
                                      colorMap.entries(),
                                    )
                                      .sort((a, b) => b[1].count - a[1].count)
                                      .slice(0, 32)
                                      .map(([_, value]) => value.color);

                                    // Step 3: Process each pixel
                                    const outputData = new Uint8ClampedArray(
                                      data.length,
                                    );
                                    for (let i = 0; i < data.length; i += 4) {
                                      let minDist = Infinity;
                                      let closestColor = sortedColors[0];

                                      // Find the closest color
                                      for (const color of sortedColors) {
                                        const dist = Math.sqrt(
                                          Math.pow(data[i] - color[0], 2) +
                                            Math.pow(
                                              data[i + 1] - color[1],
                                              2,
                                            ) +
                                            Math.pow(data[i + 2] - color[2], 2),
                                        );
                                        if (dist < minDist) {
                                          minDist = dist;
                                          closestColor = color;
                                        }
                                      }

                                      // Apply the color
                                      outputData[i] = closestColor[0];
                                      outputData[i + 1] = closestColor[1];
                                      outputData[i + 2] = closestColor[2];
                                      outputData[i + 3] = 255;
                                    }

                                    // Step 4: Apply edge detection for clear borders
                                    for (let y = 1; y < height - 1; y++) {
                                      for (let x = 1; x < width - 1; x++) {
                                        const idx = (y * width + x) * 4;
                                        const current = [
                                          outputData[idx],
                                          outputData[idx + 1],
                                          outputData[idx + 2],
                                        ];

                                        // Check neighbors
                                        const neighbors = [
                                          [(y - 1) * width + x, "top"],
                                          [(y + 1) * width + x, "bottom"],
                                          [y * width + (x - 1), "left"],
                                          [y * width + (x + 1), "right"],
                                        ];

                                        for (const [nIdx, pos] of neighbors) {
                                          const nColor = [
                                            outputData[nIdx * 4],
                                            outputData[nIdx * 4 + 1],
                                            outputData[nIdx * 4 + 2],
                                          ];

                                          // If colors are different, this is an edge
                                          if (
                                            current.some(
                                              (c, i) =>
                                                Math.abs(c - nColor[i]) > 32,
                                            )
                                          ) {
                                            outputData[idx] = current[0];
                                            outputData[idx + 1] = current[1];
                                            outputData[idx + 2] = current[2];
                                            outputData[idx + 3] = 255;
                                          }
                                        }
                                      }
                                    }

                                    // Apply the result
                                    ctx.putImageData(
                                      new ImageData(outputData, width, height),
                                      0,
                                      0,
                                    );
                                  };
                                  img.src = canvas.toDataURL();
                                }
                              }
                            }}
                            className="w-6 h-6 bg-gray-300 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Single - Each color vectorized to a separate layer"
                          />
                        </div>
                      )}
                      {type.id === "stroked" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTypeSelect("stroked");

                              const canvas = document.querySelector("canvas");
                              if (canvas) {
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  const img = new Image();
                                  img.onload = () => {
                                    // Create a temporary canvas for processing
                                    const tempCanvas =
                                      document.createElement("canvas");
                                    tempCanvas.width = canvas.width;
                                    tempCanvas.height = canvas.height;
                                    const tempCtx =
                                      tempCanvas.getContext("2d")!;

                                    // Draw original image
                                    tempCtx.drawImage(img, 0, 0);

                                    // Get image data
                                    const imageData = tempCtx.getImageData(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );
                                    const data = imageData.data;

                                    // Create output canvas with transparent background
                                    ctx.clearRect(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );

                                    // Extract dominant colors
                                    const colorMap = new Map<
                                      string,
                                      { color: number[]; count: number }
                                    >();
                                    for (let i = 0; i < data.length; i += 4) {
                                      const r = Math.round(data[i] / 32) * 32;
                                      const g =
                                        Math.round(data[i + 1] / 32) * 32;
                                      const b =
                                        Math.round(data[i + 2] / 32) * 32;
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

                                    // Sort colors by frequency
                                    const sortedColors = Array.from(
                                      colorMap.entries(),
                                    )
                                      .sort((a, b) => b[1].count - a[1].count)
                                      .slice(0, 32)
                                      .map(([_, value]) => value.color);

                                    // For each color, create a stroke layer
                                    sortedColors.forEach((color) => {
                                      const strokeCanvas =
                                        document.createElement("canvas");
                                      strokeCanvas.width = canvas.width;
                                      strokeCanvas.height = canvas.height;
                                      const strokeCtx =
                                        strokeCanvas.getContext("2d")!;

                                      // Find edges for this color
                                      const edgeData = new Uint8ClampedArray(
                                        data.length,
                                      );
                                      for (
                                        let y = 1;
                                        y < canvas.height - 1;
                                        y++
                                      ) {
                                        for (
                                          let x = 1;
                                          x < canvas.width - 1;
                                          x++
                                        ) {
                                          const idx =
                                            (y * canvas.width + x) * 4;
                                          const isColorMatch =
                                            Math.abs(data[idx] - color[0]) <
                                              30 &&
                                            Math.abs(data[idx + 1] - color[1]) <
                                              30 &&
                                            Math.abs(data[idx + 2] - color[2]) <
                                              30;

                                          if (isColorMatch) {
                                            // Check neighbors for edges
                                            const hasEdge = [-1, 0, 1].some(
                                              (dy) =>
                                                [-1, 0, 1].some((dx) => {
                                                  if (dx === 0 && dy === 0)
                                                    return false;
                                                  const nIdx =
                                                    ((y + dy) * canvas.width +
                                                      (x + dx)) *
                                                    4;
                                                  return !(
                                                    Math.abs(
                                                      data[nIdx] - color[0],
                                                    ) < 30 &&
                                                    Math.abs(
                                                      data[nIdx + 1] - color[1],
                                                    ) < 30 &&
                                                    Math.abs(
                                                      data[nIdx + 2] - color[2],
                                                    ) < 30
                                                  );
                                                }),
                                            );

                                            if (hasEdge) {
                                              edgeData[idx] = color[0];
                                              edgeData[idx + 1] = color[1];
                                              edgeData[idx + 2] = color[2];
                                              edgeData[idx + 3] = 255;
                                            }
                                          }
                                        }
                                      }

                                      // Apply the stroke
                                      strokeCtx.putImageData(
                                        new ImageData(
                                          edgeData,
                                          canvas.width,
                                          canvas.height,
                                        ),
                                        0,
                                        0,
                                      );

                                      // Draw stroke onto main canvas
                                      ctx.drawImage(strokeCanvas, 0, 0);
                                    });
                                  };
                                  img.src = canvas.toDataURL();
                                }
                              }
                            }}
                            className="w-6 h-6 border-4 border-gray-900 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Heavy Stroke - Thick colored outlines with transparent background"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTypeSelect("stroked");

                              const canvas = document.querySelector("canvas");
                              if (canvas) {
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  const img = new Image();
                                  img.onload = () => {
                                    // Clear canvas and set transparent background
                                    ctx.clearRect(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );

                                    // Create temporary canvas for processing
                                    const tempCanvas =
                                      document.createElement("canvas");
                                    tempCanvas.width = canvas.width;
                                    tempCanvas.height = canvas.height;
                                    const tempCtx =
                                      tempCanvas.getContext("2d")!;

                                    // Draw original image
                                    tempCtx.drawImage(img, 0, 0);

                                    // Get image data
                                    const imageData = tempCtx.getImageData(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );
                                    const data = imageData.data;

                                    // Create output data with transparency
                                    const outputData = new Uint8ClampedArray(
                                      data.length,
                                    );

                                    // Edge detection with medium thickness
                                    const threshold = 30;
                                    const strokeWidth = 2; // Medium stroke width

                                    for (
                                      let y = strokeWidth;
                                      y < canvas.height - strokeWidth;
                                      y++
                                    ) {
                                      for (
                                        let x = strokeWidth;
                                        x < canvas.width - strokeWidth;
                                        x++
                                      ) {
                                        const idx = (y * canvas.width + x) * 4;

                                        // Check for edges with medium range
                                        let isEdge = false;
                                        for (
                                          let dy = -strokeWidth;
                                          dy <= strokeWidth;
                                          dy++
                                        ) {
                                          for (
                                            let dx = -strokeWidth;
                                            dx <= strokeWidth;
                                            dx++
                                          ) {
                                            if (dx === 0 && dy === 0) continue;

                                            const nIdx =
                                              ((y + dy) * canvas.width +
                                                (x + dx)) *
                                              4;
                                            const diff =
                                              Math.abs(data[idx] - data[nIdx]) +
                                              Math.abs(
                                                data[idx + 1] - data[nIdx + 1],
                                              ) +
                                              Math.abs(
                                                data[idx + 2] - data[nIdx + 2],
                                              );

                                            if (diff > threshold) {
                                              isEdge = true;
                                              break;
                                            }
                                          }
                                          if (isEdge) break;
                                        }

                                        if (isEdge) {
                                          // Keep original color for the edge
                                          outputData[idx] = data[idx];
                                          outputData[idx + 1] = data[idx + 1];
                                          outputData[idx + 2] = data[idx + 2];
                                          outputData[idx + 3] = 255; // Fully opaque
                                        } else {
                                          // Transparent for non-edge pixels
                                          outputData[idx + 3] = 0;
                                        }
                                      }
                                    }

                                    // Apply the result
                                    ctx.putImageData(
                                      new ImageData(
                                        outputData,
                                        canvas.width,
                                        canvas.height,
                                      ),
                                      0,
                                      0,
                                    );
                                  };
                                  img.src = canvas.toDataURL();
                                }
                              }
                            }}
                            className="w-6 h-6 border-3 border-gray-700 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Medium Stroke - Medium-weight colored outlines with transparent background"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTypeSelect("stroked");

                              const canvas = document.querySelector("canvas");
                              if (canvas) {
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  const img = new Image();
                                  img.onload = () => {
                                    // Clear canvas and set transparent background
                                    ctx.clearRect(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );

                                    // Create temporary canvas for processing
                                    const tempCanvas =
                                      document.createElement("canvas");
                                    tempCanvas.width = canvas.width;
                                    tempCanvas.height = canvas.height;
                                    const tempCtx =
                                      tempCanvas.getContext("2d")!;

                                    // Draw original image
                                    tempCtx.drawImage(img, 0, 0);

                                    // Get image data
                                    const imageData = tempCtx.getImageData(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );
                                    const data = imageData.data;

                                    // Create output data with transparency
                                    const outputData = new Uint8ClampedArray(
                                      data.length,
                                    );

                                    // Edge detection with thin lines
                                    const threshold = 20; // Lower threshold for more sensitive edge detection
                                    const strokeWidth = 1; // Thin stroke width

                                    // First pass: Detect edges
                                    const edges = new Uint8ClampedArray(
                                      data.length,
                                    );
                                    for (
                                      let y = 1;
                                      y < canvas.height - 1;
                                      y++
                                    ) {
                                      for (
                                        let x = 1;
                                        x < canvas.width - 1;
                                        x++
                                      ) {
                                        const idx = (y * canvas.width + x) * 4;

                                        // Sobel operator for edge detection
                                        let gx = 0;
                                        let gy = 0;

                                        // Calculate gradient
                                        for (let i = -1; i <= 1; i++) {
                                          for (let j = -1; j <= 1; j++) {
                                            const nIdx =
                                              ((y + i) * canvas.width +
                                                (x + j)) *
                                              4;
                                            const val =
                                              (data[nIdx] +
                                                data[nIdx + 1] +
                                                data[nIdx + 2]) /
                                              3;

                                            gx += val * (j * (i === 0 ? 2 : 1));
                                            gy += val * (i * (j === 0 ? 2 : 1));
                                          }
                                        }

                                        const magnitude = Math.sqrt(
                                          gx * gx + gy * gy,
                                        );
                                        if (magnitude > threshold) {
                                          edges[idx] =
                                            edges[idx + 1] =
                                            edges[idx + 2] =
                                              255;
                                          edges[idx + 3] = 255;
                                        }
                                      }
                                    }

                                    // Second pass: Create thin lines
                                    for (
                                      let y = 1;
                                      y < canvas.height - 1;
                                      y++
                                    ) {
                                      for (
                                        let x = 1;
                                        x < canvas.width - 1;
                                        x++
                                      ) {
                                        const idx = (y * canvas.width + x) * 4;

                                        if (edges[idx] === 255) {
                                          // Keep original color for the edge
                                          outputData[idx] = data[idx];
                                          outputData[idx + 1] = data[idx + 1];
                                          outputData[idx + 2] = data[idx + 2];
                                          outputData[idx + 3] = 255;
                                        }
                                      }
                                    }

                                    // Apply the result
                                    ctx.putImageData(
                                      new ImageData(
                                        outputData,
                                        canvas.width,
                                        canvas.height,
                                      ),
                                      0,
                                      0,
                                    );
                                  };
                                  img.src = canvas.toDataURL();
                                }
                              }
                            }}
                            className="w-6 h-6 border-2 border-gray-500 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Thin Stroke - Fine colored outlines with transparent background"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTypeSelect("stroked");

                              const canvas = document.querySelector("canvas");
                              if (canvas) {
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  const img = new Image();
                                  img.onload = () => {
                                    // Clear canvas and set transparent background
                                    ctx.clearRect(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );

                                    // Create temporary canvas for processing
                                    const tempCanvas =
                                      document.createElement("canvas");
                                    tempCanvas.width = canvas.width;
                                    tempCanvas.height = canvas.height;
                                    const tempCtx =
                                      tempCanvas.getContext("2d")!;

                                    // Draw original image
                                    tempCtx.drawImage(img, 0, 0);

                                    // Get image data
                                    const imageData = tempCtx.getImageData(
                                      0,
                                      0,
                                      canvas.width,
                                      canvas.height,
                                    );
                                    const data = imageData.data;

                                    // Create output data with transparency
                                    const outputData = new Uint8ClampedArray(
                                      data.length,
                                    );

                                    // Parameters for centerline detection
                                    const threshold = 15; // Lower threshold for more sensitive line detection

                                    // First pass: Convert to grayscale and detect edges
                                    const edges = new Uint8ClampedArray(
                                      data.length / 4,
                                    );
                                    for (
                                      let y = 1;
                                      y < canvas.height - 1;
                                      y++
                                    ) {
                                      for (
                                        let x = 1;
                                        x < canvas.width - 1;
                                        x++
                                      ) {
                                        const idx = (y * canvas.width + x) * 4;

                                        // Convert to grayscale
                                        const gray =
                                          (data[idx] +
                                            data[idx + 1] +
                                            data[idx + 2]) /
                                          3;

                                        // Calculate gradient using Sobel
                                        let gx = 0;
                                        let gy = 0;

                                        // 3x3 Sobel kernels
                                        for (let i = -1; i <= 1; i++) {
                                          for (let j = -1; j <= 1; j++) {
                                            const nIdx =
                                              ((y + i) * canvas.width +
                                                (x + j)) *
                                              4;
                                            const nGray =
                                              (data[nIdx] +
                                                data[nIdx + 1] +
                                                data[nIdx + 2]) /
                                              3;

                                            // Sobel weights
                                            const sx = j * (i === 0 ? 2 : 1);
                                            const sy = i * (j === 0 ? 2 : 1);

                                            gx += nGray * sx;
                                            gy += nGray * sy;
                                          }
                                        }

                                        // Calculate gradient magnitude
                                        const magnitude = Math.sqrt(
                                          gx * gx + gy * gy,
                                        );
                                        edges[y * canvas.width + x] =
                                          magnitude > threshold ? 1 : 0;
                                      }
                                    }

                                    // Second pass: Find centerlines
                                    for (
                                      let y = 2;
                                      y < canvas.height - 2;
                                      y++
                                    ) {
                                      for (
                                        let x = 2;
                                        x < canvas.width - 2;
                                        x++
                                      ) {
                                        const idx = (y * canvas.width + x) * 4;

                                        if (edges[y * canvas.width + x]) {
                                          // Check if this is a centerline pixel
                                          let isCenterline = true;

                                          // Check perpendicular directions
                                          for (
                                            let angle = 0;
                                            angle < Math.PI;
                                            angle += Math.PI / 4
                                          ) {
                                            const dx = Math.cos(angle);
                                            const dy = Math.sin(angle);

                                            // Check points on both sides
                                            const p1 =
                                              edges[
                                                Math.round(y + dy) *
                                                  canvas.width +
                                                  Math.round(x + dx)
                                              ];
                                            const p2 =
                                              edges[
                                                Math.round(y - dy) *
                                                  canvas.width +
                                                  Math.round(x - dx)
                                              ];

                                            if (p1 && p2) {
                                              isCenterline = false;
                                              break;
                                            }
                                          }

                                          if (isCenterline) {
                                            // Keep original color for centerline
                                            outputData[idx] = data[idx];
                                            outputData[idx + 1] = data[idx + 1];
                                            outputData[idx + 2] = data[idx + 2];
                                            outputData[idx + 3] = 255;
                                          }
                                        }
                                      }
                                    }

                                    // Apply the result
                                    ctx.putImageData(
                                      new ImageData(
                                        outputData,
                                        canvas.width,
                                        canvas.height,
                                      ),
                                      0,
                                      0,
                                    );
                                  };
                                  img.src = canvas.toDataURL();
                                }
                              }
                            }}
                            className="w-6 h-6 border border-gray-300 rounded hover:ring-2 hover:ring-primary cursor-pointer"
                            title="Centerline - Vector lines along shape centers"
                          />
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
