interface Region {
  color: number[];
  pixels: Set<number>;
  id: number;
}

export const processPaintByNumbers = (
  ctx: CanvasRenderingContext2D,
  colorCount: number,
  onProgress?: (progress: number) => void,
) => {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Step 1: Quantize colors and create initial regions
  const regions = new Map<string, Region>();
  let regionId = 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;

      if (!regions.has(key)) {
        regions.set(key, {
          color: [r, g, b],
          pixels: new Set([y * width + x]),
          id: regionId++,
        });
      } else {
        regions.get(key)!.pixels.add(y * width + x);
      }
    }
    if (onProgress) onProgress((y / height) * 50);
  }

  // Step 2: Merge similar regions to match target color count
  const sortedRegions = Array.from(regions.values())
    .sort((a, b) => b.pixels.size - a.pixels.size)
    .slice(0, colorCount);

  // Step 3: Create final image with numbers
  const outputData = new Uint8ClampedArray(data.length);
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;

  // Draw regions with colors
  sortedRegions.forEach((region, index) => {
    const regionCanvas = document.createElement("canvas");
    regionCanvas.width = width;
    regionCanvas.height = height;
    const regionCtx = regionCanvas.getContext("2d")!;

    // Fill region
    const regionData = new Uint8ClampedArray(data.length);
    region.pixels.forEach((pixel) => {
      const i = pixel * 4;
      regionData[i] = region.color[0];
      regionData[i + 1] = region.color[1];
      regionData[i + 2] = region.color[2];
      regionData[i + 3] = 255;
    });
    regionCtx.putImageData(new ImageData(regionData, width, height), 0, 0);

    // Add number to center of region
    const pixels = Array.from(region.pixels);
    const centerPixel = pixels[Math.floor(pixels.length / 2)];
    const centerX = centerPixel % width;
    const centerY = Math.floor(centerPixel / width);

    regionCtx.font = "12px Arial";
    regionCtx.fillStyle = "#000000";
    regionCtx.textAlign = "center";
    regionCtx.textBaseline = "middle";
    regionCtx.fillText((index + 1).toString(), centerX, centerY);

    // Draw region to main canvas
    tempCtx.drawImage(regionCanvas, 0, 0);

    if (onProgress) onProgress(50 + (index / sortedRegions.length) * 50);
  });

  // Add contours
  const contourData = new Uint8ClampedArray(data.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const currentRegion = getRegionAt(sortedRegions, x, y, width);

      // Check neighbors for different regions
      const hasEdge = [-1, 0, 1].some((dy) =>
        [-1, 0, 1].some((dx) => {
          if (dx === 0 && dy === 0) return false;
          const neighborRegion = getRegionAt(
            sortedRegions,
            x + dx,
            y + dy,
            width,
          );
          return currentRegion !== neighborRegion;
        }),
      );

      if (hasEdge) {
        contourData[i] = contourData[i + 1] = contourData[i + 2] = 0;
        contourData[i + 3] = 255;
      }
    }
  }

  // Combine final image
  tempCtx.putImageData(new ImageData(contourData, width, height), 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0);
};

function getRegionAt(
  regions: Region[],
  x: number,
  y: number,
  width: number,
): Region | null {
  const pixel = y * width + x;
  return regions.find((region) => region.pixels.has(pixel)) || null;
}
