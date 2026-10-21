(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const stage = document.getElementById("stage");
  const ctx = canvas.getContext("2d");

  const ui = {
    startOverlay: document.getElementById("startOverlay"),
    pauseOverlay: document.getElementById("pauseOverlay"),
    gameOverOverlay: document.getElementById("gameOverOverlay"),
    startButton: document.getElementById("startButton"),
    resumeButton: document.getElementById("resumeButton"),
    playAgainButton: document.getElementById("playAgainButton"),
    pauseRestartButton: document.getElementById("pauseRestartButton"),
    restartSideButton: document.getElementById("restartSideButton"),
    soundButton: document.getElementById("soundButton"),
    statusLabel: document.getElementById("statusLabel"),
    statusDot: document.getElementById("statusDot"),
    scoreValue: document.getElementById("scoreValue"),
    highValue: document.getElementById("highValue"),
    levelValue: document.getElementById("levelValue"),
    bigScore: document.getElementById("bigScore"),
    bigHigh: document.getElementById("bigHigh"),
    comboLabel: document.getElementById("comboLabel"),
    multiplier: document.getElementById("multiplier"),
    comboFill: document.getElementById("comboFill"),
    comboBadge: document.getElementById("comboBadge"),
    comboBadgeValue: document.getElementById("comboBadgeValue"),
    readyHint: document.getElementById("readyHint"),
    levelBadge: document.getElementById("levelBadge"),
    levelProgress: document.getElementById("levelProgress"),
    progressDots: Array.from(document.querySelectorAll("#progressDots span")),
    speedFill: document.getElementById("speedFill"),
    speedLabel: document.getElementById("speedLabel"),
    bestInline: document.getElementById("bestInline"),
    emblemHigh: document.getElementById("emblemHigh"),
    finalScore: document.getElementById("finalScore"),
    finalHigh: document.getElementById("finalHigh"),
    finalFood: document.getElementById("finalFood"),
    newRecord: document.getElementById("newRecord"),
    levelToast: document.getElementById("levelToast"),
    levelToastValue: document.getElementById("levelToastValue"),
    liveRegion: document.getElementById("liveRegion")
  };

  const STORAGE_KEY = "neon-serpent-record-v1";
  const SOUND_KEY = "neon-serpent-sound-v1";
  const BASE_TICK = 146;
  const MIN_TICK = 66;
  const COMBO_WINDOW = 4.5;
  const MAX_LEVEL_SPEED = 11;
  const TAU = Math.PI * 2;

  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const MOTES = Array.from({ length: 34 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.5 + Math.random() * 1.2,
    phase: Math.random() * TAU,
    speed: 0.22 + Math.random() * 0.5,
    drift: 3 + Math.random() * 8,
    color: Math.random() > 0.56 ? "185, 255, 99" : "68, 232, 204"
  }));

  const KEY_DIRECTIONS = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right"
  };

  let grid = { cols: 30, rows: 20, cellW: 30, cellH: 30 };
  let view = { w: 0, h: 0, dpr: 1 };
  let state = "idle";
  let roundActive = false;
  let score = 0;
  let highScore = readNumber(STORAGE_KEY);
  let foodCount = 0;
  let level = 1;
  let combo = 0;
  let comboTimer = 0;
  let snake = [];
  let previousSnake = [];
  let direction = { ...DIRECTIONS.right };
  let directionQueue = [];
  let food = null;
  let particles = [];
  let ripples = [];
  let floaters = [];
  let tickAccumulator = 0;
  let tickProgress = 0;
  let lastFrame = 0;
  let shake = 0;
  let flash = 0;
  let flashColor = "185, 255, 99";
  let overlayTimer = 0;
  let toastTimer = 0;
  let bumpTimer = 0;
  let isNewRecord = false;
  let resizeFrame = 0;

  const Sound = {
    context: null,
    master: null,
    muted: readSoundPreference(),

    init() {
      if (this.context) {
        if (this.context.state === "suspended") this.context.resume().catch(() => {});
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.16;
      this.master.connect(this.context.destination);
    },

    setMuted(value) {
      this.muted = value;
      if (this.master && this.context) {
        const now = this.context.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(value ? 0 : 0.16, now, 0.02);
      }
      try {
        localStorage.setItem(SOUND_KEY, value ? "off" : "on");
      } catch {}
      ui.soundButton.classList.toggle("is-muted", value);
      ui.soundButton.setAttribute("aria-pressed", String(!value));
      ui.soundButton.setAttribute("aria-label", value ? "Activar sonido" : "Silenciar sonido");
      ui.soundButton.title = value ? "Activar sonido" : "Silenciar sonido";
    },

    tone(frequency, duration, options = {}) {
      if (!this.context || this.muted) return;
      const { type = "sine", volume = 0.22, endFrequency = frequency, delay = 0 } = options;
      const start = this.context.currentTime + delay;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      if (endFrequency !== frequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    },

    play(name) {
      if (!this.context || this.muted) return;
      if (name === "start") {
        [392, 523.25, 659.25].forEach((frequency, index) => {
          this.tone(frequency, 0.17, { type: "triangle", volume: 0.22, delay: index * 0.07 });
        });
      } else if (name === "eat") {
        this.tone(620, 0.1, { type: "sine", volume: 0.2, endFrequency: 880 });
        this.tone(930, 0.13, { type: "triangle", volume: 0.13, delay: 0.045, endFrequency: 1120 });
      } else if (name === "gold") {
        [660, 880, 1100, 1320].forEach((frequency, index) => {
          this.tone(frequency, 0.14, { type: "triangle", volume: 0.16, delay: index * 0.055 });
        });
      } else if (name === "level") {
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
          this.tone(frequency, 0.2, { type: "sine", volume: 0.16, delay: index * 0.065 });
        });
      } else if (name === "pause") {
        this.tone(440, 0.08, { type: "sine", volume: 0.12, endFrequency: 330 });
      } else if (name === "resume") {
        this.tone(330, 0.09, { type: "sine", volume: 0.12, endFrequency: 520 });
      } else if (name === "over") {
        this.tone(240, 0.6, { type: "sawtooth", volume: 0.16, endFrequency: 54 });
        this.tone(118, 0.55, { type: "triangle", volume: 0.14, delay: 0.06, endFrequency: 42 });
      } else if (name === "click") {
        this.tone(520, 0.045, { type: "sine", volume: 0.08, endFrequency: 640 });
      }
    }
  };

  function readNumber(key) {
    try {
      const value = Number.parseInt(localStorage.getItem(key) || "0", 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
      return 0;
    }
  }

  function readSoundPreference() {
    try {
      return localStorage.getItem(SOUND_KEY) === "off";
    } catch {
      return false;
    }
  }

  function formatScore(value) {
    return String(Math.max(0, value)).padStart(4, "0");
  }

  function formatLong(value) {
    return Math.max(0, value).toLocaleString("es-ES");
  }

  function padLevel(value) {
    return String(value).padStart(2, "0");
  }

  function sameCell(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  function cellKey(cell) {
    return `${cell.x}:${cell.y}`;
  }

  function currentTick() {
    return Math.max(MIN_TICK, BASE_TICK - (level - 1) * 8);
  }

  function centerOf(cell) {
    return {
      x: (cell.x + 0.5) * grid.cellW,
      y: (cell.y + 0.5) * grid.cellH
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createGrid(width, height) {
    const target = width < 620 ? 25 : 34;
    const cols = clamp(Math.round(width / target), 16, 38);
    const rows = clamp(Math.round(height / target), 14, 27);
    return {
      cols,
      rows,
      cellW: width / cols,
      cellH: height / rows
    };
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    view = { w: rect.width, h: rect.height, dpr };
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    grid = createGrid(rect.width, rect.height);
    if (state === "idle") {
      placeIdleSnake();
    } else {
      grid.cellW = rect.width / grid.cols;
      grid.cellH = rect.height / grid.rows;
    }
  }

  function scheduleResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
    });
  }

  function buildSnake() {
    const headX = Math.floor(grid.cols * 0.46);
    const headY = Math.floor(grid.rows * 0.5);
    const body = [];
    for (let index = 0; index < 5; index += 1) {
      body.push({ x: headX - index, y: headY });
    }
    return body;
  }

  function placeIdleSnake() {
    snake = buildSnake();
    previousSnake = snake.map((cell) => ({ ...cell }));
    food = findFreeFoodCell();
    food.phase = Math.random() * TAU;
    food.born = performance.now() / 1000;
    direction = { ...DIRECTIONS.right };
    directionQueue = [];
    tickProgress = 0;
    particles = [];
    ripples = [];
    floaters = [];
  }

  function findFreeFoodCell() {
    const occupied = new Set(snake.map(cellKey));
    if (food) occupied.add(cellKey(food));
    const available = [];
    for (let y = 0; y < grid.rows; y += 1) {
      for (let x = 0; x < grid.cols; x += 1) {
        if (!occupied.has(`${x}:${y}`)) available.push({ x, y });
      }
    }
    if (!available.length) return { x: 1, y: 1 };
    return available[Math.floor(Math.random() * available.length)];
  }

  function spawnFood() {
    const cell = findFreeFoodCell();
    const type = (foodCount + 1) % 6 === 0 ? "gold" : "normal";
    food = {
      ...cell,
      type,
      phase: Math.random() * TAU,
      born: performance.now() / 1000
    };
    const center = centerOf(cell);
    ripples.push({
      x: center.x,
      y: center.y,
      radius: Math.min(grid.cellW, grid.cellH) * 0.15,
      maxRadius: Math.min(grid.cellW, grid.cellH) * 1.3,
      life: 0.55,
      maxLife: 0.55,
      color: type === "gold" ? "255, 184, 77" : "110, 255, 172"
    });
  }

  function resetRound() {
    clearTimeout(overlayTimer);
    grid = createGrid(view.w, view.h);
    snake = buildSnake();
    previousSnake = snake.map((cell) => ({ ...cell }));
    direction = { ...DIRECTIONS.right };
    directionQueue = [];
    score = 0;
    foodCount = 0;
    level = 1;
    combo = 0;
    comboTimer = 0;
    tickAccumulator = 0;
    tickProgress = 0;
    particles = [];
    ripples = [];
    floaters = [];
    shake = 0;
    flash = 0;
    isNewRecord = false;
    food = null;
    spawnFood();
    state = "playing";
    roundActive = false;
    hideOverlays();
    syncReadyHint();
    updateHud();
    updateStatus("ELIGE DIRECCIÓN", "");
    Sound.init();
    Sound.play("start");
    lastFrame = performance.now();
    announce("Partida iniciada. Desliza o usa las flechas para mover la serpiente.");
  }

  function startGame() {
    if (state === "playing" || state === "paused") return;
    resetRound();
  }

  function playAgain() {
    clearTimeout(overlayTimer);
    resetRound();
  }

  function restartGame() {
    Sound.init();
    Sound.play("click");
    resetRound();
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    clearTimeout(overlayTimer);
    ui.readyHint.hidden = true;
    ui.pauseOverlay.hidden = false;
    updateStatus("PAUSA ACTIVA", "is-paused");
    ui.statusDot.classList.add("is-paused");
    Sound.play("pause");
    announce("Juego en pausa.");
  }

  function resumeGame() {
    if (state !== "paused") return;
    state = "playing";
    ui.pauseOverlay.hidden = true;
    syncReadyHint();
    updateStatus(roundActive ? "EN JUEGO" : "ELIGE DIRECCIÓN", "");
    lastFrame = performance.now();
    Sound.play("resume");
    announce("Partida reanudada.");
  }

  function togglePause() {
    if (state === "playing") pauseGame();
    else if (state === "paused") resumeGame();
  }

  function hideOverlays() {
    ui.startOverlay.hidden = true;
    ui.pauseOverlay.hidden = true;
    ui.gameOverOverlay.hidden = true;
  }

  function syncReadyHint() {
    ui.readyHint.hidden = !(state === "playing" && !roundActive);
  }

  function updateStatus(label, dotClass) {
    ui.statusLabel.textContent = label;
    ui.statusDot.className = "status-dot";
    if (dotClass) ui.statusDot.classList.add(dotClass);
  }

  function announce(message) {
    ui.liveRegion.textContent = "";
    window.setTimeout(() => {
      ui.liveRegion.textContent = message;
    }, 30);
  }

  function queueDirection(name) {
    if (state === "over") return;
    const next = DIRECTIONS[name];
    if (!next) return;
    if (state === "idle") startGame();
    if (state !== "playing") return;
    if (!roundActive) {
      roundActive = true;
      lastFrame = performance.now();
      tickAccumulator = 0;
      syncReadyHint();
      updateStatus("EN JUEGO", "");
    }
    const reference = directionQueue.length ? directionQueue[directionQueue.length - 1] : direction;
    if (next.x === reference.x && next.y === reference.y) return;
    if (next.x === -reference.x && next.y === -reference.y) return;
    if (directionQueue.length >= 2) directionQueue.shift();
    directionQueue.push(next);
  }

  function tick() {
    if (directionQueue.length) {
      const next = directionQueue.shift();
      if (!(next.x === -direction.x && next.y === -direction.y)) {
        direction = next;
      }
    }

    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
    const willEat = sameCell(nextHead, food);
    const hitsWall =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= grid.cols ||
      nextHead.y >= grid.rows;

    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    const hitsBody = bodyToCheck.some((cell) => sameCell(cell, nextHead));

    if (hitsWall || hitsBody) {
      gameOver(nextHead);
      return;
    }

    previousSnake = snake.map((cell) => ({ ...cell }));
    snake.unshift(nextHead);

    if (willEat) {
      consumeFood();
    } else {
      snake.pop();
    }

    tickProgress = 0;
  }

  function consumeFood() {
    const center = centerOf(food);
    const wasGold = food.type === "gold";
    foodCount += 1;
    combo = comboTimer > 0 ? combo + 1 : 1;
    comboTimer = COMBO_WINDOW;
    const multiplier = Math.min(5, combo);
    const base = wasGold ? 30 : 10;
    const gained = base * multiplier;
    score += gained;
    const previousLevel = level;
    level = 1 + Math.floor(foodCount / 5);

    burst(center.x, center.y, wasGold ? 28 : 18, wasGold);
    floaters.push({
      x: center.x,
      y: center.y,
      text: `+${gained}`,
      life: 0.9,
      maxLife: 0.9,
      color: wasGold ? "255, 193, 96" : "192, 255, 116",
      size: wasGold ? 18 : 15
    });

    if (multiplier > 1) {
      floaters.push({
        x: center.x,
        y: center.y - grid.cellH * 0.55,
        text: `x${multiplier}`,
        life: 1.1,
        maxLife: 1.1,
        color: "255, 157, 92",
        size: 12
      });
    }

    shake = Math.min(8, shake + (wasGold ? 5 : 3));
    flash = wasGold ? 0.3 : 0.16;
    flashColor = wasGold ? "255, 184, 77" : "185, 255, 99";
    Sound.play(wasGold ? "gold" : "eat");
    vibrate(wasGold ? 22 : 12);

    if (level > previousLevel) {
      showLevelToast();
      Sound.play("level");
      vibrate([14, 40, 20]);
      announce(`Nivel ${level}. La velocidad aumenta.`);
    }

    spawnFood();
    updateHud(true);
  }

  function showLevelToast() {
    ui.levelToastValue.textContent = `NIVEL ${padLevel(level)}`;
    ui.levelToast.classList.remove("is-visible");
    void ui.levelToast.offsetWidth;
    ui.levelToast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      ui.levelToast.classList.remove("is-visible");
    }, 2200);
  }

  function gameOver(head) {
    state = "over";
    roundActive = false;
    ui.readyHint.hidden = true;
    const headCenter = centerOf({
      x: clamp(head.x, 0, grid.cols - 1),
      y: clamp(head.y, 0, grid.rows - 1)
    });
    shake = 16;
    flash = 0.55;
    flashColor = "255, 93, 77";
    combo = 0;
    comboTimer = 0;
    burst(headCenter.x, headCenter.y, 34, false, true);
    Sound.play("over");
    vibrate([35, 60, 45]);
    isNewRecord = score > highScore;
    if (isNewRecord) {
      highScore = score;
      try {
        localStorage.setItem(STORAGE_KEY, String(highScore));
      } catch {}
    }
    ui.finalScore.textContent = formatLong(score);
    ui.finalHigh.textContent = formatLong(highScore);
    ui.finalFood.textContent = formatLong(foodCount);
    ui.newRecord.hidden = !isNewRecord;
    updateHud();
    updateStatus("SEÑAL PERDIDA", "is-over");
    announce(`Fin del juego. Puntuación ${score}. Récord ${highScore}.`);
    overlayTimer = window.setTimeout(() => {
      if (state === "over") ui.gameOverOverlay.hidden = false;
    }, 480);
  }

  function updateHud(bump = false) {
    const tick = currentTick();
    const speed = clamp(BASE_TICK / tick, 1, 3.2);
    const multiplier = Math.min(5, Math.max(1, combo));
    const progress = foodCount % 5;
    const speedPercent = clamp(((BASE_TICK - tick) / (BASE_TICK - MIN_TICK)) * 100, 0, 100);

    ui.scoreValue.textContent = formatScore(score);
    ui.highValue.textContent = formatScore(highScore);
    ui.levelValue.textContent = padLevel(level);
    ui.bigScore.textContent = formatLong(score);
    ui.bigHigh.textContent = formatLong(highScore);
    ui.bestInline.textContent = formatLong(highScore);
    ui.emblemHigh.textContent = formatLong(highScore);
    ui.levelBadge.textContent = `NIVEL ${padLevel(level)}`;
    ui.levelProgress.textContent = `${progress} / 5`;
    ui.speedLabel.textContent = `${speed.toFixed(1)}x`;
    ui.speedFill.style.width = `${speedPercent}%`;

    ui.progressDots.forEach((dot, index) => {
      dot.classList.toggle("is-filled", index < progress);
    });

    if (combo >= 2) {
      ui.comboLabel.textContent = `COMBO x${multiplier}`;
      ui.comboLabel.parentElement.classList.add("is-active");
      ui.multiplier.textContent = `x${multiplier}`;
      ui.comboBadge.classList.add("is-visible");
      ui.comboBadgeValue.textContent = `x${multiplier}`;
    } else {
      ui.comboLabel.textContent = "SIN COMBO";
      ui.comboLabel.parentElement.classList.remove("is-active");
      ui.multiplier.textContent = "x1";
      ui.comboBadge.classList.remove("is-visible");
    }
    ui.comboFill.style.width = `${comboTimer > 0 ? (comboTimer / COMBO_WINDOW) * 100 : 0}%`;

    if (bump) {
      ui.bigScore.classList.add("is-bumping");
      clearTimeout(bumpTimer);
      bumpTimer = window.setTimeout(() => {
        ui.bigScore.classList.remove("is-bumping");
      }, 150);
    }
  }

  function burst(x, y, count, gold = false, death = false) {
    const palette = death
      ? ["255, 109, 93", "255, 157, 92", "255, 226, 154"]
      : gold
        ? ["255, 184, 77", "255, 223, 128", "255, 143, 60"]
        : ["185, 255, 99", "68, 232, 204", "224, 255, 171"];

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * TAU;
      const speed = (40 + Math.random() * 170) * (death ? 1.2 : 1);
      const life = 0.35 + Math.random() * 0.55;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.3 + Math.random() * 2.8,
        life,
        maxLife: life,
        color: palette[Math.floor(Math.random() * palette.length)],
        drag: 2.4 + Math.random() * 2.4
      });
    }
  }

  function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function updateEffects(dt) {
    shake = Math.max(0, shake - dt * 26);
    flash = Math.max(0, flash - dt * 2.7);

    particles = particles.filter((particle) => {
      particle.life -= dt;
      if (particle.life <= 0) return false;
      const drag = Math.max(0, 1 - particle.drag * dt);
      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      return true;
    });

    ripples = ripples.filter((ripple) => {
      ripple.life -= dt;
      if (ripple.life <= 0) return false;
      const progress = 1 - ripple.life / ripple.maxLife;
      ripple.radius = lerp(ripple.radius, ripple.maxRadius, progress * 0.2 + 0.04);
      return true;
    });

    floaters = floaters.filter((floater) => {
      floater.life -= dt;
      floater.y -= dt * 26;
      return floater.life > 0;
    });
  }

  function frameStripes(time) {
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = "rgba(185, 255, 99, 0.5)";
    ctx.lineWidth = 1;
    const offset = (time * 8) % 42;
    ctx.beginPath();
    for (let y = -42 + offset; y < view.h; y += 42) {
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of MOTES) {
      const x = ((mote.x * view.w + time * mote.drift + Math.sin(time * mote.speed + mote.phase) * 16) % (view.w + 30)) - 15;
      const y = mote.y * view.h + Math.cos(time * mote.speed * 0.8 + mote.phase) * 9;
      const alpha = 0.1 + (0.5 + 0.5 * Math.sin(time * 0.9 + mote.phase)) * 0.2;
      ctx.fillStyle = `rgba(${mote.color}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, mote.size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBackground(time) {
    const base = ctx.createLinearGradient(0, 0, view.w, view.h);
    base.addColorStop(0, "#08110e");
    base.addColorStop(0.48, "#050b0a");
    base.addColorStop(1, "#071010");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, view.w, view.h);

    const glow = ctx.createRadialGradient(
      view.w * 0.5,
      view.h * 0.48,
      0,
      view.w * 0.5,
      view.h * 0.48,
      view.w * 0.66
    );
    glow.addColorStop(0, "rgba(63, 132, 66, 0.11)");
    glow.addColorStop(0.5, "rgba(18, 68, 58, 0.034)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, view.w, view.h);

    drawMotes(time);

    ctx.save();
    ctx.strokeStyle = "rgba(165, 255, 150, 0.068)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < grid.cols; x += 1) {
      const px = Math.round(x * grid.cellW) + 0.5;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, view.h);
    }
    for (let y = 1; y < grid.rows; y += 1) {
      const py = Math.round(y * grid.cellH) + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(view.w, py);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(185, 255, 99, 0.22)";
    for (let y = 1; y < grid.rows; y += 1) {
      for (let x = 1; x < grid.cols; x += 1) {
        if ((x + y) % 2 !== 0) continue;
        ctx.fillRect(x * grid.cellW - 0.7, y * grid.cellH - 0.7, 1.4, 1.4);
      }
    }
    ctx.restore();

    frameStripes(time);

    const vignette = ctx.createRadialGradient(
      view.w / 2,
      view.h / 2,
      Math.min(view.w, view.h) * 0.18,
      view.w / 2,
      view.h / 2,
      Math.max(view.w, view.h) * 0.75
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.39)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  function drawRipples() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ripple of ripples) {
      const progress = 1 - ripple.life / ripple.maxLife;
      ctx.globalAlpha = (1 - progress) * 0.4;
      ctx.strokeStyle = `rgba(${ripple.color}, 0.8)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFood(time) {
    if (!food) return;
    const center = centerOf(food);
    const unit = Math.min(grid.cellW, grid.cellH);
    const gold = food.type === "gold";
    const pulse = 1 + Math.sin(time * 4.2 + food.phase) * 0.09;
    const radius = unit * (gold ? 0.4 : 0.34) * pulse;
    const coreColor = gold ? "#ffd36f" : "#b9ff63";
    const edgeColor = gold ? "#ff9d3f" : "#44e8cc";
    const glowColor = gold ? "255, 174, 61" : "99, 255, 163";

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.globalCompositeOperation = "lighter";

    const aura = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, unit * 1.15);
    aura.addColorStop(0, `rgba(${glowColor}, ${gold ? 0.32 : 0.24})`);
    aura.addColorStop(0.42, `rgba(${glowColor}, 0.1)`);
    aura.addColorStop(1, `rgba(${glowColor}, 0)`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, unit * 1.15, 0, TAU);
    ctx.fill();

    ctx.rotate(time * (gold ? 1.15 : 0.65) + food.phase);
    ctx.strokeStyle = `rgba(${glowColor}, 0.36)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, unit * 0.5, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalCompositeOperation = "source-over";
    const body = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius);
    body.addColorStop(0, "#ffffff");
    body.addColorStop(0.2, coreColor);
    body.addColorStop(0.78, edgeColor);
    body.addColorStop(1, gold ? "#b05c1d" : "#168d7d");
    ctx.fillStyle = body;
    ctx.shadowColor = `rgba(${glowColor}, 0.9)`;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = gold ? "rgba(255, 239, 184, 0.72)" : "rgba(232, 255, 225, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, -0.8, 0.95);
    ctx.stroke();

    if (gold) {
      ctx.fillStyle = "rgba(255, 246, 203, 0.95)";
      ctx.beginPath();
      ctx.moveTo(0, -unit * 0.68);
      ctx.lineTo(unit * 0.07, -unit * 0.44);
      ctx.lineTo(unit * 0.3, -unit * 0.38);
      ctx.lineTo(unit * 0.1, -unit * 0.2);
      ctx.lineTo(unit * 0.12, unit * 0.02);
      ctx.lineTo(0, -unit * 0.12);
      ctx.lineTo(-unit * 0.12, unit * 0.02);
      ctx.lineTo(-unit * 0.1, -unit * 0.2);
      ctx.lineTo(-unit * 0.3, -unit * 0.38);
      ctx.lineTo(-unit * 0.07, -unit * 0.44);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function interpolatedSnake() {
    const progress = state === "playing" ? clamp(tickProgress, 0, 1) : state === "paused" ? 1 : 1;
    return snake.map((cell, index) => {
      const previous = previousSnake[index] || cell;
      const from = centerOf(previous);
      const to = centerOf(cell);
      return {
        x: lerp(from.x, to.x, progress),
        y: lerp(from.y, to.y, progress)
      };
    });
  }

  function traceSnake(points) {
    ctx.beginPath();
    if (!points.length) return;
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
      return;
    }
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function drawSnake(time) {
    if (!snake.length) return;
    const points = interpolatedSnake();
    const unit = Math.min(grid.cellW, grid.cellH);
    const lineWidth = unit * 0.7;
    const head = points[0];
    const tail = points[points.length - 1];

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    gradient.addColorStop(0, "#d9ff6b");
    gradient.addColorStop(0.28, "#a9ff61");
    gradient.addColorStop(0.7, "#55e5a7");
    gradient.addColorStop(1, "#1aa69f");

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(127, 255, 96, 0.13)";
    ctx.lineWidth = lineWidth * 1.85;
    ctx.shadowColor = "rgba(125, 255, 94, 0.48)";
    ctx.shadowBlur = 18;
    traceSnake(points);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    traceSnake(points);
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(235, 255, 218, 0.2)";
    ctx.lineWidth = Math.max(2, lineWidth * 0.18);
    traceSnake(points);
    ctx.stroke();

    for (let index = 1; index < points.length - 1; index += 1) {
      if (index % 2 !== 0) continue;
      const point = points[index];
      ctx.fillStyle = "rgba(6, 38, 28, 0.18)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, lineWidth * 0.18, 0, TAU);
      ctx.fill();
    }

    drawHead(head, points[1] || head, unit, time);
    ctx.restore();
  }

  function drawHead(head, neck, unit, time) {
    const angle = Math.atan2(head.y - neck.y, head.x - neck.x) || 0;
    const radius = unit * 0.44;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);

    const headGradient = ctx.createRadialGradient(-radius * 0.24, -radius * 0.3, radius * 0.1, 0, 0, radius * 1.15);
    headGradient.addColorStop(0, "#f3ffd0");
    headGradient.addColorStop(0.35, "#cfff73");
    headGradient.addColorStop(1, "#79ec78");

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(151, 255, 104, 0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.55, 0, TAU);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = headGradient;
    ctx.shadowColor = "rgba(141, 255, 103, 0.55)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(radius * 0.08, 0, radius * 1.04, radius * 0.92, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    const eyeX = radius * 0.45;
    const eyeY = radius * 0.43;
    const eyeRadius = Math.max(1.8, radius * 0.23);
    ctx.fillStyle = "#f6ffe8";
    ctx.beginPath();
    ctx.arc(eyeX, -eyeY, eyeRadius, 0, TAU);
    ctx.arc(eyeX, eyeY, eyeRadius, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#0a1810";
    const pupilOffset = eyeRadius * 0.35;
    ctx.beginPath();
    ctx.arc(eyeX + pupilOffset, -eyeY, eyeRadius * 0.48, 0, TAU);
    ctx.arc(eyeX + pupilOffset, eyeY, eyeRadius * 0.48, 0, TAU);
    ctx.fill();

    const tongue = (Math.sin(time * 4.8) + 1) * 0.5;
    if (tongue > 0.5) {
      ctx.strokeStyle = "#ff855f";
      ctx.lineWidth = Math.max(1, radius * 0.08);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(radius * 0.84, 0);
      ctx.lineTo(radius * (1.18 + tongue * 0.18), 0);
      ctx.lineTo(radius * (1.34 + tongue * 0.18), -radius * 0.1);
      ctx.moveTo(radius * 1.18, 0);
      ctx.lineTo(radius * 1.34, radius * 0.1);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${particle.color})`;
      ctx.shadowColor = `rgba(${particle.color}, 0.8)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (0.5 + alpha * 0.5), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const floater of floaters) {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${floater.color})`;
      ctx.font = `700 ${floater.size}px "Chakra Petch", sans-serif`;
      ctx.shadowColor = `rgba(${floater.color}, 0.65)`;
      ctx.shadowBlur = 12;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.restore();
  }

  function drawFlash() {
    if (flash <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(${flashColor}, ${flash * 0.13})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
  }

  function render(time) {
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    if (shake > 0.15) {
      const amount = shake;
      ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
    }
    drawBackground(time);
    if (state !== "idle") {
      drawRipples();
      drawFood(time);
      drawSnake(time);
      drawParticles();
      drawFloaters();
      drawFlash();
    }
    ctx.restore();
  }

  function loop(timestamp) {
    if (!lastFrame) lastFrame = timestamp;
    const dt = Math.min(0.05, Math.max(0, (timestamp - lastFrame) / 1000));
    lastFrame = timestamp;

    if (state === "playing" && roundActive) {
      if (comboTimer > 0) {
        comboTimer = Math.max(0, comboTimer - dt);
        if (comboTimer === 0 && combo > 0) {
          combo = 0;
          updateHud();
        } else {
          ui.comboFill.style.width = `${(comboTimer / COMBO_WINDOW) * 100}%`;
        }
      }

      tickAccumulator += dt * 1000;
      const interval = currentTick();
      while (tickAccumulator >= interval && state === "playing") {
        tickAccumulator -= interval;
        tick();
      }
      tickProgress = clamp(tickAccumulator / interval, 0, 1);
      updateEffects(dt);
    } else if (state === "over") {
      updateEffects(dt);
    } else if (state === "idle") {
      updateEffects(dt);
    }

    render(timestamp / 1000);
    requestAnimationFrame(loop);
  }

  ui.startButton.addEventListener("click", () => {
    Sound.init();
    Sound.play("click");
    startGame();
  });
  ui.resumeButton.addEventListener("click", () => {
    Sound.play("click");
    resumeGame();
  });
  ui.playAgainButton.addEventListener("click", () => {
    Sound.play("click");
    playAgain();
  });
  ui.pauseRestartButton.addEventListener("click", () => {
    Sound.play("click");
    restartGame();
  });
  ui.restartSideButton.addEventListener("click", () => {
    Sound.play("click");
    restartGame();
  });
  ui.soundButton.addEventListener("click", () => {
    Sound.init();
    Sound.setMuted(!Sound.muted);
    if (!Sound.muted) Sound.play("click");
  });

  document.querySelectorAll(".touch-controls button").forEach((button) => {
    button.addEventListener("click", () => {
      Sound.init();
      queueDirection(button.dataset.dir);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const directionName = KEY_DIRECTIONS[event.key];
    if (directionName) {
      event.preventDefault();
      Sound.init();
      queueDirection(directionName);
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      Sound.init();
      togglePause();
    } else if (event.key === "Escape") {
      togglePause();
    } else if (event.key === "Enter" && state === "idle") {
      event.preventDefault();
      Sound.init();
      startGame();
    } else if (event.key === "Enter" && state === "over") {
      event.preventDefault();
      playAgain();
    } else if ((event.key === "r" || event.key === "R") && (state === "over" || state === "paused")) {
      event.preventDefault();
      restartGame();
    }
  });

  let pointerStart = null;
  stage.addEventListener("pointerdown", (event) => {
    if (state !== "playing") return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    try {
      stage.setPointerCapture(event.pointerId);
    } catch {}
  });
  stage.addEventListener("pointerup", (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? "right" : "left");
    } else {
      queueDirection(dy > 0 ? "down" : "up");
    }
  });
  stage.addEventListener("pointercancel", () => {
    pointerStart = null;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") pauseGame();
  });

  new ResizeObserver(scheduleResize).observe(canvas);

  Sound.setMuted(Sound.muted);
  if (highScore > 0) updateHud();
  resizeCanvas();
  placeIdleSnake();
  updateHud();
  updateStatus("LISTO PARA JUGAR", "");
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => updateHud()).catch(() => {});
  }
  requestAnimationFrame(loop);

  window.__neonSerpent = {
    snapshot() {
      return {
        state,
        score,
        highScore,
        foodCount,
        level,
        combo,
        comboTimer,
        food: food ? { x: food.x, y: food.y, type: food.type } : null,
        snake: snake.map((cell) => ({ ...cell })),
        direction: { ...direction },
        cols: grid.cols,
        rows: grid.rows
      };
    },
    start: startGame,
    pause: pauseGame,
    resume: resumeGame,
    restart: restartGame,
    turn: queueDirection
  };
})();
