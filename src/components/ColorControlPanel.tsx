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

interface ColorControlPanelProps {
  onColorCountChange?: (count: number) => void;
  colorCount?: number;
  imageColors?: { [key: number]: string[] };
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

const ColorControlPanel = ({
  onColorCountChange = () => {},
  colorCount = 32,
  imageColors = {},
}: ColorControlPanelProps) => {
  const [contourDetection, setContourDetection] = useState(false);

  return (
    <div className="flex gap-6">
      {/* Input Options */}
      <Card className="flex-1 p-4 bg-white shadow-md">
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Colors: {colorCount}</Label>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Custom Palette
              </Button>
            </div>

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
                      {generateColorPalette(option).map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-0">
                          {row.map((color, colIndex) => (
                            <div
                              key={colIndex}
                              className="w-4 h-4"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>

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
          </div>
        </div>
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
              {Array(32)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: `hsl(${(i * 360) / 32}, 70%, ${50 + (i % 2) * 20}%)`,
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ColorControlPanel;
