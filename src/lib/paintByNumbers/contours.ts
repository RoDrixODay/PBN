import { Region, ContourStyle } from "./types";

export class ContourDrawer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private options: {
      style: ContourStyle;
      color: string;
      width: number;
    },
  ) {}

  public drawContours(regions: Region[]) {
    const { style, color, width } = this.options;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;

    switch (style) {
      case "dashed":
        this.ctx.setLineDash([5, 5]);
        break;
      case "dotted":
        this.ctx.setLineDash([2, 2]);
        break;
      case "double":
        this.drawDoubleContours(regions);
        return;
      case "thick":
        this.ctx.lineWidth = width * 2;
        break;
      default:
        this.ctx.setLineDash([]);
    }

    regions.forEach((region) => this.drawRegionContour(region));
  }

  private drawRegionContour(region: Region) {
    const boundaryPoints = this.traceBoundary(region);
    if (boundaryPoints.length === 0) return;

    this.ctx.beginPath();
    this.ctx.moveTo(boundaryPoints[0].x, boundaryPoints[0].y);

    for (let i = 1; i < boundaryPoints.length; i++) {
      this.ctx.lineTo(boundaryPoints[i].x, boundaryPoints[i].y);
    }

    this.ctx.closePath();
    this.ctx.stroke();
  }

  private drawDoubleContours(regions: Region[]) {
    // Draw outer stroke
    this.ctx.lineWidth = this.options.width * 2;
    this.ctx.strokeStyle = "white";
    regions.forEach((region) => this.drawRegionContour(region));

    // Draw inner stroke
    this.ctx.lineWidth = this.options.width;
    this.ctx.strokeStyle = this.options.color;
    regions.forEach((region) => this.drawRegionContour(region));
  }

  private traceBoundary(region: Region) {
    const points: { x: number; y: number }[] = [];
    const visited = new Set<number>();
    let startPixel: number | null = null;

    // Find first boundary pixel
    for (const pixel of region.pixels) {
      if (this.isBoundaryPixel(pixel, region)) {
        startPixel = pixel;
        break;
      }
    }

    if (startPixel === null) return points;

    let currentPixel = startPixel;
    do {
      const x = currentPixel % this.ctx.canvas.width;
      const y = Math.floor(currentPixel / this.ctx.canvas.width);
      points.push({ x, y });
      visited.add(currentPixel);

      // Find next boundary pixel
      currentPixel = this.findNextBoundaryPixel(currentPixel, region, visited);
    } while (currentPixel !== null && currentPixel !== startPixel);

    return this.smoothPoints(points);
  }

  private isBoundaryPixel(pixel: number, region: Region): boolean {
    const x = pixel % this.ctx.canvas.width;
    const y = Math.floor(pixel / this.ctx.canvas.width);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const neighborPixel = (y + dy) * this.ctx.canvas.width + (x + dx);
        if (!region.pixels.has(neighborPixel)) {
          return true;
        }
      }
    }
    return false;
  }

  private findNextBoundaryPixel(
    currentPixel: number,
    region: Region,
    visited: Set<number>,
  ): number | null {
    const x = currentPixel % this.ctx.canvas.width;
    const y = Math.floor(currentPixel / this.ctx.canvas.width);

    // Check neighbors in clockwise order
    const neighbors = [
      [-1, 0],
      [-1, -1],
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
    ];

    for (const [dx, dy] of neighbors) {
      const nextPixel = (y + dy) * this.ctx.canvas.width + (x + dx);
      if (
        region.pixels.has(nextPixel) &&
        !visited.has(nextPixel) &&
        this.isBoundaryPixel(nextPixel, region)
      ) {
        return nextPixel;
      }
    }

    return null;
  }

  private smoothPoints(
    points: { x: number; y: number }[],
  ): { x: number; y: number }[] {
    if (points.length <= 2) return points;

    const smoothed: { x: number; y: number }[] = [];
    const tension = 0.25;

    for (let i = 0; i < points.length; i++) {
      const p0 = points[(i - 1 + points.length) % points.length];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];

      // Catmull-Rom spline
      for (let t = 0; t < 1; t += 0.1) {
        const t2 = t * t;
        const t3 = t2 * t;

        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

        smoothed.push({ x, y });
      }
    }

    return smoothed;
  }
}
