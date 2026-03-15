import { useState } from 'react';
import { getDefinition } from '../../catalog';
import type { LayoutProject, SceneItem } from '../../domain/types';
import { ColorSwatches } from '../ui/ColorSwatches';

interface InspectorPanelProps {
  project: LayoutProject;
  item: SceneItem | null;
  activeContainerTitle?: string | null;
  activeContainerTypeLabel?: string | null;
  onUpdateActiveContainerTitle?: (title: string) => void;
  onUpdateItem: (changes: Partial<SceneItem>) => void;
  onEnterInterior: () => void;
}

const LockToggleIcon = ({ locked }: { locked: boolean }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
    <path
      d={locked ? 'M7 10V7.5A5 5 0 0 1 17 7.5V10' : 'M9 10V7.5A3 3 0 0 1 15 7.5V10'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <rect
      x="5.5"
      y="10"
      width="13"
      height="10"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

export const InspectorPanel = ({
  project,
  item,
  activeContainerTitle,
  activeContainerTypeLabel,
  onUpdateActiveContainerTitle,
  onUpdateItem,
  onEnterInterior,
}: InspectorPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!item) {
    return (
      <section className="panel-card">
        <div className="panel-title-row">
          <div className="panel-header">
            <h3>No selection</h3>
          </div>
          <button
            type="button"
            className="panel-collapse"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? 'Expand inspector' : 'Collapse inspector'}
          >
            {collapsed ? 'v' : '^'}
          </button>
        </div>
        {collapsed ? null : (
          <>
            {activeContainerTitle && onUpdateActiveContainerTitle ? (
              <label>
                {activeContainerTypeLabel ?? 'Interior title'}
                <input
                  value={activeContainerTitle}
                  onChange={(event) => onUpdateActiveContainerTitle(event.target.value)}
                />
              </label>
            ) : null}
            <p>Select an object, cable, or annotation to edit its geometry and style.</p>
          </>
        )}
      </section>
    );
  }

  const definition = item.kind === 'placed-entity' ? getDefinition(item.definitionId, project) : null;
  const itemLabelField =
    item.kind === 'placed-entity' && definition?.supportsInterior ? 'Title' : 'Label';

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <div className="panel-header">
          <h3>{item.kind}</h3>
        </div>
        <button
          type="button"
          className="panel-collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand inspector' : 'Collapse inspector'}
        >
          {collapsed ? 'v' : '^'}
        </button>
      </div>

      {collapsed ? null : (
        <>
          {activeContainerTitle && onUpdateActiveContainerTitle ? (
            <label>
              {activeContainerTypeLabel ?? 'Interior title'}
              <input
                value={activeContainerTitle}
                onChange={(event) => onUpdateActiveContainerTitle(event.target.value)}
              />
            </label>
          ) : null}

          {item.kind === 'placed-entity' ? (
            <label>
              {itemLabelField}
              <input value={item.label ?? ''} onChange={(event) => onUpdateItem({ label: event.target.value })} />
            </label>
          ) : null}

          {item.kind === 'placed-entity' ? (
            <>
              <div className="dimension-row">
                <label>
                  X
                  <input
                    value={Math.round(item.position.x)}
                    onChange={(event) =>
                      onUpdateItem({
                        position: {
                          ...item.position,
                          x: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Y
                  <input
                    value={Math.round(item.position.y)}
                    onChange={(event) =>
                      onUpdateItem({
                        position: {
                          ...item.position,
                          y: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </label>
              </div>
              <div className="dimension-row">
                <label>
                  Width
                  <input
                    disabled={!definition?.resizable}
                    value={Math.round(item.size.width)}
                    onChange={(event) =>
                      onUpdateItem({
                        size: {
                          ...item.size,
                          width: Number(event.target.value) || item.size.width,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Height
                  <input
                    disabled={!definition?.resizable}
                    value={Math.round(item.size.height)}
                    onChange={(event) =>
                      onUpdateItem({
                        size: {
                          ...item.size,
                          height: Number(event.target.value) || item.size.height,
                        },
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Rotation
                <input
                  value={Math.round(item.rotation)}
                  onChange={(event) => onUpdateItem({ rotation: Number(event.target.value) || 0 })}
                />
              </label>
              <label>
                Weight override (lbs)
                <input
                  value={item.metadata?.weightOverrideLbs ?? ''}
                  onChange={(event) =>
                    onUpdateItem({
                      metadata: {
                        ...item.metadata,
                        weightOverrideLbs: Number(event.target.value) || undefined,
                      },
                    })
                  }
                />
              </label>
              <div className="panel-group">
                <h4>Fill color</h4>
                <ColorSwatches onSelect={(color) => onUpdateItem({ style: { ...item.style, fill: color } })} />
              </div>
              <div className="panel-group">
                <h4>Stroke / icon color</h4>
                <ColorSwatches
                  onSelect={(color) =>
                    onUpdateItem({
                      style: {
                        ...item.style,
                        stroke: color,
                        iconColor: color,
                        labelColor: color,
                      },
                    })
                  }
                />
              </div>
              {definition?.supportsInterior ? (
                <button type="button" onClick={onEnterInterior}>
                  Edit interior
                </button>
              ) : null}
            </>
          ) : null}

          {item.kind === 'cable-run' ? (
            <>
              <label>
                Line thickness
                <input
                  value={item.style.lineWidth}
                  onChange={(event) =>
                    onUpdateItem({
                      style: {
                        ...item.style,
                        lineWidth: Number(event.target.value) || item.style.lineWidth,
                      },
                    })
                  }
                />
              </label>
              <div className="panel-group">
                <h4>Cable color</h4>
                <ColorSwatches onSelect={(color) => onUpdateItem({ style: { ...item.style, lineColor: color } })} />
              </div>
            </>
          ) : null}

          {item.kind === 'arrow-annotation' || item.kind === 'circle-annotation' ? (
            <>
              <label>
                Line thickness
                <input
                  value={item.style.lineWidth}
                  onChange={(event) =>
                    onUpdateItem({
                      style: {
                        ...item.style,
                        lineWidth: Number(event.target.value) || item.style.lineWidth,
                      },
                    })
                  }
                />
              </label>
              {item.kind === 'circle-annotation' ? (
                <label>
                  Radius
                  <input
                    value={Math.round(item.radius)}
                    onChange={(event) =>
                      onUpdateItem({ radius: Number(event.target.value) || item.radius })
                    }
                  />
                </label>
              ) : null}
              <div className="panel-group">
                <h4>{item.kind === 'arrow-annotation' ? 'Arrow color' : 'Circle color'}</h4>
                <ColorSwatches onSelect={(color) => onUpdateItem({ style: { ...item.style, lineColor: color } })} />
              </div>
            </>
          ) : null}

          {item.kind === 'text-annotation' ? (
            <>
              <label>
                Text
                <textarea value={item.text} onChange={(event) => onUpdateItem({ text: event.target.value })} />
              </label>
              <label>
                Font size
                <input
                  value={item.fontSize}
                  onChange={(event) => onUpdateItem({ fontSize: Number(event.target.value) || item.fontSize })}
                />
              </label>
              <div className="panel-group">
                <h4>Text color</h4>
                <ColorSwatches onSelect={(color) => onUpdateItem({ style: { ...item.style, labelColor: color } })} />
              </div>
            </>
          ) : null}

          {item.kind === 'background-image' ? (
            <>
              <div className="panel-inline-actions">
                <button
                  type="button"
                  className="icon-button"
                  title={item.locked ? 'Unlock background' : 'Lock background'}
                  aria-label={item.locked ? 'Unlock background' : 'Lock background'}
                  onClick={() => onUpdateItem({ locked: !item.locked })}
                >
                  <LockToggleIcon locked={item.locked} />
                </button>
                <span>{item.locked ? 'Background locked' : 'Background unlocked'}</span>
              </div>
              <div className="dimension-row">
                <label>
                  X
                  <input
                    value={Math.round(item.position.x)}
                    onChange={(event) =>
                      onUpdateItem({
                        position: {
                          ...item.position,
                          x: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Y
                  <input
                    value={Math.round(item.position.y)}
                    onChange={(event) =>
                      onUpdateItem({
                        position: {
                          ...item.position,
                          y: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </label>
              </div>
              <div className="dimension-row">
                <label>
                  Width
                  <input
                    value={Math.round(item.size.width)}
                    onChange={(event) =>
                      onUpdateItem({
                        size: {
                          ...item.size,
                          width: Number(event.target.value) || item.size.width,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Height
                  <input
                    value={Math.round(item.size.height)}
                    onChange={(event) =>
                      onUpdateItem({
                        size: {
                          ...item.size,
                          height: Number(event.target.value) || item.size.height,
                        },
                      })
                    }
                  />
                </label>
              </div>
              <label>
                Rotation
                <input
                  value={Math.round(item.rotation)}
                  onChange={(event) => onUpdateItem({ rotation: Number(event.target.value) || 0 })}
                />
              </label>
              <label>
                Opacity
                <input
                  value={item.opacity}
                  onChange={(event) => {
                    const nextOpacity = Number(event.target.value);
                    onUpdateItem({
                      opacity: Number.isFinite(nextOpacity) ? Math.min(1, Math.max(0, nextOpacity)) : item.opacity,
                    });
                  }}
                />
              </label>
            </>
          ) : null}
        </>
      )}
    </section>
  );
};
