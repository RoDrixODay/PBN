import React from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  applyRoundness,
  applyMinimumArea,
  applyCircleDetection,
} from "@/lib/imageProcessing/vectorization";

interface VectorizationControlsProps {
  onApplyVectorization: (
    type: "roundness" | "minimumArea" | "circleDetection",
    value: string,
  ) => void;
}

export function VectorizationControls({
  onApplyVectorization,
}: VectorizationControlsProps) {
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
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="text-sm font-medium mb-2">Roundness</span>
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-r-none"
              onClick={() => onApplyVectorization("roundness", "sharp")}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 3h18v18H3z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-none"
              onClick={() => onApplyVectorization("roundness", "medium")}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="4" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-l-none"
              onClick={() => onApplyVectorization("roundness", "round")}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
              </svg>
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
              <path d="M3 3h18v18H3z" />
            </svg>
          </div>
          <span className="text-sm font-medium mb-2">Minimum Area</span>
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-r-none"
              onClick={() => onApplyVectorization("minimumArea", "0px²")}
            >
              0px²
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-none"
              onClick={() => onApplyVectorization("minimumArea", "5px²")}
            >
              5px²
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-l-none"
              onClick={() => onApplyVectorization("minimumArea", "90px²")}
            >
              90px²
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
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <span className="text-sm font-medium mb-2">Circle Detection</span>
          <div className="flex border border-gray-200 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-r-none"
              onClick={() => onApplyVectorization("circleDetection", "off")}
            >
              Off
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-l-none"
              onClick={() => onApplyVectorization("circleDetection", "on")}
            >
              On
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
