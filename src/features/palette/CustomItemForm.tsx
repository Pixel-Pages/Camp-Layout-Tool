import { useState } from 'react';
import type { Size } from '../../domain/types';
import { DEFAULT_INTERIOR_FILL, DEFAULT_SITE_FILL, DEFAULT_STROKE } from '../../shared/colors';
import { INCHES_PER_FOOT } from '../../shared/units';
import { ColorSwatches } from '../ui/ColorSwatches';

type CustomOuterShape = 'rectangle' | 'rounded-rectangle' | 'ellipse';
type CustomSymbol = '' | 'shape-square' | 'shape-circle' | 'shape-triangle' | 'shape-diamond' | 'shape-cross';

export interface CustomItemFormValue {
  name: string;
  size: Size;
  shape: CustomOuterShape;
  fill: string;
  stroke: string;
  supportsInterior: boolean;
  iconKey?: CustomSymbol;
}

interface CustomItemFormProps {
  sceneKind: 'site' | 'interior';
  onSubmit: (value: CustomItemFormValue) => void;
  onCancel: () => void;
}

const outerShapeOptions: Array<{ value: CustomOuterShape; label: string }> = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded-rectangle', label: 'Rounded' },
  { value: 'ellipse', label: 'Oval' },
];

const symbolOptions: Array<{ value: CustomSymbol; label: string }> = [
  { value: '', label: 'None' },
  { value: 'shape-square', label: 'Square' },
  { value: 'shape-circle', label: 'Circle' },
  { value: 'shape-triangle', label: 'Triangle' },
  { value: 'shape-diamond', label: 'Diamond' },
  { value: 'shape-cross', label: 'Cross' },
];

const toInches = (feet: string, inches: string, fallback: number): number => {
  const nextFeet = Number(feet);
  const nextInches = Number(inches);
  const total =
    (Number.isFinite(nextFeet) ? nextFeet : 0) * INCHES_PER_FOOT +
    (Number.isFinite(nextInches) ? nextInches : 0);
  return total > 0 ? total : fallback;
};

export const CustomItemForm = ({ sceneKind, onSubmit, onCancel }: CustomItemFormProps) => {
  const [name, setName] = useState('Custom Item');
  const [lengthFeet, setLengthFeet] = useState(sceneKind === 'site' ? '8' : '3');
  const [lengthInches, setLengthInches] = useState('0');
  const [widthFeet, setWidthFeet] = useState(sceneKind === 'site' ? '6' : '2');
  const [widthInches, setWidthInches] = useState('0');
  const [shape, setShape] = useState<CustomOuterShape>('rectangle');
  const [symbol, setSymbol] = useState<CustomSymbol>('');
  const [fill, setFill] = useState(sceneKind === 'site' ? DEFAULT_SITE_FILL : DEFAULT_INTERIOR_FILL);
  const [stroke, setStroke] = useState(sceneKind === 'site' ? '#f5f0e6' : DEFAULT_STROKE);
  const [supportsInterior, setSupportsInterior] = useState(false);

  return (
    <div className="interior-project-form">
      <label>
        Item name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <div className="dimension-stack">
        <div className="dimension-card">
          <span>Length</span>
          <div className="dimension-row">
            <label>
              Feet
              <input value={lengthFeet} onChange={(event) => setLengthFeet(event.target.value)} />
            </label>
            <label>
              Inches
              <input value={lengthInches} onChange={(event) => setLengthInches(event.target.value)} />
            </label>
          </div>
        </div>

        <div className="dimension-card">
          <span>Width</span>
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
      </div>

      <div className="panel-group">
        <h4>Outer shape</h4>
        <div className="chip-wrap">
          {outerShapeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={shape === option.value ? 'chip chip-hidden' : 'chip'}
              onClick={() => setShape(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-group">
        <h4>Inner symbol</h4>
        <div className="chip-wrap">
          {symbolOptions.map((option) => (
            <button
              key={option.value || 'none'}
              type="button"
              className={symbol === option.value ? 'chip chip-hidden' : 'chip'}
              onClick={() => setSymbol(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-group">
        <h4>Fill color</h4>
        <ColorSwatches selectedColor={fill} onSelect={setFill} />
      </div>

      <div className="panel-group">
        <h4>Stroke / icon color</h4>
        <ColorSwatches selectedColor={stroke} onSelect={setStroke} />
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={supportsInterior}
          onChange={(event) => setSupportsInterior(event.target.checked)}
        />
        Supports interior editing
      </label>

      <div className="hero-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            onSubmit({
              name,
              size: {
                width: toInches(lengthFeet, lengthInches, sceneKind === 'site' ? 96 : 36),
                height: toInches(widthFeet, widthInches, sceneKind === 'site' ? 72 : 24),
              },
              shape,
              fill,
              stroke,
              supportsInterior,
              iconKey: symbol || undefined,
            })
          }
        >
          Create Custom Item
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};
