import { useEffect, useMemo, useRef, useState } from 'react';
import type Konva from 'konva';
import { getDefinition, getDefinitionsForScene } from '../catalog';
import { useEditorStore } from './store/editorStore';
import { LayoutStage } from '../editor/canvas/LayoutStage';
import { createCustomCatalogDefinition, findItem, findScene, getParentEntityForScene } from '../domain/project';
import { serializeLayoutProject } from '../domain/schema/projectSchema';
import {
  buildPackingListSections,
  exportPackingListSectionsCsv,
  getPackingListWeightTotal,
} from '../domain/reporting';
import {
  downloadDataUrl,
  downloadTextFile,
  loadProjectFromFile,
  saveProjectDocument,
} from '../features/project/fileIO';
import { WelcomeScreen } from '../features/project/WelcomeScreen';
import { InteriorProjectForm } from '../features/project/InteriorProjectForm';
import { Toolbar } from '../features/project/Toolbar';
import { ObjectPalette } from '../features/palette/ObjectPalette';
import { CustomItemForm } from '../features/palette/CustomItemForm';
import { Breadcrumbs } from '../features/navigation/Breadcrumbs';
import { LayerPanel } from '../features/layers/LayerPanel';
import { InspectorPanel } from '../features/inspector/InspectorPanel';
import { ReportPanel } from '../features/reports/ReportPanel';
import { BackgroundPanel } from '../features/backgrounds/BackgroundPanel';
import { useElementSize } from '../shared/useElementSize';
import { BASE_PIXELS_PER_INCH, clampZoom, screenToScene } from '../editor/viewport';
import { getLayoutFrameMetrics } from '../editor/layoutFrame';
import { buildLegendEntries } from '../editor/legend';
import type { BackgroundImageItem, ViewportState } from '../domain/types';

const defaultFileName = (projectName: string) =>
  `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'layout-project'}.layoutplanner.json`;

const getFileStem = (fileName: string): string =>
  fileName.replace(/\.layoutplanner\.json$/i, '').replace(/\.json$/i, '');

type InlineEditorState =
  | { kind: 'project-title'; value: string }
  | { kind: 'container-title'; value: string }
  | { kind: 'text-item'; itemId: string; value: string };

type CustomItemDraft = Omit<Parameters<typeof createCustomCatalogDefinition>[0], 'scope'>;

const DEFAULT_VIEWPORT: ViewportState = { zoom: 1, offset: { x: 80, y: 80 } };

const createSceneFitViewport = (
  hostWidth: number,
  hostHeight: number,
  sceneMetrics: ReturnType<typeof getLayoutFrameMetrics>,
): ViewportState => {
  const safeWidth = Math.max(hostWidth, 320);
  const safeHeight = Math.max(hostHeight, 320);
  const padding = 40;
  const zoom = clampZoom(
    Math.min(
      (safeWidth - padding) / (sceneMetrics.sheetSize.width * BASE_PIXELS_PER_INCH),
      (safeHeight - padding) / (sceneMetrics.sheetSize.height * BASE_PIXELS_PER_INCH),
    ),
  );

  return {
    zoom,
    offset: {
      x: (safeWidth - sceneMetrics.sheetSize.width * BASE_PIXELS_PER_INCH * zoom) / 2,
      y: (safeHeight - sceneMetrics.sheetSize.height * BASE_PIXELS_PER_INCH * zoom) / 2,
    },
  };
};

export const App = () => {
  const editor = useEditorStore();
  const project = editor.history?.present ?? null;
  const activeScene = project && editor.activeSceneId ? findScene(project, editor.activeSceneId) ?? null : null;
  const activeInteriorOwner =
    project && activeScene?.kind === 'interior' ? getParentEntityForScene(project, activeScene.id)?.entity ?? null : null;
  const selectedItem =
    project && activeScene && editor.selectedItemId
      ? findItem(project, activeScene.id, editor.selectedItemId) ?? null
      : null;
  const activeBackgroundItem =
    activeScene?.items.find((item) => item.kind === 'background-image') ?? null;
  const campScene =
    project?.projectType === 'site' ? findScene(project, project.rootSceneId) ?? null : null;
  const activeSceneViewport = activeScene ? editor.viewportByScene[activeScene.id] ?? DEFAULT_VIEWPORT : DEFAULT_VIEWPORT;
  const legendEntries = useMemo(
    () => (project && activeScene ? buildLegendEntries(project, activeScene) : []),
    [activeScene, project],
  );
  const activeFrame = useMemo(
    () =>
      project && activeScene
        ? getLayoutFrameMetrics(activeScene, project.visibility.showLabels, legendEntries.length)
        : null,
    [activeScene, legendEntries.length, project],
  );
  const packingSections = useMemo(
    () => (project ? buildPackingListSections(project) : { exterior: [], interior: [] }),
    [project],
  );
  const totalWeight = useMemo(
    () =>
      getPackingListWeightTotal([
        ...packingSections.exterior,
        ...packingSections.interior,
      ]),
    [packingSections],
  );
  const projectFileName = project ? editor.currentFileName ?? defaultFileName(project.name) : 'layout.layoutplanner.json';
  const documentTitle = project ? getFileStem(editor.currentFileName ?? '') || project.name : 'Layout Project';

  const projectInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [canvasHost, setCanvasHost] = useState<HTMLDivElement | null>(null);
  const canvasSize = useElementSize(canvasHost);
  const [notice, setNotice] = useState<string | null>(null);
  const [placementWidth, setPlacementWidth] = useState('');
  const [placementHeight, setPlacementHeight] = useState('');
  const [gridSizeInput, setGridSizeInput] = useState('12');
  const [campWidthInput, setCampWidthInput] = useState('');
  const [campHeightInput, setCampHeightInput] = useState('');
  const [isInteriorDialogOpen, setIsInteriorDialogOpen] = useState(false);
  const [isCustomItemDialogOpen, setIsCustomItemDialogOpen] = useState(false);
  const [inlineEditor, setInlineEditor] = useState<InlineEditorState | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const autoFitSceneIdsRef = useRef<Set<string>>(new Set());

  const sceneCategories = useMemo(() => {
    if (!project || !activeScene) {
      return [];
    }

    const categories = new Set(getDefinitionsForScene(activeScene.kind, project).map((definition) => definition.category));
    return [...categories].map((category) => ({
      name: category,
      hidden: project.visibility.hiddenCategories.includes(category),
    }));
  }, [activeScene, project]);

  useEffect(() => {
    if (!editor.selectedCatalogId) {
      return;
    }

    const definition = project ? getDefinition(editor.selectedCatalogId, project) : undefined;
    if (!definition) {
      return;
    }

    setPlacementWidth(String(editor.placementSize?.width ?? definition.defaultSize.width));
    setPlacementHeight(String(editor.placementSize?.height ?? definition.defaultSize.height));
  }, [editor.selectedCatalogId, editor.placementSize, project]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setGridSizeInput(String(project.visibility.gridSize));
  }, [project?.visibility.gridSize, project]);

  useEffect(() => {
    if (!campScene) {
      return;
    }

    setCampWidthInput(String(campScene.size.width));
    setCampHeightInput(String(campScene.size.height));
  }, [campScene?.id, campScene?.size.height, campScene?.size.width]);

  useEffect(() => {
    autoFitSceneIdsRef.current.clear();
    setInlineEditor(null);
  }, [project?.id]);

  useEffect(() => {
    setInlineEditor(null);
  }, [activeScene?.id]);

  useEffect(() => {
    if (!activeScene || activeScene.kind !== 'interior' || !activeFrame) {
      return;
    }

    if (canvasSize.width < 240 || canvasSize.height < 240) {
      return;
    }

    if (autoFitSceneIdsRef.current.has(activeScene.id)) {
      return;
    }

    editor.setViewport(
      activeScene.id,
      createSceneFitViewport(canvasSize.width, canvasSize.height, activeFrame),
    );
    autoFitSceneIdsRef.current.add(activeScene.id);
  }, [activeFrame, activeScene, canvasSize.height, canvasSize.width, editor]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editor.dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editor.dirty]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      const store = useEditorStore.getState();

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        store.redo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        store.duplicateSelection();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        store.copySelection();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        store.pasteSelection();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        store.deleteSelection();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        store.cancelDraftTool();
        store.setTool('select');
        return;
      }

      if (event.key === 'Enter') {
        store.finishDraftTool();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const confirmDiscardIfNeeded = () => {
    if (!editor.dirty) {
      return true;
    }

    return window.confirm('You have unsaved changes. Continue and discard the current session state?');
  };

  const handleCreateSite = (name: string) => {
    if (!confirmDiscardIfNeeded()) {
      return;
    }
    editor.createProject('site', name || 'New Camp Layout');
    setNotice(null);
  };

  const handleCreateInterior = (name: string, length: number, width: number) => {
    if (!confirmDiscardIfNeeded()) {
      return;
    }
    editor.createProject('interior', name || 'New Interior Layout', { width: length, height: width });
    setIsInteriorDialogOpen(false);
    setNotice(null);
  };

  const handleSelectDefinition = (definitionId: string) => {
    const definition = project ? getDefinition(definitionId, project) : undefined;
    editor.setSelectedCatalogId(definitionId);
    if (definition?.resizable) {
      editor.setPlacementSize(definition.defaultSize);
      setPlacementWidth(String(definition.defaultSize.width));
      setPlacementHeight(String(definition.defaultSize.height));
    } else {
      editor.setPlacementSize(null);
      setPlacementWidth(String(definition?.defaultSize.width ?? ''));
      setPlacementHeight(String(definition?.defaultSize.height ?? ''));
    }
  };

  const handlePlacementSizeChange = (width: string, height: string) => {
    setPlacementWidth(width);
    setPlacementHeight(height);
    const nextWidth = Number(width);
    const nextHeight = Number(height);
    if (nextWidth > 0 && nextHeight > 0) {
      editor.setPlacementSize({ width: nextWidth, height: nextHeight });
      return;
    }

    editor.setPlacementSize(null);
  };

  const handleGridSizeChange = (value: string) => {
    setGridSizeInput(value);
    const nextGridSize = Number(value);
    if (Number.isFinite(nextGridSize) && nextGridSize > 0) {
      editor.setGridSize(nextGridSize);
    }
  };

  const handleCampSizeChange = (width: string, height: string) => {
    setCampWidthInput(width);
    setCampHeightInput(height);
    if (!campScene) {
      return;
    }

    const nextWidth = Number(width);
    const nextHeight = Number(height);
    if (nextWidth > 0 && nextHeight > 0) {
      editor.setSceneSize(campScene.id, { width: nextWidth, height: nextHeight });
    }
  };

  const handleDefinitionDragStart = (definitionId: string) => {
    handleSelectDefinition(definitionId);
    setNotice('Drop the item onto the layout to place it.');
  };

  const handleCreateCustomItem = (sceneKind: 'site' | 'interior', value: CustomItemDraft) => {
    const definition = createCustomCatalogDefinition({
      ...value,
      scope: sceneKind,
    });
    editor.addCustomDefinition(definition);
    setIsCustomItemDialogOpen(false);
    setNotice(`Created ${definition.name}. Drag it onto the layout when ready.`);
  };

  const handleOpenProject = async (file?: File | null) => {
    if (!file) {
      if (project && !confirmDiscardIfNeeded()) {
        return;
      }
      projectInputRef.current?.click();
      return;
    }

    try {
      const loaded = await loadProjectFromFile(file);
      editor.loadProject(loaded.project, loaded.fileName);
      setNotice(`Opened ${loaded.fileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to open project file.');
    }
  };

  const handleSave = async () => {
    if (!project) {
      return;
    }

    try {
      const result = await saveProjectDocument(
        serializeLayoutProject(project),
        projectFileName,
        editor.fileHandle,
      );
      editor.setDirtySavedState(result.fileName, result.fileHandle);
      setNotice(`Saved ${result.fileName}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to save project.');
    }
  };

  const handleExportImage = async () => {
    if (!project || !activeScene || !stageRef.current) {
      return;
    }

    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
    await downloadDataUrl(
      dataUrl,
      `${documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${activeScene.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.png`,
    );
  };

  const handleExportCsv = () => {
    if (!project) {
      return;
    }

    downloadTextFile(
      exportPackingListSectionsCsv(packingSections),
      `${documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-packing-list.csv`,
      'text/csv',
    );
  };

  const handleBackgroundUpload = async (file?: File | null) => {
    if (!file) {
      backgroundInputRef.current?.click();
      return;
    }

    try {
      await editor.addBackgroundImageToActiveScene(file);
      setNotice(`Embedded ${file.name} into this project.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to add background.');
    }
  };

  const handleUpdateActiveInteriorTitle = (title: string) => {
    if (!project || !activeScene || !activeInteriorOwner) {
      return;
    }

    const parent = getParentEntityForScene(project, activeScene.id);
    if (!parent) {
      return;
    }

    editor.applySceneCommand({
      type: 'update-item',
      sceneId: parent.parentSceneId,
      itemId: parent.entity.id,
      changes: { label: title },
    });
  };

  const handleEditActiveTitle = () => {
    if (!project || !activeScene) {
      return;
    }

    if (activeScene.kind === 'site' || !activeInteriorOwner) {
      setInlineEditor({
        kind: 'project-title',
        value: documentTitle,
      });
      return;
    }

    setInlineEditor({
      kind: 'container-title',
      value: activeInteriorOwner.label ?? '',
    });
  };

  const handleEditTextItem = (itemId: string) => {
    if (!activeScene || !project) {
      return;
    }

    const item = findItem(project, activeScene.id, itemId);
    if (!item || item.kind !== 'text-annotation') {
      return;
    }

    setInlineEditor({
      kind: 'text-item',
      itemId,
      value: item.text,
    });
    editor.setSelectedItemId(itemId);
  };

  const handleCommitInlineEdit = () => {
    if (!inlineEditor) {
      return;
    }

    const nextValue = inlineEditor.value.trim();
    if (!nextValue) {
      setInlineEditor(null);
      return;
    }

    if (inlineEditor.kind === 'project-title') {
      editor.renameProject(nextValue);
      setInlineEditor(null);
      return;
    }

    if (inlineEditor.kind === 'container-title') {
      handleUpdateActiveInteriorTitle(nextValue);
      setInlineEditor(null);
      return;
    }

    if (!activeScene) {
      setInlineEditor(null);
      return;
    }

    editor.applySceneCommand({
      type: 'update-item',
      sceneId: activeScene.id,
      itemId: inlineEditor.itemId,
      changes: { text: nextValue, label: nextValue },
    });
    editor.setSelectedItemId(inlineEditor.itemId);
    setInlineEditor(null);
  };

  const handleUpdateBackground = (changes: Partial<BackgroundImageItem>) => {
    if (!activeScene || !activeBackgroundItem) {
      return;
    }

    editor.applySceneCommand({
      type: 'update-item',
      sceneId: activeScene.id,
      itemId: activeBackgroundItem.id,
      changes,
    });
  };

  const handleCanvasClick = (point: { x: number; y: number }) => {
    if (editor.tool === 'text') {
      const itemId = editor.addTextAt(point);
      if (itemId) {
        handleEditTextItem(itemId);
      }
      return;
    }

    editor.handleCanvasClick(point);
  };

  const activeInlineTextItem =
    inlineEditor?.kind === 'text-item' && project && activeScene
      ? findItem(project, activeScene.id, inlineEditor.itemId) ?? null
      : null;

  const inlineEditorLayout = useMemo(() => {
    if (!activeScene || !activeFrame || !inlineEditor) {
      return null;
    }

    const scale = BASE_PIXELS_PER_INCH * activeSceneViewport.zoom;

    if (inlineEditor.kind === 'project-title' || inlineEditor.kind === 'container-title') {
      return {
        left: activeSceneViewport.offset.x + scale * activeFrame.sceneOrigin.x,
        top: activeSceneViewport.offset.y + scale * (activeFrame.scenePadding - (activeScene.kind === 'site' ? 10 : 8)),
        width: scale * activeScene.size.width,
        minHeight: scale * (activeScene.kind === 'site' ? 54 : 28),
        fontSize: scale * (activeScene.kind === 'site' ? 42 : 18),
        textAlign: 'center' as const,
        multiline: false,
      };
    }

    if (!activeInlineTextItem || activeInlineTextItem.kind !== 'text-annotation') {
      return null;
    }

    return {
      left: activeSceneViewport.offset.x + scale * (activeFrame.sceneOrigin.x + activeInlineTextItem.position.x),
      top:
        activeSceneViewport.offset.y +
        scale * (activeFrame.sceneOrigin.y + activeInlineTextItem.position.y) -
        scale * (activeInlineTextItem.fontSize * 0.2),
      width: Math.max(
        160,
        Math.min(
          420,
          activeInlineTextItem.text.length * scale * Math.max(0.4, activeInlineTextItem.fontSize * 0.035) + 180,
        ),
      ),
      minHeight: Math.max(42, scale * Math.max(activeInlineTextItem.fontSize * 1.4, 28)),
      fontSize: Math.max(14, scale * activeInlineTextItem.fontSize),
      textAlign: 'left' as const,
      multiline: true,
    };
  }, [activeFrame, activeInlineTextItem, activeScene, activeSceneViewport, inlineEditor]);

  if (!project || !activeScene) {
    return (
      <div className={`app-root theme-${theme}`}>
        <WelcomeScreen
          onCreateSite={handleCreateSite}
          onCreateInterior={handleCreateInterior}
          onOpenProject={() => handleOpenProject()}
        />
        <input
          ref={projectInputRef}
          type="file"
          accept=".json,.layoutplanner.json"
          hidden
          onChange={(event) => handleOpenProject(event.target.files?.[0] ?? null)}
        />
      </div>
    );
  }

  return (
    <div className={`app-root theme-${theme}`}>
      <Toolbar
        projectName={documentTitle}
        scene={activeScene}
        dirty={editor.dirty}
        tool={editor.tool}
        canUndo={Boolean(editor.history?.past.length)}
        canRedo={Boolean(editor.history?.future.length)}
        theme={theme}
        onNewSite={() => handleCreateSite('New Camp Layout')}
        onNewInterior={() => setIsInteriorDialogOpen(true)}
        onExportPng={handleExportImage}
        onOpen={() => handleOpenProject()}
        onSave={handleSave}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        onSetTool={editor.setTool}
      />

      <div className="workspace">
        <ObjectPalette
          project={project}
          sceneKind={activeScene.kind}
          selectedDefinitionId={editor.selectedCatalogId}
          placementWidth={placementWidth}
          placementHeight={placementHeight}
          onSelectDefinition={handleSelectDefinition}
          onDragDefinitionStart={handleDefinitionDragStart}
          onPlacementSizeChange={handlePlacementSizeChange}
          onCreateCustomItem={() => setIsCustomItemDialogOpen(true)}
        />

        <section className="canvas-column">
          <div className="canvas-topbar">
            <Breadcrumbs
              project={project}
              activeSceneId={activeScene.id}
              onNavigate={(sceneId) => editor.setActiveSceneId(sceneId)}
              onOpenInterior={(itemId) => editor.openInteriorFromSiteItem(itemId)}
            />
            {notice ? <div className="notice-banner">{notice}</div> : null}
          </div>

          <div
            className={`canvas-host canvas-host-${activeScene.kind}`}
            ref={setCanvasHost}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(event) => {
              event.preventDefault();
              const definitionId = event.dataTransfer.getData('application/x-layout-definition');
              if (!definitionId || !canvasHost) {
                return;
              }

              const rect = canvasHost.getBoundingClientRect();
              const scenePoint = screenToScene(
                {
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                },
                activeSceneViewport,
              );
              const frame = getLayoutFrameMetrics(activeScene, project.visibility.showLabels, 0);
              const localPoint = {
                x: scenePoint.x - frame.sceneOrigin.x,
                y: scenePoint.y - frame.sceneOrigin.y,
              };

              if (
                localPoint.x < 0 ||
                localPoint.y < 0 ||
                localPoint.x > activeScene.size.width ||
                localPoint.y > activeScene.size.height
              ) {
                setNotice('Drop the item inside the layout grid.');
                return;
              }

              const width = Number(placementWidth);
              const height = Number(placementHeight);
              const sizeOverride = width > 0 && height > 0 ? { width, height } : null;
              editor.placeDefinitionAt(definitionId, localPoint, sizeOverride);
              editor.setSelectedCatalogId(definitionId);
              editor.setTool('select');
              setNotice(`Placed ${getDefinition(definitionId, project)?.name ?? 'item'}.`);
            }}
          >
            <LayoutStage
              project={project}
              scene={activeScene}
              documentTitle={documentTitle}
              tool={editor.tool}
              viewport={activeSceneViewport}
              selectedItemId={editor.selectedItemId}
              draftCable={editor.draftCable}
              draftArrow={editor.draftArrow}
              draftCircle={editor.draftCircle}
              width={canvasSize.width}
              height={canvasSize.height}
              stageRef={stageRef}
              onViewportChange={(viewport) => editor.setViewport(activeScene.id, viewport)}
              onCanvasClick={handleCanvasClick}
              onCanvasMove={editor.handleCanvasMove}
              onEditTitle={handleEditActiveTitle}
              onSelectItem={(itemId) => {
                editor.setSelectedItemId(itemId);
                if (editor.tool !== 'text') {
                  editor.setTool('select');
                }
              }}
              onEditTextItem={handleEditTextItem}
              onUpdateItem={(itemId, changes) =>
                editor.applySceneCommand({
                  type: 'update-item',
                  sceneId: activeScene.id,
                  itemId,
                  changes,
                })
              }
              onEnterInterior={editor.enterInterior}
              onUpdateCablePoint={editor.updateCablePoint}
              onUpdateArrowEndpoint={editor.updateArrowEndpoint}
              onFinishDraftTool={editor.finishDraftTool}
            />

            {inlineEditor && inlineEditorLayout ? (
              <div
                className="canvas-inline-editor-shell"
                style={{
                  left: `${inlineEditorLayout.left}px`,
                  top: `${inlineEditorLayout.top}px`,
                  width: `${inlineEditorLayout.width}px`,
                }}
              >
                {inlineEditorLayout.multiline ? (
                  <textarea
                    autoFocus
                    className="canvas-inline-editor"
                    value={inlineEditor.value}
                    style={{
                      minHeight: `${inlineEditorLayout.minHeight}px`,
                      fontSize: `${inlineEditorLayout.fontSize}px`,
                      textAlign: inlineEditorLayout.textAlign,
                    }}
                    onChange={(event) =>
                      setInlineEditor((current) =>
                        current ? { ...current, value: event.target.value } : current,
                      )
                    }
                    onBlur={handleCommitInlineEdit}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setInlineEditor(null);
                      }

                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault();
                        handleCommitInlineEdit();
                      }
                    }}
                  />
                ) : (
                  <input
                    autoFocus
                    className="canvas-inline-editor"
                    value={inlineEditor.value}
                    style={{
                      minHeight: `${inlineEditorLayout.minHeight}px`,
                      fontSize: `${inlineEditorLayout.fontSize}px`,
                      textAlign: inlineEditorLayout.textAlign,
                    }}
                    onChange={(event) =>
                      setInlineEditor((current) =>
                        current ? { ...current, value: event.target.value } : current,
                      )
                    }
                    onBlur={handleCommitInlineEdit}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCommitInlineEdit();
                      }

                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setInlineEditor(null);
                      }
                    }}
                  />
                )}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="sidebar right-sidebar">
          <LayerPanel
            showGrid={project.visibility.showGrid}
            showLabels={project.visibility.showLabels}
            showTentInteriors={project.visibility.showTentInteriors}
            showReferenceBackgrounds={project.visibility.showReferenceBackgrounds}
            gridSize={gridSizeInput}
            campWidth={activeScene.id === project.rootSceneId && campScene ? campWidthInput : undefined}
            campHeight={activeScene.id === project.rootSceneId && campScene ? campHeightInput : undefined}
            categories={sceneCategories}
            onToggleVisibility={editor.toggleVisibility}
            onGridSizeChange={handleGridSizeChange}
            onCampSizeChange={activeScene.id === project.rootSceneId && campScene ? handleCampSizeChange : undefined}
            onToggleCategory={editor.toggleCategoryVisibility}
          />

          <BackgroundPanel
            item={activeBackgroundItem}
            onUpload={() => handleBackgroundUpload()}
            onSelectBackground={
              activeBackgroundItem ? () => editor.setSelectedItemId(activeBackgroundItem.id) : undefined
            }
            onUpdateBackground={handleUpdateBackground}
          />

          <InspectorPanel
            project={project}
            item={selectedItem}
            activeContainerTitle={activeInteriorOwner?.label ?? null}
            activeContainerTypeLabel={activeInteriorOwner ? 'Tent / structure title' : null}
            onUpdateActiveContainerTitle={activeInteriorOwner ? handleUpdateActiveInteriorTitle : undefined}
            onUpdateItem={editor.updateSelectedItem}
            onEnterInterior={() => {
              if (selectedItem?.kind === 'placed-entity') {
                editor.enterInterior(selectedItem.id);
              }
            }}
          />

          <ReportPanel sections={packingSections} totalWeight={totalWeight} onExportCsv={handleExportCsv} />
        </aside>
      </div>

      <input
        ref={projectInputRef}
        type="file"
        accept=".json,.layoutplanner.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void handleOpenProject(file);
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void handleBackgroundUpload(file);
          event.currentTarget.value = '';
        }}
      />

      {isInteriorDialogOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="panel-header">
              <h3>New interior only layout</h3>
              <p className="panel-copy">Choose a tent footprint or set a custom room size before creating the layout.</p>
            </div>
            <InteriorProjectForm
              submitLabel="Create Interior Only Layout"
              onSubmit={handleCreateInterior}
              onCancel={() => setIsInteriorDialogOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {isCustomItemDialogOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="panel-header">
              <h3>Create custom item</h3>
              <p className="panel-copy">Define a reusable custom inventory item for this project.</p>
            </div>
            <CustomItemForm
              sceneKind={activeScene.kind}
              onSubmit={(value) => handleCreateCustomItem(activeScene.kind, value)}
              onCancel={() => setIsCustomItemDialogOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
