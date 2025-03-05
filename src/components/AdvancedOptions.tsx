import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import {
  applyAntiAliasing,
  applyNoiseReduction,
  applyUpscaling,
} from "@/lib/imageProcessing/qualityEnhancement";
import {
  applyRoundness,
  applyMinimumArea,
  applyCircleDetection,
} from "@/lib/imageProcessing/vectorization";

interface AdvancedOptionsProps {
  type: "input" | "output";
  canvas?: HTMLCanvasElement | null;
}

export function AdvancedOptions({ type, canvas }: AdvancedOptionsProps) {
  // Quality Enhancement states
  const [antiAliasing, setAntiAliasing] = useState("off");
  const [noiseReduction, setNoiseReduction] = useState("high");
  const [upscaling, setUpscaling] = useState("200%");

  // Vectorization states
  const [roundness, setRoundness] = useState("medium");
  const [minimumArea, setMinimumArea] = useState("5px²");
  const [circleDetection, setCircleDetection] = useState("off");

  // Apply quality enhancement when settings change
  useEffect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (type === "input") {
      // Get current image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply enhancements based on current settings
      if (antiAliasing !== "off") {
        applyAntiAliasing(
          ctx,
          data,
          canvas.width,
          canvas.height,
          antiAliasing as "smart" | "mid",
        );
      }

      if (noiseReduction !== "off") {
        applyNoiseReduction(
          ctx,
          data,
          canvas.width,
          canvas.height,
          noiseReduction as "low" | "high",
        );
      }

      if (upscaling !== "off") {
        applyUpscaling(
          ctx,
          data,
          canvas.width,
          canvas.height,
          upscaling as "200%" | "400%",
        );
      }
    }
  }, [antiAliasing, noiseReduction, upscaling, canvas, type]);

  // Apply vectorization when settings change
  useEffect(() => {
    if (!canvas || type !== "output") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get current image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply vectorization based on current settings
    if (roundness !== "medium") {
      applyRoundness(
        ctx,
        data,
        canvas.width,
        canvas.height,
        roundness as "sharp" | "round",
      );
    }

    if (minimumArea !== "5px²") {
      applyMinimumArea(
        ctx,
        data,
        canvas.width,
        canvas.height,
        minimumArea as "0px²" | "90px²",
      );
    }

    if (circleDetection !== "off") {
      applyCircleDetection(ctx, data, canvas.width, canvas.height, "on");
    }
  }, [roundness, minimumArea, circleDetection, canvas, type]);

  // Handle quality enhancement changes
  const handleAntiAliasingChange = (level: string) => {
    setAntiAliasing(level);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyAntiAliasing(
      ctx,
      imageData.data,
      canvas.width,
      canvas.height,
      level as "off" | "smart" | "mid",
    );
  };

  const handleNoiseReductionChange = (level: string) => {
    setNoiseReduction(level);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyNoiseReduction(
      ctx,
      imageData.data,
      canvas.width,
      canvas.height,
      level as "off" | "low" | "high",
    );
  };

  const handleUpscalingChange = (level: string) => {
    setUpscaling(level);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyUpscaling(
      ctx,
      imageData.data,
      canvas.width,
      canvas.height,
      level as "off" | "200%" | "400%",
    );
  };

  // Handle vectorization changes
  const handleRoundnessChange = (level: string) => {
    setRoundness(level);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyRoundness(
      ctx,
      imageData.data,
      canvas.width,
      canvas.height,
      level as "sharp" | "medium" | "round",
    );
  };

  const handleMinimumAreaChange = (value: string) => {
    setMinimumArea(value);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyMinimumArea(
      ctx,
      imageData.data,
      canvas.width,
      canvas.height,
      value as "0px²" | "5px²" | "90px²",
    );
  };

  const handleCircleDetectionChange = (value: string) => {
    setCircleDetection(value);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyCircleDetection(
      ctx,
      imageData.data,
      canvas.width,
      canvas.height,
      value as "off" | "on",
    );
  };

  return (
    <div className="mt-6">
      <div className="text-center text-sm text-gray-500 mb-2">
        Advanced Options
      </div>

      {type === "input" && (
        <Card className="p-4">
          <Tabs defaultValue="quality">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quality">Quality Enhancement</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="quality" className="mt-4">
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
                  <span className="text-sm font-medium mb-2">
                    Anti-aliasing
                  </span>
                  <div className="flex border border-gray-200 rounded-md">
                    <Button
                      variant={antiAliasing === "off" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-r-none"
                      onClick={() => handleAntiAliasingChange("off")}
                    >
                      Off
                    </Button>
                    <Button
                      variant={antiAliasing === "smart" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-none"
                      onClick={() => handleAntiAliasingChange("smart")}
                    >
                      Smart
                    </Button>
                    <Button
                      variant={antiAliasing === "mid" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-l-none"
                      onClick={() => handleAntiAliasingChange("mid")}
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
                  <span className="text-sm font-medium mb-2">
                    Noise Reduction
                  </span>
                  <div className="flex border border-gray-200 rounded-md">
                    <Button
                      variant={noiseReduction === "off" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-r-none"
                      onClick={() => handleNoiseReductionChange("off")}
                    >
                      Off
                    </Button>
                    <Button
                      variant={noiseReduction === "low" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-none"
                      onClick={() => handleNoiseReductionChange("low")}
                    >
                      Low
                    </Button>
                    <Button
                      variant={noiseReduction === "high" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-l-none"
                      onClick={() => handleNoiseReductionChange("high")}
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
                      variant={upscaling === "off" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-r-none"
                      onClick={() => handleUpscalingChange("off")}
                    >
                      Off
                    </Button>
                    <Button
                      variant={upscaling === "200%" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-none"
                      onClick={() => handleUpscalingChange("200%")}
                    >
                      200%
                    </Button>
                    <Button
                      variant={upscaling === "400%" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-l-none"
                      onClick={() => handleUpscalingChange("400%")}
                    >
                      400%
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters">
              <div className="p-4 text-center text-gray-500">
                Filter options will appear here
              </div>
            </TabsContent>

            <TabsContent value="text">
              <div className="p-4 text-center text-gray-500">
                Text recognition options will appear here
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {type === "output" && (
        <Card className="p-4">
          <Tabs defaultValue="vectorization">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vectorization">Vectorization</TabsTrigger>
              <TabsTrigger value="output-size">Output Size</TabsTrigger>
              <TabsTrigger value="specials">Specials</TabsTrigger>
            </TabsList>

            <TabsContent value="vectorization" className="mt-4">
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
                      variant={roundness === "sharp" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-r-none"
                      onClick={() => handleRoundnessChange("sharp")}
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
                      variant={roundness === "medium" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-none"
                      onClick={() => handleRoundnessChange("medium")}
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
                      variant={roundness === "round" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-l-none"
                      onClick={() => handleRoundnessChange("round")}
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
                      variant={minimumArea === "0px²" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-r-none"
                      onClick={() => handleMinimumAreaChange("0px²")}
                    >
                      0px²
                    </Button>
                    <Button
                      variant={minimumArea === "5px²" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-none"
                      onClick={() => handleMinimumAreaChange("5px²")}
                    >
                      5px²
                    </Button>
                    <Button
                      variant={minimumArea === "90px²" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-l-none"
                      onClick={() => handleMinimumAreaChange("90px²")}
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
                  <span className="text-sm font-medium mb-2">
                    Circle Detection
                  </span>
                  <div className="flex border border-gray-200 rounded-md">
                    <Button
                      variant={circleDetection === "off" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-r-none"
                      onClick={() => handleCircleDetectionChange("off")}
                    >
                      Off
                    </Button>
                    <Button
                      variant={circleDetection === "on" ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7 rounded-l-none"
                      onClick={() => handleCircleDetectionChange("on")}
                    >
                      On
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="output-size">
              <div className="p-4 text-center text-gray-500">
                Output size options will appear here
              </div>
            </TabsContent>

            <TabsContent value="specials">
              <div className="p-4 text-center text-gray-500">
                Special options will appear here
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
