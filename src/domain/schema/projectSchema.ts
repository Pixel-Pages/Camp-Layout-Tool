import { z } from 'zod';
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
  cloneProject,
} from '../project';
import type { LayoutProject } from '../types';

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const sizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

const styleSchema = z.object({
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number(),
  iconColor: z.string(),
  labelColor: z.string(),
  lineColor: z.string(),
  lineWidth: z.number(),
  opacity: z.number().optional(),
});

const sceneAppearanceSchema = z.object({
  backgroundColor: z.string().optional(),
  frameColor: z.string().optional(),
  accentColor: z.string().optional(),
});

const catalogDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  scope: z.union([z.literal('site'), z.literal('interior'), z.literal('both')]),
  shape: z.union([
    z.literal('rectangle'),
    z.literal('rounded-rectangle'),
    z.literal('ellipse'),
    z.literal('icon'),
    z.literal('tent-rect'),
    z.literal('tent-dome'),
  ]),
  defaultSize: sizeSchema,
  rotatable: z.boolean(),
  resizable: z.boolean(),
  supportsInterior: z.boolean(),
  defaultWeightLbs: z.number().optional(),
  defaultStyle: styleSchema,
  iconKey: z.string().optional(),
  labelPrefix: z.string().optional(),
  description: z.string().optional(),
});

const baseItemSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  label: z.string().optional(),
  visible: z.boolean(),
  locked: z.boolean(),
  metadata: z
    .object({
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      weightOverrideLbs: z.number().optional(),
    })
    .optional(),
});

const placedEntitySchema = baseItemSchema.extend({
  kind: z.literal('placed-entity'),
  definitionId: z.string(),
  position: pointSchema,
  size: sizeSchema,
  rotation: z.number(),
  style: styleSchema,
  interiorSceneId: z.string().optional(),
});

const cableRunSchema = baseItemSchema.extend({
  kind: z.literal('cable-run'),
  points: z.array(pointSchema).min(2),
  style: styleSchema,
});

const textAnnotationSchema = baseItemSchema.extend({
  kind: z.literal('text-annotation'),
  position: pointSchema,
  text: z.string(),
  fontSize: z.number().positive(),
  style: styleSchema,
});

const arrowAnnotationSchema = baseItemSchema.extend({
  kind: z.literal('arrow-annotation'),
  start: pointSchema,
  end: pointSchema,
  style: styleSchema,
});

const circleAnnotationSchema = baseItemSchema.extend({
  kind: z.literal('circle-annotation'),
  center: pointSchema,
  radius: z.number().positive(),
  style: styleSchema,
});

const backgroundImageSchema = baseItemSchema.extend({
  kind: z.literal('background-image'),
  assetId: z.string(),
  position: pointSchema,
  size: sizeSchema,
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1),
  style: styleSchema,
});

const sceneItemSchema = z.discriminatedUnion('kind', [
  placedEntitySchema,
  cableRunSchema,
  textAnnotationSchema,
  arrowAnnotationSchema,
  circleAnnotationSchema,
  backgroundImageSchema,
]);

const sceneSchema = z.object({
  id: z.string(),
  kind: z.union([z.literal('site'), z.literal('interior')]),
  name: z.string(),
  size: sizeSchema,
  appearance: sceneAppearanceSchema.default({}),
  items: z.array(sceneItemSchema),
});

const assetSchema = z.object({
  id: z.string(),
  kind: z.literal('image'),
  name: z.string(),
  mimeType: z.string(),
  dataUrl: z.string(),
});

const visibilitySchema = z.object({
  showGrid: z.boolean(),
  showLabels: z.boolean(),
  showTentInteriors: z.boolean(),
  showReferenceBackgrounds: z.boolean(),
  gridSize: z.number().positive().default(12),
  hiddenCategories: z.array(z.string()),
});

export const layoutProjectSchema = z.object({
  format: z.literal(PROJECT_FORMAT),
  version: z.literal(PROJECT_VERSION),
  id: z.string(),
  name: z.string(),
  projectType: z.union([z.literal('site'), z.literal('interior')]),
  rootSceneId: z.string(),
  scenes: z.array(sceneSchema).min(1),
  assets: z.array(assetSchema),
  customDefinitions: z.array(catalogDefinitionSchema).default([]),
  visibility: visibilitySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const parseLayoutProject = (value: unknown): LayoutProject => layoutProjectSchema.parse(value);

export const migrateLayoutProject = (value: unknown): LayoutProject => {
  const parsed = layoutProjectSchema.safeParse(value);
  if (parsed.success) {
    return cloneProject(parsed.data);
  }

  throw new Error(`Unsupported project format: ${parsed.error.issues[0]?.message ?? 'Unknown error'}`);
};

export const serializeLayoutProject = (project: LayoutProject): string => JSON.stringify(project, null, 2);
