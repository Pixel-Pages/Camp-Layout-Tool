import type Konva from 'konva';
import { useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { Arrow, Circle, Ellipse, Group, Layer, Line, Path, Rect, Stage, Text } from 'react-konva';
import { ICONS } from '../../catalog/icons';
import { getParentEntityForScene } from '../../domain/project';
import type {
  LayoutProject,
  LayoutScene,
  Point,
  SceneItem,
  ToolMode,
  ViewportState,
} from '../../domain/types';
import { buildLegendEntries } from '../legend';
import { getLayoutFrameMetrics } from '../layoutFrame';
import { getSceneThemeColors } from '../sceneTheme';
import { BASE_PIXELS_PER_INCH, screenToScene, zoomViewportAtPoint } from '../viewport';
import { SceneRenderer } from '../renderers/SceneRenderer';

interface LayoutStageProps {
  project: LayoutProject;
  scene: LayoutScene;
  documentTitle: string;
  tool: ToolMode;
  viewport: ViewportState;
  selectedItemId: string | null;
  draftCable: { points: Point[]; previewPoint: Point | null } | null;
  draftArrow: { start: Point; previewPoint: Point | null } | null;
  draftCircle: { center: Point; previewPoint: Point | null } | null;
  width: number;
  height: number;
  stageRef: RefObject<Konva.Stage | null>;
  onViewportChange: (viewport: ViewportState) => void;
  onCanvasClick: (point: Point) => void;
  onCanvasMove: (point: Point) => void;
  onSelectItem: (itemId: string | null) => void;
  onEditTextItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, changes: Partial<SceneItem>) => void;
  onEnterInterior: (itemId: string) => void;
  onUpdateCablePoint: (itemId: string, pointIndex: number, nextPoint: Point) => void;
  onUpdateArrowEndpoint: (itemId: string, endpoint: 'start' | 'end', nextPoint: Point) => void;
  onFinishDraftTool: () => void;
  onEditTitle: () => void;
  onOpenContextMenu?: (itemId: string, point: Point) => void;
  theme: 'light' | 'dark';
}

const buildGridLines = (scene: LayoutScene, gridSize: number) => {
  const majorEvery = gridSize * 5;
  const verticalMinor: number[][] = [];
  const verticalMajor: number[][] = [];
  const horizontalMinor: number[][] = [];
  const horizontalMajor: number[][] = [];

  for (let x = 0; x <= scene.size.width; x += gridSize) {
    const bucket = x % majorEvery === 0 ? verticalMajor : verticalMinor;
    bucket.push([x, 0, x, scene.size.height]);
  }

  for (let y = 0; y <= scene.size.height; y += gridSize) {
    const bucket = y % majorEvery === 0 ? horizontalMajor : horizontalMinor;
    bucket.push([0, y, scene.size.width, y]);
  }

  return { verticalMinor, verticalMajor, horizontalMinor, horizontalMajor };
};

const getTentOutlinePoints = (width: number, height: number): number[] => {
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

const LegendSwatch = ({
  entry,
  compact,
}: {
  entry: ReturnType<typeof buildLegendEntries>[number];
  compact: boolean;
}) => {
  const swatchWidth = compact ? 22 : 28;
  const swatchHeight = compact ? 14 : 18;
  const swatchX = compact ? 15 : 18;
  const swatchY = compact ? 8 : 11;
  const iconBox = compact ? 10 : 14;
  const iconOffsetX = compact ? 10 : 11;
  const iconOffsetY = compact ? 4 : 4;

  if (entry.shape === 'ellipse' || entry.shape === 'tent-dome') {
    return (
      <Ellipse
        x={swatchX}
        y={swatchY}
        radiusX={compact ? 9 : 12}
        radiusY={compact ? 6 : 8}
        fill={entry.fill}
        stroke={entry.stroke}
        strokeWidth={1.5}
      />
    );
  }

  if (entry.shape === 'tent-rect') {
    return (
      <Line
        x={swatchX}
        y={swatchY}
        points={getTentOutlinePoints(compact ? 22 : 28, compact ? 12 : 16)}
        closed
        fill={entry.fill}
        stroke={entry.stroke}
        strokeWidth={1.5}
      />
    );
  }

  const icon = entry.iconKey ? ICONS[entry.iconKey] : null;
  return (
    <>
      <Rect
        x={4}
        y={2}
        width={swatchWidth}
        height={swatchHeight}
        fill={entry.fill}
        stroke={entry.stroke}
        strokeWidth={1.5}
        cornerRadius={entry.shape === 'rounded-rectangle' ? (compact ? 4 : 6) : 2}
      />
      {icon ? (
        <Group
          x={iconOffsetX}
          y={iconOffsetY}
          scaleX={iconBox / Number(icon.viewBox.split(' ')[2])}
          scaleY={iconBox / Number(icon.viewBox.split(' ')[3])}
        >
          <Path
            data={icon.path}
            stroke={entry.stroke}
            strokeWidth={4.5}
            lineJoin="round"
            lineCap="round"
          />
        </Group>
      ) : null}
    </>
  );
};

export const LayoutStage = ({
  project,
  scene,
  documentTitle,
  tool,
  viewport,
  selectedItemId,
  draftCable,
  draftArrow,
  draftCircle,
  width,
  height,
  stageRef,
  onViewportChange,
  onCanvasClick,
  onCanvasMove,
  onSelectItem,
  onEditTextItem,
  onUpdateItem,
  onEnterInterior,
  onUpdateCablePoint,
  onUpdateArrowEndpoint,
  onFinishDraftTool,
  onEditTitle,
  onOpenContextMenu,
  theme,
}: LayoutStageProps) => {
  const legendEntries = useMemo(() => buildLegendEntries(project, scene), [project, scene]);
  const frame = useMemo(
    () => getLayoutFrameMetrics(scene, project.visibility.showLabels, legendEntries.length),
    [legendEntries.length, project.visibility.showLabels, scene],
  );
  const grid = useMemo(
    () => buildGridLines(scene, project.visibility.gridSize),
    [project.visibility.gridSize, scene],
  );
  const scale = BASE_PIXELS_PER_INCH * viewport.zoom;
  const parentEntity = useMemo(
    () => (scene.kind === 'interior' ? getParentEntityForScene(project, scene.id)?.entity ?? null : null),
    [project, scene],
  );
  const sceneColors = useMemo(
    () => getSceneThemeColors(scene.kind, scene.appearance, theme),
    [scene.appearance, scene.kind, theme],
  );
  const toolCapturesScenePointer = tool === 'cable' || tool === 'arrow' || tool === 'circle' || tool === 'text';
  const layoutTitle = scene.kind === 'site' ? documentTitle : parentEntity?.label ?? documentTitle;
  const titleFontSize = scene.kind === 'site' ? 42 : 12;
  const legendRowHeight = scene.kind === 'site' ? 28 : 16;
  const legendCardHeight = Math.max(
    scene.kind === 'site' ? 220 : 88,
    legendEntries.length * legendRowHeight + (scene.kind === 'site' ? 72 : 34),
  );

  const pendingCanvasPressRef = useRef(false);
  const panningRef = useRef(false);
  const pointerStartRef = useRef<Point | null>(null);
  const offsetStartRef = useRef<Point | null>(null);

  const resetPointerState = () => {
    pendingCanvasPressRef.current = false;
    panningRef.current = false;
    pointerStartRef.current = null;
    offsetStartRef.current = null;
  };

  const getLocalScenePoint = (pointer: Point): Point => {
    const sheetPoint = screenToScene(pointer, viewport);
    return {
      x: sheetPoint.x - frame.sceneOrigin.x,
      y: sheetPoint.y - frame.sceneOrigin.y,
    };
  };

  const isInsideScene = (point: Point): boolean =>
    point.x >= 0 &&
    point.y >= 0 &&
    point.x <= scene.size.width &&
    point.y <= scene.size.height;

  return (
    <Stage
      ref={stageRef}
      width={Math.max(width, 300)}
      height={Math.max(height, 300)}
      onMouseMove={(event) => {
        const pointer = event.target.getStage()?.getPointerPosition();
        if (!pointer) {
          return;
        }

        if (
          pendingCanvasPressRef.current &&
          tool === 'select' &&
          pointerStartRef.current &&
          offsetStartRef.current &&
          event.evt.buttons === 1
        ) {
          const delta = {
            x: pointer.x - pointerStartRef.current.x,
            y: pointer.y - pointerStartRef.current.y,
          };

          if (Math.abs(delta.x) > 4 || Math.abs(delta.y) > 4) {
            panningRef.current = true;
            onViewportChange({
              ...viewport,
              offset: {
                x: offsetStartRef.current.x + delta.x,
                y: offsetStartRef.current.y + delta.y,
              },
            });
            return;
          }
        }

        if (toolCapturesScenePointer) {
          return;
        }

        const localPoint = getLocalScenePoint(pointer);
        if (isInsideScene(localPoint)) {
          onCanvasMove(localPoint);
        }
      }}
      onMouseDown={(event) => {
        const target = event.target;
        const targetName = target.name();
        if (target !== target.getStage() && targetName !== 'canvas-surface') {
          resetPointerState();
          return;
        }

        const pointer = target.getStage()?.getPointerPosition();
        if (!pointer) {
          return;
        }

        pendingCanvasPressRef.current = true;
        pointerStartRef.current = pointer;
        offsetStartRef.current = viewport.offset;
      }}
      onMouseUp={(event) => {
        const target = event.target;
        const targetName = target.name();
        const pointer = target.getStage()?.getPointerPosition();
        const shouldHandleCanvas =
          pendingCanvasPressRef.current &&
          !panningRef.current &&
          (target === target.getStage() || targetName === 'canvas-surface');

        if (shouldHandleCanvas && pointer) {
          const localPoint = getLocalScenePoint(pointer);
          if (isInsideScene(localPoint)) {
            onCanvasClick(localPoint);
          }
        }

        resetPointerState();
      }}
      onMouseLeave={resetPointerState}
      onContextMenu={(event) => {
        event.evt.preventDefault();
        onFinishDraftTool();
      }}
      onWheel={(event) => {
        event.evt.preventDefault();
        const pointer = event.target.getStage()?.getPointerPosition();
        if (!pointer) {
          return;
        }
        onViewportChange(zoomViewportAtPoint(viewport, pointer, event.evt.deltaY));
      }}
    >
      <Layer>
        <Group x={viewport.offset.x} y={viewport.offset.y} scaleX={scale} scaleY={scale}>
          <Rect
            name="canvas-surface"
            x={0}
            y={0}
            width={frame.sheetSize.width}
            height={frame.sheetSize.height}
            fill={sceneColors.frameColor}
            cornerRadius={18}
          />

          {project.visibility.showLabels ? (
            <Text
              x={frame.sceneOrigin.x}
              y={frame.scenePadding - (scene.kind === 'site' ? 8 : 4)}
              width={scene.size.width}
              text={layoutTitle}
              align="center"
              fontSize={titleFontSize}
              fontStyle="bold"
              fill={sceneColors.textColor}
              onClick={(event) => {
                event.cancelBubble = true;
                onEditTitle();
              }}
              onTap={(event) => {
                event.cancelBubble = true;
                onEditTitle();
              }}
            />
          ) : null}

          <Group x={frame.sceneOrigin.x} y={frame.sceneOrigin.y}>
            <Rect
              name="canvas-surface"
              x={0}
              y={0}
              width={scene.size.width}
              height={scene.size.height}
              fill={sceneColors.backgroundColor}
              stroke={sceneColors.accentColor}
              strokeWidth={3}
              cornerRadius={scene.kind === 'site' ? 0 : 10}
            />

            {project.visibility.showGrid
              ? [...grid.verticalMinor, ...grid.horizontalMinor].map((points, index) => (
                  <Line
                    key={`minor-${index}`}
                    points={points}
                    stroke={sceneColors.minorGridColor}
                    strokeWidth={1}
                    listening={false}
                  />
                ))
              : null}

            {project.visibility.showGrid
              ? [...grid.verticalMajor, ...grid.horizontalMajor].map((points, index) => (
                  <Line
                    key={`major-${index}`}
                    points={points}
                    stroke={sceneColors.majorGridColor}
                    strokeWidth={1.5}
                    listening={false}
                  />
                ))
              : null}

            <Group clipX={0} clipY={0} clipWidth={scene.size.width} clipHeight={scene.size.height}>
              <SceneRenderer
                project={project}
                scene={scene}
                tool={tool}
                selectedItemId={selectedItemId}
                onSelectItem={onSelectItem}
                onEditTextItem={onEditTextItem}
                onUpdateItem={onUpdateItem}
                onEnterInterior={onEnterInterior}
                onUpdateCablePoint={onUpdateCablePoint}
                onUpdateArrowEndpoint={onUpdateArrowEndpoint}
                onOpenContextMenu={onOpenContextMenu}
              />

              {draftCable ? (
                <Line
                  points={[
                    ...draftCable.points.flatMap((point) => [point.x, point.y]),
                    ...(draftCable.previewPoint ? [draftCable.previewPoint.x, draftCable.previewPoint.y] : []),
                  ]}
                  stroke="#f97316"
                  strokeWidth={8}
                  dash={[12, 8]}
                  lineCap="round"
                  lineJoin="round"
                  listening={false}
                />
              ) : null}

              {draftArrow && draftArrow.previewPoint ? (
                <Arrow
                  points={[
                    draftArrow.start.x,
                    draftArrow.start.y,
                    draftArrow.previewPoint.x,
                    draftArrow.previewPoint.y,
                  ]}
                  stroke="#d62828"
                  fill="#d62828"
                  strokeWidth={4}
                  dash={[8, 6]}
                  pointerWidth={16}
                  pointerLength={16}
                  listening={false}
                />
              ) : null}

              {draftCircle && draftCircle.previewPoint ? (
                <Circle
                  x={draftCircle.center.x}
                  y={draftCircle.center.y}
                  radius={Math.max(
                    6,
                    Math.hypot(
                      draftCircle.previewPoint.x - draftCircle.center.x,
                      draftCircle.previewPoint.y - draftCircle.center.y,
                    ),
                  )}
                  stroke="#d62828"
                  strokeWidth={3}
                  dash={[10, 8]}
                  fillEnabled={false}
                  listening={false}
                />
              ) : null}

              {toolCapturesScenePointer ? (
                <Rect
                  x={0}
                  y={0}
                  width={scene.size.width}
                  height={scene.size.height}
                  fill="rgba(0, 0, 0, 0.001)"
                  onMouseDown={(event) => {
                    event.cancelBubble = true;
                  }}
                  onMouseMove={(event) => {
                    const localPoint = event.target.getRelativePointerPosition();
                    if (localPoint) {
                      onCanvasMove(localPoint);
                    }
                  }}
                  onClick={(event) => {
                    event.cancelBubble = true;
                    const localPoint = event.target.getRelativePointerPosition();
                    if (localPoint) {
                      onCanvasClick(localPoint);
                    }
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    const localPoint = event.target.getRelativePointerPosition();
                    if (localPoint) {
                      onCanvasClick(localPoint);
                    }
                  }}
                  onContextMenu={(event) => {
                    event.evt.preventDefault();
                    onFinishDraftTool();
                  }}
                />
              ) : null}
            </Group>
          </Group>

          {project.visibility.showLabels ? (
            <Group x={frame.legendOrigin.x} y={frame.legendOrigin.y}>
              <Rect
                name="canvas-surface"
                width={frame.legendWidth}
                height={legendCardHeight}
                fill={sceneColors.legendFill}
                stroke={sceneColors.legendBorder}
                strokeWidth={2}
                cornerRadius={16}
              />
              <Text
                x={16}
                y={scene.kind === 'site' ? 14 : 10}
                width={frame.legendWidth - 32}
                text={scene.kind === 'site' ? 'Camp Key' : 'Interior Key'}
                fontSize={scene.kind === 'site' ? 22 : 11}
                fontStyle="bold"
                fill={sceneColors.textColor}
                listening={false}
              />

              {legendEntries.length ? (
                legendEntries.map((entry, index) => (
                  <Group
                    key={entry.id}
                    x={16}
                    y={scene.kind === 'site' ? 48 + index * legendRowHeight : 30 + index * legendRowHeight}
                    listening={false}
                  >
                    <Group y={scene.kind === 'site' ? 0 : 1}>
                      <LegendSwatch entry={entry} compact={scene.kind === 'interior'} />
                    </Group>
                    <Text
                      x={scene.kind === 'site' ? 46 : 34}
                      y={scene.kind === 'site' ? -1 : 0}
                      width={frame.legendWidth - (scene.kind === 'site' ? 66 : 54)}
                      height={legendRowHeight}
                      verticalAlign="middle"
                      text={entry.quantity > 1 ? `${entry.label} x${entry.quantity}` : entry.label}
                      fontSize={scene.kind === 'site' ? 14 : 10}
                      fontStyle="bold"
                      wrap="none"
                      ellipsis
                      fill={sceneColors.textColor}
                    />
                  </Group>
                ))
              ) : (
                <Text
                  x={16}
                  y={scene.kind === 'site' ? 56 : 42}
                  width={frame.legendWidth - 32}
                  text="No placed items yet."
                  fontSize={scene.kind === 'site' ? 14 : 10}
                  fill={sceneColors.textColor}
                  listening={false}
                />
              )}
            </Group>
          ) : null}
        </Group>
      </Layer>
    </Stage>
  );
};
