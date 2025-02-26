import { useCallback } from "react";

export interface PrintOptions {
  highContrast?: boolean;
  includeColorGuide?: boolean;
  pageSize?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
}

export function usePrintFormat() {
  const preparePrintVersion = useCallback(
    (canvas: HTMLCanvasElement, options: PrintOptions = {}) => {
      const printCanvas = document.createElement("canvas");
      const ctx = printCanvas.getContext("2d");
      if (!ctx) return null;

      // Set print dimensions
      const dpi = 300;
      const width = options.pageSize === "letter" ? 8.5 * dpi : 8.27 * dpi;
      const height = options.pageSize === "letter" ? 11 * dpi : 11.69 * dpi;

      printCanvas.width = options.orientation === "landscape" ? height : width;
      printCanvas.height = options.orientation === "landscape" ? width : height;

      // Fill background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);

      // Draw image
      const scale = Math.min(
        printCanvas.width / canvas.width,
        printCanvas.height / canvas.height,
      );

      const x = (printCanvas.width - canvas.width * scale) / 2;
      const y = (printCanvas.height - canvas.height * scale) / 2;

      ctx.drawImage(canvas, x, y, canvas.width * scale, canvas.height * scale);

      if (options.highContrast) {
        const imageData = ctx.getImageData(
          0,
          0,
          printCanvas.width,
          printCanvas.height,
        );
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const value = avg < 128 ? 0 : 255;
          data[i] = data[i + 1] = data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      return printCanvas;
    },
    [],
  );

  const print = useCallback(
    (canvas: HTMLCanvasElement, options: PrintOptions = {}) => {
      const printCanvas = preparePrintVersion(canvas, options);
      if (!printCanvas) return;

      const dataUrl = printCanvas.toDataURL("image/png");
      const windowContent = `
      <html>
        <body style="margin: 0; padding: 0;">
          <img src="${dataUrl}" style="width: 100%; height: 100%;" />
        </body>
      </html>
    `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(windowContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    },
    [preparePrintVersion],
  );

  return { preparePrintVersion, print };
}
