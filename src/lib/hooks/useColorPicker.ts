import { useState, useCallback } from "react";

export function useColorPicker() {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const pickColor = useCallback(
    (canvas: HTMLCanvasElement, x: number, y: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      setSelectedColor(color);
      return color;
    },
    [],
  );

  return {
    selectedColor,
    pickColor,
    setSelectedColor,
  };
}
