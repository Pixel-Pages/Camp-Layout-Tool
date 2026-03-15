import { useState } from 'react';
import { getDefinitionsForScene } from '../../catalog';
import type { LayoutProject } from '../../domain/types';
import { formatDimension } from '../../shared/units';

interface ObjectPaletteProps {
  project: LayoutProject;
  sceneKind: 'site' | 'interior';
  selectedDefinitionId: string | null;
  placementWidth: string;
  placementHeight: string;
  onSelectDefinition: (definitionId: string) => void;
  onDragDefinitionStart: (definitionId: string) => void;
  onPlacementSizeChange: (width: string, height: string) => void;
  onCreateCustomItem: () => void;
}

export const ObjectPalette = ({
  project,
  sceneKind,
  selectedDefinitionId,
  placementWidth,
  placementHeight,
  onSelectDefinition,
  onDragDefinitionStart,
  onPlacementSizeChange,
  onCreateCustomItem,
}: ObjectPaletteProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const definitions = getDefinitionsForScene(sceneKind, project);
  const selected = definitions.find((definition) => definition.id === selectedDefinitionId) ?? null;

  return (
    <aside className={`sidebar palette palette-${sceneKind}`}>
      <div className="panel-title-row">
        <div className="panel-header">
          <h3>{sceneKind === 'site' ? 'Exterior inventory' : 'Interior inventory'}</h3>
          <p className="panel-copy">Drag items from here onto the layout.</p>
        </div>
        <button
          type="button"
          className="panel-collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand object library' : 'Collapse object library'}
        >
          {collapsed ? 'v' : '^'}
        </button>
      </div>

      {collapsed ? null : (
        <>
          <div className="palette-list">
            <button type="button" className="palette-card palette-card-custom" onClick={onCreateCustomItem}>
              <strong>Custom item</strong>
              <span>Define your own item shape, colors, size, and interior support.</span>
            </button>

            {definitions.map((definition) => (
              <button
                key={definition.id}
                type="button"
                className={`palette-card ${selectedDefinitionId === definition.id ? 'palette-card-active' : ''}`}
                onClick={() => onSelectDefinition(definition.id)}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-layout-definition', definition.id);
                  event.dataTransfer.effectAllowed = 'copy';
                  onDragDefinitionStart(definition.id);
                }}
              >
                <strong>{definition.name}</strong>
                <span>{definition.category}</span>
                <span>
                  {formatDimension(definition.defaultSize.width)} x {formatDimension(definition.defaultSize.height)}
                </span>
              </button>
            ))}
          </div>

          {selected?.resizable ? (
            <div className="panel-group">
              <h4>Placement size override</h4>
              <div className="dimension-row">
                <label>
                  Width (in)
                  <input
                    value={placementWidth}
                    onChange={(event) => onPlacementSizeChange(event.target.value, placementHeight)}
                  />
                </label>
                <label>
                  Height (in)
                  <input
                    value={placementHeight}
                    onChange={(event) => onPlacementSizeChange(placementWidth, event.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
};
