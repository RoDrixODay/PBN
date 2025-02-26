import { RegionDetector } from "./regionDetection";
import { NumberPlacer } from "./numberPlacement";
import { ContourDrawer } from "./contours";
import { PaintByNumbersOptions, ProcessingProgress } from "./types";

export class PaintByNumbersProcessor {
  constructor(private options: PaintByNumbersOptions) {}

  public async process(
    imageData: ImageData,
    onProgress?: (progress: ProcessingProgress) => void,
  ): Promise<ImageData> {
    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d")!;

    // Fill background white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Detect regions
    const detector = new RegionDetector(imageData, this.options.colorCount);
    const regions = await detector.detectRegions(onProgress);

    // Draw contours
    const contourDrawer = new ContourDrawer(ctx, {
      style: this.options.contourStyle || "solid",
      color: this.options.contourColor || "#000000",
      width: this.options.contourWidth || 1,
    });
    contourDrawer.drawContours(regions);

    // Place numbers
    const numberPlacer = new NumberPlacer(ctx, {
      style: this.options.numberStyle || "plain",
      fontSize: this.options.fontSize || 12,
      fontFamily: this.options.fontFamily || "Arial",
      fontColor: this.options.fontColor || "#000000",
    });

    regions.forEach((region, index) => {
      numberPlacer.placeNumber(region, index + 1);
    });

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}

export * from "./types";
