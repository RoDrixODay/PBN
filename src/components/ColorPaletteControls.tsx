import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  ColorPaletteManager,
  ColorPalette,
  ColorHarmony,
} from "@/lib/paintByNumbers/features/colorPalette";
import { EyeOff, Palette, Wand2 } from "lucide-react";

interface ColorPaletteControlsProps {
  onPaletteChange: (palette: ColorPalette) => void;
  onAccessibilityToggle: (enabled: boolean) => void;
}

export function ColorPaletteControls({
  onPaletteChange,
  onAccessibilityToggle,
}: ColorPaletteControlsProps) {
  const [paletteManager] = useState(() => new ColorPaletteManager());
  const [baseColor, setBaseColor] = useState("#000000");
  const [harmonies, setHarmonies] = useState<ColorHarmony[]>([]);
  const [isColorBlindMode, setIsColorBlindMode] = useState(false);

  const generateHarmonies = () => {
    const newHarmonies = paletteManager.generateHarmonies(baseColor);
    setHarmonies(newHarmonies);
  };

  const toggleColorBlindMode = () => {
    setIsColorBlindMode(!isColorBlindMode);
    const palette = isColorBlindMode
      ? paletteManager.generateColorBlindFriendlyPalette(32)
      : paletteManager.generateDefaultPalette();
    onPaletteChange(palette);
    onAccessibilityToggle(!isColorBlindMode);
  };

  return (
    <Card className="p-4 space-y-4">
      <Tabs defaultValue="palette">
        <TabsList>
          <TabsTrigger value="palette">Color Palette</TabsTrigger>
          <TabsTrigger value="harmonies">Harmonies</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        <TabsContent value="palette" className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Base Color</Label>
            <Input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="w-20"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={generateHarmonies}
              className="ml-auto"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Harmonies
            </Button>
          </div>

          <div className="grid grid-cols-8 gap-2">
            {harmonies.map((harmony, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                {harmony.colors.map((color, j) => (
                  <div
                    key={j}
                    className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 ring-primary"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      onPaletteChange({
                        name: harmony.name,
                        colors: harmony.colors,
                      })
                    }
                  />
                ))}
                <span className="text-xs text-gray-500">{harmony.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="harmonies">
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() =>
                onPaletteChange(paletteManager.generateDefaultPalette())
              }
            >
              <Palette className="w-4 h-4 mr-2" />
              Default
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                onPaletteChange({
                  name: "Custom",
                  colors: harmonies[0]?.colors || [],
                })
              }
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Custom
            </Button>
            <Button variant="outline" onClick={toggleColorBlindMode}>
              <EyeOff className="w-4 h-4 mr-2" />
              {isColorBlindMode ? "Normal Mode" : "Color Blind Mode"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="accessibility">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => {
                const palette =
                  paletteManager.generateColorBlindFriendlyPalette(32);
                onPaletteChange(palette);
              }}
              className="w-full"
            >
              Color Blind Friendly Palette
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // This would need actual regions passed in
                const palette = paletteManager.generateAccessiblePalette([]);
                onPaletteChange(palette);
              }}
              className="w-full"
            >
              High Contrast Palette
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
