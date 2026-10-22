export const ARENA_RADIUS = 108;

export const THEMES = {
  romantic: {
    id: 'romantic',
    name: { es: 'Corazón', en: 'Heart' },
    season: { es: 'Temporada de Amor', en: 'Season of Love' },
    accent: '#ff5f8f',
    accent2: '#ffc2d6',
    accent3: '#b06bff',
    css: 'radial-gradient(circle at 50% 18%, #481128 0%, #240817 42%, #0d0309 100%)',
    bg: 0x12050d,
    fog: 0x150611,
    fogDensity: 0.0078,
    ground: ['#080207', '#2a0a1e', '#4a1030', '#12040e'],
    ring: 0xff6f9d,
    light: { hemiSky: 0xffb3cf, hemiGround: 0x2a0a1a, hemi: 1.35, dir: 0xffe6ef, dirI: 2.5, point: 0xff2d6f },
    palette: [0xff4d79, 0xff7aa2, 0xffd166, 0x9b5de5, 0x5ee6b5, 0x6ec6ff, 0xff9ec4, 0xffb347, 0x00d4ff, 0xffe066],
    decor: [0xff8fb4, 0xff3b6b, 0xc77dff, 0xffd166],
    stars: [0xffe3ee, 0xff9ec4, 0xffd6a5],
    boost: '#ff3d77'
  },
  neon: {
    id: 'neon',
    name: { es: 'Neón', en: 'Neon' },
    season: { es: 'Noche Cyber', en: 'Cyber Night' },
    accent: '#26e6ff',
    accent2: '#ff4df0',
    accent3: '#b6ff3d',
    css: 'radial-gradient(circle at 50% 18%, #082a4a 0%, #04101f 45%, #01040b 100%)',
    bg: 0x030711,
    fog: 0x04101f,
    fogDensity: 0.0082,
    ground: ['#01040b', '#07192b', '#0b2a48', '#020914'],
    ring: 0x26e6ff,
    light: { hemiSky: 0x7de9ff, hemiGround: 0x061421, hemi: 1.25, dir: 0xd9fbff, dirI: 2.3, point: 0x2d7dff },
    palette: [0x26e6ff, 0xff4df0, 0xb6ff3d, 0x5d7bff, 0xffd166, 0x00ffc8, 0xff8a3d, 0xc77dff, 0x63f7ff, 0xff5c8a],
    decor: [0x26e6ff, 0xff4df0, 0xb6ff3d, 0x5d7bff],
    stars: [0xd9fbff, 0x9fc9ff, 0xff9ef7],
    boost: '#26e6ff'
  },
  pastel: {
    id: 'pastel',
    name: { es: 'Pastel', en: 'Pastel' },
    season: { es: 'Sueño de Azúcar', en: 'Sugar Dream' },
    accent: '#ffb3c7',
    accent2: '#b8f2d8',
    accent3: '#c4b5fd',
    css: 'radial-gradient(circle at 50% 18%, #44305e 0%, #291d3d 46%, #120b1d 100%)',
    bg: 0x1a1226,
    fog: 0x241a33,
    fogDensity: 0.0072,
    ground: ['#120b1d', '#332046', '#4b2f61', '#1a1027'],
    ring: 0xffb3c7,
    light: { hemiSky: 0xffd6e4, hemiGround: 0x2a2040, hemi: 1.45, dir: 0xfff4e6, dirI: 2.4, point: 0xffa7c5 },
    palette: [0xffb3c7, 0xb8f2d8, 0xc4b5fd, 0xffe5a3, 0x9ee7ff, 0xffc9a8, 0xd9b8ff, 0xa8f0d0, 0xff9fb8, 0xbfe8ff],
    decor: [0xffb3c7, 0xb8f2d8, 0xc4b5fd, 0xffe5a3],
    stars: [0xffe8f2, 0xd8fff0, 0xe9dcff],
    boost: '#ffb3c7'
  }
};

export const SKINS = [
  { id: 'fresa', name: { es: 'Fresa', en: 'Strawberry' }, main: '#ff5c8a', accent: '#ffd1dc', glow: '#ff2d6f' },
  { id: 'menta', name: { es: 'Menta', en: 'Mint' }, main: '#5ee6b5', accent: '#d6fff0', glow: '#2dd4a7' },
  { id: 'uva', name: { es: 'Uva', en: 'Grape' }, main: '#a78bfa', accent: '#ede9fe', glow: '#7c3aed' },
  { id: 'miel', name: { es: 'Miel', en: 'Honey' }, main: '#ffc857', accent: '#fff3c4', glow: '#ff9f1c' },
  { id: 'oceano', name: { es: 'Océano', en: 'Ocean' }, main: '#5bb8ff', accent: '#dff3ff', glow: '#2f8fff' },
  { id: 'cereza', name: { es: 'Cereza', en: 'Cherry' }, main: '#ff3d5a', accent: '#ffd2d8', glow: '#c1121f' }
];

export const BOT_NAMES = [
  'Luna', 'Cupido', 'Osito', 'Trufa', 'Chispa', 'Nube', 'Miel', 'Fresa',
  'Pompón', 'Coco', 'Vainilla', 'Tofu', 'Bombón', 'Estrella', 'Pétalo', 'Mochi'
];

export const MAX_SEGMENTS = 72;
export const MAX_ORBS = 320;
export const MAX_HEARTS = 34;
export const BOT_COUNT = 7;
