import { useState } from 'react';
import type { BackgroundImageItem, SceneAppearance } from '../../domain/types';
import { ColorSwatches } from '../ui/ColorSwatches';

interface BackgroundPanelProps {
  item: BackgroundImageItem | null;
  appearance: SceneAppearance;
  effectiveBackgroundColor: string;
  effectiveFrameColor: string;
  effectiveAccentColor: string;
  onUpload: () => void;
  onSelectBackground?: () => void;
  onUpdateAppearance: (changes: Partial<SceneAppearance>) => void;
}

export const BackgroundPanel = ({
  item,
  appearance,
  effectiveBackgroundColor,
  effectiveFrameColor,
  effectiveAccentColor,
  onUpload,
  onSelectBackground,
  onUpdateAppearance,
}: BackgroundPanelProps) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <div className="panel-header">
          <h3>Background</h3>
        </div>
        <button
          type="button"
          className="panel-collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand background tools' : 'Collapse background tools'}
        >
          {collapsed ? 'v' : '^'}
        </button>
      </div>

      {collapsed ? null : (
        <>
          <button type="button" onClick={onUpload}>
            Upload background image
          </button>

          <div className="panel-group">
            <h4>Background color</h4>
            <ColorSwatches
              selectedColor={appearance.backgroundColor ?? effectiveBackgroundColor}
              onSelect={(color) => onUpdateAppearance({ backgroundColor: color })}
            />
          </div>

          <div className="panel-group">
            <h4>Frame color</h4>
            <ColorSwatches
              selectedColor={appearance.frameColor ?? effectiveFrameColor}
              onSelect={(color) => onUpdateAppearance({ frameColor: color })}
            />
          </div>

          <div className="panel-group">
            <h4>Accent color</h4>
            <ColorSwatches
              selectedColor={appearance.accentColor ?? effectiveAccentColor}
              onSelect={(color) => onUpdateAppearance({ accentColor: color })}
            />
          </div>

          {item ? (
            onSelectBackground ? (
              <button type="button" onClick={onSelectBackground}>
                Edit image transform
              </button>
            ) : null
          ) : (
            <p className="panel-copy">No background image added for this layout yet.</p>
          )}
        </>
      )}
    </section>
  );
};
