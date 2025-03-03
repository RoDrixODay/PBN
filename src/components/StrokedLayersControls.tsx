import React from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface StrokedLayersControlsProps {
  onModeSelect: (mode: "heavy" | "medium" | "thin" | "centerline") => void;
  selectedMode: "heavy" | "medium" | "thin" | "centerline";
}

export function StrokedLayersControls({
  onModeSelect,
  selectedMode = "medium",
}: StrokedLayersControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-2 mt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("heavy")}
              className={`w-6 h-6 border-4 border-gray-900 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "heavy" ? "ring-2 ring-primary" : ""}`}
              aria-label="Heavy Stroke Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Heavy Stroke - Thick colored outlines with transparent background
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("medium")}
              className={`w-6 h-6 border-3 border-gray-700 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "medium" ? "ring-2 ring-primary" : ""}`}
              aria-label="Medium Stroke Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Medium Stroke - Medium-weight colored outlines with transparent
              background
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("thin")}
              className={`w-6 h-6 border-2 border-gray-500 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "thin" ? "ring-2 ring-primary" : ""}`}
              aria-label="Thin Stroke Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Thin Stroke - Fine colored outlines with transparent background
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("centerline")}
              className={`w-6 h-6 border border-gray-300 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "centerline" ? "ring-2 ring-primary" : ""}`}
              aria-label="Centerline Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Centerline - Vector lines along shape centers</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
