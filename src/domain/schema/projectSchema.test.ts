import { describe, expect, it } from 'vitest';
import { getDefinition } from '../../catalog';
import {
  createCustomCatalogDefinition,
  createInteriorProject,
  createPlacedEntity,
  createSiteProject,
  findScene,
} from '../project';
import { migrateLayoutProject, parseLayoutProject, serializeLayoutProject } from './projectSchema';

describe('layout project schema', () => {
  it('round-trips a site project with custom definitions', () => {
    const project = createSiteProject('Schema Fixture');
    const customDefinition = createCustomCatalogDefinition({
      scope: 'site',
      name: 'Custom Shelter',
      size: { width: 120, height: 84 },
      shape: 'rounded-rectangle',
      fill: '#365c3d',
      stroke: '#f5f0e6',
      supportsInterior: true,
      includeInPackingList: true,
      iconKey: 'shape-diamond',
    });
    project.customDefinitions.push(customDefinition);
    const rootScene = findScene(project, project.rootSceneId)!;
    rootScene.items.push(
      createPlacedEntity(rootScene.id, getDefinition('site-generator')!, { x: 240, y: 180 }),
      createPlacedEntity(rootScene.id, customDefinition, { x: 480, y: 180 }),
    );

    const serialized = serializeLayoutProject(project);
    const parsed = parseLayoutProject(JSON.parse(serialized));

    expect(parsed.name).toBe(project.name);
    expect(parsed.customDefinitions).toHaveLength(1);
    expect(parsed.scenes).toHaveLength(project.scenes.length);
    expect(parsed.visibility.showGrid).toBe(true);
  });

  it('migrates a valid interior project payload with missing custom definitions', () => {
    const project = createInteriorProject('Interior Fixture', { width: 360, height: 240 });
    delete (project as Partial<typeof project>).customDefinitions;
    const migrated = migrateLayoutProject(JSON.parse(JSON.stringify(project)));

    expect(migrated.projectType).toBe('interior');
    expect(migrated.rootSceneId).toBe(project.rootSceneId);
    expect(migrated.customDefinitions).toEqual([]);
  });
});
