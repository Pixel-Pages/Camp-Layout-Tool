export interface IconDefinition {
  viewBox: string;
  path: string;
}

export const ICONS: Record<string, IconDefinition> = {
  'tent-ridge': {
    viewBox: '0 0 64 64',
    path:
      'M10 18 H54 L48 28 H16 Z ' +
      'M16 28 H48 V48 H16 Z ' +
      'M20 28 L32 16 L44 28 ' +
      'M24 34 H40 ' +
      'M24 40 H40 ' +
      'M32 18 V48',
  },
  'tent-dome': {
    viewBox: '0 0 64 64',
    path: 'M10 44 C10 24 22 12 32 12 C42 12 54 24 54 44 M18 44 C18 30 24 22 32 22 C40 22 46 30 46 44 M32 12 L32 44',
  },
  'tent-hex': {
    viewBox: '0 0 64 64',
    path:
      'M22 10 H42 L54 20 V44 L42 54 H22 L10 44 V20 Z ' +
      'M18 22 H46 ' +
      'M18 42 H46 ' +
      'M22 20 L32 12 L42 20 ' +
      'M32 12 V52',
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
    path: 'M10 16h44v20H10z M24 40h16v6H24z M28 10l4 6 4-6',
  },
  computer: {
    viewBox: '0 0 64 64',
    path: 'M14 14h36v24H14z M24 40h16 M20 46h24 M30 38v8 M34 38v8',
  },
  server: {
    viewBox: '0 0 64 64',
    path:
      'M14 14h36v10H14z ' +
      'M14 28h36v10H14z ' +
      'M14 42h36v10H14z ' +
      'M18 19h12 M18 33h12 M18 47h12 ' +
      'M42 19h2 M46 19h2 M42 33h2 M46 33h2 M42 47h2 M46 47h2',
  },
  generator: {
    viewBox: '0 0 64 64',
    path:
      'M12 20 H52 V44 H12 Z ' +
      'M18 46 H24 M40 46 H46 ' +
      'M30 22 L22 36 H30 L26 46 L42 28 H33 L38 22 Z',
  },
  ecu: {
    viewBox: '0 0 64 64',
    path:
      'M14 18 H50 V46 H14 Z ' +
      'M20 24 H44 M20 30 H44 M20 36 H34 ' +
      'M18 50 H24 M40 50 H46',
  },
  trailer: {
    viewBox: '0 0 64 64',
    path:
      'M8 24 H44 V40 H8 Z ' +
      'M44 28 H54 V36 H44 ' +
      'M18 44 A4 4 0 1 0 18.01 44 ' +
      'M46 44 A4 4 0 1 0 46.01 44 ' +
      'M18 20 V24 M28 20 V24',
  },
  pdu: {
    viewBox: '0 0 64 64',
    path:
      'M18 14 H46 V50 H18 Z ' +
      'M24 22 H40 V30 H24 Z ' +
      'M24 36 H28 V40 H24 Z M32 36 H36 V40 H32 Z M40 36 H44 V40 H40 Z',
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
  'fuel-tank': {
    viewBox: '0 0 64 64',
    path:
      'M16 16 H48 V48 H16 Z ' +
      'M22 22 H42 V42 H22 Z ' +
      'M28 12 H36 V16 H28 Z ' +
      'M20 52 H28 M36 52 H44',
  },
  'structure-top': {
    viewBox: '0 0 64 64',
    path:
      'M12 24 L32 12 L52 24 ' +
      'M16 24 H48 V50 H16 Z ' +
      'M24 30 H40 ' +
      'M24 36 H40 ' +
      'M24 42 H40 ' +
      'M32 18 V24',
  },
  'spider-box': {
    viewBox: '0 0 64 64',
    path:
      'M20 20 H44 V44 H20 Z ' +
      'M12 24 H20 M12 40 H20 M44 24 H52 M44 40 H52 ' +
      'M24 12 V20 M40 12 V20 M24 44 V52 M40 44 V52 ' +
      'M28 28 H36 V36 H28 Z',
  },
  refrigerator: {
    viewBox: '0 0 64 64',
    path:
      'M20 10 H44 V54 H20 Z ' +
      'M20 30 H44 ' +
      'M24 20 V26 M24 36 V44',
  },
  'pelican-case': {
    viewBox: '0 0 64 64',
    path:
      'M12 22 H52 V46 H12 Z ' +
      'M24 16 H40 V22 H24 Z ' +
      'M18 28 H46 M18 34 H46 M20 46 V50 M44 46 V50',
  },
  shredder: {
    viewBox: '0 0 64 64',
    path:
      'M18 16 H46 V28 H18 Z ' +
      'M20 28 H44 V46 H20 Z ' +
      'M26 32 V42 M32 32 V42 M38 32 V42',
  },
  whiteboard: {
    viewBox: '0 0 64 64',
    path:
      'M14 14 H50 V42 H14 Z ' +
      'M18 20 H40 M18 26 H46 M18 32 H34 ' +
      'M20 42 L16 52 M44 42 L48 52',
  },
  'comms-gear': {
    viewBox: '0 0 64 64',
    path:
      'M14 20 H50 V44 H14 Z ' +
      'M20 26 H30 V38 H20 Z ' +
      'M36 28 H44 M36 34 H44 M18 48 H46',
  },
  phone: {
    viewBox: '0 0 64 64',
    path:
      'M22 14 H42 V50 H22 Z ' +
      'M26 20 H38 V34 H26 Z ' +
      'M30 42 H34',
  },
  'vtc-unit': {
    viewBox: '0 0 64 64',
    path:
      'M12 20 H52 V42 H12 Z ' +
      'M20 28 H32 V36 H20 Z ' +
      'M38 26 H44 M38 32 H44 M38 38 H44',
  },
  'coffee-pot': {
    viewBox: '0 0 64 64',
    path:
      'M22 22 H42 V42 H22 Z ' +
      'M42 26 H48 V38 H42 ' +
      'M26 18 H38 ' +
      'M28 14 C28 10 32 10 32 6',
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
