import { Region, Point, Bounds, ProcessingProgress } from "./types";
import { ColorQuantizer } from "../vectorization/colorQuantization";

export class RegionDetector {
  private width: number;
  private height: number;
  private visited: Set<number>;
  private regions: Map<number, Region>;
  private nextRegionId: number;

  constructor(
    private imageData: ImageData,
    private colorCount: number,
  ) {
    this.width = imageData.width;
    this.height = imageData.height;
    this.visited = new Set();
    this.regions = new Map();
    this.nextRegionId = 1;
  }

  public detectRegions(
    onProgress?: (progress: ProcessingProgress) => void,
  ): Region[] {
    // First quantize colors
    const quantizer = new ColorQuantizer(this.colorCount);
    const quantized = quantizer.quantize(this.imageData);

    if (onProgress) onProgress({ stage: "Color quantization", progress: 30 });

    // Find connected regions
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        if (!this.visited.has(idx)) {
          this.floodFill(quantized, x, y);
        }
      }
      if (onProgress) {
        onProgress({
          stage: "Region detection",
          progress: 30 + (y / this.height) * 40,
        });
      }
    }

    // Process regions (merge small ones, calculate centers)
    const processedRegions = this.processRegions();

    if (onProgress) onProgress({ stage: "Region processing", progress: 90 });

    return processedRegions;
  }

  private floodFill(data: Uint8ClampedArray, startX: number, startY: number) {
    const startIdx = (startY * this.width + startX) * 4;
    const targetColor = [
      data[startIdx],
      data[startIdx + 1],
      data[startIdx + 2],
    ];

    const pixels = new Set<number>();
    const stack: Point[] = [{ x: startX, y: startY }];
    let minX = startX,
      maxX = startX,
      minY = startY,
      maxY = startY;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const idx = (y * this.width + x) * 4;

      if (this.visited.has(idx) || !this.isSimilarColor(data, idx, targetColor))
        continue;

      this.visited.add(idx);
      pixels.add(y * this.width + x);

      // Update bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Add neighbors to stack
      if (x > 0) stack.push({ x: x - 1, y });
      if (x < this.width - 1) stack.push({ x: x + 1, y });
      if (y > 0) stack.push({ x, y: y - 1 });
      if (y < this.height - 1) stack.push({ x, y: y + 1 });
    }

    if (pixels.size > 0) {
      const region: Region = {
        id: this.nextRegionId++,
        color: targetColor as [number, number, number],
        pixels,
        center: this.calculateCenter(pixels),
        bounds: { minX, minY, maxX, maxY },
        area: pixels.size,
      };
      this.regions.set(region.id, region);
    }
  }

  private isSimilarColor(
    data: Uint8ClampedArray,
    idx: number,
    targetColor: number[],
  ): boolean {
    const threshold = 5;
    return (
      Math.abs(data[idx] - targetColor[0]) <= threshold &&
      Math.abs(data[idx + 1] - targetColor[1]) <= threshold &&
      Math.abs(data[idx + 2] - targetColor[2]) <= threshold
    );
  }

  private calculateCenter(pixels: Set<number>): Point {
    let sumX = 0,
      sumY = 0;
    pixels.forEach((pixel) => {
      sumX += pixel % this.width;
      sumY += Math.floor(pixel / this.width);
    });
    return {
      x: Math.round(sumX / pixels.size),
      y: Math.round(sumY / pixels.size),
    };
  }

  private processRegions(): Region[] {
    const minSize = Math.floor(this.width * this.height * 0.001); // 0.1% of image size
    const processed: Region[] = [];

    // Sort regions by size
    const sortedRegions = Array.from(this.regions.values()).sort(
      (a, b) => b.area - a.area,
    );

    // Keep only significant regions
    for (const region of sortedRegions) {
      if (region.area >= minSize) {
        processed.push(region);
      } else {
        // Merge small region with nearest neighbor
        this.mergeWithNearest(region, processed);
      }
    }

    return processed;
  }

  private mergeWithNearest(region: Region, regions: Region[]) {
    if (regions.length === 0) {
      regions.push(region);
      return;
    }

    let nearestRegion = regions[0];
    let minDist = this.colorDistance(region.color, regions[0].color);

    for (let i = 1; i < regions.length; i++) {
      const dist = this.colorDistance(region.color, regions[i].color);
      if (dist < minDist) {
        minDist = dist;
        nearestRegion = regions[i];
      }
    }

    // Merge pixels into nearest region
    region.pixels.forEach((pixel) => nearestRegion.pixels.add(pixel));
    nearestRegion.bounds = this.updateBounds(
      nearestRegion.bounds,
      region.bounds,
    );
    nearestRegion.center = this.calculateCenter(nearestRegion.pixels);
    nearestRegion.area = nearestRegion.pixels.size;
  }

  private colorDistance(c1: number[], c2: number[]): number {
    return Math.sqrt(
      Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2),
    );
  }

  private updateBounds(b1: Bounds, b2: Bounds): Bounds {
    return {
      minX: Math.min(b1.minX, b2.minX),
      minY: Math.min(b1.minY, b2.minY),
      maxX: Math.max(b1.maxX, b2.maxX),
      maxY: Math.max(b1.maxY, b2.maxY),
    };
  }
}
