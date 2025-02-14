import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Info } from "lucide-react";

interface ColorControlPanelProps {
  onColorCountChange?: (count: number) => void;
  colorCount?: number;
  imageColors?: { [key: number]: string[] };
}

const colorOptions = [1, 2, 4, 6, 8, 12, 16, 24, 28, 32, 36, 50, 99];

const ColorControlPanel = ({
  onColorCountChange = () => {},
  colorCount = 32,
  imageColors = {},
}: ColorControlPanelProps) => {
  return (
    <Card className="p-4 w-full bg-white shadow-md">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Input Options:</h3>

          <Tabs defaultValue="palettes" className="w-full">
            <TabsList className="w-full bg-transparent border-b mb-4">
              <TabsTrigger
                value="palettes"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
              >
                Color Palettes
              </TabsTrigger>
              <TabsTrigger
                value="objects"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
              >
                Objects
              </TabsTrigger>
              <TabsTrigger
                value="background"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none"
              >
                Background
              </TabsTrigger>
            </TabsList>

            <TabsContent value="palettes" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-sm font-normal">
                  Colors: {colorCount}
                </Label>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Custom Palette
                </Button>
              </div>

              <RadioGroup
                value={colorCount.toString()}
                onValueChange={(value) => onColorCountChange(parseInt(value))}
                className="space-y-1.5"
              >
                {colorOptions.map((option) => (
                  <div key={option} className="flex items-start gap-2">
                    <RadioGroupItem
                      value={option.toString()}
                      id={`color-${option}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`color-${option}`}
                        className="text-sm font-normal mb-1 block"
                      >
                        {option}:
                      </Label>
                      <div className="flex flex-wrap gap-0">
                        {imageColors[option]?.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4"
                            style={{ backgroundColor: color }}
                          />
                        )) ||
                          Array(option)
                            .fill(0)
                            .map((_, index) => (
                              <div
                                key={index}
                                className="w-4 h-4 bg-gray-200"
                              />
                            ))}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 text-xs h-7"
              >
                more colors
              </Button>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="contour" className="text-sm font-normal">
                      Contour Detection
                    </Label>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      Beta Feature
                    </span>
                  </div>
                  <Switch id="contour" />
                </div>
                <div className="flex items-start gap-1 text-sm text-gray-600">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Enhance the recognition of fine lines and edges in the
                    image, ideal for detailed illustrations.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Card>
  );
};

export default ColorControlPanel;
