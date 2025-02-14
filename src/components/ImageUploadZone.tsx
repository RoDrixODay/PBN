import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ImageUploadZoneProps {
  onImageUpload?: (file: File) => void;
  originalImage?: string;
  convertedImage?: string;
}

const models = [
  {
    id: "clipart",
    icon: "💎",
    label: "Clipart",
    description: "Few Colors",
  },
  {
    id: "photo",
    icon: "🖼️",
    label: "Photo",
    description: "Many Colors",
  },
  {
    id: "sketch",
    icon: "⬡",
    label: "Sketch",
    description: "Grayscale",
  },
  {
    id: "drawing",
    icon: "⧉",
    label: "Drawing",
    description: "Black / White",
  },
];

const FilledLayerIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" className="fill-current">
    <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14z" />
    <path d="M6 7h12v10H6z" />
  </svg>
);

const StrokedLayerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    className="stroke-current fill-none stroke-2"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const outputTypes = [
  {
    id: "filled",
    label: "Filled Layers",
    description: "Color filled vector elements",
    icon: <FilledLayerIcon />,
    options: [
      { transform: "rotate(0)" },
      { transform: "rotate(45deg)" },
      { transform: "rotate(90deg)" },
      { transform: "rotate(135deg)" },
    ],
  },
  {
    id: "stroked",
    label: "Stroked Layers",
    description: "Color bordered vector elements",
    icon: <StrokedLayerIcon />,
    options: [
      { transform: "rotate(0)" },
      { transform: "rotate(45deg)" },
      { transform: "scale(0.8)" },
      { transform: "scale(0.6)" },
    ],
  },
];

const detailLevels = [
  "Maximum",
  "Ultra",
  "Very High",
  "High",
  "Medium",
  "Low",
  "Minimum",
];

const ImageUploadZone = ({
  onImageUpload = () => {},
  originalImage = "",
  convertedImage = "",
}: ImageUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState("photo");
  const [detailLevel, setDetailLevel] = useState("Maximum");
  const [selectedOutputType, setSelectedOutputType] = useState("filled");
  const [selectedOutputOption, setSelectedOutputOption] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  return (
    <div className="w-full h-[600px] bg-white p-6 rounded-lg shadow-lg">
      <div className="flex flex-col h-full gap-6">
        {/* Model Selection */}
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-500 font-medium rotate-180 [writing-mode:vertical-lr]">
            STEP 0
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className="flex gap-2">
              {models.map((model) => (
                <Button
                  key={model.id}
                  variant={selectedModel === model.id ? "default" : "outline"}
                  className={`flex flex-col items-center py-2 px-4 h-auto gap-1 min-w-[100px] ${selectedModel === model.id ? "bg-primary" : ""}`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <span className="text-2xl">{model.icon}</span>
                  <div className="text-xs font-medium">{model.label}</div>
                  <div className="text-[10px] text-gray-500">
                    {model.description}
                  </div>
                </Button>
              ))}
            </div>

            <Select value={detailLevel} onValueChange={setDetailLevel}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Detail Level" />
              </SelectTrigger>
              <SelectContent>
                {detailLevels.map((level) => (
                  <SelectItem key={level} value={level} className="text-xs">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output Type Selection */}
          <div className="flex gap-8">
            {outputTypes.map((type) => (
              <div key={type.id} className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    {type.description}
                  </div>
                </div>
                <div className="flex gap-1 justify-center">
                  {type.options.map((option, index) => (
                    <Button
                      key={`${type.id}-${index}`}
                      variant={
                        selectedOutputType === type.id &&
                        selectedOutputOption === index
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="p-1 h-8 w-8"
                      onClick={() => {
                        setSelectedOutputType(type.id);
                        setSelectedOutputOption(index);
                      }}
                    >
                      <div
                        className="w-4 h-4"
                        style={{
                          transform: option.transform,
                        }}
                      >
                        {type.icon}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload Area */}
        <div className="flex flex-1 gap-6">
          {/* Left side - Original Image */}
          <Card className="flex-1 p-4 relative">
            {originalImage ? (
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-gray-300"}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">
                  Drag and drop your image here
                </p>
                <p className="text-gray-400 text-sm mb-4">or</p>
                <Button
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </Button>
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInput}
                />
              </div>
            )}
          </Card>

          {/* Right side - Converted Image */}
          <Card className="flex-1 p-4 relative">
            {convertedImage ? (
              <img
                src={convertedImage}
                alt="Converted"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">
                  Paint by numbers preview will appear here
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadZone;
