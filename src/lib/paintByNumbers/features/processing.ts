import { Region, ProcessingProgress } from '../types';
import { ColorQuantizer } from '../../vectorization/colorQuantization';

export interface ProcessingOptions {
  colorCount: number;
  detailLevel: number;
  useWorker?: boolean;
  autoAdjust?: boolean;
}

export class AdvancedProcessor {
  private worker: Worker | null = null;

  constructor(private options: ProcessingOptions) {
    if (options.useWorker) {
      this.initWorker();
    }
  }

  public async process(
    imageData: ImageData