/**
 * Process image with Heavy Stroke mode - Thick colored outlines with transparent background
 */
export function processHeavyStrokeMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Create output canvas with transparent background
  ctx.clearRect(0, 0, width, height);

  // Extract dominant colors
  const colorMap = new Map<string, { color: number[]; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, {
        color: [r, g, b],
        count: 1,
      });
    } else {
      colorMap.get(key)!.count++;
    }
  }

  // Sort colors by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 32)
    .map(([_, value]) => value.color);

  // For each color, create a stroke layer
  sortedColors.forEach((color) => {
    const strokeCanvas = document.createElement("canvas");
    strokeCanvas.width = width;
    strokeCanvas.height = height;
    const strokeCtx = strokeCanvas.getContext("2d")!;

    // Find edges for this color
    const edgeData = new Uint8ClampedArray(data.length);

    // First pass: Identify edge pixels
    const edgePixels = new Set<number>();
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const pixelIdx = y * width + x;
        const isColorMatch =
          Math.abs(data[idx] - color[0]) < 30 &&
          Math.abs(data[idx + 1] - color[1]) < 30 &&
          Math.abs(data[idx + 2] - color[2]) < 30;

        if (isColorMatch) {
          // Check neighbors for edges
          const hasEdge = [-1, 0, 1].some((dy) =>
            [-1, 0, 1].some((dx) => {
              if (dx === 0 && dy === 0) return false;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              return !(
                Math.abs(data[nIdx] - color[0]) < 30 &&
                Math.abs(data[nIdx + 1] - color[1]) < 30 &&
                Math.abs(data[nIdx + 2] - color[2]) < 30
              );
            }),
          );

          if (hasEdge) {
            edgePixels.add(pixelIdx);
            edgeData[idx] = color[0];
            edgeData[idx + 1] = color[1];
            edgeData[idx + 2] = color[2];
            edgeData[idx + 3] = 255;
          }
        }
      }
    }

    // Second pass: Fill gaps in the edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixelIdx = y * width + x;
        const idx = pixelIdx * 4;

        // Skip if already an edge pixel
        if (edgePixels.has(pixelIdx)) continue;

        // Check if this pixel is between two edge pixels (horizontally, vertically, or diagonally)
        const neighbors = [
          // Horizontal gap
          [x - 1, y, x + 1, y],
          // Vertical gap
          [x, y - 1, x, y + 1],
          // Diagonal gaps
          [x - 1, y - 1, x + 1, y + 1],
          [x + 1, y - 1, x - 1, y + 1],
        ];

        for (const [x1, y1, x2, y2] of neighbors) {
          const p1 = y1 * width + x1;
          const p2 = y2 * width + x2;

          if (edgePixels.has(p1) && edgePixels.has(p2)) {
            // Fill the gap
            edgeData[idx] = color[0];
            edgeData[idx + 1] = color[1];
            edgeData[idx + 2] = color[2];
            edgeData[idx + 3] = 255;
            break;
          }
        }
      }
    }

    // Apply the stroke
    strokeCtx.putImageData(new ImageData(edgeData, width, height), 0, 0);

    // Draw stroke onto main canvas
    ctx.drawImage(strokeCanvas, 0, 0);
  });
}

/**
 * Process image with Medium Stroke mode - Medium-weight colored outlines with transparent background
 */
export function processMediumStrokeMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Clear canvas and set transparent background
  ctx.clearRect(0, 0, width, height);

  // Create output data with transparency
  const outputData = new Uint8ClampedArray(data.length);

  // Edge detection with medium thickness
  const threshold = 30;
  const strokeWidth = 2; // Medium stroke width

  // First pass: Identify edge pixels
  const edgePixels = new Set<number>();
  for (let y = strokeWidth; y < height - strokeWidth; y++) {
    for (let x = strokeWidth; x < width - strokeWidth; x++) {
      const idx = (y * width + x) * 4;
      const pixelIdx = y * width + x;

      // Check for edges with medium range
      let isEdge = false;
      for (let dy = -strokeWidth; dy <= strokeWidth; dy++) {
        for (let dx = -strokeWidth; dx <= strokeWidth; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const diff =
            Math.abs(data[idx] - data[nIdx]) +
            Math.abs(data[idx + 1] - data[nIdx + 1]) +
            Math.abs(data[idx + 2] - data[nIdx + 2]);

          if (diff > threshold) {
            isEdge = true;
            break;
          }
        }
        if (isEdge) break;
      }

      if (isEdge) {
        edgePixels.add(pixelIdx);
        // Keep original color for the edge
        outputData[idx] = data[idx];
        outputData[idx + 1] = data[idx + 1];
        outputData[idx + 2] = data[idx + 2];
        outputData[idx + 3] = 255; // Fully opaque
      }
    }
  }

  // Second pass: Fill gaps in the edges
  for (let y = strokeWidth; y < height - strokeWidth; y++) {
    for (let x = strokeWidth; x < width - strokeWidth; x++) {
      const pixelIdx = y * width + x;
      const idx = pixelIdx * 4;

      // Skip if already an edge pixel
      if (edgePixels.has(pixelIdx)) continue;

      // Check if this pixel is between two edge pixels (horizontally, vertically, or diagonally)
      const neighbors = [
        // Horizontal gap
        [x - 1, y, x + 1, y],
        // Vertical gap
        [x, y - 1, x, y + 1],
        // Diagonal gaps
        [x - 1, y - 1, x + 1, y + 1],
        [x + 1, y - 1, x - 1, y + 1],
      ];

      for (const [x1, y1, x2, y2] of neighbors) {
        const p1 = y1 * width + x1;
        const p2 = y2 * width + x2;

        if (edgePixels.has(p1) && edgePixels.has(p2)) {
          // Fill the gap with average color of the two edge pixels
          const idx1 = p1 * 4;
          const idx2 = p2 * 4;

          outputData[idx] = Math.round((data[idx1] + data[idx2]) / 2);
          outputData[idx + 1] = Math.round(
            (data[idx1 + 1] + data[idx2 + 1]) / 2,
          );
          outputData[idx + 2] = Math.round(
            (data[idx1 + 2] + data[idx2 + 2]) / 2,
          );
          outputData[idx + 3] = 255;
          break;
        }
      }
    }
  }

  // Apply the result
  ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
}

/**
 * Process image with Thin Stroke mode - Fine colored outlines with transparent background
 */
export function processThinStrokeMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Clear canvas and set transparent background
  ctx.clearRect(0, 0, width, height);

  // Create output data with transparency
  const outputData = new Uint8ClampedArray(data.length);

  // Edge detection with thin lines
  const threshold = 20; // Lower threshold for more sensitive edge detection

  // First pass: Detect edges
  const edgePixels = new Set<number>();
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const pixelIdx = y * width + x;

      // Sobel operator for edge detection
      let gx = 0;
      let gy = 0;

      // Calculate gradient
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nIdx = ((y + i) * width + (x + j)) * 4;
          const val = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;

          gx += val * (j * (i === 0 ? 2 : 1));
          gy += val * (i * (j === 0 ? 2 : 1));
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      if (magnitude > threshold) {
        edgePixels.add(pixelIdx);
        outputData[idx] = data[idx];
        outputData[idx + 1] = data[idx + 1];
        outputData[idx + 2] = data[idx + 2];
        outputData[idx + 3] = 255;
      }
    }
  }

  // Second pass: Connect broken lines
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIdx = y * width + x;
      const idx = pixelIdx * 4;

      // Skip if already an edge pixel
      if (edgePixels.has(pixelIdx)) continue;

      // Check for nearby edge pixels that should be connected
      // Look for edge pixels that are 1-2 pixels apart
      const directions = [
        // Horizontal
        [-2, 0, -1, 0],
        [-1, 0, 1, 0],
        [1, 0, 2, 0],
        // Vertical
        [0, -2, 0, -1],
        [0, -1, 0, 1],
        [0, 1, 0, 2],
        // Diagonal
        [-2, -2, -1, -1],
        [-1, -1, 1, 1],
        [1, 1, 2, 2],
        [-2, 2, -1, 1],
        [-1, 1, 1, -1],
        [1, -1, 2, -2],
      ];

      for (const [dx1, dy1, dx2, dy2] of directions) {
        const p1 = (y + dy1) * width + (x + dx1);
        const p2 = (y + dy2) * width + (x + dx2);

        // Check if both points are valid edge pixels
        if (edgePixels.has(p1) && edgePixels.has(p2)) {
          // Connect the gap
          const idx1 = p1 * 4;
          const idx2 = p2 * 4;

          // Use average color of the two edge pixels
          outputData[idx] = Math.round((data[idx1] + data[idx2]) / 2);
          outputData[idx + 1] = Math.round(
            (data[idx1 + 1] + data[idx2 + 1]) / 2,
          );
          outputData[idx + 2] = Math.round(
            (data[idx1 + 2] + data[idx2 + 2]) / 2,
          );
          outputData[idx + 3] = 255;
          break;
        }
      }
    }
  }

  // Apply the result
  ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
}

/**
 * Process image with Centerline mode - Creates a paint-by-numbers style output with contours
 */
export function processCenterlineMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Create a temporary canvas for the paint-by-numbers effect
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Fill with white background
  tempCtx.fillStyle = "#FFFFFF";
  tempCtx.fillRect(0, 0, width, height);

  // Step 1: Quantize colors
  const colorMap = new Map<string, { color: number[]; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, {
        color: [r, g, b],
        count: 1,
      });
    } else {
      colorMap.get(key)!.count++;
    }
  }

  // Step 2: Sort colors by frequency and take top N colors
  // Get the color count from the ColorControlPanel if available
  let colorCount = 32; // Default
  const colorCountElement = document.querySelector("[data-color-count]");
  if (colorCountElement) {
    const count = parseInt(
      colorCountElement.getAttribute("data-color-count") || "32",
    );
    if (!isNaN(count)) {
      colorCount = count;
    }
  }

  // Make sure the color guide reflects the selected number of colors
  colorCount = Math.min(colorCount, 32); // Cap at 32 for performance

  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, colorCount)
    .map(([_, value]) => value.color);

  // Step 3: Create regions for each color
  const regions = new Map<string, Set<number>>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let minDist = Infinity;
      let closestColor = sortedColors[0];

      // Find the closest color
      for (const color of sortedColors) {
        const dist = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2),
        );
        if (dist < minDist) {
          minDist = dist;
          closestColor = color;
        }
      }

      // Add pixel to region
      const colorKey = closestColor.join(",");
      if (!regions.has(colorKey)) {
        regions.set(colorKey, new Set());
      }
      regions.get(colorKey)!.add(y * width + x);
    }
  }

  // Step 4: Draw only the contours between regions (no fill)
  const outlineData = new Uint8ClampedArray(width * height * 4).fill(0);

  // For each pixel, check if it's on the boundary between regions
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIdx = y * width + x;
      const pixelColorKey = getColorKeyForPixel(pixelIdx, regions);

      // Check if any neighboring pixel belongs to a different region
      const hasEdge = [-1, 0, 1].some((dy) =>
        [-1, 0, 1].some((dx) => {
          if (dx === 0 && dy === 0) return false;
          const neighborIdx = (y + dy) * width + (x + dx);
          const neighborColorKey = getColorKeyForPixel(neighborIdx, regions);
          return pixelColorKey !== neighborColorKey;
        }),
      );

      if (hasEdge) {
        // Draw black outline
        const idx = pixelIdx * 4;
        outlineData[idx] = 0; // Black
        outlineData[idx + 1] = 0;
        outlineData[idx + 2] = 0;
        outlineData[idx + 3] = 255; // Fully opaque
      }
    }
  }

  // Step 5: Add numbers to each region
  let regionId = 1;
  for (const [colorKey, pixels] of regions.entries()) {
    if (pixels.size < 50) continue; // Skip very small regions

    // Find center of region
    let sumX = 0,
      sumY = 0;
    pixels.forEach((pixel) => {
      sumX += pixel % width;
      sumY += Math.floor(pixel / width);
    });

    const centerX = Math.round(sumX / pixels.size);
    const centerY = Math.round(sumY / pixels.size);

    // Calculate font size based on region size
    const regionArea = pixels.size;
    const regionWidth = Math.sqrt(regionArea);
    const fontSize = Math.max(12, Math.min(24, Math.floor(regionWidth / 4)));

    // Draw number with white outline for better visibility
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";

    // Draw text outline
    tempCtx.strokeStyle = "white";
    tempCtx.lineWidth = 3;
    tempCtx.strokeText(regionId.toString(), centerX, centerY);

    // Draw text fill
    tempCtx.fillStyle = "#000000";
    tempCtx.fillText(regionId.toString(), centerX, centerY);

    // Store the color mapping for the legend
    const colorRgb = colorKey.split(",").map(Number);
    const colorHex = `#${colorRgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

    regionId++;
  }

  // Draw outlines on top
  tempCtx.putImageData(new ImageData(outlineData, width, height), 0, 0);

  // Add color legend at the bottom
  const legendHeight = 80;
  const legendPadding = 10;
  const swatchSize = 20;
  const swatchGap = 10;

  // Extend canvas to accommodate legend
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = width;
  finalCanvas.height = height + legendHeight;
  const finalCtx = finalCanvas.getContext("2d")!;

  // Fill with white background
  finalCtx.fillStyle = "#FFFFFF";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  // Draw the paint-by-numbers image
  finalCtx.drawImage(tempCanvas, 0, 0);

  // Draw legend title
  finalCtx.font = "bold 14px Arial";
  finalCtx.fillStyle = "#000000";
  finalCtx.textAlign = "left";
  finalCtx.fillText("Color Guide:", legendPadding, height + 20);

  // Draw color swatches with numbers
  let xPos = legendPadding;
  let yPos = height + 40;
  let count = 0;

  for (const [colorKey, pixels] of regions.entries()) {
    if (pixels.size < 50) continue; // Skip very small regions
    count++;

    // Check if we need to wrap to next row
    if (xPos + swatchSize + 40 > width) {
      xPos = legendPadding;
      yPos += swatchSize + swatchGap;
    }

    // Draw color swatch
    const colorRgb = colorKey.split(",").map(Number);
    finalCtx.fillStyle = `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`;
    finalCtx.fillRect(xPos, yPos, swatchSize, swatchSize);

    // Draw swatch outline
    finalCtx.strokeStyle = "#000000";
    finalCtx.lineWidth = 1;
    finalCtx.strokeRect(xPos, yPos, swatchSize, swatchSize);

    // Draw number
    finalCtx.font = "12px Arial";
    finalCtx.fillStyle = "#000000";
    finalCtx.textAlign = "left";
    finalCtx.fillText(count.toString(), xPos + swatchSize + 5, yPos + 15);

    xPos += swatchSize + 40;
  }

  // Copy result to original context
  ctx.clearRect(0, 0, width, height);
  ctx.canvas.width = finalCanvas.width;
  ctx.canvas.height = finalCanvas.height;
  ctx.drawImage(finalCanvas, 0, 0);
}

/**
 * Process image with Enhanced Outline mode - Clean, anti-aliased outlines
 */
export function processEnhancedOutlineMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Clear canvas and set transparent background
  ctx.clearRect(0, 0, width, height);

  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Apply Gaussian blur for smoother edges
  tempCtx.filter = "blur(0.5px)";
  tempCtx.drawImage(tempCanvas, 0, 0);
  tempCtx.filter = "none";

  // Get blurred image data
  const blurredData = tempCtx.getImageData(0, 0, width, height).data;

  // Create output data with transparency
  const outputData = new Uint8ClampedArray(data.length);

  // Canny-like edge detection
  // 1. Calculate gradients
  const gradientMagnitude = new Float32Array(width * height);
  const gradientDirection = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;

      // Sobel operators
      let gx = 0,
        gy = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nIdx = ((y + i) * width + (x + j)) * 4;
          const val =
            (blurredData[nIdx] +
              blurredData[nIdx + 1] +
              blurredData[nIdx + 2]) /
            3;

          // Sobel weights
          const sx = j * (i === 0 ? 2 : 1);
          const sy = i * (j === 0 ? 2 : 1);

          gx += val * sx;
          gy += val * sy;
        }
      }

      // Calculate magnitude and direction
      gradientMagnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      gradientDirection[idx] = Math.atan2(gy, gx);
    }
  }

  // 2. Non-maximum suppression
  const threshold = 25;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;

      if (gradientMagnitude[idx] < threshold) continue;

      // Get gradient direction (0, 45, 90, or 135 degrees)
      const direction =
        (Math.round((gradientDirection[idx] * 4) / Math.PI) + 4) % 4;

      // Check neighbors along gradient direction
      let neighbor1Idx, neighbor2Idx;

      switch (direction) {
        case 0: // 0 degrees (horizontal)
          neighbor1Idx = idx - 1;
          neighbor2Idx = idx + 1;
          break;
        case 1: // 45 degrees (diagonal)
          neighbor1Idx = (y - 1) * width + (x + 1);
          neighbor2Idx = (y + 1) * width + (x - 1);
          break;
        case 2: // 90 degrees (vertical)
          neighbor1Idx = (y - 1) * width + x;
          neighbor2Idx = (y + 1) * width + x;
          break;
        case 3: // 135 degrees (diagonal)
          neighbor1Idx = (y - 1) * width + (x - 1);
          neighbor2Idx = (y + 1) * width + (x + 1);
          break;
      }

      // Suppress non-maximum pixels
      if (
        gradientMagnitude[idx] >= gradientMagnitude[neighbor1Idx] &&
        gradientMagnitude[idx] >= gradientMagnitude[neighbor2Idx]
      ) {
        // Keep original color for the edge
        outputData[pixelIdx] = data[pixelIdx];
        outputData[pixelIdx + 1] = data[pixelIdx + 1];
        outputData[pixelIdx + 2] = data[pixelIdx + 2];
        outputData[pixelIdx + 3] = 255;
      }
    }
  }

  // Apply the result
  ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
}

/**
 * Process image with Cartoon Outline mode - Bold, comic-style outlines
 */
export function processCartoonOutlineMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Clear canvas and set transparent background
  ctx.clearRect(0, 0, width, height);

  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  // First pass: Simplify colors (posterize)
  const posterizedData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    posterizedData[i] = Math.round(data[i] / 64) * 64;
    posterizedData[i + 1] = Math.round(data[i + 1] / 64) * 64;
    posterizedData[i + 2] = Math.round(data[i + 2] / 64) * 64;
    posterizedData[i + 3] = data[i + 3];
  }

  tempCtx.putImageData(new ImageData(posterizedData, width, height), 0, 0);

  // Second pass: Find edges between color regions
  const outputData = new Uint8ClampedArray(data.length);
  const threshold = 10;
  const strokeWidth = 3; // Bold cartoon-like strokes

  for (let y = strokeWidth; y < height - strokeWidth; y++) {
    for (let x = strokeWidth; x < width - strokeWidth; x++) {
      const idx = (y * width + x) * 4;

      // Check for significant color changes in neighborhood
      let isEdge = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const colorDiff =
            Math.abs(posterizedData[idx] - posterizedData[nIdx]) +
            Math.abs(posterizedData[idx + 1] - posterizedData[nIdx + 1]) +
            Math.abs(posterizedData[idx + 2] - posterizedData[nIdx + 2]);

          if (colorDiff > threshold) {
            isEdge = true;
            break;
          }
        }
        if (isEdge) break;
      }

      if (isEdge) {
        // Create bold black outline
        for (let dy = -strokeWidth; dy <= strokeWidth; dy++) {
          for (let dx = -strokeWidth; dx <= strokeWidth; dx++) {
            if (dx * dx + dy * dy <= strokeWidth * strokeWidth) {
              const outIdx = ((y + dy) * width + (x + dx)) * 4;
              if (outIdx >= 0 && outIdx < outputData.length - 3) {
                outputData[outIdx] = 0; // Black outline
                outputData[outIdx + 1] = 0;
                outputData[outIdx + 2] = 0;
                outputData[outIdx + 3] = 255;
              }
            }
          }
        }
      }
    }
  }

  // Apply the result
  ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
}

/**
 * Process image with Single mode - Creates a paint-by-numbers style output
 * with white background, black outlines, and numbered regions
 */
export function processSingleMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Create a temporary canvas for the paint-by-numbers effect
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Fill with white background
  tempCtx.fillStyle = "#FFFFFF";
  tempCtx.fillRect(0, 0, width, height);

  // Step 1: Quantize colors
  const colorMap = new Map<string, { color: number[]; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;

    if (!colorMap.has(key)) {
      colorMap.set(key, {
        color: [r, g, b],
        count: 1,
      });
    } else {
      colorMap.get(key)!.count++;
    }
  }

  // Step 2: Sort colors by frequency and take top N colors
  // Get the color count from the ColorControlPanel if available
  let colorCount = 32; // Default
  const colorCountElement = document.querySelector("[data-color-count]");
  if (colorCountElement) {
    const count = parseInt(
      colorCountElement.getAttribute("data-color-count") || "32",
    );
    if (!isNaN(count)) {
      colorCount = count;
    }
  }

  // Make sure the color guide reflects the selected number of colors
  colorCount = Math.min(colorCount, 32); // Cap at 32 for performance

  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, colorCount)
    .map(([_, value]) => value.color);

  // Step 3: Create regions for each color
  const regions = new Map<string, Set<number>>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let minDist = Infinity;
      let closestColor = sortedColors[0];

      // Find the closest color
      for (const color of sortedColors) {
        const dist = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2),
        );
        if (dist < minDist) {
          minDist = dist;
          closestColor = color;
        }
      }

      // Add pixel to region
      const colorKey = closestColor.join(",");
      if (!regions.has(colorKey)) {
        regions.set(colorKey, new Set());
      }
      regions.get(colorKey)!.add(y * width + x);
    }
  }

  // Step 4: Draw black outlines between regions with consistent thickness
  const outlineData = new Uint8ClampedArray(width * height * 4).fill(0);

  // Set a fixed outline thickness of 0.5 for all outlines
  const outlineThickness = 0.5;

  // Use a fixed pixel thickness for all outlines to ensure consistency
  const pixelThickness = 1; // Always use 1 pixel for consistent thin lines

  // First pass: Identify all edge pixels
  const edgePixels = new Set<number>();
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIdx = y * width + x;
      const pixelColorKey = getColorKeyForPixel(pixelIdx, regions);

      // Check if any neighboring pixel belongs to a different region
      const hasEdge = [-1, 0, 1].some((dy) =>
        [-1, 0, 1].some((dx) => {
          if (dx === 0 && dy === 0) return false;
          const neighborIdx = (y + dy) * width + (x + dx);
          const neighborColorKey = getColorKeyForPixel(neighborIdx, regions);
          return pixelColorKey !== neighborColorKey;
        }),
      );

      if (hasEdge) {
        edgePixels.add(pixelIdx);
      }
    }
  }

  // Second pass: Draw all edges with exactly the same thickness
  for (const pixelIdx of edgePixels) {
    const y = Math.floor(pixelIdx / width);
    const x = pixelIdx % width;
    const idx = pixelIdx * 4;

    // Draw the edge pixel itself
    outlineData[idx] = 0; // Black
    outlineData[idx + 1] = 0;
    outlineData[idx + 2] = 0;
    outlineData[idx + 3] = 255; // Fully opaque
  }

  // Step 5: Add numbers to each region
  let regionId = 1;
  for (const [colorKey, pixels] of regions.entries()) {
    if (pixels.size < 50) continue; // Skip very small regions

    // Find center of region
    let sumX = 0,
      sumY = 0;
    pixels.forEach((pixel) => {
      sumX += pixel % width;
      sumY += Math.floor(pixel / width);
    });

    const centerX = Math.round(sumX / pixels.size);
    const centerY = Math.round(sumY / pixels.size);

    // Calculate font size based on region size
    const regionArea = pixels.size;
    const regionWidth = Math.sqrt(regionArea);
    const fontSize = Math.max(12, Math.min(24, Math.floor(regionWidth / 4)));

    // Draw number with white outline for better visibility
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";

    // Draw text outline
    tempCtx.strokeStyle = "white";
    tempCtx.lineWidth = 3;
    tempCtx.strokeText(regionId.toString(), centerX, centerY);

    // Draw text fill
    tempCtx.fillStyle = "#000000";
    tempCtx.fillText(regionId.toString(), centerX, centerY);

    // Store the color mapping for the legend
    const colorRgb = colorKey.split(",").map(Number);
    const colorHex = `#${colorRgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

    regionId++;
  }

  // Draw outlines on top
  tempCtx.putImageData(new ImageData(outlineData, width, height), 0, 0);

  // Add color legend at the bottom
  const legendHeight = 80;
  const legendPadding = 10;
  const swatchSize = 20;
  const swatchGap = 10;

  // Extend canvas to accommodate legend
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = width;
  finalCanvas.height = height + legendHeight;
  const finalCtx = finalCanvas.getContext("2d")!;

  // Fill with white background
  finalCtx.fillStyle = "#FFFFFF";
  finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

  // Draw the paint-by-numbers image
  finalCtx.drawImage(tempCanvas, 0, 0);

  // Draw legend title
  finalCtx.font = "bold 14px Arial";
  finalCtx.fillStyle = "#000000";
  finalCtx.textAlign = "left";
  finalCtx.fillText("Color Guide:", legendPadding, height + 20);

  // Draw color swatches with numbers
  let xPos = legendPadding;
  let yPos = height + 40;
  let count = 0;

  for (const [colorKey, pixels] of regions.entries()) {
    if (pixels.size < 50) continue; // Skip very small regions
    count++;

    // Check if we need to wrap to next row
    if (xPos + swatchSize + 40 > width) {
      xPos = legendPadding;
      yPos += swatchSize + swatchGap;
    }

    // Draw color swatch
    const colorRgb = colorKey.split(",").map(Number);
    finalCtx.fillStyle = `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`;
    finalCtx.fillRect(xPos, yPos, swatchSize, swatchSize);

    // Draw swatch outline
    finalCtx.strokeStyle = "#000000";
    finalCtx.lineWidth = 1;
    finalCtx.strokeRect(xPos, yPos, swatchSize, swatchSize);

    // Draw number
    finalCtx.font = "12px Arial";
    finalCtx.fillStyle = "#000000";
    finalCtx.textAlign = "left";
    finalCtx.fillText(count.toString(), xPos + swatchSize + 5, yPos + 15);

    xPos += swatchSize + 40;
  }

  // Copy result to original context
  ctx.clearRect(0, 0, width, height);
  ctx.canvas.width = finalCanvas.width;
  ctx.canvas.height = finalCanvas.height;
  ctx.drawImage(finalCanvas, 0, 0);
}

// Helper function to find which region a pixel belongs to
function getColorKeyForPixel(
  pixelIdx: number,
  regions: Map<string, Set<number>>,
): string | null {
  for (const [colorKey, pixels] of regions.entries()) {
    if (pixels.has(pixelIdx)) {
      return colorKey;
    }
  }
  return null;
}
