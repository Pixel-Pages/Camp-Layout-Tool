import type { Point, Size } from '../domain/types';

export const snapPointToGrid = (point: Point, gridSize: number): Point => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize,
});

export const offsetPoint = (point: Point, delta: Point): Point => ({
  x: point.x + delta.x,
  y: point.y + delta.y,
});

export const clampSize = (size: Size, minWidth = 12, minHeight = 12): Size => ({
  width: Math.max(minWidth, size.width),
  height: Math.max(minHeight, size.height),
});
