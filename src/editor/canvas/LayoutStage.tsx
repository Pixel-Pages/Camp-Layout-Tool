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

const LegendSwatch = ({ entry }: { entry: ReturnType<typeof buildLegendEntries>[number] }) => {
  if (entry.shape === 'ellipse' || entry.shape === 'tent-dome') {
    return (
      <Ellipse
        x={18}
        y={11}
        radiusX={12}
        radiusY={8}
        fill={entry.fill}
        stroke={entry.stroke}
        strokeWidth={1.5}
      />
    );
  }

  if (entry.shape === 'tent-rect') {
    return (
      <Line
        x={18}
        y={11}
        points={getTentOutlinePoints(28, 16)}
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
        width={28}
        height={18}
        fill={entry.fill}
        stroke={entry.stroke}
        strokeWidth={1.5}
        cornerRadius={entry.shape === 'rounded-rectangle' ? 6 : 2}
      />
      {icon ? (
        <Group
          x={11}
          y={4}
          scaleX={14 / Number(icon.viewBox.split(' ')[2])}
          scaleY={14 / Number(icon.viewBox.split(' ')[3])}
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
  const toolCapturesScenePointer = tool === 'cable' || tool === 'arrow' || tool === 'circle' || tool === 'text';
  const layoutTitle = scene.kind === 'site' ? documentTitle : parentEntity?.label ?? documentTitle;
  const titleFontSize = scene.kind === 'site' ? 42 : 18;
  const legendRowHeight = scene.kind === 'site' ? 28 : 20;
  const legendCardHeight = Math.max(
    scene.kind === 'site' ? 220 : 118,
    legendEntries.length * legendRowHeight + (scene.kind === 'site' ? 72 : 46),
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
            fill="#0b0b0c"
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
              fill="#f4ede2"
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
              fill={scene.kind === 'site' ? '#152017' : '#242424'}
              stroke="#ff8a1d"
              strokeWidth={3}
              cornerRadius={scene.kind === 'site' ? 0 : 10}
            />

            {project.visibility.showGrid
              ? [...grid.verticalMinor, ...grid.horizontalMinor].map((points, index) => (
                  <Line
                    key={`minor-${index}`}
                    points={points}
                    stroke={scene.kind === 'site' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)'}
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
                    stroke="rgba(255, 138, 29, 0.22)"
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
                fill="rgba(14, 14, 15, 0.96)"
                stroke="rgba(255, 138, 29, 0.65)"
                strokeWidth={2}
                cornerRadius={16}
              />
              <Text
                x={16}
                y={scene.kind === 'site' ? 14 : 10}
                width={frame.legendWidth - 32}
                text={scene.kind === 'site' ? 'Camp Key' : 'Interior Key'}
                fontSize={scene.kind === 'site' ? 22 : 14}
                fontStyle="bold"
                fill="#f4ede2"
                listening={false}
              />

              {legendEntries.length ? (
                legendEntries.map((entry, index) => (
                  <Group
                    key={entry.id}
                    x={16}
                    y={scene.kind === 'site' ? 48 + index * legendRowHeight : 34 + index * legendRowHeight}
                    listening={false}
                  >
                    <LegendSwatch entry={entry} />
                    <Text
                      x={46}
                      y={scene.kind === 'site' ? -1 : -1}
                      width={frame.legendWidth - 66}
                      text={entry.quantity > 1 ? `${entry.label} x${entry.quantity}` : entry.label}
                      fontSize={scene.kind === 'site' ? 14 : 12}
                      fontStyle="bold"
                      wrap="none"
                      ellipsis
                      fill="#f4ede2"
                    />
                  </Group>
                ))
              ) : (
                <Text
                  x={16}
                  y={scene.kind === 'site' ? 56 : 42}
                  width={frame.legendWidth - 32}
                  text="No placed items yet."
                  fontSize={scene.kind === 'site' ? 14 : 12}
                  fill="#f4ede2"
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
