import { ColorQuantizer } from "./colorQuantization";
import { EdgeDetector } from "./edgeDetection";
import { ContourTracer } from "./contours";

export interface VectorizationOptions {
  style: VectorizationStyle;
  colorCount?: number;
  edgeThreshold?: number;
  smoothing?: number;
  simplifyTolerance?: number;
  minArea?: number;
}

export type VectorizationStyle =
  | "filled"
  | "stroked"
  | "duotone"
  | "geometric"
  | "sketch"
  | "posterized";

export class VectorStyleProcessor {
  private quantizer: ColorQuantizer;
  private edgeDetector: EdgeDetector;
  private contourTracer: ContourTracer;

  constructor(private options: VectorizationOptions) {
    this.quantizer = new ColorQuantizer(options.colorCount || 32);
    this.edgeDetector = new EdgeDetector({
      threshold: options.edgeThreshold,
      strengthMultiplier: 1.5,
    });
    this.contourTracer = new ContourTracer({
      smoothing: options.smoothing,
      simplifyTolerance: options.simplifyTolerance,
      minArea: options.minArea,
    });
  }

  public process(imageData: ImageData): ImageData {
    switch (this.options.style) {
      case "filled":
        return this.processFilledStyle(imageData);
      case "stroked":
        return this.processStrokedStyle(imageData);
      case "duotone":
        return this.processDuotoneStyle(imageData);
      case "geometric":
        return this.processGeometricStyle(imageData);
      case "sketch":
        return this.processSketchStyle(imageData);
      case "posterized":
        return this.processPosterizedStyle(imageData);
      default:
        return imageData;
    }
  }

  private processFilledStyle(imageData: ImageData): ImageData {
    // Quantize colors
    const quantized = this.quantizer.quantize(imageData);
    const output = new ImageData(quantized, imageData.width, imageData.height);

    // Find and smooth contours
    const contours = this.contourTracer.traceContours(output);

    // Draw filled regions with smooth edges
    const ctx = this.createContext(imageData.width, imageData.height);
    contours.forEach((contour) => {
      if (contour.area > (this.options.minArea || 10)) {
        ctx.beginPath();
        contour.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
      }
    });

    return ctx.getImageData(0, 0, imageData.width, imageData.height);
  }

  private processStrokedStyle(imageData: ImageData): ImageData {
    // Detect edges
    const edges = this.edgeDetector.detectEdges(imageData);
    const output = new ImageData(edges, imageData.width, imageData.height);

    // Trace and smooth contours
    const contours = this.contourTracer.traceContours(output);

    // Draw stroked paths
    const ctx = this.createContext(imageData.width, imageData.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;

    contours.forEach((contour) => {
      if (contour.area > (this.options.minArea || 10)) {
        ctx.beginPath();
        contour.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.stroke();
      }
    });

    return ctx.getImageData(0, 0, imageData.width, imageData.height);
  }

  private processDuotoneStyle(imageData: ImageData): ImageData {
    // Convert to grayscale and apply threshold
    const ctx = this.createContext(imageData.width, imageData.height);
    ctx.putImageData(imageData, 0, 0);

    const processed = ctx.getImageData(0, 0, imageData.width, imageData.height);
    const data = processed.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = gray < 128 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    return processed;
  }

  private processGeometricStyle(imageData: ImageData): ImageData {
    // Implement geometric style processing
    // This is a placeholder - implement actual geometric processing
    return imageData;
  }

  private processSketchStyle(imageData: ImageData): ImageData {
    // Implement sketch style processing
    // This is a placeholder - implement actual sketch processing
    return imageData;
  }

  private processPosterizedStyle(imageData: ImageData): ImageData {
    // Implement posterized style processing
    // This is a placeholder - implement actual posterization
    return imageData;
  }

  private createContext(
    width: number,
    height: number,
  ): CanvasRenderingContext2D {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d")!;
  }
}
