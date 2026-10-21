export const SKINS = [
  { id: "amor", name: "Corazón", primary: "#ff4f8b", secondary: "#ffb3cc", glow: "#ff2d6f" },
  { id: "neon", name: "Neón", primary: "#31e6ff", secondary: "#8f7dff", glow: "#00c8ff" },
  { id: "menta", name: "Menta", primary: "#43f5b0", secondary: "#c2ffe8", glow: "#19d98c" },
  { id: "oro", name: "Dorado", primary: "#ffc94d", secondary: "#fff0b0", glow: "#ff9d1f" },
  { id: "uva", name: "Uva", primary: "#b06bff", secondary: "#e6cfff", glow: "#8a3dff" },
  { id: "coral", name: "Coral", primary: "#ff6b4a", secondary: "#ffb695", glow: "#ff3d1f" },
  { id: "hielo", name: "Hielo", primary: "#8fd6ff", secondary: "#effbff", glow: "#48b8ff" },
  { id: "noche", name: "Noche", primary: "#ff3d6e", secondary: "#7a3cff", glow: "#d41dff" },
];

export const THEMES = {
  love: {
    id: "love",
    label: "Amor",
    name: "Jardín de Amor",
    season: "Temporada de Amor",
    accent: "#ff4f8b",
    accentRgb: "255, 79, 139",
    accent2: "#ffabc8",
    accentHot: "#ff765e",
    gold: "#ffd166",
    skyTop: "#32103e",
    skyBottom: "#05020a",
    fog: 0x120718,
    ground: 0x26112d,
    groundEdge: 0x411a49,
    ring: 0xff5c9c,
    ambient: 0xa988bb,
    hemiSky: 0xffc9e4,
    hemiGround: 0x1b0722,
    key: 0xffd9e8,
    pointA: 0xff3f86,
    pointB: 0x8a5bff,
    food: ["#ff4f8b", "#ff8fb7", "#ffd166", "#7ef0c8", "#b28dff", "#ff6b3d", "#63c7ff", "#fff0f6"],
    heartFog: "#ff6aa5",
    minimap: { bg: "#180a20", ring: "#ff5c9c", player: "#ffd166", bot: "#ff9dc0", food: "#ff4f8b" },
  },
  neon: {
    id: "neon",
    label: "Neón",
    name: "Noche Neón",
    season: "Temporada Neón",
    accent: "#3ee5ff",
    accentRgb: "62, 229, 255",
    accent2: "#9e8cff",
    accentHot: "#9e8cff",
    gold: "#b8ff6a",
    skyTop: "#062c38",
    skyBottom: "#02060d",
    fog: 0x04121a,
    ground: 0x0a2732,
    groundEdge: 0x104350,
    ring: 0x3ee5ff,
    ambient: 0x7caabb,
    hemiSky: 0xa9f4ff,
    hemiGround: 0x06161e,
    key: 0xc9f6ff,
    pointA: 0x21e6ff,
    pointB: 0xa24dff,
    food: ["#3ee5ff", "#7ef0d0", "#b8ff6a", "#9e8cff", "#ff5ccf", "#5f9bff", "#e9ff8a", "#c8fbff"],
    heartFog: "#4ce6ff",
    minimap: { bg: "#071720", ring: "#3ee5ff", player: "#b8ff6a", bot: "#7defe2", food: "#3ee5ff" },
  },
};

export const BOT_NAMES = [
  "Luna",
  "Mateo",
  "Valentina",
  "Cupido",
  "Kiwi",
  "Sol",
  "Bruno",
  "Miel",
  "Nube",
  "Pixel",
  "Aurora",
  "Tomate",
  "Chispa",
  "Duna",
  "Rulo",
  "Vega",
  "Pompón",
  "Nori",
  "Trufa",
  "Burbuja",
];

export const NAME_POOL = [
  "Invitado",
  "Gusanito",
  "Corazón",
  "Chispa",
  "Miel",
  "Nube",
  "Bombón",
  "Cupido",
  "Estrella",
  "Burbuja",
  "Galleta",
  "Fresa",
];

export function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) || SKINS[0];
}

export function getTheme(id) {
  return THEMES[id] || THEMES.love;
}

export function applyThemeToDocument(theme) {
  const root = document.documentElement;
  root.dataset.arena = theme.id;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-rgb", theme.accentRgb);
  root.style.setProperty("--accent-2", theme.accent2);
  root.style.setProperty("--accent-hot", theme.accentHot);
  root.style.setProperty("--gold", theme.gold);
}

export function applySkinToDocument(skin) {
  const root = document.documentElement;
  root.style.setProperty("--skin-1", skin.primary);
  root.style.setProperty("--skin-2", skin.secondary);
}
