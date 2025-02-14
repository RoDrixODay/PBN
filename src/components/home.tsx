import React, { useState } from "react";
import ImageUploadZone from "./ImageUploadZone";
import ColorControlPanel from "./ColorControlPanel";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

const Home = () => {
  const [originalImage, setOriginalImage] = useState("");
  const [convertedImage, setConvertedImage] = useState("");
  const [colorCount, setColorCount] = useState(10);
  const [colors, setColors] = useState([
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#000080",
  ]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setOriginalImage(e.target.result.toString());
        // In a real implementation, this would trigger the conversion process
        setConvertedImage(e.target.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Paint by Numbers Generator
        </h1>

        <ImageUploadZone
          onImageUpload={handleImageUpload}
          originalImage={originalImage}
          convertedImage={convertedImage}
        />

        <ColorControlPanel
          onColorCountChange={setColorCount}
          onColorChange={handleColorChange}
          colorCount={colorCount}
          colors={colors}
        />

        <Card className="p-6 bg-white shadow-md">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="outline-toggle">Outline Thickness</Label>
                <Slider
                  id="outline-thickness"
                  defaultValue={[2]}
                  max={5}
                  min={1}
                  step={0.5}
                  className="w-[200px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="numbers-toggle">Show Numbers</Label>
                <Switch id="numbers-toggle" defaultChecked />
              </div>

              <div className="space-y-1">
                <Label htmlFor="font-size">Font Size</Label>
                <Slider
                  id="font-size"
                  defaultValue={[12]}
                  max={24}
                  min={8}
                  step={1}
                  className="w-[200px]"
                />
              </div>

              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  // Download logic would go here
                  console.log("Downloading image...");
                }}
              >
                <Download className="w-4 h-4" />
                Download PNG
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
