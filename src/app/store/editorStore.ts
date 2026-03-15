import { create } from 'zustand';
import { getDefinition } from '../../catalog';
import {
  applyHistoryCommand,
  createHistoryState,
  redoHistory,
  undoHistory,
} from '../../domain/history';
import {
  createArrowAnnotation,
  createCircleAnnotation,
  createBackgroundImageItem,
  createCableRun,
  createInteriorProject,
  createPlacedEntity,
  createSiteProject,
  createTextAnnotation,
  ensureInteriorScene,
  findItem,
  findScene,
  getNextEntityLabel,
  getParentEntityForScene,
} from '../../domain/project';
import type {
  CatalogDefinition,
  ExportOptions,
  HistoryState,
  LayoutProject,
  Point,
  ProjectKind,
  SceneItem,
  Size,
  ToolMode,
  ViewportState,
} from '../../domain/types';
import { createEmbeddedImageAsset } from '../../features/project/fileIO';
import { createDefaultViewport } from '../../editor/viewport';
import { createId } from '../../shared/id';

export interface DraftCableState {
  points: Point[];
  previewPoint: Point | null;
}

export interface DraftArrowState {
  start: Point;
  previewPoint: Point | null;
}

export interface DraftCircleState {
  center: Point;
  previewPoint: Point | null;
}

const buildProjectFileName = (name: string): string => {
  const sanitizedName =
    name.trim().replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Layout Project';
  return `${sanitizedName}.layoutplanner.json`;
};

interface EditorStoreState {
  history: HistoryState<LayoutProject> | null;
  activeSceneId: string | null;
  selectedItemId: string | null;
  selectedCatalogId: string | null;
  placementSize: Size | null;
  tool: ToolMode;
  viewportByScene: Record<string, ViewportState>;
  draftCable: DraftCableState | null;
  draftArrow: DraftArrowState | null;
  draftCircle: DraftCircleState | null;
  exportOptions: ExportOptions;
  dirty: boolean;
  currentFileName: string | null;
  fileHandle: unknown | null;
  clipboardItem: SceneItem | null;
  loadProject: (project: LayoutProject, fileName?: string, fileHandle?: unknown | null) => void;
  createProject: (projectType: ProjectKind, name: string, size?: Size) => void;
  renameProject: (name: string) => void;
  addCustomDefinition: (definition: CatalogDefinition) => void;
  setTool: (tool: ToolMode) => void;
  setActiveSceneId: (sceneId: string) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setSelectedCatalogId: (definitionId: string | null) => void;
  setPlacementSize: (size: Size | null) => void;
  setSceneSize: (sceneId: string, size: Size) => void;
  setSceneAppearance: (sceneId: string, appearance: Partial<LayoutProject['scenes'][number]['appearance']>) => void;
  setViewport: (sceneId: string, viewport: ViewportState) => void;
  applySceneCommand: (command: Parameters<typeof applyHistoryCommand>[1]) => void;
  updateSelectedItem: (changes: Partial<SceneItem>) => void;
  placeDefinitionAt: (definitionId: string, point: Point, sizeOverride?: Size | null) => void;
  placeSelectedDefinitionAt: (point: Point) => void;
  addTextAt: (point: Point) => string | null;
  handleCanvasClick: (point: Point) => void;
  handleCanvasMove: (point: Point) => void;
  finishDraftTool: () => void;
  cancelDraftTool: () => void;
  updateCablePoint: (itemId: string, pointIndex: number, nextPoint: Point) => void;
  updateArrowEndpoint: (itemId: string, endpoint: 'start' | 'end', nextPoint: Point) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  pasteSelection: () => void;
  undo: () => void;
  redo: () => void;
  enterInterior: (itemId: string) => void;
  openInteriorFromSiteItem: (itemId: string) => void;
  exitInterior: () => void;
  toggleVisibility: (key: keyof LayoutProject['visibility']) => void;
  setGridSize: (gridSize: number) => void;
  toggleCategoryVisibility: (category: string) => void;
  addBackgroundImageToActiveScene: (file: File) => Promise<void>;
  setDirtySavedState: (fileName: string, fileHandle: unknown | null) => void;
  updateExportOptions: (changes: Partial<ExportOptions>) => void;
}

const initializeViewports = (project: LayoutProject): Record<string, ViewportState> =>
  Object.fromEntries(project.scenes.map((scene) => [scene.id, createDefaultViewport()]));

const defaultExportOptions: ExportOptions = {
  includeGrid: true,
  includeLabels: true,
  includeInteriors: false,
  includeBackgrounds: true,
};

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  history: null,
  activeSceneId: null,
  selectedItemId: null,
  selectedCatalogId: null,
  placementSize: null,
  tool: 'select',
  viewportByScene: {},
  draftCable: null,
  draftArrow: null,
  draftCircle: null,
  exportOptions: defaultExportOptions,
  dirty: false,
  currentFileName: null,
  fileHandle: null,
  clipboardItem: null,
  loadProject: (project, fileName, fileHandle = null) =>
    set({
      history: createHistoryState(project),
      activeSceneId: project.rootSceneId,
      selectedItemId: null,
      selectedCatalogId: null,
      placementSize: null,
      tool: 'select',
      viewportByScene: initializeViewports(project),
      draftCable: null,
      draftArrow: null,
      draftCircle: null,
      dirty: false,
      currentFileName: fileName ?? `${project.name}.layoutplanner.json`,
      fileHandle,
      exportOptions: {
        includeGrid: project.visibility.showGrid,
        includeLabels: project.visibility.showLabels,
        includeInteriors: project.visibility.showTentInteriors,
        includeBackgrounds: project.visibility.showReferenceBackgrounds,
      },
    }),
  createProject: (projectType, name, size) => {
    const project =
      projectType === 'site'
        ? createSiteProject(name, size)
        : createInteriorProject(name, size);
    get().loadProject(project, `${project.name}.layoutplanner.json`, null);
  },
  renameProject: (name) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, {
          type: 'rename-project',
          name,
        }),
        dirty: true,
        currentFileName: buildProjectFileName(name),
      };
    }),
  addCustomDefinition: (definition) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, {
          type: 'add-custom-definition',
          definition,
        }),
        dirty: true,
        selectedCatalogId: definition.id,
        placementSize: definition.resizable ? definition.defaultSize : null,
      };
    }),
  setTool: (tool) => set({ tool }),
  setActiveSceneId: (activeSceneId) => set({ activeSceneId, selectedItemId: null }),
  setSelectedItemId: (selectedItemId) => set({ selectedItemId }),
  setSelectedCatalogId: (selectedCatalogId) => set({ selectedCatalogId }),
  setPlacementSize: (placementSize) => set({ placementSize }),
  setSceneSize: (sceneId, size) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, {
          type: 'update-scene-size',
          sceneId,
          size,
        }),
        dirty: true,
      };
    }),
  setSceneAppearance: (sceneId, appearance) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, {
          type: 'update-scene-appearance',
          sceneId,
          appearance,
        }),
        dirty: true,
      };
    }),
  setViewport: (sceneId, viewport) =>
    set((state) => ({
      viewportByScene: {
        ...state.viewportByScene,
        [sceneId]: viewport,
      },
    })),
  applySceneCommand: (command) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, command),
        dirty: true,
      };
    }),
  updateSelectedItem: (changes) => {
    const state = get();
    if (!state.history || !state.activeSceneId || !state.selectedItemId) {
      return;
    }

    state.applySceneCommand({
      type: 'update-item',
      sceneId: state.activeSceneId,
      itemId: state.selectedItemId,
      changes,
    });
  },
  placeDefinitionAt: (definitionId, point, sizeOverride) => {
    const state = get();
    if (!state.history || !state.activeSceneId) {
      return;
    }

    const definition = getDefinition(definitionId, state.history.present);
    if (!definition) {
      return;
    }

    const item = createPlacedEntity(
      state.activeSceneId,
      definition,
      point,
      sizeOverride ?? state.placementSize ?? definition.defaultSize,
      getNextEntityLabel(state.history.present, state.activeSceneId, definition),
    );
    state.applySceneCommand({
      type: 'add-item',
      sceneId: state.activeSceneId,
      item,
    });
    set({ selectedItemId: item.id, selectedCatalogId: definitionId });
  },
  placeSelectedDefinitionAt: (point) => {
    const state = get();
    if (!state.history || !state.activeSceneId || !state.selectedCatalogId) {
      return;
    }

    state.placeDefinitionAt(state.selectedCatalogId, point, state.placementSize);
  },
  addTextAt: (point) => {
    const state = get();
    if (!state.activeSceneId) {
      return null;
    }

    const item = createTextAnnotation(state.activeSceneId, point);
    state.applySceneCommand({
      type: 'add-item',
      sceneId: state.activeSceneId,
      item,
    });
    set({ selectedItemId: item.id, tool: 'select' });
    return item.id;
  },
  handleCanvasClick: (point) => {
    const state = get();
    switch (state.tool) {
      case 'place':
      case 'text':
        if (state.tool === 'text') {
          state.addTextAt(point);
        }
        return;
      case 'cable':
        if (!state.draftCable) {
        set({ draftCable: { points: [point], previewPoint: point } });
          return;
        }
        set({
          draftCable: {
            points: [...state.draftCable.points, point],
            previewPoint: point,
          },
        });
        return;
      case 'arrow':
        if (!state.draftArrow) {
          set({ draftArrow: { start: point, previewPoint: point } });
          return;
        }
        state.applySceneCommand({
          type: 'add-item',
          sceneId: state.activeSceneId!,
          item: createArrowAnnotation(state.activeSceneId!, state.draftArrow.start, point),
        });
        set({ draftArrow: null, selectedItemId: null, tool: 'select' });
        return;
      case 'circle':
        if (!state.draftCircle) {
          set({ draftCircle: { center: point, previewPoint: point } });
          return;
        }
        state.applySceneCommand({
          type: 'add-item',
          sceneId: state.activeSceneId!,
          item: createCircleAnnotation(
            state.activeSceneId!,
            state.draftCircle.center,
            Math.max(
              6,
              Math.hypot(
                point.x - state.draftCircle.center.x,
                point.y - state.draftCircle.center.y,
              ),
            ),
          ),
        });
        set({ draftCircle: null, selectedItemId: null, tool: 'select' });
        return;
      case 'select':
      case 'pan':
      default:
        set({ selectedItemId: null });
    }
  },
  handleCanvasMove: (point) => {
    const state = get();
    if (state.draftCable) {
      set({
        draftCable: {
          ...state.draftCable,
          previewPoint: point,
        },
      });
    }
    if (state.draftArrow) {
      set({
        draftArrow: {
          ...state.draftArrow,
          previewPoint: point,
        },
      });
    }
    if (state.draftCircle) {
      set({
        draftCircle: {
          ...state.draftCircle,
          previewPoint: point,
        },
      });
    }
  },
  finishDraftTool: () => {
    const state = get();
    if (state.draftCable && state.activeSceneId && state.draftCable.points.length >= 2) {
      const item = createCableRun(state.activeSceneId, state.draftCable.points);
      state.applySceneCommand({
        type: 'add-item',
        sceneId: state.activeSceneId,
        item,
      });
      set({ draftCable: null, selectedItemId: item.id, tool: 'select' });
      return;
    }

    if (state.draftCable && state.draftCable.points.length < 2) {
      set({ draftCable: null });
    }

    if (state.draftArrow) {
      set({ draftArrow: null });
    }

    if (state.draftCircle) {
      set({ draftCircle: null });
    }
  },
  cancelDraftTool: () => set({ draftCable: null, draftArrow: null, draftCircle: null }),
  updateCablePoint: (itemId, pointIndex, nextPoint) => {
    const state = get();
    if (!state.history || !state.activeSceneId) {
      return;
    }

    const current = findItem(state.history.present, state.activeSceneId, itemId);
    if (!current || current.kind !== 'cable-run') {
      return;
    }

    const points = current.points.map((point, index) => (index === pointIndex ? nextPoint : point));
    state.applySceneCommand({
      type: 'update-item',
      sceneId: state.activeSceneId,
      itemId,
      changes: { points } as Partial<SceneItem>,
    });
  },
  updateArrowEndpoint: (itemId, endpoint, nextPoint) => {
    const state = get();
    if (!state.history || !state.activeSceneId) {
      return;
    }

    state.applySceneCommand({
      type: 'update-item',
      sceneId: state.activeSceneId,
      itemId,
      changes: { [endpoint]: nextPoint } as Partial<SceneItem>,
    });
  },
  deleteSelection: () => {
    const state = get();
    if (!state.history || !state.activeSceneId || !state.selectedItemId) {
      return;
    }

    state.applySceneCommand({
      type: 'remove-item',
      sceneId: state.activeSceneId,
      itemId: state.selectedItemId,
    });
    set({ selectedItemId: null });
  },
  duplicateSelection: () => {
    const state = get();
    if (!state.history || !state.activeSceneId || !state.selectedItemId) {
      return;
    }

    state.applySceneCommand({
      type: 'duplicate-item',
      sceneId: state.activeSceneId,
      itemId: state.selectedItemId,
      offset: { x: 24, y: 24 },
    });
  },
  copySelection: () => {
    const state = get();
    if (!state.history || !state.activeSceneId || !state.selectedItemId) {
      return;
    }

    const item = findItem(state.history.present, state.activeSceneId, state.selectedItemId);
    if (item) {
      set({ clipboardItem: JSON.parse(JSON.stringify(item)) as SceneItem });
    }
  },
  pasteSelection: () => {
    const state = get();
    if (!state.history || !state.activeSceneId || !state.clipboardItem) {
      return;
    }

    const copied = JSON.parse(JSON.stringify(state.clipboardItem)) as SceneItem;
    const copiedDefinition =
      copied.kind === 'placed-entity' ? getDefinition(copied.definitionId, state.history.present) : null;
    const item: SceneItem =
      copied.kind === 'placed-entity'
        ? {
            ...copied,
            id: createId('item'),
            sceneId: state.activeSceneId,
            interiorSceneId: undefined,
            label: copiedDefinition
              ? getNextEntityLabel(state.history.present, state.activeSceneId, copiedDefinition)
              : copied.label,
            position: {
              x: copied.position.x + 24,
              y: copied.position.y + 24,
            },
          }
        : copied.kind === 'cable-run'
          ? {
              ...copied,
              id: createId('item'),
              sceneId: state.activeSceneId,
              points: copied.points.map((point) => ({ x: point.x + 24, y: point.y + 24 })),
            }
          : copied.kind === 'arrow-annotation'
          ? {
              ...copied,
              id: createId('item'),
              sceneId: state.activeSceneId,
              start: { x: copied.start.x + 24, y: copied.start.y + 24 },
              end: { x: copied.end.x + 24, y: copied.end.y + 24 },
            }
          : copied.kind === 'circle-annotation'
            ? {
                ...copied,
                id: createId('item'),
                sceneId: state.activeSceneId,
                center: {
                  x: copied.center.x + 24,
                  y: copied.center.y + 24,
                },
              }
            : {
                ...copied,
                id: createId('item'),
                sceneId: state.activeSceneId,
                position: {
                  x: copied.position.x + 24,
                  y: copied.position.y + 24,
                },
              };

    state.applySceneCommand({
      type: 'add-item',
      sceneId: state.activeSceneId,
      item,
    });
    set({ selectedItemId: item.id });
  },
  undo: () => set((state) => (state.history ? { history: undoHistory(state.history), dirty: true } : state)),
  redo: () => set((state) => (state.history ? { history: redoHistory(state.history), dirty: true } : state)),
  enterInterior: (itemId) => {
    const state = get();
    if (!state.history || !state.activeSceneId) {
      return;
    }

    const item = findItem(state.history.present, state.activeSceneId, itemId);
    if (!item || item.kind !== 'placed-entity') {
      return;
    }

    const result = ensureInteriorScene(state.history.present, state.activeSceneId, itemId);
    set((current) => ({
      history:
        current.history && result.project !== current.history.present
          ? {
              past: [...current.history.past, current.history.present],
              present: result.project,
              future: [],
            }
          : current.history,
      activeSceneId: result.interiorSceneId,
      viewportByScene: {
        ...current.viewportByScene,
        [result.interiorSceneId]: current.viewportByScene[result.interiorSceneId] ?? createDefaultViewport(),
      },
      selectedItemId: null,
      dirty: result.project !== current.history?.present ? true : current.dirty,
    }));
  },
  openInteriorFromSiteItem: (itemId) => {
    const state = get();
    if (!state.history) {
      return;
    }

    const rootScene = findScene(state.history.present, state.history.present.rootSceneId);
    const item = rootScene?.items.find((candidate) => candidate.id === itemId);
    if (!rootScene || !item || item.kind !== 'placed-entity') {
      return;
    }

    const result = ensureInteriorScene(state.history.present, rootScene.id, itemId);
    set((current) => ({
      history:
        current.history && result.project !== current.history.present
          ? {
              past: [...current.history.past, current.history.present],
              present: result.project,
              future: [],
            }
          : current.history,
      activeSceneId: result.interiorSceneId,
      viewportByScene: {
        ...current.viewportByScene,
        [result.interiorSceneId]:
          current.viewportByScene[result.interiorSceneId] ?? createDefaultViewport(),
      },
      selectedItemId: null,
      dirty: result.project !== current.history?.present ? true : current.dirty,
    }));
  },
  exitInterior: () => {
    const state = get();
    if (!state.history || !state.activeSceneId) {
      return;
    }

    const parent = getParentEntityForScene(state.history.present, state.activeSceneId);
    if (parent) {
      set({
        activeSceneId: parent.parentSceneId,
        selectedItemId: parent.entity.id,
      });
    }
  },
  toggleVisibility: (key) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      const currentValue = state.history.present.visibility[key];
      if (typeof currentValue !== 'boolean') {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, {
          type: 'set-visibility',
          visibility: { [key]: !currentValue },
        }),
        dirty: true,
      };
    }),
  setGridSize: (gridSize) =>
    set((state) => {
      if (!state.history || !Number.isFinite(gridSize) || gridSize <= 0) {
        return state;
      }

      return {
        history: applyHistoryCommand(state.history, {
          type: 'set-visibility',
          visibility: { gridSize },
        }),
        dirty: true,
      };
    }),
  toggleCategoryVisibility: (category) =>
    set((state) => {
      if (!state.history) {
        return state;
      }

      const hiddenCategories = state.history.present.visibility.hiddenCategories.includes(category)
        ? state.history.present.visibility.hiddenCategories.filter((entry) => entry !== category)
        : [...state.history.present.visibility.hiddenCategories, category];

      return {
        history: applyHistoryCommand(state.history, {
          type: 'set-visibility',
          visibility: { hiddenCategories },
        }),
        dirty: true,
      };
    }),
  addBackgroundImageToActiveScene: async (file) => {
    const state = get();
    if (!state.history || !state.activeSceneId) {
      return;
    }

    const asset = await createEmbeddedImageAsset(file);
    state.applySceneCommand({ type: 'add-asset', asset });
    const scene = findScene(get().history!.present, state.activeSceneId);
    if (!scene) {
      return;
    }

    for (const existingBackground of scene.items.filter((item) => item.kind === 'background-image')) {
      get().applySceneCommand({
        type: 'remove-item',
        sceneId: state.activeSceneId,
        itemId: existingBackground.id,
      });
    }

    const background = createBackgroundImageItem(state.activeSceneId, asset.id, scene.size);
    get().applySceneCommand({
      type: 'add-item',
      sceneId: state.activeSceneId,
      item: background,
    });
    set({ selectedItemId: background.id, tool: 'select' });
  },
  setDirtySavedState: (fileName, fileHandle) => set({ dirty: false, currentFileName: fileName, fileHandle }),
  updateExportOptions: (changes) =>
    set((state) => ({
      exportOptions: {
        ...state.exportOptions,
        ...changes,
      },
    })),
}));
