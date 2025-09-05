type SeriesSize = 'sm' | 'md' | 'lg';

export interface SimpleOptions {
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}

export interface ThreeDOptions {
  shapeType: 'sphere' | 'cube' | 'cone' | 'custom';
  customModelUrl?: string;
  scale: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  showNegativeAxes: boolean;
  shapeColor: string;
}  