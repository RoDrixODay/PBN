/**
 * Apply anti-aliasing to image
 */
export function applyAntiAliasing(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  level: "off" | "smart" | "mid" = "smart",
) {
  if (level === "off") return;

  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Apply different levels of anti-aliasing
  if (level === "smart") {
    // Smart anti-aliasing - only smooth edges
    const edgeData = detectEdges(data, width, height);
    const outputData = new Uint8ClampedArray(data.length);

    // Copy original data
    for (let i = 0; i < data.length; i++) {
      outputData[i] = data[i];
    }

    // Apply smoothing only to edge pixels
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (edgeData[y * width + x]) {
          // Apply 3x3 box blur to edge pixels
          let r = 0,
            g = 0,
            b = 0,
            a = 0,
            count = 0;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              r += data[nIdx];
              g += data[nIdx + 1];
              b += data[nIdx + 2];
              a += data[nIdx + 3];
              count++;
            }
          }

          outputData[idx] = r / count;
          outputData[idx + 1] = g / count;
          outputData[idx + 2] = b / count;
          outputData[idx + 3] = a / count;
        }
      }
    }

    ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
  } else if (level === "mid") {
    // Medium anti-aliasing - apply subtle blur to entire image
    tempCtx.filter = "blur(0.5px)";
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.filter = "none";

    // Apply sharpening to maintain details
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const sharpenedData = applySharpen(imageData.data, width, height, 0.3);

    ctx.putImageData(new ImageData(sharpenedData, width, height), 0, 0);
  }
}

/**
 * Apply noise reduction to image
 */
export function applyNoiseReduction(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  level: "off" | "low" | "high" = "high",
) {
  if (level === "off") return;

  // Create temporary canvas for processing
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Apply different levels of noise reduction
  if (level === "low") {
    // Low noise reduction - median filter with small radius
    const outputData = applyMedianFilter(data, width, height, 1);
    ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
  } else if (level === "high") {
    // High noise reduction - bilateral filter for edge-preserving smoothing
    tempCtx.filter = "blur(1px)";
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.filter = "none";

    // Get blurred data
    const blurredData = tempCtx.getImageData(0, 0, width, height).data;

    // Apply edge-preserving filter
    const outputData = applyBilateralFilter(data, blurredData, width, height);
    ctx.putImageData(new ImageData(outputData, width, height), 0, 0);
  }
}

/**
 * Apply upscaling to image
 */
export function applyUpscaling(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  scale: "off" | "200%" | "400%" = "200%",
) {
  if (scale === "off") return;

  // Determine scale factor
  const scaleFactor = scale === "200%" ? 2 : scale === "400%" ? 4 : 1;
  if (scaleFactor === 1) return;

  // Create new canvas with scaled dimensions
  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = width * scaleFactor;
  scaledCanvas.height = height * scaleFactor;
  const scaledCtx = scaledCanvas.getContext("2d")!;

  // Draw original image to temporary canvas
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.putImageData(new ImageData(data, width, height), 0, 0);

  // Apply high-quality upscaling
  scaledCtx.imageSmoothingEnabled = true;
  scaledCtx.imageSmoothingQuality = "high";
  scaledCtx.drawImage(
    tempCanvas,
    0,
    0,
    scaledCanvas.width,
    scaledCanvas.height,
  );

  // Apply sharpening to maintain details
  const scaledData = scaledCtx.getImageData(
    0,
    0,
    scaledCanvas.width,
    scaledCanvas.height,
  );
  const sharpenedData = applySharpen(
    scaledData.data,
    scaledCanvas.width,
    scaledCanvas.height,
    0.5,
  );

  // Update canvas with upscaled image
  ctx.canvas.width = scaledCanvas.width;
  ctx.canvas.height = scaledCanvas.height;
  ctx.putImageData(
    new ImageData(sharpenedData, scaledCanvas.width, scaledCanvas.height),
    0,
    0,
  );
}

// Helper functions

/**
 * Detect edges in an image
 */
function detectEdges(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): boolean[] {
  const edges = new Array(width * height).fill(false);
  const threshold = 30;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Check neighbors for significant color differences
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const diff =
            Math.abs(data[idx] - data[nIdx]) +
            Math.abs(data[idx + 1] - data[nIdx + 1]) +
            Math.abs(data[idx + 2] - data[nIdx + 2]);

          if (diff > threshold) {
            edges[y * width + x] = true;
            break;
          }
        }
        if (edges[y * width + x]) break;
      }
    }
  }

  return edges;
}

/**
 * Apply median filter for noise reduction
 */
function applyMedianFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Process each color channel separately
      for (let c = 0; c < 3; c++) {
        const values: number[] = [];

        // Gather values in neighborhood
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = Math.min(Math.max(y + dy, 0), height - 1);
            const nx = Math.min(Math.max(x + dx, 0), width - 1);
            const nIdx = (ny * width + nx) * 4 + c;

            values.push(data[nIdx]);
          }
        }

        // Sort values and take median
        values.sort((a, b) => a - b);
        output[idx + c] = values[Math.floor(values.length / 2)];
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Apply bilateral filter for edge-preserving noise reduction
 */
function applyBilateralFilter(
  data: Uint8ClampedArray,
  blurredData: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = 2;
  const colorSigma = 30.0;
  const spaceSigma = 3.0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Process each color channel separately
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let totalWeight = 0;

        // Apply bilateral filter
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = Math.min(Math.max(y + dy, 0), height - 1);
            const nx = Math.min(Math.max(x + dx, 0), width - 1);
            const nIdx = (ny * width + nx) * 4 + c;

            // Calculate spatial weight
            const spatialDist = dx * dx + dy * dy;
            const spatialWeight = Math.exp(
              -spatialDist / (2 * spaceSigma * spaceSigma),
            );

            // Calculate color weight
            const colorDist = Math.abs(data[idx + c] - data[nIdx]);
            const colorWeight = Math.exp(
              -colorDist / (2 * colorSigma * colorSigma),
            );

            // Combined weight
            const weight = spatialWeight * colorWeight;

            sum += data[nIdx] * weight;
            totalWeight += weight;
          }
        }

        // Normalize and set output
        output[idx + c] =
          totalWeight > 0 ? sum / totalWeight : blurredData[idx + c];
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Apply sharpening filter
 */
function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const kernel = [
    -strength,
    -strength,
    -strength,
    -strength,
    1 + 8 * strength,
    -strength,
    -strength,
    -strength,
    -strength,
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Process each color channel separately
      for (let c = 0; c < 3; c++) {
        let sum = 0;

        // Apply convolution
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[nIdx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }

        // Clamp values
        output[idx + c] = Math.min(255, Math.max(0, sum));
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}
