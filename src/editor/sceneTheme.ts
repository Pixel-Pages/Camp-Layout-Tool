import type { SceneAppearance, SceneKind } from '../domain/types';

export interface SceneThemeColors {
  backgroundColor: string;
  frameColor: string;
  accentColor: string;
  textColor: string;
  minorGridColor: string;
  majorGridColor: string;
  legendFill: string;
  legendBorder: string;
}

const parseHexColor = (value: string): { r: number; g: number; b: number } | null => {
  const normalized = value.trim().replace('#', '');
  const hex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
};

const withAlpha = (value: string, alpha: number, fallback: string): string => {
  const parsed = parseHexColor(value);
  if (!parsed) {
    return fallback;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
};

const getReadableTextColor = (backgroundColor: string, fallback: string): string => {
  const parsed = parseHexColor(backgroundColor);
  if (!parsed) {
    return fallback;
  }

  const luminance = (0.2126 * parsed.r + 0.7152 * parsed.g + 0.0722 * parsed.b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#f8fafc';
};

export const getSceneThemeColors = (
  sceneKind: SceneKind,
  appearance: SceneAppearance,
  theme: 'light' | 'dark',
): SceneThemeColors => {
  const defaults =
    theme === 'light'
      ? {
          backgroundColor: sceneKind === 'site' ? '#e4eee6' : '#f5f7fb',
          frameColor: '#eef2f8',
          accentColor: '#2563eb',
          textColor: '#0f172a',
        }
      : {
          backgroundColor: sceneKind === 'site' ? '#152017' : '#242424',
          frameColor: '#0b0b0c',
          accentColor: '#ff8a1d',
          textColor: '#f4ede2',
        };

  const frameColor = appearance.frameColor ?? defaults.frameColor;
  const accentColor = appearance.accentColor ?? defaults.accentColor;
  const textColor = getReadableTextColor(frameColor, defaults.textColor);

  return {
    backgroundColor: appearance.backgroundColor ?? defaults.backgroundColor,
    frameColor,
    accentColor,
    textColor,
    minorGridColor:
      theme === 'light'
        ? 'rgba(15, 23, 42, 0.08)'
        : sceneKind === 'site'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.06)',
    majorGridColor:
      theme === 'light'
        ? withAlpha(accentColor, 0.22, 'rgba(37, 99, 235, 0.22)')
        : withAlpha(accentColor, 0.22, 'rgba(255, 138, 29, 0.22)'),
    legendFill:
      theme === 'light'
        ? withAlpha(frameColor, 0.96, 'rgba(255, 255, 255, 0.96)')
        : withAlpha(frameColor, 0.96, 'rgba(14, 14, 15, 0.96)'),
    legendBorder:
      theme === 'light'
        ? withAlpha(accentColor, 0.42, 'rgba(37, 99, 235, 0.42)')
        : withAlpha(accentColor, 0.65, 'rgba(255, 138, 29, 0.65)'),
  };
};
