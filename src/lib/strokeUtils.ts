interface StrokeOptions {
  strokeColor?: string;
  strokeWidth?: number;
  smoothing?: number;
}

export const generateStrokes = (
  imageData: ImageData,
  options: StrokeOptions = {},
): ImageData => {
  const { strokeColor = "#000000", strokeWidth = 2, smoothing = 1 } = options;

  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const strokeData = new Uint8ClampedArray(data.length);

  // First pass: Quantize colors to create distinct regions
  const colorMap = new Map<string, number[]>();
  const quantizationLevel = 32; // Higher number means fewer distinct colors

  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / quantizationLevel) * quantizationLevel;
    const g = Math.round(data[i + 1] / quantizationLevel) * quantizationLevel;
    const b = Math.round(data[i + 2] / quantizationLevel) * quantizationLevel;
    const key = `${r},${g},${b}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, [r, g, b]);
    }
  }

  // Second pass: Detect edges between regions
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let isEdge = false;

      // Get current pixel's quantized color
      const currentR =
        Math.round(data[idx] / quantizationLevel) * quantizationLevel;
      const currentG =
        Math.round(data[idx + 1] / quantizationLevel) * quantizationLevel;
      const currentB =
        Math.round(data[idx + 2] / quantizationLevel) * quantizationLevel;

      // Check all 8 neighboring pixels
      const neighbors = [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ];

      for (const [dx, dy] of neighbors) {
        const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
        const neighborR =
          Math.round(data[neighborIdx] / quantizationLevel) * quantizationLevel;
        const neighborG =
          Math.round(data[neighborIdx + 1] / quantizationLevel) *
          quantizationLevel;
        const neighborB =
          Math.round(data[neighborIdx + 2] / quantizationLevel) *
          quantizationLevel;

        if (
          currentR !== neighborR ||
          currentG !== neighborG ||
          currentB !== neighborB
        ) {
          isEdge = true;
          break;
        }
      }

      if (isEdge) {
        // Convert stroke color to RGB
        const color = strokeColor.startsWith("#")
          ? hexToRgb(strokeColor)
          : { r: 0, g: 0, b: 0 };

        // Apply anti-aliased stroke
        for (let sy = -strokeWidth; sy <= strokeWidth; sy++) {
          for (let sx = -strokeWidth; sx <= strokeWidth; sx++) {
            const distance = Math.sqrt(sx * sx + sy * sy);
            if (distance <= strokeWidth) {
              const strokeIdx = ((y + sy) * width + (x + sx)) * 4;
              if (strokeIdx >= 0 && strokeIdx < strokeData.length - 3) {
                const alpha = Math.max(0, 1 - distance / strokeWidth);
                strokeData[strokeIdx] = color.r;
                strokeData[strokeIdx + 1] = color.g;
                strokeData[strokeIdx + 2] = color.b;
                strokeData[strokeIdx + 3] = Math.round(255 * alpha);
              }
            }
          }
        }
      }
    }
  }

  return new ImageData(strokeData, width, height);
};

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

// Function to generate contours from merged colors
export const generateContours = (imageData: ImageData): ImageData => {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const contourData = new Uint8ClampedArray(data.length);

  // First pass: merge similar colors
  const mergedData = new Uint8ClampedArray(data.length);
  const colorThreshold = 30; // Threshold for considering colors similar

  for (let i = 0; i < data.length; i += 4) {
    let similarFound = false;
    // Look back at previous pixels to find similar colors
    for (let j = Math.max(0, i - width * 4 * 5); j < i; j += 4) {
      const colorDiff = Math.sqrt(
        Math.pow(data[i] - data[j], 2) +
          Math.pow(data[i + 1] - data[j + 1], 2) +
          Math.pow(data[i + 2] - data[j + 2], 2),
      );
      if (colorDiff < colorThreshold) {
        mergedData[i] = mergedData[j];
        mergedData[i + 1] = mergedData[j + 1];
        mergedData[i + 2] = mergedData[j + 2];
        mergedData[i + 3] = 255;
        similarFound = true;
        break;
      }
    }
    if (!similarFound) {
      mergedData[i] = data[i];
      mergedData[i + 1] = data[i + 1];
      mergedData[i + 2] = data[i + 2];
      mergedData[i + 3] = 255;
    }
  }

  // Second pass: detect edges in merged colors
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      let isEdge = false;

      // Check all 8 neighboring pixels
      const neighbors = [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ];

      for (const [dx, dy] of neighbors) {
        const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
        const colorDiff = Math.sqrt(
          Math.pow(mergedData[idx] - mergedData[neighborIdx], 2) +
            Math.pow(mergedData[idx + 1] - mergedData[neighborIdx + 1], 2) +
            Math.pow(mergedData[idx + 2] - mergedData[neighborIdx + 2], 2),
        );

        if (colorDiff > 0) {
          isEdge = true;
          break;
        }
      }

      if (isEdge) {
        contourData[idx] = 0;
        contourData[idx + 1] = 0;
        contourData[idx + 2] = 0;
        contourData[idx + 3] = 255;
      } else {
        contourData[idx] = 255;
        contourData[idx + 1] = 255;
        contourData[idx + 2] = 255;
        contourData[idx + 3] = 0; // Transparent
      }
    }
  }

  return new ImageData(contourData, width, height);
};

// Function to apply contours as an overlay
export const applyContourOverlay = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const contourData = generateContours(imageData);

  // Create overlay canvas
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  const overlayCtx = overlayCanvas.getContext("2d")!;

  // Draw original image
  overlayCtx.drawImage(canvas, 0, 0);

  // Apply contours on top
  overlayCtx.putImageData(contourData, 0, 0);

  // Update original canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(overlayCanvas, 0, 0);

  return canvas;
};

// Function to apply strokes as an overlay
export const applyStrokeOverlay = (
  canvas: HTMLCanvasElement,
  options: StrokeOptions = {},
) => {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const strokeData = generateStrokes(imageData, options);

  // Create overlay canvas
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  const overlayCtx = overlayCanvas.getContext("2d")!;

  // Draw original image
  overlayCtx.drawImage(canvas, 0, 0);

  // Apply strokes on top
  const strokeImageData = new ImageData(
    strokeData.data,
    strokeData.width,
    strokeData.height,
  );

  // Create temporary canvas for stroke data
  const strokeCanvas = document.createElement("canvas");
  strokeCanvas.width = canvas.width;
  strokeCanvas.height = canvas.height;
  const strokeCtx = strokeCanvas.getContext("2d")!;
  strokeCtx.putImageData(strokeImageData, 0, 0);

  // Draw strokes with 'source-over' blend mode
  overlayCtx.globalCompositeOperation = "source-over";
  overlayCtx.drawImage(strokeCanvas, 0, 0);

  // Update original canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(overlayCanvas, 0, 0);

  return canvas;
};
