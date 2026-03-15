import { useState } from 'react';
import { DEFAULT_SITE_SIZE } from '../../domain/project';
import { INCHES_PER_FOOT } from '../../shared/units';

interface CampProjectFormProps {
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string, width: number, height: number) => void;
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

export const CampProjectForm = ({
  initialName = 'New Camp Layout',
  submitLabel,
  onSubmit,
  onCancel,
}: CampProjectFormProps) => {
  const initialWidth = splitInches(DEFAULT_SITE_SIZE.width);
  const initialHeight = splitInches(DEFAULT_SITE_SIZE.height);
  const [projectName, setProjectName] = useState(initialName);
  const [widthFeet, setWidthFeet] = useState(initialWidth.feet);
  const [widthInches, setWidthInches] = useState(initialWidth.inches);
  const [heightFeet, setHeightFeet] = useState(initialHeight.feet);
  const [heightInches, setHeightInches] = useState(initialHeight.inches);

  return (
    <div className="interior-project-form">
      <label>
        Project name
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
      </label>

      <div className="dimension-stack">
        <div className="dimension-card">
          <span>Camp width</span>
          <div className="dimension-row">
            <label>
              Feet
              <input value={widthFeet} onChange={(event) => setWidthFeet(event.target.value)} />
            </label>
            <label>
              Inches
              <input value={widthInches} onChange={(event) => setWidthInches(event.target.value)} />
            </label>
          </div>
        </div>

        <div className="dimension-card">
          <span>Camp height</span>
          <div className="dimension-row">
            <label>
              Feet
              <input value={heightFeet} onChange={(event) => setHeightFeet(event.target.value)} />
            </label>
            <label>
              Inches
              <input value={heightInches} onChange={(event) => setHeightInches(event.target.value)} />
            </label>
          </div>
        </div>
      </div>

      <div className="hero-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            onSubmit(
              projectName,
              toInches(widthFeet, widthInches, DEFAULT_SITE_SIZE.width),
              toInches(heightFeet, heightInches, DEFAULT_SITE_SIZE.height),
            )
          }
        >
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
