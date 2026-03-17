import { describe, expect, it } from 'vitest';
import { getDefinition } from '../catalog';
import { buildPackingList, buildPackingListSections, getPackingListWeightTotal } from './reporting';
import {
  createPlacedEntity,
  createScene,
  createSiteProject,
  ensureInteriorScene,
  findScene,
} from './project';

describe('packing list reporting', () => {
  it('aggregates entities across site and interior scenes', () => {
    const project = createSiteProject('Reporting Fixture');
    const siteScene = findScene(project, project.rootSceneId)!;
    const tent = createPlacedEntity(siteScene.id, getDefinition('tent-307')!, { x: 420, y: 360 });
    const tree = createPlacedEntity(siteScene.id, getDefinition('site-tree')!, { x: 700, y: 360 });
    const structure = createPlacedEntity(siteScene.id, getDefinition('site-structure')!, { x: 860, y: 620 });
    siteScene.items.push(tent, tree, structure);

    const interiorResult = ensureInteriorScene(project, siteScene.id, tent.id);
    const withInterior = interiorResult.project;
    const interiorScene = findScene(withInterior, interiorResult.interiorSceneId)!;
    interiorScene.items.push(
      createPlacedEntity(interiorScene.id, getDefinition('interior-rack')!, { x: 120, y: 60 }),
    );

    const rows = buildPackingList(withInterior);
    const sections = buildPackingListSections(withInterior);

    expect(rows.find((row) => row.definitionId === 'tent-307')?.quantity).toBe(1);
    expect(rows.find((row) => row.definitionId === 'site-tree')).toBeUndefined();
    expect(rows.find((row) => row.definitionId === 'site-structure')?.quantity).toBe(1);
    expect(sections.exterior.find((row) => row.definitionId === 'site-structure')?.quantity).toBe(1);
    expect(sections.interior.find((row) => row.definitionId === 'interior-rack')?.quantity).toBe(1);
    expect(getPackingListWeightTotal(rows)).toBeGreaterThan(0);
  });
});
