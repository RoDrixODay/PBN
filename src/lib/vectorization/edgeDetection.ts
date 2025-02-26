export interface EdgeDetectionOptions {
  threshold?: number;
  blurRadius?: number;
  strengthMultiplier?: number;
}

export class EdgeDetector {
  private gaussianKernel: number[] = [];

  constructor(private options: EdgeDetectionOptions = {}) {
    const { threshold = 30, blurRadius = 1, strengthMultiplier = 1 } = options;

    this.options = { threshold, blurRadius, strengthMultiplier };
    this.generateGaussianKernel();
  }

  private generateGaussianKernel() {
    const radius = this.options.blurRadius;
    const size = radius * 2 + 1;
    const kernel = new Array(size * size);
    let sigma = radius / 3;
    let sum = 0;

    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const exponent = -(x * x + y * y) / (2 * sigma * sigma);
        const value = Math.exp(exponent) / (2 * Math.PI * sigma * sigma);
        kernel[(y + radius) * size + (x + radius)] = value;
        sum += value;
      }
    }

    // Normalize kernel
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }

    this.gaussianKernel = kernel;
  }

  public detectEdges(imageData: ImageData): Uint8ClampedArray {
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const blurred = this.applyGaussianBlur(imageData);

    // Sobel operators
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let gx = 0,
          gy = 0;

        // Apply Sobel operators
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4;
            const value =
              (blurred[pixel] + blurred[pixel + 1] + blurred[pixel + 2]) / 3;

            gx += value * sobelX[(ky + 1) * 3 + (kx + 1)];
            gy += value * sobelY[(ky + 1) * 3 + (kx + 1)];
          }
        }

        // Calculate gradient magnitude
        const magnitude =
          Math.sqrt(gx * gx + gy * gy) * this.options.strengthMultiplier;

        // Apply threshold
        if (magnitude > this.options.threshold) {
          output[idx] = output[idx + 1] = output[idx + 2] = 0;
          output[idx + 3] = 255;
        } else {
          output[idx] = output[idx + 1] = output[idx + 2] = 255;
          output[idx + 3] = 0;
        }
      }
    }

    return output;
  }

  private applyGaussianBlur(imageData: ImageData): Uint8ClampedArray {
    const { width, height, data } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const radius = this.options.blurRadius;
    const size = radius * 2 + 1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let r = 0,
          g = 0,
          b = 0;

        // Apply kernel
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const pixelY = Math.min(Math.max(y + ky, 0), height - 1);
            const pixelX = Math.min(Math.max(x + kx, 0), width - 1);
            const pixel = (pixelY * width + pixelX) * 4;
            const weight =
              this.gaussianKernel[(ky + radius) * size + (kx + radius)];

            r += data[pixel] * weight;
            g += data[pixel + 1] * weight;
            b += data[pixel + 2] * weight;
          }
        }

        output[idx] = r;
        output[idx + 1] = g;
        output[idx + 2] = b;
        output[idx + 3] = data[idx + 3];
      }
    }

    return output;
  }
}
