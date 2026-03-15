import { useMemo, useState } from 'react';
import { SITE_DEFINITIONS } from '../../catalog/siteCatalog';
import { INCHES_PER_FOOT, inchesToFeetAndInches } from '../../shared/units';

const CUSTOM_PRESET_ID = 'custom';

const sizePresets = SITE_DEFINITIONS.filter(
  (definition) => definition.supportsInterior && definition.category === 'tent',
).map((definition) => ({
  id: definition.id,
  label: definition.name,
  length: definition.defaultSize.width,
  width: definition.defaultSize.height,
}));

interface InteriorProjectFormProps {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string, length: number, width: number) => void;
  onCancel?: () => void;
}

const splitInches = (totalInches: number): { feet: string; inches: string } => ({
  feet: String(Math.floor(totalInches / INCHES_PER_FOOT)),
  inches: String(totalInches % INCHES_PER_FOOT),
});

const toInches = (feet: string, inches: string, fallback: number): number => {
  const nextFeet = Number(feet);
  const nextInches = Number(inches);
  const total =
    (Number.isFinite(nextFeet) ? nextFeet : 0) * INCHES_PER_FOOT +
    (Number.isFinite(nextInches) ? nextInches : 0);
  return total > 0 ? total : fallback;
};

export const InteriorProjectForm = ({
  initialName = 'New Interior Layout',
  submitLabel,
  onSubmit,
  onCancel,
}: InteriorProjectFormProps) => {
  const [projectName, setProjectName] = useState(initialName);
  const [presetId, setPresetId] = useState<string>(CUSTOM_PRESET_ID);
  const [lengthFeet, setLengthFeet] = useState('30');
  const [lengthInches, setLengthInches] = useState('0');
  const [widthFeet, setWidthFeet] = useState('20');
  const [widthInches, setWidthInches] = useState('0');

  const activePreset = useMemo(
    () => sizePresets.find((preset) => preset.id === presetId) ?? null,
    [presetId],
  );

  const applyPreset = (nextPresetId: string) => {
    setPresetId(nextPresetId);
    const preset = sizePresets.find((entry) => entry.id === nextPresetId);
    if (!preset) {
      return;
    }

    const nextLength = splitInches(preset.length);
    const nextWidth = splitInches(preset.width);
    setLengthFeet(nextLength.feet);
    setLengthInches(nextLength.inches);
    setWidthFeet(nextWidth.feet);
    setWidthInches(nextWidth.inches);
  };

  const handleSubmit = () => {
    const length = activePreset
      ? activePreset.length
      : toInches(lengthFeet, lengthInches, 360);
    const width = activePreset
      ? activePreset.width
      : toInches(widthFeet, widthInches, 240);
    onSubmit(projectName, length, width);
  };

  return (
    <div className="interior-project-form">
      <label>
        Project name
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
      </label>

      <div className="panel-group">
        <h4>Size preset</h4>
        <div className="chip-wrap">
          {sizePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={presetId === preset.id ? 'chip chip-hidden' : 'chip'}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className={presetId === CUSTOM_PRESET_ID ? 'chip chip-hidden' : 'chip'}
            onClick={() => setPresetId(CUSTOM_PRESET_ID)}
          >
            Custom
          </button>
        </div>
        {activePreset ? (
          <p className="panel-copy">
            Uses the default {activePreset.label.toLowerCase()} footprint: {inchesToFeetAndInches(activePreset.length)} by{' '}
            {inchesToFeetAndInches(activePreset.width)}.
          </p>
        ) : (
          <p className="panel-copy">Use custom room dimensions for buildings, rooms, or non-tent interiors.</p>
        )}
      </div>

      <div className="dimension-stack">
        <div className="dimension-card">
          <span>Length</span>
          <div className="dimension-row">
            <label>
              Feet
              <input
                value={lengthFeet}
                disabled={Boolean(activePreset)}
                onChange={(event) => setLengthFeet(event.target.value)}
              />
            </label>
            <label>
              Inches
              <input
                value={lengthInches}
                disabled={Boolean(activePreset)}
                onChange={(event) => setLengthInches(event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="dimension-card">
          <span>Width</span>
          <div className="dimension-row">
            <label>
              Feet
              <input
                value={widthFeet}
                disabled={Boolean(activePreset)}
                onChange={(event) => setWidthFeet(event.target.value)}
              />
            </label>
            <label>
              Inches
              <input
                value={widthInches}
                disabled={Boolean(activePreset)}
                onChange={(event) => setWidthInches(event.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="hero-actions">
        <button className="primary-button" type="button" onClick={handleSubmit}>
          {submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
};
