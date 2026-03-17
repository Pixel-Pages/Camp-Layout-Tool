import { getDefinition } from '../catalog';
import {
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_BACKGROUND_TINT,
  DEFAULT_CABLE_COLOR,
  DEFAULT_STROKE,
} from '../shared/colors';
import { createId } from '../shared/id';
import type {
  ArrowAnnotation,
  BackgroundImageItem,
  CableRun,
  CatalogDefinition,
  CircleAnnotation,
  EmbeddedAsset,
  LayoutProject,
  LayoutScene,
  PlacedEntity,
  Point,
  ProjectKind,
  SceneItem,
  SceneKind,
  ShapeKind,
  Size,
  TextAnnotation,
  VisibilityState,
} from './types';

export const PROJECT_FORMAT = 'field-layout-planner' as const;
export const PROJECT_VERSION = 1 as const;
export const DEFAULT_SITE_SIZE: Size = { width: 2400, height: 1800 };
export const DEFAULT_INTERIOR_SIZE: Size = { width: 240, height: 144 };

export const createVisibilityState = (): VisibilityState => ({
  showGrid: true,
  showLabels: true,
  showTentInteriors: false,
  showReferenceBackgrounds: true,
  gridSize: 12,
  hiddenCategories: [],
});

export const cloneProject = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

export const nowIso = (): string => new Date().toISOString();

export const createScene = (kind: SceneKind, name: string, size: Size): LayoutScene => ({
  id: createId('scene'),
  kind,
  name,
  size,
  appearance: {},
  items: [],
});

export const createProject = (
  name: string,
  projectType: ProjectKind,
  rootScene: LayoutScene,
): LayoutProject => {
  const timestamp = nowIso();
  return {
    format: PROJECT_FORMAT,
    version: PROJECT_VERSION,
    id: createId('project'),
    name,
    projectType,
    rootSceneId: rootScene.id,
    scenes: [rootScene],
    assets: [],
    customDefinitions: [],
    visibility: createVisibilityState(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const createSiteProject = (
  name = 'New Camp Layout',
  size: Size = DEFAULT_SITE_SIZE,
): LayoutProject => createProject(name, 'site', createScene('site', 'Camp Layout', size));

export const createInteriorProject = (
  name = 'New Interior Layout',
  size: Size = DEFAULT_INTERIOR_SIZE,
): LayoutProject => createProject(name, 'interior', createScene('interior', 'Interior Layout', size));

export const findScene = (project: LayoutProject, sceneId: string): LayoutScene | undefined =>
  project.scenes.find((scene) => scene.id === sceneId);

export const findItem = (project: LayoutProject, sceneId: string, itemId: string): SceneItem | undefined =>
  findScene(project, sceneId)?.items.find((item) => item.id === itemId);

export const updateProjectTimestamp = (project: LayoutProject): LayoutProject => ({
  ...project,
  updatedAt: nowIso(),
});

export const getScenePath = (project: LayoutProject, sceneId: string): string[] => {
  if (project.rootSceneId === sceneId) {
    return [sceneId];
  }

  const parent = project.scenes
    .flatMap((scene) =>
      scene.items
        .filter((item): item is PlacedEntity => item.kind === 'placed-entity' && Boolean(item.interiorSceneId))
        .map((item) => ({ sceneId: scene.id, childSceneId: item.interiorSceneId! })),
    )
    .find((link) => link.childSceneId === sceneId);

  if (!parent) {
    return [sceneId];
  }

  return [...getScenePath(project, parent.sceneId), sceneId];
};

export const getParentEntityForScene = (
  project: LayoutProject,
  sceneId: string,
): { parentSceneId: string; entity: PlacedEntity } | null => {
  for (const scene of project.scenes) {
    for (const item of scene.items) {
      if (item.kind === 'placed-entity' && item.interiorSceneId === sceneId) {
        return { parentSceneId: scene.id, entity: item };
      }
    }
  }

  return null;
};

export const createPlacedEntity = (
  sceneId: string,
  definition: CatalogDefinition,
  position: Point,
  size = definition.defaultSize,
  label = definition.name,
): PlacedEntity => ({
  id: createId('item'),
  kind: 'placed-entity',
  sceneId,
  definitionId: definition.id,
  position,
  size,
  rotation: 0,
  label,
  visible: true,
  locked: false,
  style: { ...definition.defaultStyle },
});

interface CustomCatalogDefinitionInput {
  scope: 'site' | 'interior';
  name: string;
  size: Size;
  shape: Extract<ShapeKind, 'rectangle' | 'rounded-rectangle' | 'ellipse'>;
  fill: string;
  stroke: string;
  supportsInterior: boolean;
  includeInPackingList: boolean;
  iconKey?: string;
}

export const createCustomCatalogDefinition = ({
  scope,
  name,
  size,
  shape,
  fill,
  stroke,
  supportsInterior,
  includeInPackingList,
  iconKey,
}: CustomCatalogDefinitionInput): CatalogDefinition => ({
  id: createId('definition'),
  name: name.trim() || 'Custom Item',
  category: 'custom',
  scope,
  shape,
  defaultSize: size,
  rotatable: true,
  resizable: false,
  supportsInterior,
  includeInPackingList,
  defaultStyle: {
    fill,
    stroke,
    strokeWidth: 2,
    iconColor: stroke,
    labelColor: scope === 'site' ? '#f5f0e6' : DEFAULT_STROKE,
    lineColor: DEFAULT_CABLE_COLOR,
    lineWidth: 8,
  },
  iconKey,
});

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getNextEntityLabelForScene = (
  scene: LayoutScene,
  definition: CatalogDefinition,
): string => {
  if (scene.kind !== 'site' || !definition.supportsInterior) {
    return definition.name;
  }

  const baseName = definition.name;
  const matcher = new RegExp(`^${escapeRegExp(baseName)}(?:\\s+(\\d+))?$`);
  const highestIndex = scene.items.reduce((maxIndex, item) => {
    if (item.kind !== 'placed-entity' || item.definitionId !== definition.id) {
      return maxIndex;
    }

    const match = item.label?.match(matcher);
    if (!match) {
      return maxIndex;
    }

    const parsedIndex = Number(match[1] ?? 1);
    return Number.isFinite(parsedIndex) ? Math.max(maxIndex, parsedIndex) : maxIndex;
  }, 0);

  return `${baseName} ${highestIndex + 1}`;
};

export const getNextEntityLabel = (
  project: LayoutProject,
  sceneId: string,
  definition: CatalogDefinition,
): string => {
  const scene = findScene(project, sceneId);
  if (!scene) {
    return definition.name;
  }

  return getNextEntityLabelForScene(scene, definition);
};

export const createCableRun = (sceneId: string, points: Point[]): CableRun => ({
  id: createId('item'),
  kind: 'cable-run',
  sceneId,
  points,
  label: 'Cable Run',
  visible: true,
  locked: false,
  style: {
    fill: 'transparent',
    stroke: DEFAULT_CABLE_COLOR,
    strokeWidth: 0,
    iconColor: DEFAULT_CABLE_COLOR,
    labelColor: DEFAULT_STROKE,
    lineColor: DEFAULT_CABLE_COLOR,
    lineWidth: 8,
    lineStyle: 'solid',
  },
});

export const createTextAnnotation = (sceneId: string, position: Point, text = 'Annotation'): TextAnnotation => ({
  id: createId('item'),
  kind: 'text-annotation',
  sceneId,
  position,
  text,
  fontSize: 18,
  label: text,
  visible: true,
  locked: false,
  style: {
    fill: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    iconColor: DEFAULT_ANNOTATION_COLOR,
    labelColor: DEFAULT_ANNOTATION_COLOR,
    lineColor: DEFAULT_ANNOTATION_COLOR,
    lineWidth: 2,
  },
});

export const createArrowAnnotation = (sceneId: string, start: Point, end: Point): ArrowAnnotation => ({
  id: createId('item'),
  kind: 'arrow-annotation',
  sceneId,
  start,
  end,
  label: 'Arrow',
  visible: true,
  locked: false,
  style: {
    fill: 'transparent',
    stroke: DEFAULT_ANNOTATION_COLOR,
    strokeWidth: 2,
    iconColor: DEFAULT_ANNOTATION_COLOR,
    labelColor: DEFAULT_ANNOTATION_COLOR,
    lineColor: DEFAULT_ANNOTATION_COLOR,
    lineWidth: 4,
  },
});

export const createCircleAnnotation = (
  sceneId: string,
  center: Point,
  radius: number,
): CircleAnnotation => ({
  id: createId('item'),
  kind: 'circle-annotation',
  sceneId,
  center,
  radius,
  label: 'Circle',
  visible: true,
  locked: false,
  style: {
    fill: 'transparent',
    stroke: DEFAULT_ANNOTATION_COLOR,
    strokeWidth: 2,
    iconColor: DEFAULT_ANNOTATION_COLOR,
    labelColor: DEFAULT_ANNOTATION_COLOR,
    lineColor: DEFAULT_ANNOTATION_COLOR,
    lineWidth: 3,
  },
});

export const createBackgroundImageItem = (
  sceneId: string,
  assetId: string,
  size: Size,
): BackgroundImageItem => ({
  id: createId('item'),
  kind: 'background-image',
  sceneId,
  assetId,
  position: { x: size.width / 2, y: size.height / 2 },
  size,
  rotation: 0,
  opacity: 0.5,
  label: 'Reference Background',
  visible: true,
  locked: false,
  style: {
    fill: DEFAULT_BACKGROUND_TINT,
    stroke: 'transparent',
    strokeWidth: 0,
    iconColor: DEFAULT_STROKE,
    labelColor: DEFAULT_STROKE,
    lineColor: DEFAULT_STROKE,
    lineWidth: 0,
    opacity: 0.5,
  },
});

export const ensureInteriorScene = (
  project: LayoutProject,
  sceneId: string,
  itemId: string,
): { project: LayoutProject; interiorSceneId: string } => {
  const existing = findItem(project, sceneId, itemId);
  if (existing?.kind !== 'placed-entity') {
    throw new Error('Only placed entities can own interior scenes.');
  }

  if (existing.interiorSceneId) {
    return { project, interiorSceneId: existing.interiorSceneId };
  }

  const definition = getDefinition(existing.definitionId, project);
  const scene = createScene('interior', `${definition?.name ?? 'Interior'} Layout`, existing.size);
  const nextProject = cloneProject(project);
  nextProject.scenes.push(scene);
  const parentScene = findScene(nextProject, sceneId);
  if (!parentScene) {
    throw new Error('Parent scene not found.');
  }
  parentScene.items = parentScene.items.map((item) =>
    item.id === itemId && item.kind === 'placed-entity'
      ? {
          ...item,
          interiorSceneId: scene.id,
        }
      : item,
  );

  return { project: updateProjectTimestamp(nextProject), interiorSceneId: scene.id };
};

export const getAsset = (project: LayoutProject, assetId: string): EmbeddedAsset | undefined =>
  project.assets.find((asset) => asset.id === assetId);
