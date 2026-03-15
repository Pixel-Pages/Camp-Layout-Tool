import { getDefinition } from '../catalog';
import { createId } from '../shared/id';
import { clampSize, offsetPoint } from '../shared/geometry';
import {
  cloneProject,
  findScene,
  getNextEntityLabelForScene,
  updateProjectTimestamp,
} from './project';
import type { LayoutProject, ProjectCommand, SceneItem } from './types';

const duplicateSceneItem = (
  item: SceneItem,
  sceneId: string,
  project: LayoutProject,
  scene: LayoutProject['scenes'][number],
  offset = { x: 24, y: 24 },
): SceneItem => {
  const nextId = createId('item');
  switch (item.kind) {
    case 'placed-entity': {
      const definition = getDefinition(item.definitionId, project);
      return {
        ...item,
        id: nextId,
        sceneId,
        interiorSceneId: undefined,
        position: offsetPoint(item.position, offset),
        label: definition ? getNextEntityLabelForScene(scene, definition) : item.label,
      };
    }
    case 'cable-run':
      return {
        ...item,
        id: nextId,
        sceneId,
        points: item.points.map((point) => offsetPoint(point, offset)),
        label: item.label ? `${item.label} Copy` : undefined,
      };
    case 'text-annotation':
      return {
        ...item,
        id: nextId,
        sceneId,
        position: offsetPoint(item.position, offset),
      };
    case 'arrow-annotation':
      return {
        ...item,
        id: nextId,
        sceneId,
        start: offsetPoint(item.start, offset),
        end: offsetPoint(item.end, offset),
      };
    case 'circle-annotation':
      return {
        ...item,
        id: nextId,
        sceneId,
        center: offsetPoint(item.center, offset),
      };
    case 'background-image':
      return {
        ...item,
        id: nextId,
        sceneId,
      };
  }
};

export const applyProjectCommand = (project: LayoutProject, command: ProjectCommand): LayoutProject => {
  const nextProject = cloneProject(project);

  switch (command.type) {
    case 'add-item': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items.push(command.item);
      return updateProjectTimestamp(nextProject);
    }
    case 'update-item': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items = scene.items.map((item) =>
        item.id === command.itemId ? ({ ...item, ...command.changes } as SceneItem) : item,
      );
      return updateProjectTimestamp(nextProject);
    }
    case 'move-item': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items = scene.items.map((item) => {
        if (item.id !== command.itemId) {
          return item;
        }

        switch (item.kind) {
          case 'placed-entity':
          case 'text-annotation':
          case 'background-image':
            return { ...item, position: command.position };
          case 'cable-run': {
            const currentAnchor = item.points[0];
            const delta = {
              x: command.position.x - currentAnchor.x,
              y: command.position.y - currentAnchor.y,
            };
            return {
              ...item,
              points: item.points.map((point) => offsetPoint(point, delta)),
            };
          }
          case 'arrow-annotation': {
            const currentAnchor = item.start;
            const delta = {
              x: command.position.x - currentAnchor.x,
              y: command.position.y - currentAnchor.y,
            };
            return {
              ...item,
              start: offsetPoint(item.start, delta),
              end: offsetPoint(item.end, delta),
            };
          }
          case 'circle-annotation':
            return {
              ...item,
              center: command.position,
            };
        }
      });
      return updateProjectTimestamp(nextProject);
    }
    case 'rotate-entity': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items = scene.items.map((item) =>
        item.id === command.itemId && item.kind === 'placed-entity'
          ? { ...item, rotation: command.rotation }
          : item,
      );
      return updateProjectTimestamp(nextProject);
    }
    case 'resize-entity': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items = scene.items.map((item) =>
        item.id === command.itemId && item.kind === 'placed-entity'
          ? { ...item, size: clampSize(command.size) }
          : item,
      );
      return updateProjectTimestamp(nextProject);
    }
    case 'update-scene-size': {
      nextProject.scenes = nextProject.scenes.map((scene) =>
        scene.id === command.sceneId
          ? { ...scene, size: clampSize(command.size) }
          : scene,
      );
      return updateProjectTimestamp(nextProject);
    }
    case 'update-scene-appearance': {
      nextProject.scenes = nextProject.scenes.map((scene) =>
        scene.id === command.sceneId
          ? {
              ...scene,
              appearance: {
                ...scene.appearance,
                ...command.appearance,
              },
            }
          : scene,
      );
      return updateProjectTimestamp(nextProject);
    }
    case 'rename-project': {
      nextProject.name = command.name;
      return updateProjectTimestamp(nextProject);
    }
    case 'add-custom-definition': {
      nextProject.customDefinitions.push(command.definition);
      return updateProjectTimestamp(nextProject);
    }
    case 'remove-item': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items = scene.items.filter((item) => item.id !== command.itemId);
      return updateProjectTimestamp(nextProject);
    }
    case 'duplicate-item': {
      const scene = findScene(nextProject, command.sceneId);
      const item = scene?.items.find((candidate) => candidate.id === command.itemId);
      if (!scene || !item) {
        return project;
      }
      scene.items.push(duplicateSceneItem(item, command.sceneId, nextProject, scene, command.offset));
      return updateProjectTimestamp(nextProject);
    }
    case 'add-scene': {
      nextProject.scenes.push(command.scene);
      return updateProjectTimestamp(nextProject);
    }
    case 'link-interior-scene': {
      const scene = findScene(nextProject, command.sceneId);
      if (!scene) {
        return project;
      }
      scene.items = scene.items.map((item) =>
        item.id === command.itemId && item.kind === 'placed-entity'
          ? { ...item, interiorSceneId: command.interiorSceneId }
          : item,
      );
      return updateProjectTimestamp(nextProject);
    }
    case 'set-visibility': {
      nextProject.visibility = {
        ...nextProject.visibility,
        ...command.visibility,
      };
      return updateProjectTimestamp(nextProject);
    }
    case 'add-asset': {
      nextProject.assets.push(command.asset);
      return updateProjectTimestamp(nextProject);
    }
    case 'remove-asset': {
      nextProject.assets = nextProject.assets.filter((asset) => asset.id !== command.assetId);
      nextProject.scenes = nextProject.scenes.map((scene) => ({
        ...scene,
        items: scene.items.filter(
          (item) => item.kind !== 'background-image' || item.assetId !== command.assetId,
        ),
      }));
      return updateProjectTimestamp(nextProject);
    }
  }
};
