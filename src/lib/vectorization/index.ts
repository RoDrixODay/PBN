export * from "./colorQuantization";
export * from "./edgeDetection";
export * from "./contours";
export * from "./styles";

export interface VectorizationResult {
  imageData: ImageData;
  svg?: string;
  paths?: string[];
  colors?: string[];
}

export interface ProcessingProgress {
  stage: string;
  progress: number;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;

export async function processImage(
  imageData: ImageData,
  options: VectorizationOptions,
  onProgress?: ProgressCallback,
): Promise<VectorizationResult> {
  const processor = new VectorStyleProcessor(options);

  // Process image with progress updates
  if (onProgress) onProgress({ stage: "Initializing", progress: 0 });

  const result = processor.process(imageData);

  if (onProgress) onProgress({ stage: "Completed", progress: 100 });

  return { imageData: result };
}
