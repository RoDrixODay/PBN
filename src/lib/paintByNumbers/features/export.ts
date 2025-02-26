import { Region } from "../types";
// Dynamically import jsPDF to avoid initial load issues
const getJsPDF = async () => {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
};

export interface ExportOptions {
  format?: "svg" | "png" | "pdf";
  scale?: number;
  includeColorGuide?: boolean;
  printFriendly?: boolean;
}

export class ExportManager {
  constructor(private canvas: HTMLCanvasElement) {}

  public async export(
    regions: Region[],
    options: ExportOptions = {},
  ): Promise<string | Blob> {
    switch (options.format) {
      case "svg":
        return this.exportSVG(regions);
      case "pdf":
        return this.exportPDF(regions, options);
      case "png":
      default:
        return this.exportPNG(options);
    }
  }

  private async exportSVG(regions: Region[]): Promise<string> {
    const width = this.canvas.width;
    const height = this.canvas.height;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Add regions
    regions.forEach((region, index) => {
      const path = this.regionToSVGPath(region);
      const color = `rgb(${region.color.join(",")})`;

      svg += `
        <path d="${path}" fill="${color}" stroke="black" stroke-width="1"/>
        <text x="${region.center.x}" y="${region.center.y}" 
              text-anchor="middle" dominant-baseline="middle"
              font-size="12" fill="black">${index + 1}</text>
      `;
    });

    svg += "</svg>";
    return svg;
  }

  private async exportPDF(
    regions: Region[],
    options: ExportOptions,
  ): Promise<Blob> {
    const jsPDF = await getJsPDF();
    const pdf = new jsPDF({
      orientation:
        this.canvas.width > this.canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [this.canvas.width, this.canvas.height],
    });

    // Add main image
    const imageData = this.canvas.toDataURL("image/png");
    pdf.addImage(imageData, "PNG", 0, 0);

    if (options.includeColorGuide) {
      // Add color guide page
      pdf.addPage();
      this.addColorGuide(pdf, regions);
    }

    return pdf.output("blob");
  }

  private async exportPNG(options: ExportOptions): Promise<Blob> {
    const scale = options.scale || 1;

    // Create high-resolution canvas
    const hiResCanvas = document.createElement("canvas");
    hiResCanvas.width = this.canvas.width * scale;
    hiResCanvas.height = this.canvas.height * scale;

    const ctx = hiResCanvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.drawImage(this.canvas, 0, 0);

    if (options.printFriendly) {
      this.applyPrintFriendlyAdjustments(ctx);
    }

    return new Promise((resolve) => {
      hiResCanvas.toBlob((blob) => resolve(blob!), "image/png");
    });
  }

  private regionToSVGPath(region: Region): string {
    const boundaryPoints = this.findBoundaryPoints(region);
    if (boundaryPoints.length === 0) return "";

    let path = `M ${boundaryPoints[0].x} ${boundaryPoints[0].y}`;
    boundaryPoints.slice(1).forEach((point) => {
      path += ` L ${point.x} ${point.y}`;
    });
    path += " Z";

    return path;
  }

  private findBoundaryPoints(region: Region): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const visited = new Set<number>();

    // Find first boundary pixel
    let startPixel: number | null = null;
    for (const pixel of region.pixels) {
      if (this.isOnBoundary(pixel, region)) {
        startPixel = pixel;
        break;
      }
    }

    if (!startPixel) return points;

    // Trace boundary
    let currentPixel = startPixel;
    do {
      const x = currentPixel % this.canvas.width;
      const y = Math.floor(currentPixel / this.canvas.width);
      points.push({ x, y });
      visited.add(currentPixel);

      currentPixel = this.findNextBoundaryPixel(currentPixel, region, visited);
    } while (currentPixel !== null && currentPixel !== startPixel);

    return this.simplifyPoints(points);
  }

  private isOnBoundary(pixel: number, region: Region): boolean {
    const x = pixel % this.canvas.width;
    const y = Math.floor(pixel / this.canvas.width);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const neighborPixel = (y + dy) * this.canvas.width + (x + dx);
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
    const x = currentPixel % this.canvas.width;
    const y = Math.floor(currentPixel / this.canvas.width);

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
      const nextPixel = (y + dy) * this.canvas.width + (x + dx);
      if (
        region.pixels.has(nextPixel) &&
        !visited.has(nextPixel) &&
        this.isOnBoundary(nextPixel, region)
      ) {
        return nextPixel;
      }
    }

    return null;
  }

  private simplifyPoints(
    points: { x: number; y: number }[],
  ): { x: number; y: number }[] {
    if (points.length <= 2) return points;

    const tolerance = 1.0;
    const simplified: { x: number; y: number }[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const angle = Math.abs(
        Math.atan2(next.y - curr.y, next.x - curr.x) -
          Math.atan2(curr.y - prev.y, curr.x - prev.x),
      );

      if (angle > tolerance) {
        simplified.push(curr);
      }
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  private addColorGuide(pdf: any, regions: Region[]) {
    const margin = 20;
    let y = margin;

    pdf.setFontSize(16);
    pdf.text("Color Guide", margin, y);
    y += 20;

    pdf.setFontSize(12);
    regions.forEach((region, index) => {
      const color = region.color;

      // Draw color swatch
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(margin, y, 15, 15, "F");

      // Add number and RGB values
      pdf.text(`${index + 1}: RGB(${color.join(",")})`, margin + 20, y + 10);

      y += 25;
      if (y > pdf.internal.pageSize.height - margin) {
        pdf.addPage();
        y = margin;
      }
    });
  }

  private applyPrintFriendlyAdjustments(ctx: CanvasRenderingContext2D) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height,
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale if not already
      if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Increase contrast
      const value = data[i];
      data[i] =
        data[i + 1] =
        data[i + 2] =
          value < 128 ? Math.max(0, value - 20) : Math.min(255, value + 20);
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
