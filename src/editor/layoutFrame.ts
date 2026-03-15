import type { LayoutScene, Point, Size } from '../domain/types';

export interface LayoutFrameMetrics {
  sceneOrigin: Point;
  legendOrigin: Point;
  sheetSize: Size;
  legendWidth: number;
  titleHeight: number;
  scenePadding: number;
  sceneGap: number;
}

const SHEET_PADDING = 72;
const TITLE_HEIGHT = 70;
const INTERIOR_TITLE_HEIGHT = 40;
const LEGEND_WIDTH = 320;
const INTERIOR_LEGEND_WIDTH = 170;
const SECTION_GAP = 56;

export const getLayoutFrameMetrics = (
  scene: LayoutScene,
  showTitleAndKey: boolean,
  legendRowCount: number,
): LayoutFrameMetrics => {
  const titleHeight =
    showTitleAndKey ? (scene.kind === 'site' ? TITLE_HEIGHT : INTERIOR_TITLE_HEIGHT) : 0;
  const legendWidth =
    showTitleAndKey ? (scene.kind === 'site' ? LEGEND_WIDTH : INTERIOR_LEGEND_WIDTH) : 0;
  const legendRowHeight = scene.kind === 'site' ? 28 : 20;
  const legendHeight = showTitleAndKey
    ? Math.max(scene.kind === 'site' ? 220 : 118, legendRowCount * legendRowHeight + (scene.kind === 'site' ? 70 : 46))
    : 0;
  const sceneOrigin = {
    x: SHEET_PADDING,
    y: SHEET_PADDING + titleHeight,
  };
  const legendOrigin = {
    x: sceneOrigin.x + scene.size.width + (showTitleAndKey ? SECTION_GAP : 0),
    y: sceneOrigin.y,
  };

  return {
    sceneOrigin,
    legendOrigin,
    legendWidth,
    titleHeight,
    scenePadding: SHEET_PADDING,
    sceneGap: SECTION_GAP,
    sheetSize: {
      width:
        sceneOrigin.x +
        scene.size.width +
        (showTitleAndKey ? SECTION_GAP + legendWidth : 0) +
        SHEET_PADDING,
      height: Math.max(
        sceneOrigin.y + scene.size.height + SHEET_PADDING,
        legendOrigin.y + legendHeight + SHEET_PADDING,
      ),
    },
  };
};
