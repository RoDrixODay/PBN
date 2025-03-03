/**
 * Apply roundness to vector shapes
 */
export function applyRoundness(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  level: "sharp" | "medium" | "round" = "medium",
) {
  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);

  // Extract regions
  const regions = extractRegions(data, width, height);

  // Apply different levels of roundness
  regions.forEach((region) => {
    const path = new Path2D();
    const points = extractBoundaryPoints(region, width, height);

    if (points.length > 0) {
      // Start path
      path.moveTo(points[0].x, points[0].y);

      if (level === "sharp") {
        // Sharp corners - straight lines between points
        for (let i = 1; i < points.length; i++) {
          path.lineTo(points[i].x, points[i].y);
        }
      } else if (level === "medium") {
        // Medium roundness - simplified curve with some corners
        const simplifiedPoints = simplifyPoints(points, 1.0);
        for (let i = 1; i < simplifiedPoints.length; i++) {
          path.lineTo(simplifiedPoints[i].x, simplifiedPoints[i].y);
        }
      } else if (level === "round") {
        // Maximum roundness - smooth bezier curves
        const controlPoints = calculateControlPoints(points);
        for (let i = 0; i < points.length; i++) {
          const nextIdx = (i + 1) % points.length;
          path.bezierCurveTo(
            controlPoints[i].cp2.x,
            controlPoints[i].cp2.y,
            controlPoints[nextIdx].cp1.x,
            controlPoints[nextIdx].cp1.y,
            points[nextIdx].x,
            points[nextIdx].y,
          );
        }
      }

      path.closePath();

      // Fill with region color
      ctx.fillStyle = `rgb(${region.color[0]}, ${region.color[1]}, ${region.color[2]})`;
      ctx.fill(path);
    }
  });
}

/**
 * Apply minimum area filtering to vector shapes
 */
export function applyMinimumArea(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minArea: "0px²" | "5px²" | "90px²" = "5px²",
) {
  // Parse minimum area value
  const minAreaValue = parseInt(minArea.replace("px²", "")) || 0;

  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);

  // Extract regions
  const regions = extractRegions(data, width, height);

  // Filter regions by area and draw them
  regions
    .filter((region) => region.pixels.size >= minAreaValue)
    .forEach((region) => {
      const path = new Path2D();
      const points = extractBoundaryPoints(region, width, height);

      if (points.length > 0) {
        // Start path
        path.moveTo(points[0].x, points[0].y);

        // Draw path
        for (let i = 1; i < points.length; i++) {
          path.lineTo(points[i].x, points[i].y);
        }

        path.closePath();

        // Fill with region color
        ctx.fillStyle = `rgb(${region.color[0]}, ${region.color[1]}, ${region.color[2]})`;
        ctx.fill(path);
      }
    });
}

/**
 * Apply circle detection to vector shapes
 */
export function applyCircleDetection(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  enabled: "off" | "on" = "off",
) {
  if (enabled === "off") return;

  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);

  // Extract regions
  const regions = extractRegions(data, width, height);

  // Process each region
  regions.forEach((region) => {
    const points = extractBoundaryPoints(region, width, height);

    if (points.length > 0) {
      // Check if region is circular
      const isCircle = detectCircle(points);

      if (isCircle) {
        // Draw as circle
        const circle = fitCircle(points);
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${region.color[0]}, ${region.color[1]}, ${region.color[2]})`;
        ctx.fill();
      } else {
        // Draw as polygon
        const path = new Path2D();
        path.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
          path.lineTo(points[i].x, points[i].y);
        }

        path.closePath();
        ctx.fillStyle = `rgb(${region.color[0]}, ${region.color[1]}, ${region.color[2]})`;
        ctx.fill(path);
      }
    }
  });
}

// Helper functions

/**
 * Extract color regions from image data
 */
function extractRegions(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const visited = new Set<number>();
  const regions: Array<{
    color: [number, number, number];
    pixels: Set<number>;
  }> = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const idx = pixelIdx * 4;

      if (data[idx + 3] > 0 && !visited.has(pixelIdx)) {
        // Start a new region
        const color: [number, number, number] = [
          data[idx],
          data[idx + 1],
          data[idx + 2],
        ];
        const pixels = new Set<number>();

        // Flood fill to find all connected pixels of the same color
        const queue: Array<[number, number]> = [[x, y]];
        visited.add(pixelIdx);
        pixels.add(pixelIdx);

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;

          // Check 4-connected neighbors
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nPixelIdx = ny * width + nx;
              const nIdx = nPixelIdx * 4;

              if (
                !visited.has(nPixelIdx) &&
                data[nIdx + 3] > 0 &&
                Math.abs(data[nIdx] - color[0]) < 5 &&
                Math.abs(data[nIdx + 1] - color[1]) < 5 &&
                Math.abs(data[nIdx + 2] - color[2]) < 5
              ) {
                visited.add(nPixelIdx);
                pixels.add(nPixelIdx);
                queue.push([nx, ny]);
              }
            }
          }
        }

        regions.push({ color, pixels });
      }
    }
  }

  return regions;
}

/**
 * Extract boundary points from a region
 */
function extractBoundaryPoints(
  region: { pixels: Set<number> },
  width: number,
  height: number,
) {
  const points: Array<{ x: number; y: number }> = [];
  const visited = new Set<number>();

  // Find a boundary pixel to start
  let startPixel: number | null = null;
  for (const pixel of region.pixels) {
    const x = pixel % width;
    const y = Math.floor(pixel / width);

    // Check if this is a boundary pixel
    if (isBoundaryPixel(pixel, region.pixels, width, height)) {
      startPixel = pixel;
      break;
    }
  }

  if (startPixel === null) return points;

  // Trace the boundary using Moore-Neighbor algorithm
  let currentPixel = startPixel;
  let firstPoint = true;

  do {
    const x = currentPixel % width;
    const y = Math.floor(currentPixel / width);

    if (firstPoint || !visited.has(currentPixel)) {
      points.push({ x, y });
      visited.add(currentPixel);
      firstPoint = false;
    }

    // Find next boundary pixel in clockwise order
    currentPixel = findNextBoundaryPixel(
      currentPixel,
      region.pixels,
      visited,
      width,
      height,
    );
  } while (currentPixel !== null && currentPixel !== startPixel);

  return points;
}

/**
 * Check if a pixel is on the boundary of a region
 */
function isBoundaryPixel(
  pixel: number,
  regionPixels: Set<number>,
  width: number,
  height: number,
) {
  const x = pixel % width;
  const y = Math.floor(pixel / width);

  // Check 4-connected neighbors
  const neighbors = [
    (y - 1) * width + x, // top
    (y + 1) * width + x, // bottom
    y * width + (x - 1), // left
    y * width + (x + 1), // right
  ];

  for (const neighbor of neighbors) {
    if (!regionPixels.has(neighbor)) {
      return true;
    }
  }

  return false;
}

/**
 * Find the next boundary pixel in clockwise order
 */
function findNextBoundaryPixel(
  pixel: number,
  regionPixels: Set<number>,
  visited: Set<number>,
  width: number,
  height: number,
) {
  const x = pixel % width;
  const y = Math.floor(pixel / width);

  // Check neighbors in clockwise order
  const directions = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const neighborPixel = ny * width + nx;

      if (
        regionPixels.has(neighborPixel) &&
        isBoundaryPixel(neighborPixel, regionPixels, width, height)
      ) {
        return neighborPixel;
      }
    }
  }

  return null;
}

/**
 * Simplify a polyline using the Ramer-Douglas-Peucker algorithm
 */
function simplifyPoints(
  points: Array<{ x: number; y: number }>,
  tolerance: number,
) {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance
  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1],
    );

    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const firstLine = simplifyPoints(points.slice(0, index + 1), tolerance);
    const secondLine = simplifyPoints(points.slice(index), tolerance);

    // Concatenate the two lines, removing the duplicate point
    return [...firstLine.slice(0, -1), ...secondLine];
  }

  // Return just the endpoints
  return [points[0], points[points.length - 1]];
}

/**
 * Calculate the perpendicular distance from a point to a line
 */
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
) {
  const area = Math.abs(
    (lineStart.y - lineEnd.y) * point.x +
      (lineEnd.x - lineStart.x) * point.y +
      (lineStart.x * lineEnd.y - lineEnd.x * lineStart.y),
  );

  const bottom = Math.sqrt(
    Math.pow(lineEnd.x - lineStart.x, 2) + Math.pow(lineEnd.y - lineStart.y, 2),
  );

  return area / bottom;
}

/**
 * Calculate control points for smooth curves
 */
function calculateControlPoints(points: Array<{ x: number; y: number }>) {
  const controlPoints: Array<{
    cp1: { x: number; y: number };
    cp2: { x: number; y: number };
  }> = [];
  const n = points.length;

  // Tension controls how tight the curve is
  const tension = 0.3;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const nextNext = points[(i + 2) % n];

    // Calculate control points
    const cp1 = {
      x: curr.x + (next.x - prev.x) * tension,
      y: curr.y + (next.y - prev.y) * tension,
    };

    const cp2 = {
      x: next.x - (nextNext.x - curr.x) * tension,
      y: next.y - (nextNext.y - curr.y) * tension,
    };

    controlPoints.push({ cp1, cp2 });
  }

  return controlPoints;
}

/**
 * Detect if a set of points forms a circle
 */
function detectCircle(points: Array<{ x: number; y: number }>) {
  if (points.length < 8) return false;

  // Fit a circle to the points
  const circle = fitCircle(points);

  // Calculate how well the points fit the circle
  let totalDeviation = 0;
  for (const point of points) {
    const distance = Math.sqrt(
      Math.pow(point.x - circle.x, 2) + Math.pow(point.y - circle.y, 2),
    );

    totalDeviation += Math.abs(distance - circle.radius);
  }

  // Calculate average deviation as a percentage of radius
  const avgDeviation = totalDeviation / points.length / circle.radius;

  // If average deviation is less than 10%, consider it a circle
  return avgDeviation < 0.1;
}

/**
 * Fit a circle to a set of points using least squares method
 */
function fitCircle(points: Array<{ x: number; y: number }>) {
  // Calculate centroid
  let sumX = 0,
    sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  const centerX = sumX / points.length;
  const centerY = sumY / points.length;

  // Calculate average distance from centroid (radius)
  let sumRadius = 0;
  for (const point of points) {
    sumRadius += Math.sqrt(
      Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2),
    );
  }

  const radius = sumRadius / points.length;

  return { x: centerX, y: centerY, radius };
}
