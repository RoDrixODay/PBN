import { Region, Point } from "../types";

export interface InteractionState {
  selectedRegion: Region | null;
  zoom: number;
  pan: Point;
  highlightedRegions: Set<number>;
}

export class InteractionManager {
  private state: InteractionState = {
    selectedRegion: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    highlightedRegions: new Set(),
  };

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private regions: Region[] = [];
  private isDragging = false;
  private lastMousePos: Point | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.setupEventListeners();
  }

  public setRegions(regions: Region[]) {
    this.regions = regions;
  }

  public highlightRegion(regionId: number) {
    this.state.highlightedRegions.add(regionId);
    this.redraw();
  }

  public unhighlightRegion(regionId: number) {
    this.state.highlightedRegions.delete(regionId);
    this.redraw();
  }

  public zoomTo(scale: number, center?: Point) {
    const oldZoom = this.state.zoom;
    this.state.zoom = Math.max(0.1, Math.min(5, scale));

    if (center) {
      // Adjust pan to keep the zoom centered on the given point
      const dx = center.x - this.canvas.width / 2;
      const dy = center.y - this.canvas.height / 2;
      this.state.pan.x -= dx * (this.state.zoom - oldZoom);
      this.state.pan.y -= dy * (this.state.zoom - oldZoom);
    }

    this.redraw();
  }

  public resetView() {
    this.state.zoom = 1;
    this.state.pan = { x: 0, y: 0 };
    this.redraw();
  }

  private setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("wheel", this.handleWheel);
    this.canvas.addEventListener("dblclick", this.handleDoubleClick);
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.lastMousePos = this.getMousePos(e);

    const clickedRegion = this.findRegionAtPoint(this.lastMousePos);
    if (clickedRegion) {
      this.state.selectedRegion = clickedRegion;
      this.redraw();
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const pos = this.getMousePos(e);

    if (this.isDragging && this.lastMousePos) {
      const dx = pos.x - this.lastMousePos.x;
      const dy = pos.y - this.lastMousePos.y;

      this.state.pan.x += dx;
      this.state.pan.y += dy;
      this.redraw();
    }

    this.lastMousePos = pos;

    // Highlight region under cursor
    const hoveredRegion = this.findRegionAtPoint(pos);
    if (hoveredRegion) {
      this.canvas.style.cursor = "pointer";
      if (!this.state.highlightedRegions.has(hoveredRegion.id)) {
        this.highlightRegion(hoveredRegion.id);
      }
    } else {
      this.canvas.style.cursor = "default";
    }
  };

  private handleMouseUp = () => {
    this.isDragging = false;
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomTo(this.state.zoom * delta, this.getMousePos(e));
  };

  private handleDoubleClick = () => {
    this.resetView();
  };

  private getMousePos(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.state.zoom - this.state.pan.x,
      y: (e.clientY - rect.top) / this.state.zoom - this.state.pan.y,
    };
  }

  private findRegionAtPoint(point: Point): Region | null {
    const transformedPoint = {
      x: point.x * this.state.zoom + this.state.pan.x,
      y: point.y * this.state.zoom + this.state.pan.y,
    };

    return (
      this.regions.find((region) => {
        const pixel =
          Math.floor(transformedPoint.y) * this.canvas.width +
          Math.floor(transformedPoint.x);
        return region.pixels.has(pixel);
      }) || null
    );
  }

  private redraw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply transformations
    this.ctx.save();
    this.ctx.translate(this.state.pan.x, this.state.pan.y);
    this.ctx.scale(this.state.zoom, this.state.zoom);

    // Draw regions
    this.regions.forEach((region) => {
      const isHighlighted = this.state.highlightedRegions.has(region.id);
      const isSelected = this.state.selectedRegion?.id === region.id;

      this.drawRegion(region, isHighlighted, isSelected);
    });

    this.ctx.restore();
  }

  private drawRegion(
    region: Region,
    isHighlighted: boolean,
    isSelected: boolean,
  ) {
    // Draw region fill
    this.ctx.fillStyle = `rgb(${region.color.join(",")})`;
    if (isHighlighted) {
      this.ctx.globalAlpha = 0.8;
    }
    this.ctx.beginPath();
    this.drawRegionPath(region);
    this.ctx.fill();

    // Draw region stroke
    if (isSelected || isHighlighted) {
      this.ctx.strokeStyle = isSelected ? "#ff0000" : "#000000";
      this.ctx.lineWidth = isSelected ? 2 : 1;
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawRegionPath(region: Region) {
    // Convert pixels to path
    const path: Point[] = [];
    const visited = new Set<number>();

    // Find boundary pixels
    region.pixels.forEach((pixel) => {
      const x = pixel % this.canvas.width;
      const y = Math.floor(pixel / this.canvas.width);

      if (!visited.has(pixel) && this.isOnBoundary(x, y, region)) {
        path.push({ x, y });
        visited.add(pixel);
      }
    });

    // Draw path
    if (path.length > 0) {
      this.ctx.moveTo(path[0].x, path[0].y);
      path.forEach((point) => this.ctx.lineTo(point.x, point.y));
      this.ctx.closePath();
    }
  }

  private isOnBoundary(x: number, y: number, region: Region): boolean {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const neighborPixel = (y + dy) * this.canvas.width + (x + dx);
        if (!region.pixels.has(neighborPixel)) {
          return true;
        }
      }
    }
    return false;
  }
}
