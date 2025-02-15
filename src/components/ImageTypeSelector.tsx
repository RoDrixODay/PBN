import React from "react";
import { Card } from "./ui/card";
import {
  Diamond,
  Image as ImageIcon,
  PenTool,
  FileImage,
  Layers,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
                          <div className="w-6 h-6 bg-gray-900 rounded" />
                          <div className="w-6 h-6 bg-gray-700 rounded" />
                          <div className="w-6 h-6 bg-gray-500 rounded" />
                          <div className="w-6 h-6 bg-gray-300 rounded" />
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

      {selectedTypeData?.showDetailLevel && (
        <div className="flex items-center gap-2">
          <select
            value={detailLevel}
            onChange={(e) => onDetailLevelChange?.(Number(e.target.value))}
            className="form-select block w-48 text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          >
            {detailLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ImageTypeSelector;
