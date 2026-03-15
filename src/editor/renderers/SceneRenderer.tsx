import { useEffect, useMemo, useRef, useState } from 'react';
import type { Ref } from 'react';
import Konva from 'konva';
import {
  Arrow,
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Path,
  Rect,
  Text,
  Transformer,
} from 'react-konva';
import { getDefinition } from '../../catalog';
import { ICONS } from '../../catalog/icons';
import { findScene, getAsset } from '../../domain/project';
import type {
  ArrowAnnotation,
  BackgroundImageItem,
  LayoutProject,
  LayoutScene,
  PlacedEntity,
  Point,
  SceneItem,
  ToolMode,
} from '../../domain/types';

interface SceneRendererProps {
  project: LayoutProject;
  scene: LayoutScene;
  tool: ToolMode;
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onEditTextItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, changes: Partial<SceneItem>) => void;
  onEnterInterior: (itemId: string) => void;
  onUpdateCablePoint: (itemId: string, pointIndex: number, nextPoint: Point) => void;
  onUpdateArrowEndpoint: (itemId: string, endpoint: 'start' | 'end', nextPoint: Point) => void;
  interactive?: boolean;
  allowInteriorOverlay?: boolean;
}

const useLoadedImage = (src?: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const nextImage = new window.Image();
    nextImage.onload = () => setImage(nextImage);
    nextImage.src = src;
  }, [src]);

  return image;
};

const flattenPoints = (points: Point[]): number[] => points.flatMap((point) => [point.x, point.y]);

const sortSceneItems = (items: SceneItem[]): SceneItem[] => {
  const order: Record<SceneItem['kind'], number> = {
    'background-image': 0,
    'placed-entity': 1,
    'cable-run': 2,
    'arrow-annotation': 3,
    'circle-annotation': 4,
    'text-annotation': 5,
  };

  return [...items].sort((left, right) => order[left.kind] - order[right.kind]);
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

const renderEntityShell = (entity: PlacedEntity, definitionId: string, project: LayoutProject) => {
  const definition = getDefinition(definitionId, project);
  if (!definition) {
    return null;
  }

  if (definition.shape === 'ellipse' || definition.shape === 'tent-dome') {
    return (
      <Ellipse
        radiusX={entity.size.width / 2}
        radiusY={entity.size.height / 2}
        fill={entity.style.fill}
        stroke={entity.style.stroke}
        strokeWidth={entity.style.strokeWidth}
      />
    );
  }

  if (definition.shape === 'tent-rect') {
    return (
      <Line
        points={getTentOutlinePoints(entity.size.width, entity.size.height)}
        closed
        fill={entity.style.fill}
        stroke={entity.style.stroke}
        strokeWidth={entity.style.strokeWidth}
        lineJoin="round"
      />
    );
  }

  return (
    <Rect
      x={-entity.size.width / 2}
      y={-entity.size.height / 2}
      width={entity.size.width}
      height={entity.size.height}
      cornerRadius={definition.shape === 'rounded-rectangle' ? 18 : 4}
      fill={entity.style.fill}
      stroke={entity.style.stroke}
      strokeWidth={entity.style.strokeWidth}
    />
  );
};

const BackgroundNode = ({
  item,
  project,
  interactive,
  selected,
  tool,
  onSelectItem,
  onUpdateItem,
  nodeRef,
}: {
  item: BackgroundImageItem;
  project: LayoutProject;
  interactive: boolean;
  selected: boolean;
  tool: ToolMode;
  onSelectItem: (itemId: string | null) => void;
  onUpdateItem: (itemId: string, changes: Partial<SceneItem>) => void;
  nodeRef?: Ref<Konva.Group>;
}) => {
  const asset = getAsset(project, item.assetId);
  const image = useLoadedImage(asset?.dataUrl);

  return (
    <Group
      ref={nodeRef}
      x={item.position.x}
      y={item.position.y}
      rotation={item.rotation}
      draggable={interactive && tool === 'select' && !item.locked}
      onMouseDown={(event) => {
        if (item.locked) {
          return;
        }
        event.cancelBubble = true;
      }}
      onDragStart={(event) => {
        event.cancelBubble = true;
      }}
      onClick={(event) => {
        if (item.locked) {
          return;
        }
        event.cancelBubble = true;
        onSelectItem(item.id);
      }}
      onTap={(event) => {
        if (item.locked) {
          return;
        }
        event.cancelBubble = true;
        onSelectItem(item.id);
      }}
      listening={!item.locked || selected}
      onDragEnd={(event) => {
        onUpdateItem(item.id, {
          position: {
            x: event.target.x(),
            y: event.target.y(),
          },
        });
      }}
      onTransformEnd={(event) => {
        const node = event.target as Konva.Group;
        const nextSize = {
          width: item.size.width * node.scaleX(),
          height: item.size.height * node.scaleY(),
        };
        node.scaleX(1);
        node.scaleY(1);
        onUpdateItem(item.id, {
          position: { x: node.x(), y: node.y() },
          rotation: node.rotation(),
          size: nextSize,
        });
      }}
    >
      <Rect
        x={-item.size.width / 2}
        y={-item.size.height / 2}
        width={item.size.width}
        height={item.size.height}
        fill={item.style.fill}
        opacity={selected ? 0.16 : 0.08}
        stroke={selected ? '#355070' : 'transparent'}
        strokeWidth={selected ? 1.5 : 0}
        dash={selected ? [8, 6] : undefined}
      />
      {image ? (
        <KonvaImage
          image={image}
          x={-item.size.width / 2}
          y={-item.size.height / 2}
          width={item.size.width}
          height={item.size.height}
          opacity={item.opacity}
          listening={false}
        />
      ) : null}
    </Group>
  );
};

const OverlayScene = ({
  project,
  scene,
}: {
  project: LayoutProject;
  scene: LayoutScene;
}) => (
  <>
    {sortSceneItems(scene.items).map((item) => {
      if (item.kind === 'background-image') {
        return project.visibility.showReferenceBackgrounds ? (
          <BackgroundNode
            key={item.id}
            item={item}
            project={project}
            interactive={false}
            selected={false}
            tool="select"
            onSelectItem={() => undefined}
            onUpdateItem={() => undefined}
          />
        ) : null;
      }

      if (item.kind === 'placed-entity') {
        const definition = getDefinition(item.definitionId, project);
        if (!definition || project.visibility.hiddenCategories.includes(definition.category)) {
          return null;
        }

        return (
          <Group key={item.id} x={item.position.x} y={item.position.y} rotation={item.rotation} listening={false}>
            {renderEntityShell(item, item.definitionId, project)}
          </Group>
        );
      }

      if (item.kind === 'cable-run') {
        return (
          <Line
            key={item.id}
            points={flattenPoints(item.points)}
            stroke={item.style.lineColor}
            strokeWidth={item.style.lineWidth}
            lineCap="round"
            lineJoin="round"
            opacity={0.8}
            listening={false}
          />
        );
      }

      if (item.kind === 'arrow-annotation') {
        return (
          <Arrow
            key={item.id}
            points={[item.start.x, item.start.y, item.end.x, item.end.y]}
            stroke={item.style.lineColor}
            fill={item.style.lineColor}
            strokeWidth={item.style.lineWidth}
            pointerWidth={18}
            pointerLength={18}
            listening={false}
          />
        );
      }

      if (item.kind === 'circle-annotation') {
        return (
          <Circle
            key={item.id}
            x={item.center.x}
            y={item.center.y}
            radius={item.radius}
            stroke={item.style.lineColor}
            strokeWidth={item.style.lineWidth}
            dash={[10, 8]}
            fillEnabled={false}
            listening={false}
          />
        );
      }

      return (
        <Text
          key={item.id}
          x={item.position.x}
          y={item.position.y}
          text={item.text}
          fontSize={Math.max(11, item.fontSize * 0.75)}
          wrap="none"
          ellipsis
          fill={item.style.labelColor}
          listening={false}
        />
      );
    })}
  </>
);

export const SceneRenderer = ({
  project,
  scene,
  tool,
  selectedItemId,
  onSelectItem,
  onEditTextItem,
  onUpdateItem,
  onEnterInterior,
  onUpdateCablePoint,
  onUpdateArrowEndpoint,
  interactive = true,
  allowInteriorOverlay = true,
}: SceneRendererProps) => {
  const selectedTransformNodeRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const selectedTransformItem = useMemo(
    () =>
      scene.items.find(
        (item): item is PlacedEntity | BackgroundImageItem =>
          item.id === selectedItemId &&
          (item.kind === 'placed-entity' || item.kind === 'background-image') &&
          !item.locked,
      ) ?? null,
    [scene.items, selectedItemId],
  );

  useEffect(() => {
    if (!selectedTransformItem || !selectedTransformNodeRef.current || !transformerRef.current) {
      return;
    }

    transformerRef.current.nodes([selectedTransformNodeRef.current]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedTransformItem]);

  const sortedItems = useMemo(() => sortSceneItems(scene.items), [scene.items]);

  return (
    <>
      {sortedItems.map((item) => {
        if (item.kind === 'background-image') {
          return project.visibility.showReferenceBackgrounds ? (
            <BackgroundNode
              key={item.id}
              item={item}
              project={project}
              interactive={interactive}
              selected={interactive && item.id === selectedItemId}
              tool={tool}
              nodeRef={interactive && item.id === selectedItemId ? selectedTransformNodeRef : undefined}
              onSelectItem={onSelectItem}
              onUpdateItem={onUpdateItem}
            />
          ) : null;
        }

        if (item.kind === 'placed-entity') {
          const definition = getDefinition(item.definitionId, project);
          if (!definition || project.visibility.hiddenCategories.includes(definition.category) || !item.visible) {
            return null;
          }

          const icon = definition.iconKey ? ICONS[definition.iconKey] : null;
          const isSelected = interactive && item.id === selectedItemId;
          const interiorScene = item.interiorSceneId ? findScene(project, item.interiorSceneId) : undefined;

          return (
            <Group
              key={item.id}
              ref={isSelected ? selectedTransformNodeRef : undefined}
              x={item.position.x}
              y={item.position.y}
              rotation={item.rotation}
              draggable={interactive && tool === 'select' && !item.locked}
              onMouseDown={(event) => {
                event.cancelBubble = true;
              }}
              onDragStart={(event) => {
                event.cancelBubble = true;
              }}
              onClick={(event) => {
                event.cancelBubble = true;
                onSelectItem(item.id);
              }}
              onTap={(event) => {
                event.cancelBubble = true;
                onSelectItem(item.id);
              }}
              onDblClick={(event) => {
                event.cancelBubble = true;
                if (definition.supportsInterior) {
                  onEnterInterior(item.id);
                }
              }}
              onDragEnd={(event) => {
                onUpdateItem(item.id, {
                  position: {
                    x: event.target.x(),
                    y: event.target.y(),
                  },
                });
              }}
              onTransformEnd={(event) => {
                const node = event.target as Konva.Group;
                const nextSize = {
                  width: Math.abs(item.size.width * node.scaleX()),
                  height: Math.abs(item.size.height * node.scaleY()),
                };
                node.scaleX(1);
                node.scaleY(1);
                onUpdateItem(item.id, {
                  position: { x: node.x(), y: node.y() },
                  rotation: node.rotation(),
                  size: definition.resizable ? nextSize : item.size,
                });
              }}
            >
              {renderEntityShell(item, item.definitionId, project)}

              {icon ? (
                <Group
                  x={-item.size.width / 2}
                  y={-item.size.height / 2}
                  scaleX={item.size.width / Number(icon.viewBox.split(' ')[2])}
                  scaleY={item.size.height / Number(icon.viewBox.split(' ')[3])}
                  listening={false}
                >
                  <Path
                    data={icon.path}
                    stroke={item.style.iconColor}
                    strokeWidth={2}
                    lineJoin="round"
                    lineCap="round"
                  />
                </Group>
              ) : null}

              {allowInteriorOverlay &&
              scene.kind === 'site' &&
              project.visibility.showTentInteriors &&
              interiorScene ? (
                <Group
                  x={-item.size.width / 2}
                  y={-item.size.height / 2}
                  clipX={0}
                  clipY={0}
                  clipWidth={item.size.width}
                  clipHeight={item.size.height}
                  listening={false}
                >
                  <Rect width={item.size.width} height={item.size.height} fill="#f5f0e6" opacity={0.05} />
                  <Group
                    scaleX={item.size.width / interiorScene.size.width}
                    scaleY={item.size.height / interiorScene.size.height}
                  >
                    <OverlayScene project={project} scene={interiorScene} />
                  </Group>
                </Group>
              ) : null}
            </Group>
          );
        }

        if (item.kind === 'cable-run') {
          if (!item.visible) {
            return null;
          }

          const isSelected = interactive && item.id === selectedItemId;

          return (
            <Group key={item.id}>
              <Line
                x={0}
                y={0}
                points={flattenPoints(item.points)}
                stroke={item.style.lineColor}
                strokeWidth={item.style.lineWidth}
                lineCap="round"
                lineJoin="round"
                draggable={interactive && tool === 'select'}
                onMouseDown={(event) => {
                  event.cancelBubble = true;
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                }}
                onClick={(event) => {
                  event.cancelBubble = true;
                  onSelectItem(item.id);
                }}
                onDragEnd={(event) => {
                  const delta = {
                    x: event.target.x(),
                    y: event.target.y(),
                  };
                  onUpdateItem(item.id, {
                    points: item.points.map((point) => ({
                      x: point.x + delta.x,
                      y: point.y + delta.y,
                    })),
                  });
                  event.target.position({ x: 0, y: 0 });
                }}
              />
              {isSelected
                ? item.points.map((point, index) => (
                    <Circle
                      key={`${item.id}-handle-${index}`}
                      x={point.x}
                      y={point.y}
                      radius={7}
                      fill="#f5f0e6"
                      stroke={item.style.lineColor}
                      strokeWidth={2}
                      draggable
                      onMouseDown={(event) => {
                        event.cancelBubble = true;
                      }}
                      onDragMove={(event) => {
                        onUpdateCablePoint(item.id, index, {
                          x: event.target.x(),
                          y: event.target.y(),
                        });
                      }}
                    />
                  ))
                : null}
            </Group>
          );
        }

        if (item.kind === 'arrow-annotation') {
          const isSelected = interactive && item.id === selectedItemId;
          return (
            <Group key={item.id}>
              <Arrow
                x={0}
                y={0}
                points={[item.start.x, item.start.y, item.end.x, item.end.y]}
                stroke={item.style.lineColor}
                fill={item.style.lineColor}
                strokeWidth={item.style.lineWidth}
                pointerWidth={18}
                pointerLength={18}
                draggable={interactive && tool === 'select'}
                onMouseDown={(event) => {
                  event.cancelBubble = true;
                }}
                onDragStart={(event) => {
                  event.cancelBubble = true;
                }}
                onClick={(event) => {
                  event.cancelBubble = true;
                  onSelectItem(item.id);
                }}
                onDragEnd={(event) => {
                  const delta = {
                    x: event.target.x(),
                    y: event.target.y(),
                  };
                  onUpdateItem(item.id, {
                    start: { x: item.start.x + delta.x, y: item.start.y + delta.y },
                    end: { x: item.end.x + delta.x, y: item.end.y + delta.y },
                  } as Partial<ArrowAnnotation>);
                  event.target.position({ x: 0, y: 0 });
                }}
              />
              {isSelected ? (
                <>
                  <Circle
                    x={item.start.x}
                    y={item.start.y}
                    radius={7}
                    fill="#f5f0e6"
                    stroke={item.style.lineColor}
                    strokeWidth={2}
                    draggable
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                    }}
                    onDragMove={(event) =>
                      onUpdateArrowEndpoint(item.id, 'start', {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                  />
                  <Circle
                    x={item.end.x}
                    y={item.end.y}
                    radius={7}
                    fill="#f5f0e6"
                    stroke={item.style.lineColor}
                    strokeWidth={2}
                    draggable
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                    }}
                    onDragMove={(event) =>
                      onUpdateArrowEndpoint(item.id, 'end', {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                  />
                </>
              ) : null}
            </Group>
          );
        }

        if (item.kind === 'circle-annotation') {
          return (
            <Circle
              key={item.id}
              x={item.center.x}
              y={item.center.y}
              radius={item.radius}
              stroke={item.style.lineColor}
              strokeWidth={item.style.lineWidth}
              dash={[10, 8]}
              fillEnabled={false}
              draggable={interactive && tool === 'select'}
              onMouseDown={(event) => {
                event.cancelBubble = true;
              }}
              onDragStart={(event) => {
                event.cancelBubble = true;
              }}
              onClick={(event) => {
                event.cancelBubble = true;
                onSelectItem(item.id);
              }}
              onDragEnd={(event) =>
                onUpdateItem(item.id, {
                  center: {
                    x: event.target.x(),
                    y: event.target.y(),
                  },
                } as Partial<SceneItem>)
              }
            />
          );
        }

        return (
          <Text
            key={item.id}
            x={item.position.x}
            y={item.position.y}
            text={item.text}
            fontSize={item.fontSize}
            fill={item.style.labelColor}
            draggable={interactive && tool === 'select'}
            onMouseDown={(event) => {
              event.cancelBubble = true;
            }}
            onDragStart={(event) => {
              event.cancelBubble = true;
            }}
            onClick={(event) => {
              event.cancelBubble = true;
              onSelectItem(item.id);
              onEditTextItem(item.id);
            }}
            onTap={(event) => {
              event.cancelBubble = true;
              onSelectItem(item.id);
              onEditTextItem(item.id);
            }}
            onDblClick={(event) => {
              event.cancelBubble = true;
              onEditTextItem(item.id);
            }}
            onDragEnd={(event) =>
              onUpdateItem(item.id, {
                position: {
                  x: event.target.x(),
                  y: event.target.y(),
                },
              })
            }
          />
        );
      })}

      {interactive && selectedTransformItem ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={
            selectedTransformItem.kind === 'background-image' ||
            getDefinition(selectedTransformItem.definitionId, project)?.resizable
              ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
              : []
          }
          ignoreStroke
        />
      ) : null}
    </>
  );
};
