export interface IconDefinition {
  viewBox: string;
  path: string;
}

export const ICONS: Record<string, IconDefinition> = {
  'tent-ridge': {
    viewBox: '0 0 64 64',
    path: 'M8 18 L32 8 L56 18 M8 46 L32 56 L56 46 M32 8 L32 56 M8 18 L8 46 M56 18 L56 46 M18 18 L18 46 M46 18 L46 46',
  },
  'tent-dome': {
    viewBox: '0 0 64 64',
    path: 'M10 44 C10 24 22 12 32 12 C42 12 54 24 54 44 M18 44 C18 30 24 22 32 22 C40 22 46 30 46 44 M32 12 L32 44',
  },
  laptop: {
    viewBox: '0 0 64 64',
    path: 'M14 18h36v22H14z M10 42h44v4H10z M20 46h24',
  },
  printer: {
    viewBox: '0 0 64 64',
    path: 'M18 14h28v10H18z M14 24h36v18H14z M20 42h24v8H20z M22 30h20 M22 35h20',
  },
  tv: {
    viewBox: '0 0 64 64',
    path: 'M12 16h40v24H12z M24 42h16v6H24z M28 10l4 6 4-6',
  },
  computer: {
    viewBox: '0 0 64 64',
    path: 'M14 14h36v24H14z M24 40h16 M20 46h24 M30 38v8 M34 38v8',
  },
  rack: {
    viewBox: '0 0 64 64',
    path: 'M18 10h28v44H18z M22 18h20 M22 28h20 M22 38h20 M22 48h20 M24 22h2 M24 32h2 M24 42h2',
  },
  generator: {
    viewBox: '0 0 64 64',
    path: 'M14 22h36v22H14z M20 28h10v10H20z M36 28h8 M36 34h8 M18 44h8 M38 44h8',
  },
  antenna: {
    viewBox: '0 0 64 64',
    path: 'M32 10v34 M24 44h16 M26 18l6 6 6-6 M20 12l12 12 12-12 M16 30 C24 24 40 24 48 30 M14 38 C24 32 40 32 50 38',
  },
  tree: {
    viewBox: '0 0 64 64',
    path: 'M32 10l16 18H16z M18 30h28L32 14z M20 40h24L32 24z M28 42h8v12h-8z',
  },
  container: {
    viewBox: '0 0 64 64',
    path: 'M10 18h44v28H10z M20 18v28 M30 18v28 M40 18v28 M12 22h4 M48 22h4 M12 42h4 M48 42h4',
  },
  'structure-top': {
    viewBox: '0 0 64 64',
    path: 'M10 14h44v36H10z M16 20h14v10H16z M34 20h14v10H34z M16 34h32v10H16',
  },
  'shape-square': {
    viewBox: '0 0 64 64',
    path: 'M18 18h28v28H18z',
  },
  'shape-circle': {
    viewBox: '0 0 64 64',
    path: 'M32 18 C39.7 18 46 24.3 46 32 C46 39.7 39.7 46 32 46 C24.3 46 18 39.7 18 32 C18 24.3 24.3 18 32 18z',
  },
  'shape-triangle': {
    viewBox: '0 0 64 64',
    path: 'M32 16 L48 44 H16 Z',
  },
  'shape-diamond': {
    viewBox: '0 0 64 64',
    path: 'M32 14 L50 32 L32 50 L14 32 Z',
  },
  'shape-cross': {
    viewBox: '0 0 64 64',
    path: 'M28 16h8v12h12v8H36v12h-8V36H16v-8h12z',
  },
};
