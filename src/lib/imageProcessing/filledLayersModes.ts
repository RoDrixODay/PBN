/**
 * Process image with Overlap mode - Stack colors in order of frequency
 */
export function processOverlapMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Extract and sort colors by frequency
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

  // Create and stack color layers
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 32)
    .map(([_, value]) => value.color);

  ctx.clearRect(0, 0, width, height);
  sortedColors.forEach((color) => {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerCtx = layerCanvas.getContext("2d")!;
    const layerData = ctx.createImageData(width, height);

    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - color[0]) < 30 &&
        Math.abs(data[i + 1] - color[1]) < 30 &&
        Math.abs(data[i + 2] - color[2]) < 30
      ) {
        layerData.data[i] = color[0];
        layerData.data[i + 1] = color[1];
        layerData.data[i + 2] = color[2];
        layerData.data[i + 3] = 255;
      }
    }

    layerCtx.putImageData(layerData, 0, 0);
    ctx.drawImage(layerCanvas, 0, 0);
  });
}

/**
 * Process image with Merge mode - Combine similar colors with increased tolerance
 */
export function processMergeMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Extract and sort colors with FULL overlap
  const colorMap = new Map<string, { color: number[]; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
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

  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 32)
    .map(([_, value]) => value.color);

  ctx.clearRect(0, 0, width, height);

  // Apply FULL overlap - larger tolerance and more aggressive merging
  sortedColors.forEach((color) => {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerCtx = layerCanvas.getContext("2d")!;
    const layerData = ctx.createImageData(width, height);

    for (let i = 0; i < data.length; i += 4) {
      // Increased color tolerance for more aggressive merging
      if (
        Math.abs(data[i] - color[0]) < 60 &&
        Math.abs(data[i + 1] - color[1]) < 60 &&
        Math.abs(data[i + 2] - color[2]) < 60
      ) {
        layerData.data[i] = color[0];
        layerData.data[i + 1] = color[1];
        layerData.data[i + 2] = color[2];
        layerData.data[i + 3] = 255;
      }
    }

    layerCtx.putImageData(layerData, 0, 0);
    ctx.drawImage(layerCanvas, 0, 0);
  });
}

/**
 * Process image with No Overlap mode - Vectorize with non-overlapping shapes
 */
export function processNoOverlapMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  // Step 1: Quantize colors and create initial regions
  const colorMap = new Map<string, { color: number[]; pixels: Set<number> }>();
  const minRegionSize = 100; // Minimum area of 10px²

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;

      if (!colorMap.has(key)) {
        colorMap.set(key, {
          color: [r, g, b],
          pixels: new Set([y * width + x]),
        });
      } else {
        colorMap.get(key)!.pixels.add(y * width + x);
      }
    }
  }

  // Step 2: Filter out small regions and merge them with neighbors
  const finalRegions = new Map<
    string,
    { color: number[]; pixels: Set<number> }
  >();
  for (const [key, region] of colorMap.entries()) {
    if (region.pixels.size >= minRegionSize) {
      finalRegions.set(key, region);
    } else {
      // Merge small regions with the most similar neighbor
      for (const pixel of region.pixels) {
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        let bestMatch = null;
        let minDiff = Infinity;

        // Check neighbors
        for (const [nKey, nRegion] of finalRegions.entries()) {
          const diff = Math.sqrt(
            Math.pow(region.color[0] - nRegion.color[0], 2) +
              Math.pow(region.color[1] - nRegion.color[1], 2) +
              Math.pow(region.color[2] - nRegion.color[2], 2),
          );
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = nKey;
          }
        }

        if (bestMatch) {
          finalRegions.get(bestMatch)!.pixels.add(pixel);
        }
      }
    }
  }

  // Step 3: Create non-overlapping shapes
  const outputData = new Uint8ClampedArray(data.length);
  for (const region of finalRegions.values()) {
    for (const pixel of region.pixels) {
      const i = pixel * 4;
      outputData[i] = region.color[0];
      outputData[i + 1] = region.color[1];
      outputData[i + 2] = region.color[2];
      outputData[i + 3] = 255;
    }
  }

  // Apply the result
  ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
}

/**
 * Process image with Single mode - Each color vectorized to a separate layer
 */
export function processSingleMode(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
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
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 32)
    .map(([_, value]) => value.color);

  // Step 3: Process each pixel
  const outputData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
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

    // Apply the color
    outputData[i] = closestColor[0];
    outputData[i + 1] = closestColor[1];
    outputData[i + 2] = closestColor[2];
    outputData[i + 3] = 255;
  }

  // Step 4: Apply edge detection for clear borders
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const current = [
        outputData[idx],
        outputData[idx + 1],
        outputData[idx + 2],
      ];

      // Check neighbors
      const neighbors = [
        [(y - 1) * width + x, "top"],
        [(y + 1) * width + x, "bottom"],
        [y * width + (x - 1), "left"],
        [y * width + (x + 1), "right"],
      ];

      for (const [nIdx, pos] of neighbors) {
        const nColor = [
          outputData[nIdx * 4],
          outputData[nIdx * 4 + 1],
          outputData[nIdx * 4 + 2],
        ];

        // If colors are different, this is an edge
        if (current.some((c, i) => Math.abs(c - nColor[i]) > 32)) {
          outputData[idx] = current[0];
          outputData[idx + 1] = current[1];
          outputData[idx + 2] = current[2];
          outputData[idx + 3] = 255;
        }
      }
    }
  }

  // Apply the result
  ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
}
