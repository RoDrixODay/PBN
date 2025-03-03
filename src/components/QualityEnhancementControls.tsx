import React from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  applyAntiAliasing,
  applyNoiseReduction,
  applyUpscaling,
} from "@/lib/imageProcessing/qualityEnhancement";

interface QualityEnhancementControlsProps {
  onApplyEnhancement: (
    enhancement: "antiAliasing" | "noiseReduction" | "upscaling",
    level: string,
  ) => void;
}

export function QualityEnhancementControls({
  onApplyEnhancement,
}: QualityEnhancementControlsProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border border-gray-300 rounded-md flex items-center justify-center mb-2">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3v18M3 12h18" />
            </svg>
          </div>
          <span className="text-sm font-medium mb-2">Anti-aliasing</span>
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-r-none"
              onClick={() => onApplyEnhancement("antiAliasing", "off")}
            >
              Off
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-none"
              onClick={() => onApplyEnhancement("antiAliasing", "smart")}
            >
              Smart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-l-none"
              onClick={() => onApplyEnhancement("antiAliasing", "mid")}
            >
              Mid
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border border-gray-300 rounded-md flex items-center justify-center mb-2">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3v18M3 12h18" />
            </svg>
          </div>
          <span className="text-sm font-medium mb-2">Noise Reduction</span>
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-r-none"
              onClick={() => onApplyEnhancement("noiseReduction", "off")}
            >
              Off
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-none"
              onClick={() => onApplyEnhancement("noiseReduction", "low")}
            >
              Low
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-l-none"
              onClick={() => onApplyEnhancement("noiseReduction", "high")}
            >
              High
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border border-gray-300 rounded-md flex items-center justify-center mb-2">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 3v18M3 12h18" />
            </svg>
          </div>
          <span className="text-sm font-medium mb-2">Upscaling</span>
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-r-none"
              onClick={() => onApplyEnhancement("upscaling", "off")}
            >
              Off
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-none"
              onClick={() => onApplyEnhancement("upscaling", "200%")}
            >
              200%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-l-none"
              onClick={() => onApplyEnhancement("upscaling", "400%")}
            >
              400%
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
