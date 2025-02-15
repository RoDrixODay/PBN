import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import ImageTypeSelector, { ImageType } from "./ImageTypeSelector";
import { processImage, ProcessingType } from "@/lib/imageProcessing";

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
      // Create URL for original image preview
      const originalUrl = URL.createObjectURL(file);
      onImageUpload(file);

      // Process the image based on selected type
      const processedImageUrl = await processImage(file, {
        type: imageType as ProcessingType,
        detailLevel,
        colorCount: 8, // This could be made configurable
      });

      setConvertedImage(processedImageUrl);
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
  );
};

export default ImageUploadZone;
