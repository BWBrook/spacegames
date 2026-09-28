export interface Frame {
  id: string;
  title: string;
  /** What the frame tests, shown under it. */
  note: string;
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void;
}
