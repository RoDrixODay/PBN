import React, { useState, useRef } from "react";
import { Card } from "./ui/card";
import { InteractiveControls } from "./InteractiveControls";
import { Button } from "./ui/button";
import { Upload, Image as ImageIcon, Layers, BoxSelect } from "lucide-react";
import { applyStrokeOverlay, applyContourOverlay } from "@/lib/strokeUtils";
import ImageTypeSelector, { ImageType } from "./ImageTypeSelector";
import {
  processImage,
  ProcessingType,
  upscaleImage,
} from "@/lib/imageProcessing";

interface ImageUploadZoneProps {
  onImageUpload?: (file: File) => void;
  originalImage?: string;
  convertedImage?: string;
}

const ImageUploadZone = ({
  onImageUpload = () => {},
  originalImage = "",
  convertedImage: initialConvertedImage = "",
}: ImageUploadZoneProps) => {
  const [convertedImage, setConvertedImage] = useState(initialConvertedImage);
  const [originalHdUrl, setOriginalHdUrl] = useState("");
  const [showStrokes, setShowStrokes] = useState(false);
  const [currentTool, setCurrentTool] = useState<
    "select" | "pan" | "colorPicker"
  >("select");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showContours, setShowContours] = useState(false);
  const convertedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [strokeOptions, setStrokeOptions] = useState({
    strokeColor: "#000000",
    strokeWidth: 2,
    smoothing: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [imageType, setImageType] = useState<ImageType>("photo");
  const [detailLevel, setDetailLevel] = useState(3);

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
      processAndUploadImage(files[0]);
    }
  };

  const processAndUploadImage = async (file: File) => {
    try {
      // Create a canvas with the original image
      const img = new Image();
      const originalUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalUrl;
      });

      // Calculate target dimensions for HD (maintaining aspect ratio)
      let targetWidth = 1920;
      let targetHeight = 1080;
      const aspectRatio = img.width / img.height;

      if (aspectRatio > 1) {
        // Landscape
        targetHeight = Math.round(1920 / aspectRatio);
      } else {
        // Portrait
        targetWidth = Math.round(1080 * aspectRatio);
      }

      // Create HD canvas
      const hdCanvas = document.createElement("canvas");
      hdCanvas.width = targetWidth;
      hdCanvas.height = targetHeight;
      const hdCtx = hdCanvas.getContext("2d")!;

      // Enable high-quality image rendering
      hdCtx.imageSmoothingEnabled = true;
      hdCtx.imageSmoothingQuality = "high";

      // Draw image with bicubic-like interpolation
      hdCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Apply subtle sharpening to maintain crisp edges
      const imageData = hdCtx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;

      // Sharpen kernel
      const kernel = [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0];

      const tempData = new Uint8ClampedArray(data);
      for (let y = 1; y < targetHeight - 1; y++) {
        for (let x = 1; x < targetWidth - 1; x++) {
          const idx = (y * targetWidth + x) * 4;
          for (let c = 0; c < 3; c++) {
            let val = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const pidx = ((y + ky) * targetWidth + (x + kx)) * 4 + c;
                val += tempData[pidx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            data[idx + c] = Math.min(255, Math.max(0, val));
          }
        }
      }
      hdCtx.putImageData(imageData, 0, 0);

      // Convert to high-quality PNG
      const hdUrl = hdCanvas.toDataURL("image/png", 1.0);
      setOriginalHdUrl(hdUrl);
      onImageUpload(file);

      // Process the image based on selected type
      const processedImageUrl = await processImage(file, {
        type: imageType as ProcessingType,
        detailLevel,
        colorCount: 8, // This could be made configurable
      });

      setConvertedImage(processedImageUrl);

      // Initialize the canvas with the processed image
      const processedImg = new Image();
      processedImg.onload = () => {
        if (convertedCanvasRef.current) {
          const ctx = convertedCanvasRef.current.getContext("2d");
          if (ctx) {
            convertedCanvasRef.current.width = processedImg.width;
            convertedCanvasRef.current.height = processedImg.height;
            ctx.drawImage(processedImg, 0, 0);
          }
        }
      };
      processedImg.src = processedImageUrl;
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processAndUploadImage(files[0]);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-lg space-y-6">
      <InteractiveControls
        zoom={zoom}
        onZoomChange={setZoom}
        onReset={() => setZoom(1)}
        canvas={convertedCanvasRef.current}
        regions={[]}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolChange={setCurrentTool}
        currentTool={currentTool}
      />
      <ImageTypeSelector
        selectedType={imageType}
        onTypeSelect={(type) => {
          setImageType(type);
          // Reprocess the image if we have one
          if (originalImage) {
            fetch(originalImage)
              .then((res) => res.blob())
              .then((blob) =>
                processAndUploadImage(
                  new File([blob], "image.png", { type: "image/png" }),
                ),
              );
          }
        }}
        detailLevel={detailLevel}
        onDetailLevelChange={(level) => {
          setDetailLevel(level);
          // Reprocess the image if we have one
          if (originalImage) {
            fetch(originalImage)
              .then((res) => res.blob())
              .then((blob) =>
                processAndUploadImage(
                  new File([blob], "image.png", { type: "image/png" }),
                ),
              );
          }
        }}
      />
      <div className="flex h-[500px] gap-6">
        {/* Left side - Original Image */}
        <Card className="flex-1 p-4 relative">
          {originalImage ? (
            <img
              src={originalHdUrl || originalImage}
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
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={
                showContours ? "bg-primary text-primary-foreground" : ""
              }
              onClick={() => {
                setShowContours(!showContours);
                if (convertedCanvasRef.current && convertedImage) {
                  const ctx = convertedCanvasRef.current.getContext("2d");
                  if (ctx) {
                    if (!showContours) {
                      // Apply contours
                      const img = new Image();
                      img.onload = () => {
                        convertedCanvasRef.current!.width = img.width;
                        convertedCanvasRef.current!.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        applyContourOverlay(convertedCanvasRef.current!);
                      };
                      img.src = convertedImage;
                    } else {
                      // Remove contours (restore original)
                      const img = new Image();
                      img.onload = () => {
                        convertedCanvasRef.current!.width = img.width;
                        convertedCanvasRef.current!.height = img.height;
                        ctx.drawImage(img, 0, 0);
                      };
                      img.src = convertedImage;
                    }
                  }
                }
              }}
            >
              <BoxSelect className="w-4 h-4 mr-1" />
              {showContours ? "Hide Contours" : "Show Contours"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={
                showStrokes ? "bg-primary text-primary-foreground" : ""
              }
              onClick={() => {
                setShowStrokes(!showStrokes);
                if (convertedCanvasRef.current && convertedImage) {
                  const ctx = convertedCanvasRef.current.getContext("2d");
                  if (ctx) {
                    if (!showStrokes) {
                      // Apply strokes
                      const img = new Image();
                      img.onload = () => {
                        convertedCanvasRef.current!.width = img.width;
                        convertedCanvasRef.current!.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        applyStrokeOverlay(
                          convertedCanvasRef.current!,
                          strokeOptions,
                        );
                      };
                      img.src = convertedImage;
                    } else {
                      // Remove strokes (restore original)
                      const img = new Image();
                      img.onload = () => {
                        convertedCanvasRef.current!.width = img.width;
                        convertedCanvasRef.current!.height = img.height;
                        ctx.drawImage(img, 0, 0);
                      };
                      img.src = convertedImage;
                    }
                  }
                }
              }}
            >
              <Layers className="w-4 h-4 mr-1" />
              {showStrokes ? "Hide Strokes" : "Show Strokes"}
            </Button>
          </div>
          {convertedImage ? (
            <div className="relative w-full h-full">
              <canvas
                ref={convertedCanvasRef}
                className="w-full h-full object-contain"
              />
            </div>
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
  );
};

export default ImageUploadZone;
