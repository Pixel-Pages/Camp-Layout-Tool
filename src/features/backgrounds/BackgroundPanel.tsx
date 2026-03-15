import { useState } from 'react';
import type { BackgroundImageItem } from '../../domain/types';
import { ColorSwatches } from '../ui/ColorSwatches';

interface BackgroundPanelProps {
  item: BackgroundImageItem | null;
  onUpload: () => void;
  onSelectBackground?: () => void;
  onUpdateBackground: (changes: Partial<BackgroundImageItem>) => void;
}

export const BackgroundPanel = ({
  item,
  onUpload,
  onSelectBackground,
  onUpdateBackground,
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

          {item ? (
            <>
              <div className="panel-group">
                <h4>Background color</h4>
                <ColorSwatches
                  selectedColor={item.style.fill}
                  onSelect={(color) =>
                    onUpdateBackground({
                      style: {
                        ...item.style,
                        fill: color,
                      },
                    })
                  }
                />
              </div>

              {onSelectBackground ? (
                <button type="button" onClick={onSelectBackground}>
                  Edit image transform
                </button>
              ) : null}
            </>
          ) : (
            <p className="panel-copy">No background image added for this layout yet.</p>
          )}
        </>
      )}
    </section>
  );
};
