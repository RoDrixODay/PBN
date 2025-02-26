import { Region } from "../types";

export interface ColorPalette {
  name: string;
  colors: string[];
  isAccessible?: boolean;
}

export interface ColorHarmony {
  name: string;
  colors: string[];
}

export class ColorPaletteManager {
  private currentPalette: ColorPalette;
  private history: ColorPalette[] = [];
  private historyIndex = -1;

  constructor(initialPalette?: ColorPalette) {
    this.currentPalette = initialPalette || this.generateDefaultPalette();
  }

  public generateHarmonies(baseColor: string): ColorHarmony[] {
    const hsl = this.hexToHSL(baseColor);
    return [
      {
        name: "Complementary",
        colors: [
          baseColor,
          this.hslToHex((hsl[0] + 180) % 360, hsl[1], hsl[2]),
        ],
      },
      {
        name: "Triadic",
        colors: [
          baseColor,
          this.hslToHex((hsl[0] + 120) % 360, hsl[1], hsl[2]),
          this.hslToHex((hsl[0] + 240) % 360, hsl[1], hsl[2]),
        ],
      },
      {
        name: "Analogous",
        colors: [
          this.hslToHex((hsl[0] - 30 + 360) % 360, hsl[1], hsl[2]),
          baseColor,
          this.hslToHex((hsl[0] + 30) % 360, hsl[1], hsl[2]),
        ],
      },
    ];
  }

  public generateAccessiblePalette(regions: Region[]): ColorPalette {
    const colors = regions.map((region) => {
      const rgb = region.color;
      return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    });

    // Ensure sufficient contrast between adjacent colors
    const accessibleColors = colors.map((color, i) => {
      const prevColor = colors[(i - 1 + colors.length) % colors.length];
      const nextColor = colors[(i + 1) % colors.length];

      if (
        !this.hasGoodContrast(color, prevColor) ||
        !this.hasGoodContrast(color, nextColor)
      ) {
        return this.adjustForContrast(color, [prevColor, nextColor]);
      }
      return color;
    });

    return {
      name: "Accessible Palette",
      colors: accessibleColors,
      isAccessible: true,
    };
  }

  public generateColorBlindFriendlyPalette(colorCount: number): ColorPalette {
    // Use a color-blind friendly palette (Wong, 2011)
    const baseColors = [
      "#000000", // black
      "#E69F00", // orange
      "#56B4E9", // sky blue
      "#009E73", // bluish green
      "#F0E442", // yellow
      "#0072B2", // blue
      "#D55E00", // vermillion
      "#CC79A7", // reddish purple
    ];

    // If we need more colors, generate variations
    const colors = [...baseColors];
    while (colors.length < colorCount) {
      const baseColor = baseColors[colors.length % baseColors.length];
      const hsl = this.hexToHSL(baseColor);
      colors.push(this.hslToHex(hsl[0], hsl[1], Math.max(20, hsl[2] - 20)));
    }

    return {
      name: "Color Blind Friendly",
      colors: colors.slice(0, colorCount),
      isAccessible: true,
    };
  }

  public undo(): ColorPalette | null {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentPalette = this.history[this.historyIndex];
      return this.currentPalette;
    }
    return null;
  }

  public redo(): ColorPalette | null {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentPalette = this.history[this.historyIndex];
      return this.currentPalette;
    }
    return null;
  }

  private generateDefaultPalette(): ColorPalette {
    return {
      name: "Default",
      colors: [
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#FFA500",
        "#800080",
      ],
    };
  }

  private hasGoodContrast(color1: string, color2: string): boolean {
    const l1 = this.getRelativeLuminance(this.hexToRGB(color1));
    const l2 = this.getRelativeLuminance(this.hexToRGB(color2));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio >= 3; // WCAG AA standard for large text
  }

  private adjustForContrast(color: string, neighbors: string[]): string {
    const rgb = this.hexToRGB(color);
    const hsl = this.rgbToHSL(rgb[0], rgb[1], rgb[2]);

    // Try adjusting lightness until we find good contrast
    for (let i = 0; i < 10; i++) {
      const lighter = this.hslToHex(
        hsl[0],
        hsl[1],
        Math.min(95, hsl[2] + i * 5),
      );
      const darker = this.hslToHex(hsl[0], hsl[1], Math.max(5, hsl[2] - i * 5));

      if (neighbors.every((n) => this.hasGoodContrast(lighter, n)))
        return lighter;
      if (neighbors.every((n) => this.hasGoodContrast(darker, n)))
        return darker;
    }

    return color; // If we can't find better contrast, return original
  }

  // Color conversion utilities
  private hexToRGB(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  private hexToHSL(hex: string): [number, number, number] {
    const rgb = this.hexToRGB(hex);
    return this.rgbToHSL(rgb[0], rgb[1], rgb[2]);
  }

  private rgbToHSL(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  private hslToHex(h: number, s: number, l: number): string {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return this.rgbToHex(
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
    );
  }

  private getRelativeLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}
