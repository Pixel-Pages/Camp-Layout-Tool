import { getDefinition } from '../catalog';
import type { LayoutProject, LayoutScene, PlacedEntity } from '../domain/types';

export interface LegendEntry {
  id: string;
  label: string;
  quantity: number;
  fill: string;
  stroke: string;
  shape: 'rectangle' | 'rounded-rectangle' | 'ellipse' | 'tent-rect' | 'tent-dome';
  iconKey?: string;
}

const getLegendShape = (entity: PlacedEntity, project: LayoutProject): LegendEntry['shape'] => {
  const definition = getDefinition(entity.definitionId, project);
  if (!definition) {
    return 'rectangle';
  }

  if (definition.shape === 'ellipse') {
    return 'ellipse';
  }

  if (definition.shape === 'tent-dome') {
    return 'tent-dome';
  }

  if (definition.shape === 'tent-rect') {
    return 'tent-rect';
  }

  if (definition.shape === 'rounded-rectangle') {
    return 'rounded-rectangle';
  }

  return 'rectangle';
};

export const buildLegendEntries = (project: LayoutProject, scene: LayoutScene): LegendEntry[] => {
  const entities = scene.items.filter((item): item is PlacedEntity => {
    if (item.kind !== 'placed-entity' || !item.visible) {
      return false;
    }

    const definition = getDefinition(item.definitionId, project);
    if (!definition) {
      return false;
    }

    return !project.visibility.hiddenCategories.includes(definition.category);
  });

  const grouped = new Map<string, LegendEntry>();

  for (const entity of entities) {
    const definition = getDefinition(entity.definitionId, project);
    if (!definition) {
      continue;
    }

    const groupKey =
      scene.kind === 'interior'
        ? [
            definition.id,
            entity.style.fill,
            entity.style.stroke,
            entity.style.iconColor,
          ].join('::')
        : definition.id;

    const existing = grouped.get(groupKey) ?? {
      id: groupKey,
      label: definition.name,
      quantity: 0,
      fill: entity.style.fill,
      stroke: entity.style.iconColor || entity.style.stroke,
      shape: getLegendShape(entity, project),
      iconKey: definition.iconKey,
    };

    existing.quantity += 1;
    grouped.set(groupKey, existing);
  }

  return [...grouped.values()].sort((left, right) => left.label.localeCompare(right.label));
};
