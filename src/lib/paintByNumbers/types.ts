export interface Region {
  id: number;
  color: [number, number, number];
  pixels: Set<number>;
  center: Point;
  bounds: Bounds;
  area: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PaintByNumbersOptions {
  colorCount: number;
  numberStyle?: NumberStyle;
  contourStyle?: ContourStyle;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  contourColor?: string;
  contourWidth?: number;
  minRegionSize?: number;
  smoothing?: number;
}

export type NumberStyle = "circle" | "square" | "plain" | "outline" | "bubble";

export type ContourStyle = "solid" | "dashed" | "dotted" | "double" | "thick";

export interface ProcessingProgress {
  stage: string;
  progress: number;
}

export type ProgressCallback = (progress: ProcessingProgress) => void;
