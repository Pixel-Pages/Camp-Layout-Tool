import { useState } from 'react';

interface LayerPanelProps {
  showGrid: boolean;
  showLabels: boolean;
  showTentInteriors: boolean;
  showReferenceBackgrounds: boolean;
  gridSize: string;
  campWidth?: string;
  campHeight?: string;
  categories: { name: string; hidden: boolean }[];
  onToggleVisibility: (key: 'showGrid' | 'showLabels' | 'showTentInteriors' | 'showReferenceBackgrounds') => void;
  onGridSizeChange: (value: string) => void;
  onCampSizeChange?: (width: string, height: string) => void;
  onToggleCategory: (category: string) => void;
}

export const LayerPanel = ({
  showGrid,
  showLabels,
  showTentInteriors,
  showReferenceBackgrounds,
  gridSize,
  campWidth,
  campHeight,
  categories,
  onToggleVisibility,
  onGridSizeChange,
  onCampSizeChange,
  onToggleCategory,
}: LayerPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <div className="panel-header">
          <h3>Visibility</h3>
        </div>
        <button
          type="button"
          className="panel-collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand layers' : 'Collapse layers'}
        >
          {collapsed ? 'v' : '^'}
        </button>
      </div>

      {collapsed ? null : (
        <>
          <label className="checkbox-row">
            <input type="checkbox" checked={showGrid} onChange={() => onToggleVisibility('showGrid')} />
            Show grid
          </label>
          <label>
            Grid spacing (in)
            <input value={gridSize} onChange={(event) => onGridSizeChange(event.target.value)} />
          </label>
          {onCampSizeChange && campWidth && campHeight ? (
            <div className="panel-group">
              <h4>Camp size</h4>
              <div className="dimension-row">
                <label>
                  Width (in)
                  <input
                    value={campWidth}
                    onChange={(event) => onCampSizeChange(event.target.value, campHeight)}
                  />
                </label>
                <label>
                  Height (in)
                  <input
                    value={campHeight}
                    onChange={(event) => onCampSizeChange(campWidth, event.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : null}
          <label className="checkbox-row">
            <input type="checkbox" checked={showLabels} onChange={() => onToggleVisibility('showLabels')} />
            Show title and key
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showTentInteriors}
              onChange={() => onToggleVisibility('showTentInteriors')}
            />
            Show tent / structure interiors in site view
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={showReferenceBackgrounds}
              onChange={() => onToggleVisibility('showReferenceBackgrounds')}
            />
            Show reference backgrounds
          </label>

          {categories.length ? (
            <div className="panel-group">
              <h4>Categories</h4>
              <div className="chip-wrap">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    className={`chip ${category.hidden ? 'chip-hidden' : ''}`}
                    onClick={() => onToggleCategory(category.name)}
                  >
                    {category.hidden ? `Show ${category.name}` : `Hide ${category.name}`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};
