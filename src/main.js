import "./styles.css";
import { AudioKit } from "./audio.js";
import { Game } from "./game.js";
import { initialsFor, sanitizeNickname } from "./logic.js";
import {
  NAME_POOL,
  SKINS,
  THEMES,
  applySkinToDocument,
  applyThemeToDocument,
  getSkin,
  getTheme,
} from "./theme.js";

const STORAGE_KEY = "wormate3d.prefs.v1";
const DEFAULT_PREFS = {
  nickname: "Invitado",
  skin: "amor",
  theme: "love",
  muted: false,
  quality: "auto",
  best: 0,
};

function readPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const merged = { ...DEFAULT_PREFS, ...stored };
    merged.nickname = sanitizeNickname(merged.nickname);
    merged.skin = SKINS.some((skin) => skin.id === merged.skin) ? merged.skin : "amor";
    merged.theme = THEMES[merged.theme] ? merged.theme : "love";
    merged.quality = ["auto", "high", "low"].includes(merged.quality) ? merged.quality : "auto";
    merged.best = Number.isFinite(Number(merged.best)) ? Math.max(0, Number(merged.best)) : 0;
    merged.muted = Boolean(merged.muted);
    return merged;
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

const prefs = readPrefs();
const $ = (id) => document.getElementById(id);

const elements = {
  canvas: $("scene"),
  menu: $("menu"),
  hud: $("hud"),
  death: $("death"),
  pause: $("pause"),
  modalRoot: $("modal-root"),
  modalContent: $("modal-content"),
  toast: $("toast"),
  nickname: $("nickname"),
  avatar: $("avatar"),
  hudAvatar: $("hud-avatar"),
  hudName: $("hud-name"),
  hudScore: $("hud-score"),
  hudLength: $("hud-length"),
  lbRank: $("lb-rank"),
  lbList: $("lb-list"),
  menuBoard: $("menu-board"),
  menuSeason: $("menu-season"),
  seasonLabel: $("season-label"),
  online: $("online-count"),
  bestInline: $("best-inline"),
  bestScore: $("best-score"),
  soundBtn: $("sound-btn"),
  skinButton: $("skins-btn"),
  boostBtn: $("boost-btn"),
  joystick: $("joystick"),
  knob: $("joy-knob"),
  minimap: $("minimap"),
  hint: $("hud-hint"),
};

const audio = new AudioKit({ muted: prefs.muted });
applyThemeToDocument(getTheme(prefs.theme));
applySkinToDocument(getSkin(prefs.skin));

let game;
let lastLeaderboardKey = "";
let lastMenuKey = "";
let toastTimer = 0;

try {
  game = new Game(elements.canvas, {
    audio,
    theme: prefs.theme,
    quality: prefs.quality,
    elements,
    onHud: handleHud,
    onDeath: handleDeath,
    onToast: showToast,
  });
  game.setSkin(getSkin(prefs.skin));
  game.setPlayerName(prefs.nickname);
  game.setQuality(prefs.quality);
} catch (error) {
  console.error(error);
  showStartupError();
}

window.__wormate = { game, prefs };

function savePrefs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

function showToast(message, duration = 2200) {
  if (!elements.toast) return;
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), duration);
}

function formatScore(value) {
  return Number(value || 0).toLocaleString("es-ES");
}

function updateAvatar() {
  const name = sanitizeNickname(elements.nickname.value, "Invitado");
  const initials = initialsFor(name);
  if (elements.avatar) elements.avatar.textContent = initials;
  if (elements.hudAvatar) elements.hudAvatar.textContent = initials;
}

function updateBest() {
  const best = formatScore(prefs.best);
  if (elements.bestInline) elements.bestInline.textContent = best;
  if (elements.bestScore) elements.bestScore.textContent = best;
}

function updateSoundUi() {
  const enabled = !prefs.muted;
  elements.soundBtn?.setAttribute("aria-pressed", String(enabled));
  if (elements.soundBtn) elements.soundBtn.title = enabled ? "Silenciar sonido" : "Activar sonido";
  const toggle = document.getElementById("modal-sound");
  toggle?.setAttribute("aria-pressed", String(enabled));
}

function setMuted(muted, notify = true) {
  prefs.muted = Boolean(muted);
  savePrefs();
  audio.setMuted(prefs.muted);
  updateSoundUi();
  if (notify) showToast(prefs.muted ? "Sonido desactivado" : "Sonido activado");
}

function setTheme(themeId, notify = true) {
  const theme = getTheme(themeId);
  prefs.theme = theme.id;
  savePrefs();
  applyThemeToDocument(theme);
  game?.setTheme(theme.id);
  if (elements.seasonLabel) elements.seasonLabel.textContent = theme.season;
  if (elements.menuSeason) elements.menuSeason.textContent = theme.label;
  document.querySelectorAll("[data-theme]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.theme === theme.id);
  });
  if (notify) showToast(`Arena: ${theme.name}`);
}

function setSkin(skinId, notify = true) {
  const skin = getSkin(skinId);
  prefs.skin = skin.id;
  savePrefs();
  applySkinToDocument(skin);
  game?.setSkin(skin);
  updateAvatar();
  document.querySelectorAll("[data-skin]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.skin === skin.id);
  });
  if (notify) showToast(`Skin: ${skin.name}`);
}

function renderMenuBoard(entries, state) {
  const key = `${state}|${entries.map((entry) => `${entry.name}:${entry.score}`).join("|")}`;
  if (key === lastMenuKey || !elements.menuBoard) return;
  lastMenuKey = key;
  elements.menuBoard.replaceChildren();
  entries.slice(0, 5).forEach((entry) => {
    const row = document.createElement("li");
    row.className = `board-row${entry.you ? " is-you" : ""}`;
    const rank = document.createElement("span");
    rank.className = "board-rank";
    rank.textContent = String(entry.rank);
    const name = document.createElement("span");
    name.className = "board-name";
    name.textContent = entry.you ? `${entry.name} · tú` : entry.name;
    const score = document.createElement("span");
    score.className = "board-score";
    score.textContent = formatScore(entry.score);
    row.append(rank, name, score);
    elements.menuBoard.append(row);
  });
}

function renderHudBoard(entries) {
  const key = entries.map((entry) => `${entry.name}:${entry.score}:${entry.you}`).join("|");
  if (key === lastLeaderboardKey || !elements.lbList) return;
  lastLeaderboardKey = key;
  elements.lbList.replaceChildren();
  entries.slice(0, 6).forEach((entry) => {
    const row = document.createElement("li");
    row.className = `lb-row${entry.you ? " is-you" : ""}`;
    const rank = document.createElement("span");
    rank.textContent = String(entry.rank);
    const name = document.createElement("span");
    name.textContent = entry.you ? `${entry.name} · tú` : entry.name;
    const score = document.createElement("b");
    score.textContent = formatScore(entry.score);
    row.append(rank, name, score);
    elements.lbList.append(row);
  });
}

function handleHud(payload) {
  if (!game) return;
  if (elements.online) elements.online.textContent = String(payload.online);
  if (payload.state === "playing" || payload.state === "paused") {
    if (elements.hudName) elements.hudName.textContent = game.player.name;
    if (elements.hudScore) elements.hudScore.textContent = formatScore(payload.score);
    if (elements.hudLength) elements.hudLength.textContent = String(Math.max(1, payload.length));
    if (elements.lbRank) elements.lbRank.textContent = payload.rank ? `#${payload.rank}` : "—";
    renderHudBoard(payload.leaderboard);
    elements.boostBtn?.setAttribute("aria-disabled", String(!payload.boostReady));
  }
  renderMenuBoard(payload.leaderboard, payload.state);
}

function handleDeath(stats) {
  const newRecord = stats.score > prefs.best;
  if (newRecord) {
    prefs.best = stats.score;
    savePrefs();
    updateBest();
  }
  showToast(newRecord ? "¡Nuevo récord personal!" : `Puntuación: ${formatScore(stats.score)}`, 2600);
  $("death-score").textContent = formatScore(stats.score);
  $("death-length").textContent = `${Math.max(1, stats.length)} m`;
  $("death-rank").textContent = stats.rank ? `#${stats.rank}` : "—";
  $("death-reason").textContent = stats.reason;
  elements.hud.classList.add("hidden");
  elements.menu.classList.add("hidden");
  elements.pause.classList.add("hidden");
  elements.death.classList.remove("hidden");
  elements.boostBtn?.classList.remove("is-boosting");
}

function startGame() {
  if (!game) return;
  const name = sanitizeNickname(elements.nickname.value, "Invitado");
  elements.nickname.value = name;
  prefs.nickname = name;
  savePrefs();
  updateAvatar();
  audio.ensure();
  audio.click();
  closeModal();
  elements.nickname.blur();
  elements.menu.classList.add("hidden");
  elements.death.classList.add("hidden");
  elements.pause.classList.add("hidden");
  elements.hud.classList.remove("hidden");
  lastLeaderboardKey = "";
  game.setSkin(getSkin(prefs.skin));
  game.startRun({ name, skin: getSkin(prefs.skin) });
  updateHint();
}

function goMenu() {
  if (!game) return;
  closeModal();
  game.goMenu();
  lastLeaderboardKey = "";
  lastMenuKey = "";
  elements.hud.classList.add("hidden");
  elements.death.classList.add("hidden");
  elements.pause.classList.add("hidden");
  elements.menu.classList.remove("hidden");
  updateBest();
}

function pauseGame() {
  if (!game) return;
  if (game.pause()) {
    elements.hud.classList.add("hidden");
    elements.pause.classList.remove("hidden");
    elements.boostBtn?.classList.remove("is-boosting");
  }
}

function resumeGame() {
  if (!game) return;
  if (game.resume()) {
    elements.pause.classList.add("hidden");
    elements.hud.classList.remove("hidden");
  }
}

function togglePause() {
  if (!game) return;
  if (game.state === "playing") pauseGame();
  else if (game.state === "paused") resumeGame();
}

function updateHint() {
  if (!elements.hint) return;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  elements.hint.textContent = coarse
    ? "Arrastra para moverte · toca la derecha para turbo"
    : "Mueve el ratón · mantén clic o Espacio para turbo";
}

function randomNickname() {
  const options = NAME_POOL.filter((name) => name !== elements.nickname.value);
  elements.nickname.value = options[Math.floor(Math.random() * options.length)] || "Invitado";
  updateAvatar();
  prefs.nickname = elements.nickname.value;
  savePrefs();
  audio.click();
}

function skinCards() {
  return SKINS.map(
    (skin) => `
      <button class="skin-card${skin.id === prefs.skin ? " is-selected" : ""}" type="button" data-skin="${skin.id}" style="--c1:${skin.primary};--c2:${skin.secondary}">
        <span class="skin-check" aria-hidden="true">✓</span>
        <span class="skin-preview" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="skin-name">${skin.name}</span>
      </button>`,
  ).join("");
}

const modalTemplates = {
  skins: () => `
    <span class="kicker">Personaliza</span>
    <h2 id="modal-title">Elige tu skin</h2>
    <p class="modal-lede">Ocho estilos brillantes. Tu elección se guarda en este dispositivo.</p>
    <div class="skin-grid">${skinCards()}</div>
  `,
  settings: () => `
    <span class="kicker">Ajustes</span>
    <h2 id="modal-title">Ajustes</h2>
    <div class="modal-section">
      <div class="settings-row">
        <div><b>Sonido</b><small>Efectos de comer, turbo y choques.</small></div>
        <button id="modal-sound" class="switch" type="button" aria-pressed="${!prefs.muted}" aria-label="Sonido"></button>
      </div>
      <div class="settings-row">
        <div><b>Calidad visual</b><small>Baja la calidad para tablets más antiguas.</small></div>
        <div class="segment" id="quality-segment">
          <button type="button" data-quality="auto" class="${prefs.quality === "auto" ? "is-active" : ""}">Auto</button>
          <button type="button" data-quality="high" class="${prefs.quality === "high" ? "is-active" : ""}">Alta</button>
          <button type="button" data-quality="low" class="${prefs.quality === "low" ? "is-active" : ""}">Baja</button>
        </div>
      </div>
      <div class="settings-row">
        <div><b>Récord personal</b><small>${formatScore(prefs.best)} puntos</small></div>
        <button id="reset-best" class="btn-ghost settings-action" type="button">Borrar</button>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" type="button" data-close-modal>Listo</button>
      <button id="settings-play" class="btn-play" type="button" aria-label="Play game">
        <span class="btn-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg></span>
        <span class="btn-play-text"><b>Jugar</b><small>Entrar</small></span>
        <span class="btn-play-glow" aria-hidden="true"></span>
      </button>
    </div>
  `,
  help: () => `
    <span class="kicker">Manual rápido</span>
    <h2 id="modal-title">Cómo jugar</h2>
    <p class="modal-lede">Todo se controla con un dedo. En computadora también puedes usar el ratón y el teclado.</p>
    <ul class="help-list">
      <li><span class="help-icon">01</span><div><b>Muévete</b><small>Arrastra en la mitad izquierda de la pantalla. Con ratón, apunta hacia donde quieras ir. WASD y flechas también funcionan.</small></div></li>
      <li><span class="help-icon">02</span><div><b>Come y crece</b><small>Recoge corazones y orbes. Los orbes grandes valen más y te hacen más largo.</small></div></li>
      <li><span class="help-icon">03</span><div><b>Turbo</b><small>Mantén pulsado el botón Turbo, toca la mitad derecha o usa Espacio. Gastas longitud mientras aceleras.</small></div></li>
      <li><span class="help-icon">04</span><div><b>Sobrevive</b><small>Si tu cabeza toca el cuerpo de otro gusano, pierdes. Rodea a los rivales y oblígalos a chocar.</small></div></li>
    </ul>
    <div class="modal-actions">
      <button class="btn-ghost" type="button" data-close-modal>Volver</button>
      <button id="help-play" class="btn-play" type="button" aria-label="Play game">
        <span class="btn-play-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg></span>
        <span class="btn-play-text"><b>Jugar</b><small>Entrar</small></span>
        <span class="btn-play-glow" aria-hidden="true"></span>
      </button>
    </div>
  `,
  language: () => `
    <span class="kicker">Idioma</span>
    <h2 id="modal-title">Idioma del juego</h2>
    <p class="modal-lede">La arena está en español. El inglés llegará en una próxima temporada.</p>
    <div class="segment" style="width:100%;display:grid;grid-template-columns:1fr 1fr;gap:4px">
      <button type="button" class="is-active">Español</button>
      <button type="button" disabled>English</button>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" type="button" data-close-modal style="grid-column:1/-1">Cerrar</button>
    </div>
  `,
  about: () => `
    <div class="about-mark"><span class="mini-heart"></span><span>WORMATE<em>.3D</em></span></div>
    <p class="modal-lede">Un juego de gusanos en 3D para teléfonos y tablets. Come corazones, crece y domina una arena llena de rivales brillantes.</p>
    <ul class="help-list">
      <li><span class="help-icon">3D</span><div><b>Construido con Three.js</b><small>Geometría, luces y partículas en tiempo real dentro del navegador.</small></div></li>
      <li><span class="help-icon">09</span><div><b>Rivales con IA</b><small>Nueve gusanos recorren la arena, comen y vuelven a aparecer.</small></div></li>
      <li><span class="help-icon">01</span><div><b>Tu récord</b><small>El apodo, la skin, la arena y la mejor marca se guardan en tu dispositivo.</small></div></li>
    </ul>
    <div class="modal-actions">
      <button class="btn-ghost" type="button" data-close-modal style="grid-column:1/-1">Cerrar</button>
    </div>
  `,
  privacy: () => `
    <span class="kicker">Privacidad</span>
    <h2 id="modal-title">Política de privacidad</h2>
    <p class="modal-lede">Wormate.3D es una demo jugable que funciona en tu navegador.</p>
    <ul class="help-list">
      <li><span class="help-icon">01</span><div><b>Sin cuentas</b><small>No pedimos correo, teléfono ni contraseña.</small></div></li>
      <li><span class="help-icon">02</span><div><b>Datos locales</b><small>Apodo, skin, arena y récord se guardan solo en el almacenamiento local del dispositivo.</small></div></li>
      <li><span class="help-icon">03</span><div><b>Sin rastreo</b><small>No hay analítica, anuncios ni envío de datos a servidores.</small></div></li>
    </ul>
    <div class="modal-actions">
      <button class="btn-ghost" type="button" data-close-modal style="grid-column:1/-1">Cerrar</button>
    </div>
  `,
  support: () => `
    <span class="kicker">Soporte</span>
    <h2 id="modal-title">¿Necesitas ayuda?</h2>
    <p class="modal-lede">Estas son las soluciones rápidas para los problemas más comunes.</p>
    <ul class="help-list">
      <li><span class="help-icon">01</span><div><b>Si no ves la arena</b><small>Actualiza la página y comprueba que tu navegador tenga WebGL activo.</small></div></li>
      <li><span class="help-icon">02</span><div><b>Si va lento</b><small>Abre Ajustes y cambia la calidad visual a Baja.</small></div></li>
      <li><span class="help-icon">03</span><div><b>Si no responde el turbo</b><small>Mantén pulsado el botón Turbo o la mitad derecha de la pantalla.</small></div></li>
    </ul>
    <div class="modal-actions">
      <button class="btn-ghost" type="button" data-close-modal style="grid-column:1/-1">Cerrar</button>
    </div>
  `,
};

function openModal(kind) {
  const template = modalTemplates[kind];
  if (!template || !elements.modalRoot) return;
  elements.modalContent.innerHTML = template();
  elements.modalRoot.classList.remove("hidden");
  elements.modalRoot.dataset.kind = kind;
  const close = elements.modalRoot.querySelector(".modal-close");
  close?.focus({ preventScroll: true });
  document.getElementById("settings-play")?.addEventListener("click", startGame);
  document.getElementById("help-play")?.addEventListener("click", startGame);
  document.getElementById("modal-sound")?.addEventListener("click", () => setMuted(!prefs.muted));
  document.getElementById("reset-best")?.addEventListener("click", () => {
    prefs.best = 0;
    savePrefs();
    updateBest();
    showToast("Récord borrado");
    openModal("settings");
  });
  document.querySelectorAll("[data-quality]").forEach((button) => {
    button.addEventListener("click", () => {
      prefs.quality = button.dataset.quality;
      savePrefs();
      game?.setQuality(prefs.quality);
      document.querySelectorAll("[data-quality]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      showToast(`Calidad: ${button.textContent}`);
    });
  });
  elements.modalContent.querySelectorAll("[data-skin]").forEach((button) => {
    button.addEventListener("click", () => setSkin(button.dataset.skin));
  });
}

function closeModal() {
  elements.modalRoot?.classList.add("hidden");
  elements.modalContent.replaceChildren();
  delete elements.modalRoot?.dataset.kind;
}

function showStartupError() {
  const overlay = document.createElement("section");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="result-card">
      <span class="kicker">No se pudo iniciar</span>
      <h2>WebGL no está disponible</h2>
      <p class="result-copy">Este navegador no pudo crear la arena 3D. Activa la aceleración gráfica o prueba con Chrome, Edge o Safari actualizado.</p>
      <button class="btn-ghost" type="button" onclick="location.reload()">Recargar</button>
    </div>`;
  $("app").append(overlay);
}

/* ------------------------------------------------------------------ events */
$("play-btn")?.addEventListener("click", startGame);
$("respawn-btn")?.addEventListener("click", () => {
  elements.death.classList.add("hidden");
  elements.hud.classList.remove("hidden");
  lastLeaderboardKey = "";
  game?.respawn();
  audio.click();
});
$("death-menu-btn")?.addEventListener("click", goMenu);
$("pause-btn")?.addEventListener("click", pauseGame);
$("resume-btn")?.addEventListener("click", resumeGame);
$("pause-menu-btn")?.addEventListener("click", goMenu);
$("sound-btn")?.addEventListener("click", () => setMuted(!prefs.muted));
$("settings-btn")?.addEventListener("click", () => openModal("settings"));
$("skins-btn")?.addEventListener("click", () => openModal("skins"));
$("help-btn")?.addEventListener("click", () => openModal("help"));
$("lang-btn")?.addEventListener("click", () => openModal("language"));
$("random-name")?.addEventListener("click", randomNickname);

elements.nickname?.addEventListener("input", () => {
  updateAvatar();
});
elements.nickname?.addEventListener("blur", () => {
  const name = sanitizeNickname(elements.nickname.value, "Invitado");
  elements.nickname.value = name;
  prefs.nickname = name;
  savePrefs();
  updateAvatar();
});
elements.nickname?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    startGame();
  }
});

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.theme));
});

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.modal));
});

elements.modalRoot?.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!elements.modalRoot.classList.contains("hidden")) {
      closeModal();
      return;
    }
    if (game && (game.state === "playing" || game.state === "paused")) togglePause();
  }
  if ((event.key === "p" || event.key === "P") && !event.repeat) {
    if (elements.modalRoot.classList.contains("hidden")) togglePause();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game?.state === "playing") pauseGame();
});

window.addEventListener("pointerdown", () => audio.ensure(), { once: true, passive: true });

/* -------------------------------------------------------------- initialise */
elements.nickname.value = prefs.nickname;
updateAvatar();
updateBest();
updateSoundUi();
updateHint();
setTheme(prefs.theme, false);
setSkin(prefs.skin, false);
if (elements.soundBtn) elements.soundBtn.setAttribute("aria-pressed", String(!prefs.muted));
