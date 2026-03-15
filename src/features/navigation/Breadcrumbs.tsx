import { getDefinition } from '../../catalog';
import { findScene } from '../../domain/project';
import type { LayoutProject, PlacedEntity } from '../../domain/types';

interface BreadcrumbsProps {
  project: LayoutProject;
  activeSceneId: string;
  onNavigate: (sceneId: string) => void;
  onOpenInterior: (itemId: string) => void;
}

export const Breadcrumbs = ({ project, activeSceneId, onNavigate, onOpenInterior }: BreadcrumbsProps) => {
  const rootScene = findScene(project, project.rootSceneId);
  const rootLabel = project.projectType === 'site' ? 'Camp Layout' : 'Layout';
  const interiorButtons =
    rootScene?.kind === 'site'
      ? rootScene.items
          .filter((item): item is PlacedEntity => item.kind === 'placed-entity')
          .filter((item) => getDefinition(item.definitionId, project)?.supportsInterior)
          .sort((left, right) => (left.label ?? '').localeCompare(right.label ?? ''))
      : [];

  return (
    <nav className="breadcrumbs">
      <button
        onClick={() => onNavigate(project.rootSceneId)}
        className={activeSceneId === project.rootSceneId ? 'crumb-active' : ''}
      >
        {rootLabel}
      </button>

      {interiorButtons.map((item) => (
        <button
          key={item.id}
          onClick={() => onOpenInterior(item.id)}
          className={item.interiorSceneId === activeSceneId ? 'crumb-active' : ''}
        >
          {item.label ?? getDefinition(item.definitionId, project)?.name ?? 'Interior'}
        </button>
      ))}
    </nav>
  );
};
