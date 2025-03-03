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
 * Process image with Centerline mode - Vector lines along shape centers
 */
export function processCenterlineMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Clear canvas and set transparent background
  ctx.clearRect(0, 0, width, height);

  // Create output data with transparency
  const outputData = new Uint8ClampedArray(data.length);

  // Parameters for centerline detection
  const threshold = 15; // Lower threshold for more sensitive line detection

  // First pass: Convert to grayscale and detect edges
  const edges = new Uint8ClampedArray(data.length / 4);
  const edgePixels = new Set<number>();

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const pixelIdx = y * width + x;

      // Convert to grayscale
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

      // Calculate gradient using Sobel
      let gx = 0;
      let gy = 0;

      // 3x3 Sobel kernels
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nIdx = ((y + i) * width + (x + j)) * 4;
          const nGray = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;

          // Sobel weights
          const sx = j * (i === 0 ? 2 : 1);
          const sy = i * (j === 0 ? 2 : 1);

          gx += nGray * sx;
          gy += nGray * sy;
        }
      }

      // Calculate gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      if (magnitude > threshold) {
        edges[pixelIdx] = 1;
        edgePixels.add(pixelIdx);
      } else {
        edges[pixelIdx] = 0;
      }
    }
  }

  // Second pass: Find centerlines
  const centerlinePixels = new Set<number>();
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const pixelIdx = y * width + x;
      const idx = pixelIdx * 4;

      if (edges[pixelIdx]) {
        // Check if this is a centerline pixel
        let isCenterline = true;

        // Check perpendicular directions
        for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);

          // Check points on both sides
          const p1 = edges[Math.round(y + dy) * width + Math.round(x + dx)];
          const p2 = edges[Math.round(y - dy) * width + Math.round(x - dx)];

          if (p1 && p2) {
            isCenterline = false;
            break;
          }
        }

        if (isCenterline) {
          centerlinePixels.add(pixelIdx);
          // Keep original color for centerline
          outputData[idx] = data[idx];
          outputData[idx + 1] = data[idx + 1];
          outputData[idx + 2] = data[idx + 2];
          outputData[idx + 3] = 255;
        }
      }
    }
  }

  // Third pass: Connect broken centerlines
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const pixelIdx = y * width + x;
      const idx = pixelIdx * 4;

      // Skip if already a centerline pixel
      if (centerlinePixels.has(pixelIdx)) continue;

      // Check if this pixel would connect two centerline segments
      // Look for centerline pixels that are 2-3 pixels apart
      const directions = [
        // Horizontal
        [-2, 0, 2, 0],
        [-3, 0, 3, 0],
        // Vertical
        [0, -2, 0, 2],
        [0, -3, 0, 3],
        // Diagonal
        [-2, -2, 2, 2],
        [-3, -3, 3, 3],
        [-2, 2, 2, -2],
        [-3, 3, 3, -3],
      ];

      for (const [dx1, dy1, dx2, dy2] of directions) {
        const p1 = (y + dy1) * width + (x + dx1);
        const p2 = (y + dy2) * width + (x + dx2);

        // Check if both points are valid centerline pixels
        if (centerlinePixels.has(p1) && centerlinePixels.has(p2)) {
          // Connect the gap
          const idx1 = p1 * 4;
          const idx2 = p2 * 4;

          // Use average color of the two centerline pixels
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
