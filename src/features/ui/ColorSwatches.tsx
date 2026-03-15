import { COLOR_PRESETS } from '../../shared/colors';

interface ColorSwatchesProps {
  onSelect: (color: string) => void;
  selectedColor?: string;
}

export const ColorSwatches = ({ onSelect, selectedColor }: ColorSwatchesProps) => (
  <div className="color-grid">
    {COLOR_PRESETS.map((color) => (
      <button
        key={color}
        type="button"
        className={`color-swatch${selectedColor === color ? ' color-swatch-active' : ''}`}
        style={{ background: color }}
        onClick={() => onSelect(color)}
        title={color}
        aria-label={`Select ${color}`}
      />
    ))}
  </div>
);
