import { ARENA_RADIUS, SKINS, THEMES } from './config.js';

const I18N = {
  es: {
    score: 'PUNTOS',
    length: 'LONGITUD',
    ranking: 'RANKING',
    map: 'MAPA',
    boost: 'TURBO',
    pause: 'Pausa',
    play: 'JUGAR',
    how: 'CÓMO JUGAR',
    settings: 'AJUSTES',
    privacy: 'Privacidad',
    support: 'Soporte',
    tagline: 'Come dulces. Crece. Rodea a tus rivales.',
    yourBest: 'TU MEJOR MARCA',
    bestSub: 'Cada partida cuenta',
    topToday: 'TOP DE HOY',
    arena: 'ARENA',
    skin: 'COLOR DEL GUSANO',
    arenaRomantic: 'Corazón',
    arenaNeon: 'Neón',
    arenaPastel: 'Pastel',
    reach: 'Llega al',
    seasonGoal: 'META DE TEMPORADA',
    seasonGoalSub: 'Rodea a los rivales, roba sus dulces y domina el jardín.',
    guest: 'INVITADO',
    loading: 'Preparando el jardín...',
    nicknamePlaceholder: 'Tu apodo',
    howKicker: 'MANUAL DEL GUSANO',
    howTitle: 'Aprende a <span class="accent">enrollarte</span>',
    howDesc: 'Fácil de aprender, difícil de soltar. Todo se controla con un dedo o el ratón.',
    howMoveTitle: 'Muévete',
    howMove: 'Arrastra el dedo por la pantalla para girar. En ordenador, mueve el ratón.',
    howBoostTitle: 'Acelera',
    howBoost: 'Mantén TURBO (clic o espacio en ordenador) para acelerar. Se recarga solo.',
    howEatTitle: 'Come y crece',
    howEat: 'Recoge caramelos y corazones. Los corazones valen mucho más y hacen brillar tu gusano.',
    howDangerTitle: 'Rodea y sobrevive',
    howDanger: 'Si tu cabeza toca el cuerpo de otro gusano, explotas. Rodea a los rivales para eliminarlos.',
    gotIt: '¡VAMOS!',
    pauseKicker: 'RESPIRA HONDO',
    pauseTitle: 'Juego en <span class="accent">pausa</span>',
    pauseDesc: 'Tu gusano te espera. El jardín también.',
    resume: 'SEGUIR JUGANDO',
    menu: 'MENÚ PRINCIPAL',
    settingsKicker: 'A TU GUSTO',
    settingsTitle: 'Ajustes',
    settingsDesc: 'Sonido, rendimiento e idioma. Todo se guarda en este dispositivo.',
    sound: 'Sonido',
    soundSub: 'Efectos y ambiente del juego',
    music: 'Música',
    musicSub: 'Ambiente suave de fondo',
    quality: 'Calidad',
    qualitySub: 'Baja la calidad si notas tirones',
    qualityAuto: 'AUTO',
    qualityHigh: 'ALTA',
    qualityLow: 'BAJA',
    language: 'Idioma',
    languageSub: 'Español o inglés',
    resetBest: 'BORRAR MI RÉCORD',
    resetOk: 'Récord borrado',
    deathKicker: 'FIN DEL RECORRIDO',
    deathTitle: '¡Te has <span class="accent">desintegrado</span>!',
    deathDesc: 'Alguien te ha rodeado. Tus dulces se han quedado en el jardín.',
    deathScoreLabel: 'PUNTUACIÓN',
    deathLength: 'LONGITUD',
    deathRank: 'POSICIÓN',
    deathBest: 'RÉCORD',
    newRecord: '¡NUEVO RÉCORD!',
    respawn: 'VOLVER A JUGAR',
    toMenu: 'MENÚ PRINCIPAL',
    privacyKicker: 'TRANQUILO, ES TUYO',
    privacyTitle: 'Privacidad',
    privacyText: 'Wormate 3D funciona por completo en tu navegador. El apodo, el color, el idioma, el récord y los ajustes se guardan solo en el almacenamiento local de este dispositivo. No hay cuentas, anuncios ni seguimiento.',
    privacyText2: 'El botón de soporte abre las incidencias públicas del proyecto en GitHub. No se envía ningún dato del juego.',
    close: 'CERRAR',
    killToast: '¡Derribaste a',
    rankToast: '¡Eres el #1 del jardín!',
    boundaryToast: '¡Cuidado con el borde!',
    startToast: '¡A comer!',
    recordToast: '¡Nuevo récord personal!'
  },
  en: {
    score: 'SCORE',
    length: 'LENGTH',
    ranking: 'RANKING',
    map: 'MAP',
    boost: 'BOOST',
    pause: 'Pause',
    play: 'PLAY',
    how: 'HOW TO PLAY',
    settings: 'SETTINGS',
    privacy: 'Privacy',
    support: 'Support',
    tagline: 'Eat candy. Grow. Wrap your rivals.',
    yourBest: 'YOUR BEST SCORE',
    bestSub: 'Every run counts',
    topToday: 'TOP TODAY',
    arena: 'ARENA',
    skin: 'WORM COLOR',
    arenaRomantic: 'Heart',
    arenaNeon: 'Neon',
    arenaPastel: 'Pastel',
    reach: 'Reach',
    seasonGoal: 'SEASON GOAL',
    seasonGoalSub: 'Wrap your rivals, steal their candy and rule the garden.',
    guest: 'GUEST',
    loading: 'Growing the garden...',
    nicknamePlaceholder: 'Your nickname',
    howKicker: 'WORM HANDBOOK',
    howTitle: 'Learn to <span class="accent">swirl</span>',
    howDesc: 'Easy to learn, hard to put down. One finger or a mouse is all you need.',
    howMoveTitle: 'Move',
    howMove: 'Drag your finger anywhere to steer. On desktop, move the mouse.',
    howBoostTitle: 'Boost',
    howBoost: 'Hold BOOST (click or space on desktop) to speed up. It recharges by itself.',
    howEatTitle: 'Eat and grow',
    howEat: 'Collect candy and hearts. Hearts are worth much more and make your worm glow.',
    howDangerTitle: 'Wrap and survive',
    howDanger: 'If your head touches another worm body, you pop. Wrap around rivals to take them down.',
    gotIt: 'LET’S GO!',
    pauseKicker: 'TAKE A BREATH',
    pauseTitle: 'Game <span class="accent">paused</span>',
    pauseDesc: 'Your worm is waiting. So is the garden.',
    resume: 'KEEP PLAYING',
    menu: 'MAIN MENU',
    settingsKicker: 'YOUR WAY',
    settingsTitle: 'Settings',
    settingsDesc: 'Sound, performance and language. Everything is saved on this device.',
    sound: 'Sound',
    soundSub: 'Game effects and ambience',
    music: 'Music',
    musicSub: 'Soft background ambience',
    quality: 'Quality',
    qualitySub: 'Lower it if you notice stutter',
    qualityAuto: 'AUTO',
    qualityHigh: 'HIGH',
    qualityLow: 'LOW',
    language: 'Language',
    languageSub: 'Spanish or English',
    resetBest: 'CLEAR MY BEST SCORE',
    resetOk: 'Best score cleared',
    deathKicker: 'RUN OVER',
    deathTitle: 'You got <span class="accent">wrapped</span>!',
    deathDesc: 'Someone outswirled you. Your candy is now part of the garden.',
    deathScoreLabel: 'SCORE',
    deathLength: 'LENGTH',
    deathRank: 'PLACE',
    deathBest: 'BEST',
    newRecord: 'NEW HIGH SCORE!',
    respawn: 'PLAY AGAIN',
    toMenu: 'MAIN MENU',
    privacyKicker: 'IT STAYS YOURS',
    privacyTitle: 'Privacy',
    privacyText: 'Wormate 3D runs entirely in your browser. Your nickname, color, language, high score and settings are stored only in this device’s local storage. There are no accounts, ads or tracking.',
    privacyText2: 'The support button opens the project’s public GitHub issues. No game data is sent.',
    close: 'CLOSE',
    killToast: 'You took down',
    rankToast: 'You are the garden #1!',
    boundaryToast: 'Watch the edge!',
    startToast: 'Time to feast!',
    recordToast: 'New personal record!'
  }
};

const heartIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C6.4 16.8 2.5 13.4 2.5 9.2 2.5 6.1 4.8 4 7.6 4c1.6 0 3.1.8 4.4 2.5C13.3 4.8 14.8 4 16.4 4c2.8 0 5.1 2.1 5.1 5.2 0 4.2-3.9 7.6-9.5 11.8z"/></svg>';
const moveIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M2 12h20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/></svg>';
const boltIcon = heartIcon.replace('M12 21C6.4 16.8 2.5 13.4 2.5 9.2 2.5 6.1 4.8 4 7.6 4c1.6 0 3.1.8 4.4 2.5C13.3 4.8 14.8 4 16.4 4c2.8 0 5.1 2.1 5.1 5.2 0 4.2-3.9 7.6-9.5 11.8z', 'M13 2 4 14h7l-1 8 10-13h-7l1-7z');
const candyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM16 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg>';
const shieldIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c2.5 2 5 3 8 3 0 7-3 12-8 15-5-3-8-8-8-15 3 0 5.5-1 8-3z"/><path d="M9 12l2 2 4-4"/></svg>';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeName(value) {
  return String(value)
    .replace(/[<>&"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14);
}

function colorToCss(color) {
  const value = typeof color === 'number' ? color : parseInt(String(color).replace('#', ''), 16);
  return `#${(value >>> 0).toString(16).padStart(6, '0')}`;
}

export class UI {
  constructor(game, audio, input) {
    this.game = game;
    this.audio = audio;
    this.input = input;
    this.storage = this.readStorage();
    this.lang = this.storage.language === 'en' ? 'en' : 'es';
    this.sound = this.storage.sound !== false;
    this.music = this.storage.music !== false;
    this.quality = ['auto', 'high', 'low'].includes(this.storage.quality) ? this.storage.quality : 'auto';
    this.theme = THEMES[this.storage.theme] ? this.storage.theme : 'romantic';
    this.skin = SKINS.some((item) => item.id === this.storage.skin) ? this.storage.skin : 'fresa';
    this.best = Number(this.storage.best) || 0;
    this.nickname = sanitizeName(this.storage.nickname || '');
    this.modalKind = null;
    this.lastScore = 0;
    this.lastLeaderboard = 0;
    this.lastMinimap = 0;
    this.menuTimer = 0;
    this.toastTimer = null;
    this.loadingHidden = false;
    this.lastTime = performance.now();

    this.refs = {
      menu: document.getElementById('menu'),
      hud: document.getElementById('hud'),
      score: document.getElementById('score'),
      length: document.getElementById('length'),
      rankBadge: document.getElementById('rank-badge'),
      combo: document.getElementById('combo-pill'),
      boost: document.getElementById('boost-button'),
      leaderboard: document.getElementById('leaderboard-list'),
      minimap: document.getElementById('minimap'),
      nickname: document.getElementById('nickname'),
      play: document.getElementById('play-button'),
      how: document.getElementById('how-button'),
      settings: document.getElementById('settings-button'),
      privacy: document.getElementById('privacy-button'),
      language: document.getElementById('language-button'),
      languageLabel: document.getElementById('language-label'),
      pause: document.getElementById('pause-button'),
      arenaRow: document.getElementById('arena-row'),
      skinRow: document.getElementById('skin-row'),
      season: document.getElementById('season-label'),
      best: document.getElementById('best-score'),
      menuTop: document.getElementById('menu-top'),
      loading: document.getElementById('loading'),
      backdrop: document.getElementById('modal-backdrop'),
      modal: document.getElementById('modal-content'),
      modalClose: document.getElementById('modal-close'),
      toast: document.getElementById('toast'),
      boundary: document.getElementById('boundary-warning'),
      popLayer: document.getElementById('pop-layer')
    };

    this.minimapContext = this.refs.minimap.getContext('2d');
    this.buildSkins();
    this.refs.nickname.value = this.nickname;
    this.applyLanguage(false);
    this.applyThemeUI(this.theme);
    this.applySettings();
    this.game.setSkin(this.skin);
    this.game.setTheme(this.theme);
    this.game.player.setName(this.nickname || this.t('guest'));
    this.updateBest();
    this.updateMenuTop();
    this.bind();
    this.subscribe();
    this.input.setEnabled(false);
    this.renderLeaderboard(this.game.getHudState());
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
    setTimeout(() => this.hideLoading(), 850);
  }

  readStorage() {
    try {
      return JSON.parse(localStorage.getItem('wormate3d.settings') || '{}');
    } catch {
      return {};
    }
  }

  saveStorage() {
    try {
      localStorage.setItem('wormate3d.settings', JSON.stringify({
        language: this.lang,
        sound: this.sound,
        music: this.music,
        quality: this.quality,
        theme: this.theme,
        skin: this.skin,
        best: this.best,
        nickname: this.nickname
      }));
    } catch {
      void 0;
    }
  }

  t(key) {
    return I18N[this.lang][key] ?? I18N.es[key] ?? key;
  }

  format(value) {
    return Math.max(0, Math.floor(value)).toLocaleString(this.lang === 'es' ? 'es-ES' : 'en-US');
  }

  hideLoading() {
    if (this.loadingHidden) return;
    this.loadingHidden = true;
    this.refs.loading.classList.add('hidden');
  }

  buildSkins() {
    this.refs.skinRow.innerHTML = SKINS.map((skin) => `
      <button type="button" class="skin-button" data-skin="${skin.id}"
        style="--skin-main:${skin.main};--skin-accent:${skin.accent};--skin-glow:${skin.glow}"
        data-label="${escapeHtml(skin.name[this.lang])}" title="${escapeHtml(skin.name[this.lang])}">
        <span class="skin-dot"></span>
      </button>
    `).join('');
    this.updateSkinSelection();
  }

  updateSkinSelection() {
    this.refs.skinRow.querySelectorAll('[data-skin]').forEach((button) => {
      button.classList.toggle('active', button.dataset.skin === this.skin);
    });
  }

  applyLanguage(rebuild = true) {
    document.documentElement.lang = this.lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      const value = this.t(key);
      if (value) node.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
      node.setAttribute('aria-label', this.t(node.dataset.i18nAria));
    });
    this.refs.nickname.placeholder = this.t('nicknamePlaceholder');
    this.refs.languageLabel.textContent = this.lang.toUpperCase();
    if (rebuild) {
      this.refs.skinRow.querySelectorAll('[data-skin]').forEach((button) => {
        const skin = SKINS.find((item) => item.id === button.dataset.skin);
        if (!skin) return;
        button.dataset.label = skin.name[this.lang];
        button.title = skin.name[this.lang];
      });
    }
    this.applyThemeUI(this.theme);
  }

  applyThemeUI(id) {
    const theme = THEMES[id] || THEMES.romantic;
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-2', theme.accent2);
    root.style.setProperty('--accent-3', theme.accent3);
    root.style.setProperty('--bg', colorToCss(theme.bg));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colorToCss(theme.bg));
    this.refs.season.textContent = theme.season[this.lang];
    this.refs.arenaRow.querySelectorAll('[data-theme]').forEach((button) => {
      button.classList.toggle('active', button.dataset.theme === id);
    });
  }

  applySettings() {
    this.audio.enabled = this.sound;
    this.audio.musicEnabled = this.music;
    if (this.audio.master) {
      this.audio.setEnabled(this.sound);
      this.audio.setMusic(this.music);
    }
    this.game.applyQuality(this.quality);
  }

  updateBest() {
    this.refs.best.textContent = this.format(this.best);
  }

  updateMenuTop() {
    const leaders = this.game.getLeaderboard(3);
    if (!leaders.length) {
      this.refs.menuTop.innerHTML = '';
      return;
    }
    this.refs.menuTop.innerHTML = leaders.map((entry) => `
      <div class="menu-top-row">
        <span class="menu-top-rank">#${entry.rank}</span>
        <span class="menu-top-name"><span class="menu-top-dot" style="--dot:${entry.color}"></span>${escapeHtml(entry.name)}</span>
        <strong>${this.format(entry.score)}</strong>
      </div>
    `).join('');
  }

  bind() {
    const unlock = () => {
      this.audio.init();
      this.audio.setEnabled(this.sound);
      this.audio.setMusic(this.music);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    this.refs.play.addEventListener('click', () => {
      this.audio.init();
      this.audio.click();
      this.startGame();
    });

    this.refs.arenaRow.addEventListener('click', (event) => {
      const button = event.target.closest('[data-theme]');
      if (!button) return;
      this.theme = button.dataset.theme;
      this.saveStorage();
      this.game.setTheme(this.theme);
      this.applyThemeUI(this.theme);
      this.audio.click();
    });

    this.refs.skinRow.addEventListener('click', (event) => {
      const button = event.target.closest('[data-skin]');
      if (!button) return;
      this.skin = button.dataset.skin;
      this.saveStorage();
      this.game.setSkin(this.skin);
      this.updateSkinSelection();
      this.audio.click();
    });

    this.refs.how.addEventListener('click', () => this.showHow());
    this.refs.settings.addEventListener('click', () => this.showSettings());
    this.refs.privacy.addEventListener('click', () => this.showPrivacy());
    this.refs.language.addEventListener('click', () => {
      this.setLanguage(this.lang === 'es' ? 'en' : 'es');
      this.audio.click();
    });
    this.refs.pause.addEventListener('click', () => this.togglePause());
    this.refs.modalClose.addEventListener('click', () => this.closeModal());
    this.refs.backdrop.addEventListener('click', (event) => {
      if (event.target === this.refs.backdrop) this.closeModal();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.modalKind && this.modalKind !== 'death') {
        event.preventDefault();
        this.closeModal();
      }
    });
  }

  subscribe() {
    this.game.on('state', (state) => this.onState(state));
    this.game.on('death', (data) => this.showDeath(data));
    this.game.on('eat', (data) => this.onEat(data));
    this.game.on('kill', (data) => this.showToast(`${this.t('killToast')} ${data.name}!`, 'gold'));
    this.game.on('rank', () => this.showToast(this.t('rankToast'), 'gold'));
    this.game.on('boundary', (active) => {
      this.refs.boundary.classList.toggle('active', Boolean(active));
    });
  }

  startGame() {
    const entered = sanitizeName(this.refs.nickname.value);
    this.nickname = entered;
    this.refs.nickname.value = entered;
    this.saveStorage();
    const displayName = entered || this.t('guest');
    this.game.player.setName(displayName);
    this.closeModal(true);
    this.game.start({ name: displayName, skin: this.skin, theme: this.theme });
    this.showToast(this.t('startToast'), '');
  }

  onState(state) {
    if (state === 'playing') {
      this.refs.menu.classList.add('hidden');
      this.refs.hud.classList.add('active');
      this.input.setEnabled(true);
      if (this.modalKind === 'pause') this.closeModal(true);
      this.lastScore = 0;
      this.lastLeaderboard = 0;
    } else if (state === 'paused') {
      this.refs.hud.classList.add('active');
      this.input.setEnabled(false);
      this.showPause();
    } else if (state === 'dead') {
      this.input.setEnabled(false);
    } else if (state === 'menu') {
      this.refs.menu.classList.remove('hidden');
      this.refs.hud.classList.remove('active');
      this.input.setEnabled(false);
      this.refs.boundary.classList.remove('active');
      if (this.modalKind !== 'settings' && this.modalKind !== 'how' && this.modalKind !== 'privacy') {
        this.closeModal(true);
      }
      this.updateMenuTop();
      this.updateBest();
    }
  }

  togglePause() {
    if (this.game.state === 'playing') this.game.pause();
    else if (this.game.state === 'paused') this.game.resume();
  }

  openModal(html, kind, closable = true) {
    this.refs.modal.innerHTML = html;
    this.refs.modalClose.style.display = closable ? 'grid' : 'none';
    this.refs.backdrop.classList.remove('hidden');
    this.modalKind = kind;
  }

  closeModal(force = false) {
    if (this.modalKind === 'death' && !force) return;
    if (this.modalKind === 'pause' && this.game.state === 'paused' && !force) {
      this.game.resume();
    }
    this.refs.backdrop.classList.add('hidden');
    this.modalKind = null;
  }

  showHow() {
    const html = `
      <span class="modal-kicker">${this.t('howKicker')}</span>
      <h2>${this.t('howTitle')}</h2>
      <p class="modal-desc">${this.t('howDesc')}</p>
      <div class="how-grid">
        <div class="how-item">
          <span class="how-icon">${moveIcon}</span>
          <div><h3>${this.t('howMoveTitle')}</h3><p>${this.t('howMove')}</p></div>
        </div>
        <div class="how-item">
          <span class="how-icon">${boltIcon}</span>
          <div><h3>${this.t('howBoostTitle')}</h3><p>${this.t('howBoost')}</p></div>
        </div>
        <div class="how-item">
          <span class="how-icon">${candyIcon}</span>
          <div><h3>${this.t('howEatTitle')}</h3><p>${this.t('howEat')}</p></div>
        </div>
        <div class="how-item">
          <span class="how-icon">${shieldIcon}</span>
          <div><h3>${this.t('howDangerTitle')}</h3><p>${this.t('howDanger')}</p></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-primary" id="modal-got-it">${this.t('gotIt')}</button>
      </div>
    `;
    this.openModal(html, 'how');
    this.refs.modal.querySelector('#modal-got-it')?.addEventListener('click', () => this.closeModal(true));
  }

  showPause() {
    const html = `
      <span class="modal-kicker">${this.t('pauseKicker')}</span>
      <h2>${this.t('pauseTitle')}</h2>
      <p class="modal-desc">${this.t('pauseDesc')}</p>
      <div class="modal-actions">
        <button class="modal-primary" id="modal-resume">${this.t('resume')}</button>
        <button class="modal-secondary" id="modal-menu">${this.t('menu')}</button>
      </div>
    `;
    this.openModal(html, 'pause');
    this.refs.modal.querySelector('#modal-resume')?.addEventListener('click', () => {
      this.game.resume();
    });
    this.refs.modal.querySelector('#modal-menu')?.addEventListener('click', () => {
      this.closeModal(true);
      this.game.showMenu();
    });
  }

  showSettings() {
    const qualityButton = (value) => `
      <button type="button" data-quality="${value}" class="${this.quality === value ? 'active' : ''}">
        ${this.t(value === 'auto' ? 'qualityAuto' : value === 'high' ? 'qualityHigh' : 'qualityLow')}
      </button>
    `;
    const html = `
      <span class="modal-kicker">${this.t('settingsKicker')}</span>
      <h2>${this.t('settingsTitle')}</h2>
      <p class="modal-desc">${this.t('settingsDesc')}</p>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-copy"><strong>${this.t('sound')}</strong><span>${this.t('soundSub')}</span></div>
          <button type="button" class="switch ${this.sound ? 'on' : ''}" data-toggle="sound" aria-label="${this.t('sound')}" aria-pressed="${this.sound}"></button>
        </div>
        <div class="settings-row">
          <div class="settings-copy"><strong>${this.t('music')}</strong><span>${this.t('musicSub')}</span></div>
          <button type="button" class="switch ${this.music ? 'on' : ''}" data-toggle="music" aria-label="${this.t('music')}" aria-pressed="${this.music}"></button>
        </div>
        <div class="settings-row">
          <div class="settings-copy"><strong>${this.t('quality')}</strong><span>${this.t('qualitySub')}</span></div>
          <div class="segmented">
            ${qualityButton('auto')}${qualityButton('high')}${qualityButton('low')}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-copy"><strong>${this.t('language')}</strong><span>${this.t('languageSub')}</span></div>
          <div class="segmented">
            <button type="button" data-lang="es" class="${this.lang === 'es' ? 'active' : ''}">ES</button>
            <button type="button" data-lang="en" class="${this.lang === 'en' ? 'active' : ''}">EN</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-secondary" id="settings-reset-best">${this.t('resetBest')}</button>
        <button class="modal-primary" id="modal-settings-close">${this.t('gotIt')}</button>
      </div>
    `;
    this.openModal(html, 'settings');
    const content = this.refs.modal;
    content.querySelectorAll('[data-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.toggle;
        if (key === 'sound') {
          this.sound = !this.sound;
          this.audio.setEnabled(this.sound);
        } else {
          this.music = !this.music;
          this.audio.setMusic(this.music);
        }
        button.classList.toggle('on', key === 'sound' ? this.sound : this.music);
        button.setAttribute('aria-pressed', String(key === 'sound' ? this.sound : this.music));
        this.saveStorage();
        this.audio.click();
      });
    });
    content.querySelectorAll('[data-quality]').forEach((button) => {
      button.addEventListener('click', () => {
        this.quality = button.dataset.quality;
        this.game.applyQuality(this.quality);
        content.querySelectorAll('[data-quality]').forEach((item) => {
          item.classList.toggle('active', item.dataset.quality === this.quality);
        });
        this.saveStorage();
        this.audio.click();
      });
    });
    content.querySelectorAll('[data-lang]').forEach((button) => {
      button.addEventListener('click', () => {
        this.setLanguage(button.dataset.lang);
        this.audio.click();
      });
    });
    content.querySelector('#settings-reset-best')?.addEventListener('click', () => {
      this.best = 0;
      this.saveStorage();
      this.updateBest();
      this.showToast(this.t('resetOk'), '');
      this.audio.click();
    });
    content.querySelector('#modal-settings-close')?.addEventListener('click', () => this.closeModal(true));
  }

  showPrivacy() {
    const html = `
      <span class="modal-kicker">${this.t('privacyKicker')}</span>
      <h2>${this.t('privacyTitle')}</h2>
      <p class="privacy-copy">${this.t('privacyText')}</p>
      <p class="privacy-copy">${this.t('privacyText2')}</p>
      <div class="modal-actions">
        <button class="modal-primary" id="modal-privacy-close">${this.t('close')}</button>
      </div>
    `;
    this.openModal(html, 'privacy');
    this.refs.modal.querySelector('#modal-privacy-close')?.addEventListener('click', () => this.closeModal(true));
  }

  showDeath(data) {
    const isRecord = data.score > this.best && data.score > 0;
    if (isRecord) {
      this.best = data.score;
      this.saveStorage();
      this.updateBest();
      this.showToast(this.t('recordToast'), 'gold');
    }
    const html = `
      <div class="death-card">
        <span class="modal-kicker">${this.t('deathKicker')}</span>
        <h2>${this.t('deathTitle')}</h2>
        <p class="modal-desc">${this.t('deathDesc')}</p>
        ${isRecord ? `<span class="record-badge">${heartIcon} ${this.t('newRecord')}</span>` : ''}
        <div class="death-label">${this.t('deathScoreLabel')}</div>
        <div class="death-score">${this.format(data.score)}</div>
        <div class="death-stats">
          <div class="death-stat"><strong>${this.format(this.best)}</strong><span>${this.t('deathBest')}</span></div>
          <div class="death-stat"><strong>${data.length}</strong><span>${this.t('deathLength')}</span></div>
          <div class="death-stat"><strong>#${data.rank}</strong><span>${this.t('deathRank')}</span></div>
        </div>
        <div class="modal-actions">
          <button class="modal-primary" id="death-respawn">${this.t('respawn')}</button>
          <button class="modal-secondary" id="death-menu">${this.t('toMenu')}</button>
        </div>
      </div>
    `;
    this.openModal(html, 'death', false);
    this.refs.modal.querySelector('#death-respawn')?.addEventListener('click', () => {
      this.closeModal(true);
      this.game.respawn();
    });
    this.refs.modal.querySelector('#death-menu')?.addEventListener('click', () => {
      this.closeModal(true);
      this.game.showMenu();
    });
  }

  setLanguage(lang) {
    this.lang = lang === 'en' ? 'en' : 'es';
    this.saveStorage();
    this.applyLanguage();
    this.updateBest();
    this.updateMenuTop();
    if (this.modalKind === 'settings') this.showSettings();
    else if (this.modalKind === 'how') this.showHow();
    else if (this.modalKind === 'privacy') this.showPrivacy();
    else if (this.modalKind === 'pause') this.showPause();
  }

  showToast(text, tone = '') {
    this.refs.toast.textContent = text;
    this.refs.toast.className = `toast show ${tone}`.trim();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.refs.toast.classList.remove('show');
    }, 1900);
  }

  onEat(data) {
    const color = colorToCss(data.color);
    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = `+${data.value}`;
    const spread = data.kind === 'heart' ? 46 : 26;
    pop.style.left = `${window.innerWidth / 2 + (Math.random() - 0.5) * spread}px`;
    pop.style.top = `${window.innerHeight * (window.innerWidth < 720 ? 0.58 : 0.55) + (Math.random() - 0.5) * 30}px`;
    pop.style.setProperty('--pop-color', color);
    if (data.kind === 'heart') pop.style.fontSize = '30px';
    this.refs.popLayer.appendChild(pop);
    while (this.refs.popLayer.children.length > 18) this.refs.popLayer.firstElementChild.remove();
    setTimeout(() => pop.remove(), 950);
  }

  updateHud(hud) {
    if (hud.score !== this.lastScore) {
      if (hud.score > this.lastScore) {
        this.refs.score.classList.remove('bump');
        void this.refs.score.offsetWidth;
        this.refs.score.classList.add('bump');
      }
      this.lastScore = hud.score;
      this.refs.score.textContent = this.format(hud.score);
    }
    this.refs.length.textContent = hud.length;
    this.refs.rankBadge.textContent = `#${hud.rank}`;
    this.refs.boost.style.setProperty('--boost', Math.max(0, Math.min(100, hud.boost)));
    const showCombo = hud.combo > 1;
    this.refs.combo.classList.toggle('visible', showCombo);
    if (showCombo) this.refs.combo.textContent = `x${hud.combo}`;
  }

  renderLeaderboard(hud) {
    const entries = hud.leaderboard.slice(0, 5);
    if (!entries.some((entry) => entry.isPlayer) && hud.alive) {
      entries.push({
        name: this.game.player.name,
        score: Math.floor(this.game.player.score),
        color: this.game.player.skin.main,
        isPlayer: true,
        rank: hud.rank
      });
    }
    this.refs.leaderboard.innerHTML = entries.map((entry) => `
      <li class="lb-row ${entry.isPlayer ? 'me' : ''}">
        <span class="lb-rank">#${entry.rank}</span>
        <span class="lb-name"><span class="lb-dot" style="--dot:${entry.color}"></span>${escapeHtml(entry.name)}</span>
        <span class="lb-score">${this.format(entry.score)}</span>
      </li>
    `).join('');
  }

  renderMinimap(hud) {
    const canvas = this.refs.minimap;
    const ctx = this.minimapContext;
    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 9;
    const scale = radius / ARENA_RADIUS;
    ctx.clearRect(0, 0, size, size);

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff5f8f';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    hud.worms.forEach((worm) => {
      const x = center + worm.x * scale;
      const y = center + worm.z * scale;
      if (worm.isPlayer) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.26;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 3.4, 0, Math.PI * 2);
        ctx.fillStyle = colorToCss(worm.color);
        ctx.fill();
      }
    });
  }

  tick(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const state = this.game.state;
    if (state === 'playing' || state === 'paused' || state === 'dead') {
      const hud = this.game.getHudState();
      this.updateHud(hud);
      if (now - this.lastLeaderboard > 240) {
        this.renderLeaderboard(hud);
        this.lastLeaderboard = now;
      }
      if (now - this.lastMinimap > 80) {
        this.renderMinimap(hud);
        this.lastMinimap = now;
      }
    } else if (state === 'menu' && now - this.menuTimer > 1800) {
      this.menuTimer = now;
      this.updateMenuTop();
      this.updateBest();
    }
    void dt;
    requestAnimationFrame(this.tick);
  }
}
