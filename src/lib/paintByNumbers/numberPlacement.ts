import { Region, Point, NumberStyle } from "./types";

export class NumberPlacer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private options: {
      style: NumberStyle;
      fontSize: number;
      fontFamily: string;
      fontColor: string;
    },
  ) {}

  public placeNumber(region: Region, number: number) {
    const { style, fontSize, fontFamily, fontColor } = this.options;
    const center = this.findOptimalPlacement(region);

    switch (style) {
      case "circle":
        this.drawCircleNumber(center, number);
        break;
      case "square":
        this.drawSquareNumber(center, number);
        break;
      case "outline":
        this.drawOutlineNumber(center, number);
        break;
      case "bubble":
        this.drawBubbleNumber(center, number);
        break;
      default:
        this.drawPlainNumber(center, number);
    }
  }

  private findOptimalPlacement(region: Region): Point {
    // Start with region center
    let bestPoint = region.center;
    let maxDistance = 0;

    // Sample points in region to find most central point
    const sampleSize = Math.min(100, region.pixels.size);
    const step = Math.max(1, Math.floor(region.pixels.size / sampleSize));

    const pixels = Array.from(region.pixels);
    for (let i = 0; i < pixels.length; i += step) {
      const pixel = pixels[i];
      const x = pixel % this.ctx.canvas.width;
      const y = Math.floor(pixel / this.ctx.canvas.width);

      // Calculate minimum distance to region boundary
      const distance = this.calculateMinBoundaryDistance(x, y, region);

      if (distance > maxDistance) {
        maxDistance = distance;
        bestPoint = { x, y };
      }
    }

    return bestPoint;
  }

  private calculateMinBoundaryDistance(
    x: number,
    y: number,
    region: Region,
  ): number {
    let minDistance = Infinity;

    // Sample points on region boundary
    const boundaryPoints = this.getBoundaryPoints(region);
    for (const point of boundaryPoints) {
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2),
      );
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private getBoundaryPoints(region: Region): Point[] {
    const points: Point[] = [];
    const { minX, minY, maxX, maxY } = region.bounds;

    // Sample boundary pixels
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const pixel = y * this.ctx.canvas.width + x;
        if (region.pixels.has(pixel)) {
          // Check if this is a boundary pixel
          if (this.isBoundaryPixel(x, y, region)) {
            points.push({ x, y });
          }
        }
      }
    }

    return points;
  }

  private isBoundaryPixel(x: number, y: number, region: Region): boolean {
    // Check if any neighboring pixel is not in the region
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

  private drawCircleNumber(center: Point, number: number) {
    const { fontSize, fontFamily, fontColor } = this.options;
    const radius = fontSize * 0.8;

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();
    this.ctx.strokeStyle = fontColor;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = fontColor;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(number.toString(), center.x, center.y);
  }

  private drawSquareNumber(center: Point, number: number) {
    const { fontSize, fontFamily, fontColor } = this.options;
    const size = fontSize * 1.6;

    this.ctx.fillStyle = "white";
    this.ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
    this.ctx.strokeStyle = fontColor;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size);

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = fontColor;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(number.toString(), center.x, center.y);
  }

  private drawOutlineNumber(center: Point, number: number) {
    const { fontSize, fontFamily, fontColor } = this.options;

    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Draw outline
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(number.toString(), center.x, center.y);

    // Draw number
    this.ctx.fillStyle = fontColor;
    this.ctx.fillText(number.toString(), center.x, center.y);
  }

  private drawBubbleNumber(center: Point, number: number) {
    const { fontSize, fontFamily, fontColor } = this.options;
    const radius = fontSize * 0.8;

    // Draw bubble
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "white";
    this.ctx.fill();

    // Add bubble effect
    const gradient = this.ctx.createRadialGradient(
      center.x - radius / 3,
      center.y - radius / 3,
      0,
      center.x,
      center.y,
      radius,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.8)");
    gradient.addColorStop(1, "rgba(200,200,200,0.2)");
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Draw number
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = fontColor;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(number.toString(), center.x, center.y);
  }

  private drawPlainNumber(center: Point, number: number) {
    const { fontSize, fontFamily, fontColor } = this.options;

    // Draw bold number with white outline for better visibility
    this.ctx.font = `bold ${fontSize}px ${fontFamily}`;

    // Draw text outline
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeText(number.toString(), center.x, center.y);

    // Draw text fill
    this.ctx.fillStyle = fontColor;
    this.ctx.fillText(number.toString(), center.x, center.y);
  }
}
