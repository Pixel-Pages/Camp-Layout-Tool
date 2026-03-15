import type { Point, ViewportState } from '../domain/types';

export const BASE_PIXELS_PER_INCH = 0.55;
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 4;

export const createDefaultViewport = (): ViewportState => ({
  zoom: 1,
  offset: { x: 80, y: 80 },
});

export const sceneToScreen = (point: Point, viewport: ViewportState): Point => ({
  x: point.x * BASE_PIXELS_PER_INCH * viewport.zoom + viewport.offset.x,
  y: point.y * BASE_PIXELS_PER_INCH * viewport.zoom + viewport.offset.y,
});

export const screenToScene = (point: Point, viewport: ViewportState): Point => ({
  x: (point.x - viewport.offset.x) / (BASE_PIXELS_PER_INCH * viewport.zoom),
  y: (point.y - viewport.offset.y) / (BASE_PIXELS_PER_INCH * viewport.zoom),
});

export const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export const zoomViewportAtPoint = (
  viewport: ViewportState,
  screenPoint: Point,
  direction: number,
): ViewportState => {
  const nextZoom = clampZoom(viewport.zoom * (direction > 0 ? 0.9 : 1.1));
  const scenePoint = screenToScene(screenPoint, viewport);
  return {
    zoom: nextZoom,
    offset: {
      x: screenPoint.x - scenePoint.x * BASE_PIXELS_PER_INCH * nextZoom,
      y: screenPoint.y - scenePoint.y * BASE_PIXELS_PER_INCH * nextZoom,
    },
  };
};
