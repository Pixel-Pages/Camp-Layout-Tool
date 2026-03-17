import type { Point, ShapeKind, Size } from '../domain/types';

export type SceneBoundaryShape = 'rect' | 'ellipse' | 'hex';

export const getTentOutlinePoints = (width: number, height: number): number[] => {
  const inset = Math.min(width * 0.08, 20);
  return [
    -width / 2 + inset,
    -height / 2,
    width / 2 - inset,
    -height / 2,
    width / 2,
    0,
    width / 2 - inset,
    height / 2,
    -width / 2 + inset,
    height / 2,
    -width / 2,
    0,
  ];
};

export const getTentHexPoints = (width: number, height: number): number[] => [
  -width * 0.28,
  -height / 2,
  width * 0.28,
  -height / 2,
  width / 2,
  0,
  width * 0.28,
  height / 2,
  -width * 0.28,
  height / 2,
  -width / 2,
  0,
];

export const getSceneBoundaryShape = (shape?: ShapeKind): SceneBoundaryShape => {
  if (shape === 'tent-dome') {
    return 'ellipse';
  }

  if (shape === 'tent-hex') {
    return 'hex';
  }

  return 'rect';
};

const getSceneHexPoints = (size: Size): Point[] => [
  { x: size.width * 0.22, y: 0 },
  { x: size.width * 0.78, y: 0 },
  { x: size.width, y: size.height / 2 },
  { x: size.width * 0.78, y: size.height },
  { x: size.width * 0.22, y: size.height },
  { x: 0, y: size.height / 2 },
];

const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const currentPoint = polygon[current];
    const previousPoint = polygon[previous];

    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y || Number.EPSILON) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

export const isPointWithinSceneBoundary = (
  point: Point,
  size: Size,
  boundaryShape: SceneBoundaryShape,
): boolean => {
  if (point.x < 0 || point.y < 0 || point.x > size.width || point.y > size.height) {
    return false;
  }

  if (boundaryShape === 'ellipse') {
    const normalizedX = (point.x - size.width / 2) / (size.width / 2 || 1);
    const normalizedY = (point.y - size.height / 2) / (size.height / 2 || 1);
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  if (boundaryShape === 'hex') {
    return isPointInPolygon(point, getSceneHexPoints(size));
  }

  return true;
};

export const getSceneHexPointsFlat = (size: Size): number[] =>
  getSceneHexPoints(size).flatMap((point) => [point.x, point.y]);
