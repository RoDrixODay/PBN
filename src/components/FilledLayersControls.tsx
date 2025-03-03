import React from "react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface FilledLayersControlsProps {
  onModeSelect: (mode: "overlap" | "merge" | "noOverlap" | "single") => void;
  selectedMode: "overlap" | "merge" | "noOverlap" | "single";
}

export function FilledLayersControls({
  onModeSelect,
  selectedMode = "overlap",
}: FilledLayersControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex gap-2 mt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("overlap")}
              className={`w-6 h-6 bg-gray-900 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "overlap" ? "ring-2 ring-primary" : ""}`}
              aria-label="Overlap Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Overlap - Stack colors in order of frequency</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("merge")}
              className={`w-6 h-6 bg-gray-700 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "merge" ? "ring-2 ring-primary" : ""}`}
              aria-label="Merge Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Merge - Combine similar colors with increased tolerance</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("noOverlap")}
              className={`w-6 h-6 bg-gray-500 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "noOverlap" ? "ring-2 ring-primary" : ""}`}
              aria-label="No Overlap Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>No Overlap - Vectorize with non-overlapping shapes</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onModeSelect("single")}
              className={`w-6 h-6 bg-gray-300 rounded hover:ring-2 hover:ring-primary cursor-pointer ${selectedMode === "single" ? "ring-2 ring-primary" : ""}`}
              aria-label="Single Mode"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Single - Each color vectorized to a separate layer</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
