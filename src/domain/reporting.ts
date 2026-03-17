import { getDefinition } from '../catalog';
import type { LayoutProject, PackingListRow, PackingListSections, PlacedEntity } from './types';

const collectEntitiesByScope = (
  project: LayoutProject,
): { exterior: PlacedEntity[]; interior: PlacedEntity[] } => {
  const sections = {
    exterior: [] as PlacedEntity[],
    interior: [] as PlacedEntity[],
  };

  for (const scene of project.scenes) {
    const target =
      project.projectType === 'site' && scene.id === project.rootSceneId
        ? sections.exterior
        : sections.interior;
    target.push(
      ...scene.items.filter((item): item is PlacedEntity => item.kind === 'placed-entity'),
    );
  }

  return sections;
};

const buildPackingListRows = (project: LayoutProject, entities: PlacedEntity[]): PackingListRow[] => {
  const totals = new Map<string, PackingListRow>();

  for (const entity of entities) {
    const definition = getDefinition(entity.definitionId, project);
    if (definition?.includeInPackingList === false) {
      continue;
    }
    const definitionKey = definition?.id ?? entity.definitionId;
    const definitionName = definition?.name ?? entity.label ?? entity.definitionId;
    const category = definition?.category ?? 'custom';

    const row = totals.get(definitionKey) ?? {
      definitionId: definitionKey,
      definitionName,
      category,
      quantity: 0,
      totalWeightLbs: 0,
    };

    row.quantity += 1;
    const weight = entity.metadata?.weightOverrideLbs ?? definition?.defaultWeightLbs;
    if (typeof weight === 'number') {
      row.totalWeightLbs = (row.totalWeightLbs ?? 0) + weight;
    }
    totals.set(definitionKey, row);
  }

  return [...totals.values()].sort((left, right) =>
    left.definitionName.localeCompare(right.definitionName),
  );
};

export const buildPackingList = (project: LayoutProject): PackingListRow[] => {
  const sections = collectEntitiesByScope(project);
  return buildPackingListRows(project, [...sections.exterior, ...sections.interior]);
};

export const buildPackingListSections = (project: LayoutProject): PackingListSections => {
  const sections = collectEntitiesByScope(project);
  return {
    exterior: buildPackingListRows(project, sections.exterior),
    interior: buildPackingListRows(project, sections.interior),
  };
};

export const getPackingListWeightTotal = (rows: PackingListRow[]): number =>
  rows.reduce((sum, row) => sum + (row.totalWeightLbs ?? 0), 0);

export const exportPackingListCsv = (rows: PackingListRow[]): string => {
  const header = 'Item,Category,Quantity,Total Weight (lbs)';
  const lines = rows.map((row) =>
    [row.definitionName, row.category, row.quantity, row.totalWeightLbs ?? ''].join(','),
  );
  return [header, ...lines].join('\n');
};

export const exportPackingListSectionsCsv = (sections: PackingListSections): string => {
  const header = 'Item,Category,Quantity,Total Weight (lbs)';
  const exteriorLines = sections.exterior.map((row) =>
    [row.definitionName, row.category, row.quantity, row.totalWeightLbs ?? ''].join(','),
  );
  const interiorLines = sections.interior.map((row) =>
    [row.definitionName, row.category, row.quantity, row.totalWeightLbs ?? ''].join(','),
  );

  return [
    'Exterior Packing List',
    header,
    ...exteriorLines,
    '',
    'Interior Packing List',
    header,
    ...interiorLines,
  ].join('\n');
};
