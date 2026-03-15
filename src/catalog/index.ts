import type { CatalogDefinition, LayoutProject } from '../domain/types';
import { INTERIOR_DEFINITIONS } from './interiorCatalog';
import { SITE_DEFINITIONS } from './siteCatalog';

export const BUILTIN_CATALOG_DEFINITIONS: CatalogDefinition[] = [
  ...SITE_DEFINITIONS,
  ...INTERIOR_DEFINITIONS,
];

const builtInDefinitionMap = new Map(
  BUILTIN_CATALOG_DEFINITIONS.map((definition) => [definition.id, definition]),
);

const getCustomDefinitions = (
  projectOrDefinitions?: Pick<LayoutProject, 'customDefinitions'> | CatalogDefinition[] | null,
): CatalogDefinition[] =>
  Array.isArray(projectOrDefinitions)
    ? projectOrDefinitions
    : projectOrDefinitions?.customDefinitions ?? [];

export const getDefinition = (
  definitionId: string,
  projectOrDefinitions?: Pick<LayoutProject, 'customDefinitions'> | CatalogDefinition[] | null,
): CatalogDefinition | undefined =>
  getCustomDefinitions(projectOrDefinitions).find((definition) => definition.id === definitionId) ??
  builtInDefinitionMap.get(definitionId);

export const getDefinitionsForScene = (
  sceneKind: 'site' | 'interior',
  projectOrDefinitions?: Pick<LayoutProject, 'customDefinitions'> | CatalogDefinition[] | null,
): CatalogDefinition[] =>
  [...BUILTIN_CATALOG_DEFINITIONS, ...getCustomDefinitions(projectOrDefinitions)].filter(
    (definition) => definition.scope === sceneKind || definition.scope === 'both',
  );
