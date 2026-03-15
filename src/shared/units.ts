export const INCHES_PER_FOOT = 12;

export const inchesToFeetAndInches = (inches: number): string => {
  const sign = inches < 0 ? '-' : '';
  const absolute = Math.abs(Math.round(inches));
  const feet = Math.floor(absolute / INCHES_PER_FOOT);
  const remainder = absolute % INCHES_PER_FOOT;
  return `${sign}${feet}' ${remainder}"`;
};

export const parseFeetAndInches = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^\s*(-?\d+)\s*(?:'|ft)?\s*(?:(\d+)\s*(?:"|in)?)?\s*$/i);
  if (!match) {
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }

  const feet = Number(match[1] ?? 0);
  const inches = Number(match[2] ?? 0);
  const direction = feet < 0 ? -1 : 1;
  return feet * INCHES_PER_FOOT + direction * inches;
};

export const formatDimension = (inches: number): string => `${inchesToFeetAndInches(inches)} (${Math.round(inches)} in)`;
