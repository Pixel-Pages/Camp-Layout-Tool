export type ProjectKind = 'site' | 'interior';
export type SceneKind = 'site' | 'interior';
export type ToolMode = 'select' | 'pan' | 'place' | 'cable' | 'text' | 'arrow' | 'circle';
export type ItemKind =
  | 'placed-entity'
  | 'cable-run'
  | 'text-annotation'
  | 'arrow-annotation'
  | 'circle-annotation'
  | 'background-image';
export type ShapeKind =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'ellipse'
  | 'icon'
  | 'tent-rect'
  | 'tent-dome';
export type DefinitionScope = 'site' | 'interior' | 'both';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface StyleProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  iconColor: string;
  labelColor: string;
  lineColor: string;
  lineWidth: number;
  opacity?: number;
}

export interface VisibilityState {
  showGrid: boolean;
  showLabels: boolean;
  showTentInteriors: boolean;
  showReferenceBackgrounds: boolean;
  gridSize: number;
  hiddenCategories: string[];
}

export interface SceneAppearance {
  backgroundColor?: string;
  frameColor?: string;
  accentColor?: string;
}

export interface ItemMetadata {
  notes?: string;
  tags?: string[];
  weightOverrideLbs?: number;
}

export interface CatalogDefinition {
  id: string;
  name: string;
  category: string;
  scope: DefinitionScope;
  shape: ShapeKind;
  defaultSize: Size;
  rotatable: boolean;
  resizable: boolean;
  supportsInterior: boolean;
  defaultWeightLbs?: number;
  defaultStyle: StyleProps;
  iconKey?: string;
  labelPrefix?: string;
  description?: string;
}

export interface BaseSceneItem {
  id: string;
  kind: ItemKind;
  sceneId: string;
  label?: string;
  visible: boolean;
  locked: boolean;
  metadata?: ItemMetadata;
}

export interface PlacedEntity extends BaseSceneItem {
  kind: 'placed-entity';
  definitionId: string;
  position: Point;
  size: Size;
  rotation: number;
  style: StyleProps;
  interiorSceneId?: string;
}

export interface CableRun extends BaseSceneItem {
  kind: 'cable-run';
  points: Point[];
  style: StyleProps;
}

export interface TextAnnotation extends BaseSceneItem {
  kind: 'text-annotation';
  position: Point;
  text: string;
  fontSize: number;
  style: StyleProps;
}

export interface ArrowAnnotation extends BaseSceneItem {
  kind: 'arrow-annotation';
  start: Point;
  end: Point;
  style: StyleProps;
}

export interface CircleAnnotation extends BaseSceneItem {
  kind: 'circle-annotation';
  center: Point;
  radius: number;
  style: StyleProps;
}

export interface BackgroundImageItem extends BaseSceneItem {
  kind: 'background-image';
  assetId: string;
  position: Point;
  size: Size;
  rotation: number;
  opacity: number;
  style: StyleProps;
}

export type SceneItem =
  | PlacedEntity
  | CableRun
  | TextAnnotation
  | ArrowAnnotation
  | CircleAnnotation
  | BackgroundImageItem;

export interface LayoutScene {
  id: string;
  kind: SceneKind;
  name: string;
  size: Size;
  appearance: SceneAppearance;
  items: SceneItem[];
}

export interface EmbeddedAsset {
  id: string;
  kind: 'image';
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface LayoutProject {
  format: 'field-layout-planner';
  version: 1;
  id: string;
  name: string;
  projectType: ProjectKind;
  rootSceneId: string;
  scenes: LayoutScene[];
  assets: EmbeddedAsset[];
  customDefinitions: CatalogDefinition[];
  visibility: VisibilityState;
  createdAt: string;
  updatedAt: string;
}

export interface PackingListRow {
  definitionId: string;
  definitionName: string;
  category: string;
  quantity: number;
  totalWeightLbs?: number;
}

export interface PackingListSections {
  exterior: PackingListRow[];
  interior: PackingListRow[];
}

export type ProjectCommand =
  | { type: 'add-item'; sceneId: string; item: SceneItem }
  | { type: 'update-item'; sceneId: string; itemId: string; changes: Partial<SceneItem> }
  | { type: 'move-item'; sceneId: string; itemId: string; position: Point }
  | { type: 'rotate-entity'; sceneId: string; itemId: string; rotation: number }
  | { type: 'resize-entity'; sceneId: string; itemId: string; size: Size }
  | { type: 'update-scene-size'; sceneId: string; size: Size }
  | { type: 'update-scene-appearance'; sceneId: string; appearance: Partial<SceneAppearance> }
  | { type: 'rename-project'; name: string }
  | { type: 'add-custom-definition'; definition: CatalogDefinition }
  | { type: 'remove-item'; sceneId: string; itemId: string }
  | { type: 'duplicate-item'; sceneId: string; itemId: string; offset?: Point }
  | { type: 'add-scene'; scene: LayoutScene }
  | { type: 'link-interior-scene'; sceneId: string; itemId: string; interiorSceneId: string }
  | { type: 'set-visibility'; visibility: Partial<VisibilityState> }
  | { type: 'add-asset'; asset: EmbeddedAsset }
  | { type: 'remove-asset'; assetId: string };

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface ViewportState {
  zoom: number;
  offset: Point;
}

export interface ExportOptions {
  includeGrid: boolean;
  includeLabels: boolean;
  includeInteriors: boolean;
  includeBackgrounds: boolean;
}
