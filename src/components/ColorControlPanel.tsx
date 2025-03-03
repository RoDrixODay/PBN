import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { AdvancedOptions } from "./AdvancedOptions";

interface ColorControlPanelProps {
  onColorCountChange?: (count: number) => void;
  colorCount?: number;
  originalImage?: string;
  onColorChange?: (index: number, color: string) => void;
}

const colorOptions = [1, 2, 4, 6, 8, 12, 16, 24, 28, 32, 36, 50, 99];

const generateColorPalette = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / count;
    return Array.from(
      { length: Math.min(Math.ceil(32 / count), 8) },
      (_, j) => {
        const lightness =
          20 + (j * 60) / (Math.min(Math.ceil(32 / count), 8) - 1);
        return `hsl(${hue}, 70%, ${lightness}%)`;
      },
    );
  });
};

import ControlPanel from "./ControlPanel";

const ColorControlPanel = ({
  onColorCountChange = () => {},
  colorCount = 32,
  originalImage,
  onColorChange = () => {},
}: ColorControlPanelProps) => {
  const [dominantColors, setDominantColors] = React.useState<string[]>([]);
  const [outputColors, setOutputColors] = React.useState<string[]>([]);
  const [contourDetection, setContourDetection] = useState(false);
  const [outlineThickness, setOutlineThickness] = useState(2);
  const [showNumbers, setShowNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(12);

  // Extract dominant colors from the image
  React.useEffect(() => {
    if (originalImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = extractDominantColors(imageData.data, 32);
        setDominantColors(colors);
      };
      img.src = originalImage;
    }
  }, [originalImage]);

  // Update output colors when color count changes
  React.useEffect(() => {
    if (dominantColors.length > 0) {
      const newColors = dominantColors.slice(0, colorCount);
      setOutputColors(newColors);
      newColors.forEach((color, index) => onColorChange(index, color));
    }
  }, [colorCount, dominantColors]);

  // Function to extract dominant colors from image data
  const extractDominantColors = (
    data: Uint8ClampedArray,
    maxColors: number,
  ): string[] => {
    const colorMap = new Map<string, number>();

    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Quantize colors to reduce number of unique colors
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;

      const colorKey = `rgb(${quantizedR},${quantizedG},${quantizedB})`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    // Sort colors by frequency and take top N
    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxColors)
      .map(([color]) => color);
  };
  return (
    <div className="space-y-4">
      <ControlPanel
        outlineThickness={outlineThickness}
        showNumbers={showNumbers}
        fontSize={fontSize}
        onOutlineThicknessChange={setOutlineThickness}
        onShowNumbersChange={setShowNumbers}
        onFontSizeChange={setFontSize}
        onDownload={() => {
          console.log("Downloading image...");
        }}
        colorPalette={outputColors}
      />
      <div className="flex gap-6">
        {/* Input Options */}
        <Card className="flex-1 p-4 bg-white shadow-md h-2 h-[578]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Input Options:</h3>
              <Tabs defaultValue="palettes" className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="palettes">Color Palettes</TabsTrigger>
                  <TabsTrigger value="background">Background</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="flex justify-start items-center">
            <Label>Colors: {colorCount}</Label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-center flex-row items-center gap-x-0.5"
            >
              Custom Palette
            </Button>
          </div>
          <div className="space-y-4 flex justify-start">
            <RadioGroup
              value={colorCount.toString()}
              onValueChange={(value) => onColorCountChange(parseInt(value))}
              className="space-y-1"
            >
              {colorOptions.map((option) => (
                <div key={option} className="flex items-start gap-2">
                  <RadioGroupItem
                    value={option.toString()}
                    id={`color-${option}`}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`color-${option}`}
                      className="text-sm font-normal"
                    >
                      {option}:
                    </Label>
                    <div className="flex flex-wrap gap-0 mt-1">
                      {dominantColors.slice(0, option).map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="contour"
                checked={contourDetection}
                onCheckedChange={(checked) =>
                  setContourDetection(checked as boolean)
                }
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="contour" className="text-sm font-normal">
                  Contour Detection
                </Label>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  Beta Feature
                </span>
              </div>
            </div>
            <div className="flex items-start gap-1 text-sm text-gray-600 pl-6">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Enhance the recognition of fine lines and edges in the image,
                ideal for detailed illustrations.
              </p>
            </div>
          </div>

          {/* Advanced Options for Input */}
          <AdvancedOptions type="input" />
        </Card>
        {/* Output Options */}
        <Card className="flex-1 p-4 bg-white shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Output Options:</h3>
              <Tabs defaultValue="colors" className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="colors">Color Groups</TabsTrigger>
                  <TabsTrigger value="gradients">Gradients</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Colors: {colorCount}</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Button>
                  <Select defaultValue="5">
                    <SelectTrigger className="w-[80px] h-7">
                      <SelectValue placeholder="5%" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-8 gap-2">
                {outputColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options for Output */}
          <AdvancedOptions type="output" />
        </Card>
      </div>
    </div>
  );
};

export default ColorControlPanel;
