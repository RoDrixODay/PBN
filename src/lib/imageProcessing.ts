export type ProcessingType =
  | "photo"
  | "clipart"
  | "sketch"
  | "drawing"
  | "filled"
  | "stroked";

interface ProcessImageOptions {
  type: ProcessingType;
  detailLevel?: number; // 7 (Maximum) to 1 (Minimum)
  colorCount?: number;
}

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const processPhoto = (ctx: CanvasRenderingContext2D, detailLevel: number) => {
  // Map detail level 7-1 to processing parameters
  const normalizedLevel = (detailLevel - 1) / 6; // 0 to 1

  // Parameters increase with detail level
  const contrast = 1 + normalizedLevel * 1.5; // 1.0 to 2.5
  const saturation = 1 + normalizedLevel * 1.0; // 1.0 to 2.0
  const sharpness = 0.5 + normalizedLevel * 2.5; // 0.5 to 3.0
  const brightness = 1 + normalizedLevel * 0.3; // 1.0 to 1.3

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Apply contrast and brightness
    for (let j = 0; j < 3; j++) {
      data[i + j] = Math.min(
        255,
        Math.max(
          0,
          ((data[i + j] / 255 - 0.5) * contrast + 0.5) * 255 * brightness,
        ),
      );
    }

    // Apply saturation
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    for (let j = 0; j < 3; j++) {
      data[i + j] = Math.min(
        255,
        Math.max(0, avg + (data[i + j] - avg) * saturation),
      );
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply sharpening
  if (sharpness > 0.5) {
    ctx.filter = `contrast(${100 + sharpness * 30}%) brightness(${100 + sharpness * 10}%)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = "none";
  }
};

const processClipart = (ctx: CanvasRenderingContext2D, detailLevel: number) => {
  // Map detail levels to color counts
  const colorCounts = {
    7: 64, // Maximum
    6: 32, // Ultra
    5: 16, // Very High
    4: 12, // High
    3: 8, // Medium
    2: 6, // Low
    1: 4, // Minimum
  };

  const colorCount = colorCounts[detailLevel as keyof typeof colorCounts];
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  // Create color buckets for quantization
  const colorBuckets: { [key: string]: { color: number[]; count: number } } =
    {};

  // First pass: collect colors and their frequencies
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / (256 / colorCount)) * (256 / colorCount);
    const g = Math.round(data[i + 1] / (256 / colorCount)) * (256 / colorCount);
    const b = Math.round(data[i + 2] / (256 / colorCount)) * (256 / colorCount);
    const key = `${r},${g},${b}`;

    if (!colorBuckets[key]) {
      colorBuckets[key] = { color: [r, g, b], count: 0 };
    }
    colorBuckets[key].count++;
  }

  // Get the most common colors
  const palette = Object.values(colorBuckets)
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount)
    .map((bucket) => bucket.color);

  // Second pass: map to nearest palette color
  for (let i = 0; i < data.length; i += 4) {
    let minDist = Infinity;
    let nearestColor = palette[0];

    for (const color of palette) {
      const dist = Math.sqrt(
        Math.pow(data[i] - color[0], 2) +
          Math.pow(data[i + 1] - color[1], 2) +
          Math.pow(data[i + 2] - color[2], 2),
      );

      if (dist < minDist) {
        minDist = dist;
        nearestColor = color;
      }
    }

    data[i] = nearestColor[0];
    data[i + 1] = nearestColor[1];
    data[i + 2] = nearestColor[2];
  }

  ctx.putImageData(imageData, 0, 0);
};

const processSketch = (ctx: CanvasRenderingContext2D, detailLevel: number) => {
  // Map detail level to processing parameters
  const normalizedLevel = (detailLevel - 1) / 6; // 0 to 1

  const contrast = 1 + normalizedLevel * 1.5; // 1.0 to 2.5
  const blurAmount = 2 - normalizedLevel * 1.8; // 2.0 to 0.2
  const edgeStrength = 50 + normalizedLevel * 150; // 50 to 200

  // Apply initial blur
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = "none";

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  // Convert to grayscale with enhanced contrast
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const enhanced = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
    data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, enhanced));
  }

  ctx.putImageData(imageData, 0, 0);

  // Apply edge enhancement
  ctx.filter = `contrast(${edgeStrength}%) brightness(110%)`;
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = "none";
};

const processDrawing = (ctx: CanvasRenderingContext2D, detailLevel: number) => {
  // Map detail level to processing parameters
  const normalizedLevel = (detailLevel - 1) / 6; // 0 to 1

  const threshold = 128 + normalizedLevel * 64; // 128 to 192
  const edgeSensitivity = 64 + normalizedLevel * 128; // 64 to 192
  const contrast = 1 + normalizedLevel; // 1.0 to 2.0

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // First pass: edge detection
  const edges = new Uint8ClampedArray(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Sobel operator
      const gx =
        -data[idx - 4 - width * 4] +
        data[idx + 4 - width * 4] +
        -2 * data[idx - 4] +
        2 * data[idx + 4] +
        -data[idx - 4 + width * 4] +
        data[idx + 4 + width * 4];

      const gy =
        -data[idx - width * 4 - 4] +
        -2 * data[idx - width * 4] +
        -data[idx - width * 4 + 4] +
        data[idx + width * 4 - 4] +
        2 * data[idx + width * 4] +
        data[idx + width * 4 + 4];

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[idx] =
        edges[idx + 1] =
        edges[idx + 2] =
          magnitude > edgeSensitivity ? 0 : 255;
      edges[idx + 3] = 255;
    }
  }

  // Apply edges with threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const isEdge = edges[i] === 0;
    const value = isEdge || gray < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);
};

interface UpscaleOptions {
  targetWidth?: number;
  targetHeight?: number;
  preserveAspectRatio?: boolean;
  quality?: "low" | "medium" | "high";
}

// Function to upscale image using high-quality interpolation
export const upscaleImage = async (
  sourceCanvas: HTMLCanvasElement,
  options: UpscaleOptions = {},
): Promise<HTMLCanvasElement> => {
  const {
    targetWidth = 1920,
    targetHeight = 1080,
    preserveAspectRatio = true,
    quality = "high",
  } = options;

  // Calculate dimensions maintaining aspect ratio if needed
  let finalWidth = targetWidth;
  let finalHeight = targetHeight;

  if (preserveAspectRatio) {
    const aspectRatio = sourceCanvas.width / sourceCanvas.height;
    if (targetWidth / targetHeight > aspectRatio) {
      finalWidth = Math.round(targetHeight * aspectRatio);
    } else {
      finalHeight = Math.round(targetWidth / aspectRatio);
    }
  }

  // Create intermediate canvas for multi-step upscaling
  const steps = quality === "high" ? 3 : quality === "medium" ? 2 : 1;
  let currentCanvas = sourceCanvas;

  for (let i = 0; i < steps; i++) {
    const stepCanvas = document.createElement("canvas");
    const stepCtx = stepCanvas.getContext("2d")!;

    // Calculate intermediate size
    const progress = (i + 1) / steps;
    const stepWidth = Math.round(
      sourceCanvas.width + (finalWidth - sourceCanvas.width) * progress,
    );
    const stepHeight = Math.round(
      sourceCanvas.height + (finalHeight - sourceCanvas.height) * progress,
    );

    stepCanvas.width = stepWidth;
    stepCanvas.height = stepHeight;

    // Apply high-quality interpolation
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = "high";

    // Draw with bicubic-like interpolation
    stepCtx.drawImage(currentCanvas, 0, 0, stepWidth, stepHeight);

    // Apply sharpening if needed
    if (quality === "high") {
      const imageData = stepCtx.getImageData(0, 0, stepWidth, stepHeight);
      applySharpening(imageData);
      stepCtx.putImageData(imageData, 0, 0);
    }

    currentCanvas = stepCanvas;
  }

  return currentCanvas;
};

// Helper function to apply sharpening
const applySharpening = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const sharpenMatrix = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  const tempData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let val = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pidx = ((y + ky) * width + (x + kx)) * 4 + c;
            val += tempData[pidx] * sharpenMatrix[(ky + 1) * 3 + (kx + 1)];
          }
        }
        data[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
};

export const processImage = async (
  file: File,
  options: ProcessImageOptions,
): Promise<string> => {
  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get canvas context");

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Apply processing based on type with detail level (default to Maximum - 7)
  const detailLevel = options.detailLevel || 7;

  const processFilledLayers = (
    ctx: CanvasRenderingContext2D,
    detailLevel: number,
  ) => {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Step 1: Extract unique colors and create color map
    const colorMap = new Map<string, { color: number[]; count: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${r},${g},${b}`;

      if (!colorMap.has(key)) {
        colorMap.set(key, { color: [r, g, b], count: 1 });
      } else {
        colorMap.get(key)!.count++;
      }
    }

    // Step 2: Sort colors by frequency
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 32) // Limit to top 32 colors
      .map(([_, value]) => value.color);

    // Step 3: Create separate layers for each color
    const layers: ImageData[] = [];
    sortedColors.forEach((color) => {
      const layerData = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        const isMatch =
          Math.abs(data[i] - color[0]) < 30 &&
          Math.abs(data[i + 1] - color[1]) < 30 &&
          Math.abs(data[i + 2] - color[2]) < 30;

        if (isMatch) {
          layerData[i] = color[0];
          layerData[i + 1] = color[1];
          layerData[i + 2] = color[2];
          layerData[i + 3] = 255; // Full opacity
        } else {
          layerData[i + 3] = 0; // Transparent
        }
      }
      layers.push(new ImageData(layerData, width, height));
    });

    // Step 4: Stack layers from bottom to top
    ctx.clearRect(0, 0, width, height);
    layers.forEach((layer) => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.putImageData(layer, 0, 0);

      // Use 'source-over' blending to stack layers
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(tempCanvas, 0, 0);
    });

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";
  };

  const processStrokedLayers = (
    ctx: CanvasRenderingContext2D,
    detailLevel: number,
  ) => {
    // Map detail level to processing parameters
    const normalizedLevel = (detailLevel - 1) / 6; // 0 to 1
    const edgeStrength = 50 + normalizedLevel * 150; // 50 to 200
    const strokeWidth = 1 + Math.floor(normalizedLevel * 3); // 1 to 4 pixels

    // First apply edge detection
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Create edge map
    const edges = new Uint8ClampedArray(data.length);
    for (let y = strokeWidth; y < height - strokeWidth; y++) {
      for (let x = strokeWidth; x < width - strokeWidth; x++) {
        const idx = (y * width + x) * 4;
        let maxDiff = 0;

        // Check surrounding pixels
        for (let dy = -strokeWidth; dy <= strokeWidth; dy++) {
          for (let dx = -strokeWidth; dx <= strokeWidth; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            const diff = Math.abs(data[idx] - data[neighborIdx]);
            maxDiff = Math.max(maxDiff, diff);
          }
        }

        edges[idx] =
          edges[idx + 1] =
          edges[idx + 2] =
            maxDiff > edgeStrength ? 0 : 255;
        edges[idx + 3] = 255;
      }
    }

    // Apply edges
    for (let i = 0; i < data.length; i += 4) {
      data[i] = edges[i];
      data[i + 1] = edges[i + 1];
      data[i + 2] = edges[i + 2];
    }

    ctx.putImageData(imageData, 0, 0);
  };

  switch (options.type) {
    case "photo":
      processPhoto(ctx, detailLevel);
      break;
    case "clipart":
      processClipart(ctx, detailLevel);
      break;
    case "sketch":
      processSketch(ctx, detailLevel);
      break;
    case "drawing":
      processDrawing(ctx, detailLevel);
      break;
    case "filled":
      processFilledLayers(ctx, detailLevel);
      break;
    case "stroked":
      processStrokedLayers(ctx, detailLevel);
      break;
  }

  return canvas.toDataURL("image/png");
};
