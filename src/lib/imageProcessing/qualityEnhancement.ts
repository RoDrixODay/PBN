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
    // First apply a subtle blur to reduce noise while preserving edges
    tempCtx.filter = "blur(1.2px)";
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.filter = "none";

    // Get blurred data
    const blurredData = tempCtx.getImageData(0, 0, width, height).data;

    // Apply enhanced bilateral filter with improved parameters
    const outputData = applyEnhancedBilateralFilter(
      data,
      blurredData,
      width,
      height,
    );

    // Apply a final pass of selective sharpening to maintain details
    const sharpenedData = applySelectiveSharpening(outputData, width, height);

    ctx.putImageData(new ImageData(sharpenedData, width, height), 0, 0);
  }
}

/**
 * Apply upscaling to image
 * Uses advanced multi-step upscaling with detail preservation and outline enhancement
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

  try {
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

    // First enhance edges in the original image to make them clearer
    const edgeEnhancedData = enhanceEdges(data, width, height);
    tempCtx.putImageData(new ImageData(edgeEnhancedData, width, height), 0, 0);

    // Apply multi-step upscaling for better quality
    if (scaleFactor > 2) {
      // For 400%, do it in two steps for better quality
      const intermediateCanvas = document.createElement("canvas");
      intermediateCanvas.width = width * 2;
      intermediateCanvas.height = height * 2;
      const intermediateCtx = intermediateCanvas.getContext("2d")!;

      // First step: 100% -> 200%
      intermediateCtx.imageSmoothingEnabled = true;
      intermediateCtx.imageSmoothingQuality = "high";
      intermediateCtx.drawImage(
        tempCanvas,
        0,
        0,
        intermediateCanvas.width,
        intermediateCanvas.height,
      );

      // Apply detail enhancement at intermediate step
      const intermediateData = intermediateCtx.getImageData(
        0,
        0,
        intermediateCanvas.width,
        intermediateCanvas.height,
      );
      const enhancedData = applyDetailEnhancement(
        intermediateData.data,
        intermediateCanvas.width,
        intermediateCanvas.height,
      );
      intermediateCtx.putImageData(
        new ImageData(
          enhancedData,
          intermediateCanvas.width,
          intermediateCanvas.height,
        ),
        0,
        0,
      );

      // Second step: 200% -> 400%
      scaledCtx.imageSmoothingEnabled = true;
      scaledCtx.imageSmoothingQuality = "high";
      scaledCtx.drawImage(
        intermediateCanvas,
        0,
        0,
        scaledCanvas.width,
        scaledCanvas.height,
      );
    } else {
      // For 200%, do it in one step
      scaledCtx.imageSmoothingEnabled = true;
      scaledCtx.imageSmoothingQuality = "high";
      scaledCtx.drawImage(
        tempCanvas,
        0,
        0,
        scaledCanvas.width,
        scaledCanvas.height,
      );
    }

    // Apply final detail enhancement
    const scaledData = scaledCtx.getImageData(
      0,
      0,
      scaledCanvas.width,
      scaledCanvas.height,
    );

    // Apply outline enhancement to make edges more visible
    const outlineEnhancedData = enhanceOutlines(
      scaledData.data,
      scaledCanvas.width,
      scaledCanvas.height,
    );

    // Apply edge-aware sharpening to maintain details
    const sharpenedData = applyEdgeAwareSharpening(
      outlineEnhancedData,
      scaledCanvas.width,
      scaledCanvas.height,
      0.5, // Increased sharpening strength for clearer outlines
    );

    // Update canvas with upscaled image
    ctx.canvas.width = scaledCanvas.width;
    ctx.canvas.height = scaledCanvas.height;
    ctx.putImageData(
      new ImageData(sharpenedData, scaledCanvas.width, scaledCanvas.height),
      0,
      0,
    );
  } catch (error) {
    console.error("Error during upscaling:", error);
  }
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
 * Apply enhanced bilateral filter for edge-preserving noise reduction
 * with improved parameters for better quality
 */
function applyEnhancedBilateralFilter(
  data: Uint8ClampedArray,
  blurredData: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = 3; // Increased radius for better smoothing
  const colorSigma = 25.0; // Adjusted for better edge preservation
  const spaceSigma = 3.5; // Slightly increased for smoother results

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Process each color channel separately
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let totalWeight = 0;

        // Apply bilateral filter with adaptive sampling
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            // Skip pixels outside the circular kernel for better quality
            if (dx * dx + dy * dy > radius * radius) continue;

            const ny = Math.min(Math.max(y + dy, 0), height - 1);
            const nx = Math.min(Math.max(x + dx, 0), width - 1);
            const nIdx = (ny * width + nx) * 4 + c;

            // Calculate spatial weight with improved Gaussian function
            const spatialDist = dx * dx + dy * dy;
            const spatialWeight = Math.exp(
              -spatialDist / (2 * spaceSigma * spaceSigma),
            );

            // Calculate color weight with adaptive range
            const colorDist = Math.abs(data[idx + c] - data[nIdx]);
            // Adjust color sigma based on local contrast
            const adaptiveColorSigma =
              colorSigma * (1 + (colorDist / 255) * 0.5);
            const colorWeight = Math.exp(
              -colorDist / (2 * adaptiveColorSigma * adaptiveColorSigma),
            );

            // Combined weight with edge-preserving factor
            const weight = spatialWeight * colorWeight;

            sum += data[nIdx] * weight;
            totalWeight += weight;
          }
        }

        // Normalize and set output with fallback to blurred data
        output[idx + c] =
          totalWeight > 0
            ? Math.round(sum / totalWeight)
            : blurredData[idx + c];
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Apply selective sharpening to maintain details after noise reduction
 */
function applySelectiveSharpening(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const edgeThreshold = 20; // Threshold for edge detection
  const sharpenStrength = 0.4; // Strength of sharpening effect (0.0-1.0)

  // Sharpening kernel
  const kernel = [
    -sharpenStrength,
    -sharpenStrength,
    -sharpenStrength,
    -sharpenStrength,
    1 + 8 * sharpenStrength,
    -sharpenStrength,
    -sharpenStrength,
    -sharpenStrength,
    -sharpenStrength,
  ];

  // First pass: detect edges
  const edges = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Simple edge detection using Sobel-like approach
      let edgeStrength = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const diff =
            Math.abs(data[idx] - data[nIdx]) +
            Math.abs(data[idx + 1] - data[nIdx + 1]) +
            Math.abs(data[idx + 2] - data[nIdx + 2]);

          edgeStrength = Math.max(edgeStrength, diff);
        }
      }

      // Mark as edge if strength exceeds threshold
      edges[y * width + x] = edgeStrength > edgeThreshold ? 1 : 0;
    }
  }

  // Second pass: apply sharpening only to edge areas
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const pixelIdx = y * width + x;

      // Check if this is an edge area (including nearby pixels)
      let isEdgeArea = edges[pixelIdx] === 1;
      if (!isEdgeArea) {
        // Check neighboring pixels
        for (let dy = -1; dy <= 1 && !isEdgeArea; dy++) {
          for (let dx = -1; dx <= 1 && !isEdgeArea; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              isEdgeArea = edges[ny * width + nx] === 1;
            }
          }
        }
      }

      if (isEdgeArea) {
        // Apply sharpening to edge areas
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let ki = 0;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = Math.min(Math.max(y + dy, 0), height - 1);
              const nx = Math.min(Math.max(x + dx, 0), width - 1);
              const nIdx = (ny * width + nx) * 4 + c;

              sum += data[nIdx] * kernel[ki++];
            }
          }

          // Clamp values
          output[idx + c] = Math.min(255, Math.max(0, Math.round(sum)));
        }
      } else {
        // Copy original data for non-edge areas
        output[idx] = data[idx];
        output[idx + 1] = data[idx + 1];
        output[idx + 2] = data[idx + 2];
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Apply detail enhancement to upscaled image
 * Enhances fine details and textures that might be lost during upscaling
 */
function applyDetailEnhancement(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);

  // First pass: detect edges and fine details
  const details = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;

      // Calculate local variance as a measure of detail
      let sum = 0,
        sumSq = 0,
        count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = (ny * width + nx) * 4;
            const val = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
            sum += val;
            sumSq += val * val;
            count++;
          }
        }
      }

      const mean = sum / count;
      const variance = Math.sqrt(sumSq / count - mean * mean);
      details[idx] = variance;
    }
  }

  // Second pass: enhance details based on local variance
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const detailLevel =
        y > 0 && y < height - 1 && x > 0 && x < width - 1
          ? details[y * width + x]
          : 0;

      // Apply adaptive enhancement based on detail level
      const enhancementFactor = Math.min(1.0, detailLevel / 30) * 0.3 + 0.7;

      for (let c = 0; c < 3; c++) {
        // Apply contrast enhancement to areas with details
        const val = data[idx + c];
        const enhanced = ((val / 255 - 0.5) * enhancementFactor + 0.5) * 255;
        output[idx + c] = Math.min(255, Math.max(0, enhanced));
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Enhance edges in the original image before upscaling
 * Makes edges more defined for better preservation during upscaling
 */
function enhanceEdges(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);

  // First pass: detect edges
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel edge detection
      let gx = 0,
        gy = 0;
      for (let c = 0; c < 3; c++) {
        const tl = ((y - 1) * width + (x - 1)) * 4 + c;
        const t = ((y - 1) * width + x) * 4 + c;
        const tr = ((y - 1) * width + (x + 1)) * 4 + c;
        const l = (y * width + (x - 1)) * 4 + c;
        const r = (y * width + (x + 1)) * 4 + c;
        const bl = ((y + 1) * width + (x - 1)) * 4 + c;
        const b = ((y + 1) * width + x) * 4 + c;
        const br = ((y + 1) * width + (x + 1)) * 4 + c;

        // Horizontal gradient (Sobel)
        const gxVal = tr + 2 * r + br - (tl + 2 * l + bl);
        // Vertical gradient (Sobel)
        const gyVal = bl + 2 * b + br - (tl + 2 * t + tr);

        gx += gxVal;
        gy += gyVal;
      }

      // Calculate edge magnitude
      edges[idx] = Math.sqrt(gx * gx + gy * gy) / 3; // Average across channels
    }
  }

  // Second pass: enhance edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const edgeIdx = y * width + x;

      // Copy original pixel data
      output[idx] = data[idx];
      output[idx + 1] = data[idx + 1];
      output[idx + 2] = data[idx + 2];
      output[idx + 3] = data[idx + 3];

      // Only process valid edge pixels
      if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
        const edgeStrength = edges[edgeIdx];

        // If this is an edge pixel, enhance the contrast
        if (edgeStrength > 30) {
          // Threshold for edge detection
          // Increase contrast at edges to make them more defined
          for (let c = 0; c < 3; c++) {
            const val = data[idx + c];
            // Increase contrast by pushing values away from middle gray
            const enhanced =
              val < 128
                ? Math.max(0, val - edgeStrength * 0.2)
                : Math.min(255, val + edgeStrength * 0.2);
            output[idx + c] = enhanced;
          }
        }
      }
    }
  }

  return output;
}

/**
 * Enhance outlines in the upscaled image
 * Makes contours more visible for paint-by-numbers style
 */
function enhanceOutlines(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);

  // First pass: detect edges with higher sensitivity
  const edges = new Float32Array(width * height);
  const directions = new Float32Array(width * height); // Store edge directions

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel edge detection with higher sensitivity
      let gx = 0,
        gy = 0;
      for (let c = 0; c < 3; c++) {
        const tl = ((y - 1) * width + (x - 1)) * 4 + c;
        const t = ((y - 1) * width + x) * 4 + c;
        const tr = ((y - 1) * width + (x + 1)) * 4 + c;
        const l = (y * width + (x - 1)) * 4 + c;
        const r = (y * width + (x + 1)) * 4 + c;
        const bl = ((y + 1) * width + (x - 1)) * 4 + c;
        const b = ((y + 1) * width + x) * 4 + c;
        const br = ((y + 1) * width + (x + 1)) * 4 + c;

        // Horizontal gradient (Sobel)
        const gxVal = tr + 2 * r + br - (tl + 2 * l + bl);
        // Vertical gradient (Sobel)
        const gyVal = bl + 2 * b + br - (tl + 2 * t + tr);

        gx += gxVal;
        gy += gyVal;
      }

      // Calculate edge magnitude and direction
      const magnitude = Math.sqrt(gx * gx + gy * gy) / 3;
      edges[idx] = magnitude;
      directions[idx] = Math.atan2(gy, gx); // Store direction for line enhancement
    }
  }

  // Second pass: non-maximum suppression to thin edges
  const thinEdges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const angle = directions[idx];

      // Convert angle to 0, 45, 90, or 135 degrees
      const sector = Math.round((angle * 4) / Math.PI) % 4;

      // Get indices of pixels in the gradient direction
      let idx1, idx2;
      switch (sector) {
        case 0: // 0 degrees - horizontal
          idx1 = y * width + (x - 1);
          idx2 = y * width + (x + 1);
          break;
        case 1: // 45 degrees - diagonal
          idx1 = (y - 1) * width + (x + 1);
          idx2 = (y + 1) * width + (x - 1);
          break;
        case 2: // 90 degrees - vertical
          idx1 = (y - 1) * width + x;
          idx2 = (y + 1) * width + x;
          break;
        default: // 135 degrees - diagonal
          idx1 = (y - 1) * width + (x - 1);
          idx2 = (y + 1) * width + (x + 1);
          break;
      }

      // Non-maximum suppression
      if (edges[idx] >= edges[idx1] && edges[idx] >= edges[idx2]) {
        thinEdges[idx] = edges[idx];
      } else {
        thinEdges[idx] = 0;
      }
    }
  }

  // Third pass: apply hysteresis thresholding to connect edges
  const highThreshold = 50;
  const lowThreshold = 20;
  const finalEdges = new Uint8Array(width * height);

  // First mark strong edges
  for (let i = 0; i < thinEdges.length; i++) {
    if (thinEdges[i] >= highThreshold) {
      finalEdges[i] = 255;
    }
  }

  // Then trace weak edges connected to strong edges
  let edgeChanged = true;
  while (edgeChanged) {
    edgeChanged = false;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // Skip if already marked or below low threshold
        if (finalEdges[idx] === 255 || thinEdges[idx] < lowThreshold) continue;

        // Check 8-connected neighbors for strong edges
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nIdx = (y + dy) * width + (x + dx);
            if (finalEdges[nIdx] === 255) {
              finalEdges[idx] = 255;
              edgeChanged = true;
              break;
            }
          }
          if (finalEdges[idx] === 255) break;
        }
      }
    }
  }

  // Fourth pass: enhance the original image with the detected edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const edgeIdx = y * width + x;

      // Copy original pixel data
      output[idx] = data[idx];
      output[idx + 1] = data[idx + 1];
      output[idx + 2] = data[idx + 2];
      output[idx + 3] = data[idx + 3];

      // If this is an edge pixel, enhance it
      if (finalEdges[edgeIdx] === 255) {
        // Make edges darker to create clear outlines
        for (let c = 0; c < 3; c++) {
          // Darken the edge pixel
          output[idx + c] = Math.max(0, data[idx + c] - 40);
        }
      }
    }
  }

  return output;
}

/**
 * Apply edge-aware sharpening filter
 * Sharpens details while avoiding noise amplification
 */
function applyEdgeAwareSharpening(
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

  // First pass: detect edges
  const edges = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel edge detection
      let gx = 0,
        gy = 0;
      for (let c = 0; c < 3; c++) {
        const tl = ((y - 1) * width + (x - 1)) * 4 + c;
        const t = ((y - 1) * width + x) * 4 + c;
        const tr = ((y - 1) * width + (x + 1)) * 4 + c;
        const l = (y * width + (x - 1)) * 4 + c;
        const r = (y * width + (x + 1)) * 4 + c;
        const bl = ((y + 1) * width + (x - 1)) * 4 + c;
        const b = ((y + 1) * width + x) * 4 + c;
        const br = ((y + 1) * width + (x + 1)) * 4 + c;

        // Horizontal gradient
        const gxVal = tr + 2 * r + br - (tl + 2 * l + bl);
        // Vertical gradient
        const gyVal = bl + 2 * b + br - (tl + 2 * t + tr);

        gx += gxVal;
        gy += gyVal;
      }

      // Calculate edge magnitude
      edges[idx] = Math.sqrt(gx * gx + gy * gy) / 3; // Average across channels
    }
  }

  // Second pass: apply adaptive sharpening based on edge strength
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const edgeStrength = edges[y * width + x];

      // Adjust sharpening strength based on edge detection
      // Stronger sharpening on edges, gentler in flat areas
      const adaptiveStrength = Math.min(1.0, edgeStrength / 100) * strength;

      // Process each color channel separately
      for (let c = 0; c < 3; c++) {
        let sum = 0;

        // Apply convolution with adaptive kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelValue =
              ky === 0 && kx === 0
                ? 1 + 8 * adaptiveStrength
                : -adaptiveStrength;
            sum += data[nIdx] * kernelValue;
          }
        }

        // Clamp values
        output[idx + c] = Math.min(255, Math.max(0, Math.round(sum)));
      }

      // Copy alpha channel
      output[idx + 3] = data[idx + 3];
    }
  }

  return output;
}

/**
 * Apply standard sharpening filter
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
