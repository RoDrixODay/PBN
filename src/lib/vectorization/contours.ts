export interface ContourOptions {
  smoothing?: number;
  simplifyTolerance?: number;
  minArea?: number;
}

export class ContourTracer {
  constructor(private options: ContourOptions = {}) {
    this.options = {
      smoothing: 0.5,
      simplifyTolerance: 1,
      minArea: 10,
      ...options,
    };
  }

  public traceContours(imageData: ImageData): Contour[] {
    const { width, height, data } = imageData;
    const visited = new Set<number>();
    const contours: Contour[] = [];

    // Find contour starting points
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixelKey = y * width + x;

        if (!visited.has(pixelKey) && this.isEdgePixel(data, idx)) {
          const contour = this.traceContour(imageData, x, y, visited);
          if (this.isValidContour(contour)) {
            contours.push(contour);
          }
        }
      }
    }

    return contours.map((contour) => this.processContour(contour));
  }

  private isEdgePixel(data: Uint8ClampedArray, idx: number): boolean {
    return data[idx + 3] > 0; // Check alpha channel
  }

  private traceContour(
    imageData: ImageData,
    startX: number,
    startY: number,
    visited: Set<number>,
  ): Point[] {
    const { width, height, data } = imageData;
    const contour: Point[] = [];
    let x = startX;
    let y = startY;
    let dir = 0; // 0: right, 1: down, 2: left, 3: up

    do {
      const pixelKey = y * width + x;
      if (visited.has(pixelKey)) break;

      visited.add(pixelKey);
      contour.push({ x, y });

      // Moore-Neighbor tracing
      let found = false;
      let count = 0;
      while (!found && count < 8) {
        const nx = x + this.dx[dir];
        const ny = y + this.dy[dir];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          if (this.isEdgePixel(data, idx)) {
            x = nx;
            y = ny;
            found = true;
          }
        }

        if (!found) {
          dir = (dir + 1) % 8;
          count++;
        }
      }

      if (!found) break;
    } while (x !== startX || y !== startY);

    return contour;
  }

  private processContour(points: Point[]): Contour {
    // Smooth contour
    let smoothed = this.smoothContour(points);

    // Simplify using Douglas-Peucker algorithm
    smoothed = this.simplifyContour(smoothed);

    return {
      points: smoothed,
      area: this.calculateArea(smoothed),
      bounds: this.calculateBounds(smoothed),
    };
  }

  private smoothContour(points: Point[]): Point[] {
    const smoothing = this.options.smoothing;
    const result: Point[] = [];

    for (let i = 0; i < points.length; i++) {
      const prev = points[(i - 1 + points.length) % points.length];
      const curr = points[i];
      const next = points[(i + 1) % points.length];

      result.push({
        x: curr.x * (1 - smoothing) + ((prev.x + next.x) * smoothing) / 2,
        y: curr.y * (1 - smoothing) + ((prev.y + next.y) * smoothing) / 2,
      });
    }

    return result;
  }

  private simplifyContour(points: Point[]): Point[] {
    if (points.length <= 2) return points;

    const tolerance = this.options.simplifyTolerance;
    let maxDist = 0;
    let index = 0;

    // Find point with maximum distance
    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.pointLineDistance(
        points[i],
        points[0],
        points[points.length - 1],
      );
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > tolerance) {
      // Recursive simplification
      const left = this.simplifyContour(points.slice(0, index + 1));
      const right = this.simplifyContour(points.slice(index));
      return [...left.slice(0, -1), ...right];
    }

    return [points[0], points[points.length - 1]];
  }

  private pointLineDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point,
  ): number {
    const numerator = Math.abs(
      (lineEnd.y - lineStart.y) * point.x -
        (lineEnd.x - lineStart.x) * point.y +
        lineEnd.x * lineStart.y -
        lineEnd.y * lineStart.x,
    );

    const denominator = Math.sqrt(
      Math.pow(lineEnd.y - lineStart.y, 2) +
        Math.pow(lineEnd.x - lineStart.x, 2),
    );

    return numerator / denominator;
  }

  private calculateArea(points: Point[]): number {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  private calculateBounds(points: Point[]): Bounds {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }

  private dx = [1, 1, 0, -1, -1, -1, 0, 1];
  private dy = [0, 1, 1, 1, 0, -1, -1, -1];
}

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Contour {
  points: Point[];
  area: number;
  bounds: Bounds;
}
