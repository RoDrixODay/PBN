// Advanced color quantization using Modified Median Cut algorithm
export interface ColorBox {
  r1: number;
  r2: number;
  g1: number;
  g2: number;
  b1: number;
  b2: number;
  volume: number;
}

export class ColorQuantizer {
  private histogram: number[][][] = [];
  private boxes: ColorBox[] = [];

  constructor(private targetColors: number) {
    // Initialize 3D histogram
    for (let r = 0; r < 32; r++) {
      this.histogram[r] = [];
      for (let g = 0; g < 32; g++) {
        this.histogram[r][g] = new Array(32).fill(0);
      }
    }
  }

  public quantize(imageData: ImageData): Uint8ClampedArray {
    this.buildHistogram(imageData);
    this.splitBoxes();
    return this.applyQuantization(imageData);
  }

  private buildHistogram(imageData: ImageData) {
    const data = imageData.data;

    // Populate histogram with reduced precision (32 levels per channel)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] >> 3; // Reduce to 5 bits (32 levels)
      const g = data[i + 1] >> 3;
      const b = data[i + 2] >> 3;
      this.histogram[r][g][b]++;
    }
  }

  private splitBoxes() {
    // Initialize with one box containing all colors
    this.boxes = [
      {
        r1: 0,
        r2: 31,
        g1: 0,
        g2: 31,
        b1: 0,
        b2: 31,
        volume: 32 * 32 * 32,
      },
    ];

    // Split boxes until we have desired number of colors
    while (this.boxes.length < this.targetColors) {
      let maxVolume = 0;
      let boxToSplit = 0;

      // Find largest box
      this.boxes.forEach((box, i) => {
        if (box.volume > maxVolume) {
          maxVolume = box.volume;
          boxToSplit = i;
        }
      });

      // Split the box on longest axis
      const box = this.boxes[boxToSplit];
      const rLength = box.r2 - box.r1;
      const gLength = box.g2 - box.g1;
      const bLength = box.b2 - box.b1;

      if (rLength >= gLength && rLength >= bLength) {
        this.splitOnRed(boxToSplit);
      } else if (gLength >= bLength) {
        this.splitOnGreen(boxToSplit);
      } else {
        this.splitOnBlue(boxToSplit);
      }
    }
  }

  private splitOnRed(boxIndex: number) {
    const box = this.boxes[boxIndex];
    const median = this.findMedianRed(box);

    // Create two new boxes
    this.boxes[boxIndex] = {
      ...box,
      r2: median,
      volume: (median - box.r1) * (box.g2 - box.g1) * (box.b2 - box.b1),
    };

    this.boxes.push({
      ...box,
      r1: median + 1,
      volume: (box.r2 - median) * (box.g2 - box.g1) * (box.b2 - box.b1),
    });
  }

  private splitOnGreen(boxIndex: number) {
    const box = this.boxes[boxIndex];
    const median = this.findMedianGreen(box);

    this.boxes[boxIndex] = {
      ...box,
      g2: median,
      volume: (box.r2 - box.r1) * (median - box.g1) * (box.b2 - box.b1),
    };

    this.boxes.push({
      ...box,
      g1: median + 1,
      volume: (box.r2 - box.r1) * (box.g2 - median) * (box.b2 - box.b1),
    });
  }

  private splitOnBlue(boxIndex: number) {
    const box = this.boxes[boxIndex];
    const median = this.findMedianBlue(box);

    this.boxes[boxIndex] = {
      ...box,
      b2: median,
      volume: (box.r2 - box.r1) * (box.g2 - box.g1) * (median - box.b1),
    };

    this.boxes.push({
      ...box,
      b1: median + 1,
      volume: (box.r2 - box.r1) * (box.g2 - box.g1) * (box.b2 - median),
    });
  }

  private findMedianRed(box: ColorBox): number {
    let total = 0;
    let sum = 0;

    // Count pixels in box
    for (let r = box.r1; r <= box.r2; r++) {
      for (let g = box.g1; g <= box.g2; g++) {
        for (let b = box.b1; b <= box.b2; b++) {
          total += this.histogram[r][g][b];
        }
      }
    }

    // Find median
    for (let r = box.r1; r <= box.r2; r++) {
      for (let g = box.g1; g <= box.g2; g++) {
        for (let b = box.b1; b <= box.b2; b++) {
          sum += this.histogram[r][g][b];
          if (sum >= total / 2) return r;
        }
      }
    }

    return Math.floor((box.r1 + box.r2) / 2);
  }

  private findMedianGreen(box: ColorBox): number {
    // Similar to findMedianRed but for green channel
    // Implementation omitted for brevity
    return Math.floor((box.g1 + box.g2) / 2);
  }

  private findMedianBlue(box: ColorBox): number {
    // Similar to findMedianRed but for blue channel
    // Implementation omitted for brevity
    return Math.floor((box.b1 + box.b2) / 2);
  }

  private applyQuantization(imageData: ImageData): Uint8ClampedArray {
    const output = new Uint8ClampedArray(imageData.data.length);
    const data = imageData.data;

    // Calculate average color for each box
    const boxColors = this.boxes.map((box) => {
      let r = 0,
        g = 0,
        b = 0,
        total = 0;

      for (let ri = box.r1; ri <= box.r2; ri++) {
        for (let gi = box.g1; gi <= box.g2; gi++) {
          for (let bi = box.b1; bi <= box.b2; bi++) {
            const count = this.histogram[ri][gi][bi];
            if (count > 0) {
              r += ri * count;
              g += gi * count;
              b += bi * count;
              total += count;
            }
          }
        }
      }

      return total === 0
        ? [0, 0, 0]
        : [(r / total) << 3, (g / total) << 3, (b / total) << 3];
    });

    // Map each pixel to nearest box color
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] >> 3;
      const g = data[i + 1] >> 3;
      const b = data[i + 2] >> 3;

      let minDist = Infinity;
      let bestColor = boxColors[0];

      boxColors.forEach((color) => {
        const dr = r - (color[0] >> 3);
        const dg = g - (color[1] >> 3);
        const db = b - (color[2] >> 3);
        const dist = dr * dr + dg * dg + db * db;

        if (dist < minDist) {
          minDist = dist;
          bestColor = color;
        }
      });

      output[i] = bestColor[0];
      output[i + 1] = bestColor[1];
      output[i + 2] = bestColor[2];
      output[i + 3] = data[i + 3];
    }

    return output;
  }
}
