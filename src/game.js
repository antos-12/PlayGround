import * as THREE from "three";
import {
  ARENA_RADIUS,
  HEAD_RADIUS,
  MIN_BOOST_LENGTH,
  TAU,
  distanceSq,
  hitsCircle,
  randomPointInCircle,
  rankWorms,
  safeSpawnPoint,
} from "./logic.js";
import { BOT_NAMES, SKINS, getSkin, getTheme } from "./theme.js";
import { Worm } from "./worm.js";
import { World } from "./world.js";

const BOT_COUNT = 9;

export class Game {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.audio = options.audio;
    this.onHud = options.onHud || (() => {});
    this.onDeath = options.onDeath || (() => {});
    this.onToast = options.onToast || (() => {});
    this.elements = options.elements || {};
    this.theme = getTheme(options.theme || "love");
    this.quality = options.quality || "auto";
    this.world = new World(canvas, this.theme);
    this.scene = this.world.scene;

    this.state = "menu";
    this.time = 0;
    this.lastFrame = performance.now();
    this.lastHudAt = 0;
    this.lastMinimapAt = 0;
    this.trailTimer = 0;
    this.cameraMode = "orbit";
    this.cameraLook = new THREE.Vector3(0, 0, 0);
    this.cameraDesired = new THREE.Vector3();
    this.deathAt = 0;
    this.deathFocus = { x: 0, z: 0 };
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.9);
    this.pointerWorld = new THREE.Vector3();
    this.mouseDirection = { x: 0, z: -1 };
    this.keyboard = { up: false, down: false, left: false, right: false, boost: false };
    this.joyPointer = null;
    this.joyOrigin = null;
    this.joyTouch = false;
    this.boostPointers = new Set();
    this.mouseBoost = false;
    this.pointerInside = false;
    this.botRespawnTimers = [];
    this.playerStalled = true;
    this.invulnerableUntil = 0;

    this.player = new Worm(this.scene, {
      name: "Invitado",
      skin: getSkin("amor"),
      isPlayer: true,
    });
    this.player.removed = true;

    this.bots = [];
    for (let i = 0; i < BOT_COUNT; i += 1) {
      const worm = new Worm(this.scene, {
        name: BOT_NAMES[i % BOT_NAMES.length],
        skin: SKINS[(i + 1) % SKINS.length],
      });
      worm.removed = true;
      this.bots.push(worm);
      this.spawnBot(worm, i);
    }

    this.attachInput();
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setTheme(themeId) {
    this.theme = getTheme(themeId);
    this.world.setTheme(this.theme);
  }

  setSkin(skin) {
    this.player.setSkin(skin);
  }

  setPlayerName(name) {
    this.player.setName(name);
  }

  setQuality(quality) {
    this.quality = quality;
    this.world.setQuality(quality === "low" ? "low" : "high");
  }

  resize() {
    this.world.resize(window.innerWidth, window.innerHeight);
  }

  spawnBot(bot, index) {
    const avoid = this.bots
      .filter((other) => other !== bot && other.alive)
      .map((other) => ({ x: other.x, z: other.z }));
    if (this.player.alive) avoid.push({ x: this.player.x, z: this.player.z });
    const point = safeSpawnPoint(ARENA_RADIUS - 34, avoid);
    const length = 36 + Math.random() * 58;
    bot.spawn({ x: point.x, z: point.z, angle: Math.random() * TAU, length });
    bot.score = Math.round(length * 1.1 + Math.random() * 90);
    bot.aiTimer = 0;
    bot.aiTarget = null;
    bot.boostPlan = false;
    bot.respawnAt = 0;
    bot.removed = false;
    bot.alive = true;
  }

  startRun({ name, skin }) {
    this.player.setName(name);
    this.player.setSkin(skin || getSkin("amor"));
    const avoid = this.bots.filter((bot) => bot.alive).map((bot) => ({ x: bot.x, z: bot.z }));
    const point = safeSpawnPoint(ARENA_RADIUS - 44, avoid);
    this.player.spawn({ x: point.x, z: point.z, angle: Math.random() * TAU, length: 34 });
    this.player.score = 0;
    this.state = "playing";
    this.cameraMode = "follow";
    this.playerStalled = true;
    this.invulnerableUntil = this.time + 3;
    this.audio.spawn();
    this.releaseInputs();
    this.emitHud(true);
    this.onToast("Come corazones y hazte enorme");
  }

  respawn() {
    this.startRun({ name: this.player.name, skin: this.player.skin });
  }

  killBot(bot) {
    if (!bot.alive) return;
    bot.kill();
    bot.removed = true;
    this.world.sparkles.emit(bot.x, 1.1, bot.z, bot.skin.primary, 18, 4.5);
    bot.respawnAt = this.time + 1.8 + Math.random() * 2.4;
    if (this.state === "playing") {
      this.audio.bump();
    }
  }

  killPlayer(reason = "Otro gusano se cruzó en tu camino.") {
    if (this.state !== "playing" || !this.player.alive) return;
    const ranked = rankWorms([this.player, ...this.bots]);
    const rank = ranked.indexOf(this.player) + 1;
    const stats = {
      score: this.player.score,
      length: Math.round(this.player.length),
      rank: rank || ranked.length + 1,
      reason,
    };
    this.world.sparkles.emit(this.player.x, 1.2, this.player.z, this.player.skin.primary, 42, 7);
    this.world.sparkles.emit(this.player.x, 1.2, this.player.z, this.player.skin.secondary, 22, 5);
    this.player.kill();
    this.player.removed = true;
    this.state = "dead";
    this.deathAt = this.time;
    this.deathFocus.x = this.player.x;
    this.deathFocus.z = this.player.z;
    this.releaseInputs();
    this.audio.death();
    this.emitHud(true);
    this.onDeath(stats);
  }

  goMenu() {
    this.player.kill();
    this.player.removed = true;
    this.state = "menu";
    this.cameraMode = "orbit";
    this.releaseInputs();
    this.emitHud(true);
  }

  pause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.releaseInputs();
      return true;
    }
    return false;
  }

  resume() {
    if (this.state === "paused") {
      this.state = "playing";
      this.lastFrame = performance.now();
      return true;
    }
    return false;
  }

  releaseInputs() {
    this.joyPointer = null;
    this.joyOrigin = null;
    this.keyboard.up = false;
    this.keyboard.down = false;
    this.keyboard.left = false;
    this.keyboard.right = false;
    this.keyboard.boost = false;
    this.boostPointers.clear();
    this.mouseBoost = false;
    this.elements.joystick?.classList.remove("is-active");
    if (this.elements.knob) this.elements.knob.style.transform = "";
    this.elements.boostBtn?.classList.remove("is-boosting", "is-empty");
  }

  attachInput() {
    const canvas = this.canvas;
    canvas.addEventListener("pointermove", (event) => {
      this.pointerInside = true;
      if (event.pointerType === "touch") {
        if (event.pointerId === this.joyPointer) this.updateJoystick(event.clientX, event.clientY);
        return;
      }
      if (this.state !== "playing") return;
      const point = this.screenToGround(event.clientX, event.clientY);
      if (!point) return;
      const dx = point.x - this.player.x;
      const dz = point.z - this.player.z;
      const length = Math.hypot(dx, dz);
      if (length > 0.8) {
        this.mouseDirection.x = dx / length;
        this.mouseDirection.z = dz / length;
      }
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (this.state !== "playing") return;
      if (event.pointerType === "touch") {
        const rect = canvas.getBoundingClientRect();
        if (event.clientX - rect.left < rect.width * 0.6) {
          if (this.joyPointer !== null) return;
          this.joyPointer = event.pointerId;
          this.joyOrigin = { x: event.clientX, y: event.clientY };
          this.joyTouch = true;
          this.elements.joystick?.classList.add("is-active");
          this.updateJoystick(event.clientX, event.clientY);
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch {}
        } else {
          this.boostPointers.add(event.pointerId);
          this.elements.boostBtn?.classList.add("is-boosting");
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch {}
        }
      } else if (event.button === 0) {
        this.mouseBoost = true;
        this.elements.boostBtn?.classList.add("is-boosting");
      }
    });

    const release = (event) => {
      if (event.pointerId === this.joyPointer) {
        this.joyPointer = null;
        this.joyOrigin = null;
        this.joyTouch = false;
        this.elements.joystick?.classList.remove("is-active");
        if (this.elements.knob) this.elements.knob.style.transform = "";
      }
      if (this.boostPointers.delete(event.pointerId)) {
        this.elements.boostBtn?.classList.remove("is-boosting");
      }
      if (event.pointerType !== "touch" && event.button === 0) {
        this.mouseBoost = false;
        this.elements.boostBtn?.classList.remove("is-boosting");
      }
    };
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("pointerleave", () => {
      this.pointerInside = false;
    });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    const joystick = this.elements.joystick;
    if (joystick) {
      joystick.addEventListener("pointerdown", (event) => {
        if (this.state !== "playing" || this.joyPointer !== null) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = joystick.getBoundingClientRect();
        this.joyPointer = event.pointerId;
        this.joyTouch = true;
        this.joyOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        joystick.classList.add("is-active");
        this.updateJoystick(event.clientX, event.clientY);
        try {
          joystick.setPointerCapture(event.pointerId);
        } catch {}
      });
      joystick.addEventListener("pointermove", (event) => {
        if (event.pointerId === this.joyPointer) {
          event.preventDefault();
          this.updateJoystick(event.clientX, event.clientY);
        }
      });
      const stop = (event) => {
        if (event.pointerId !== this.joyPointer) return;
        this.joyPointer = null;
        this.joyOrigin = null;
        this.joyTouch = false;
        joystick.classList.remove("is-active");
        if (this.elements.knob) this.elements.knob.style.transform = "";
      };
      joystick.addEventListener("pointerup", stop);
      joystick.addEventListener("pointercancel", stop);
    }

    const boostBtn = this.elements.boostBtn;
    if (boostBtn) {
      boostBtn.addEventListener("pointerdown", (event) => {
        if (this.state !== "playing") return;
        event.preventDefault();
        event.stopPropagation();
        this.boostPointers.add(event.pointerId);
        boostBtn.classList.add("is-boosting");
        try {
          boostBtn.setPointerCapture(event.pointerId);
        } catch {}
      });
      const stopBoost = (event) => {
        if (this.boostPointers.delete(event.pointerId)) {
          boostBtn.classList.remove("is-boosting");
        }
      };
      boostBtn.addEventListener("pointerup", stopBoost);
      boostBtn.addEventListener("pointercancel", stopBoost);
    }

    window.addEventListener("keydown", (event) => {
      if (event.code === "ArrowUp" || event.code === "KeyW") this.keyboard.up = true;
      if (event.code === "ArrowDown" || event.code === "KeyS") this.keyboard.down = true;
      if (event.code === "ArrowLeft" || event.code === "KeyA") this.keyboard.left = true;
      if (event.code === "ArrowRight" || event.code === "KeyD") this.keyboard.right = true;
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        this.keyboard.boost = true;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code) && this.state === "playing") {
        event.preventDefault();
      }
    });
    window.addEventListener("keyup", (event) => {
      if (event.code === "ArrowUp" || event.code === "KeyW") this.keyboard.up = false;
      if (event.code === "ArrowDown" || event.code === "KeyS") this.keyboard.down = false;
      if (event.code === "ArrowLeft" || event.code === "KeyA") this.keyboard.left = false;
      if (event.code === "ArrowRight" || event.code === "KeyD") this.keyboard.right = false;
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") {
        this.keyboard.boost = false;
      }
    });
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("blur", () => this.releaseInputs());
  }

  updateJoystick(clientX, clientY) {
    if (!this.joyOrigin) return;
    const dx = clientX - this.joyOrigin.x;
    const dy = clientY - this.joyOrigin.y;
    const max = 42;
    const distance = Math.hypot(dx, dy);
    const scale = distance > max ? max / distance : 1;
    this.joyInput = { x: (dx * scale) / max, z: (dy * scale) / max };
    if (this.elements.knob) {
      this.elements.knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    }
  }

  screenToGround(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera({ x, y }, this.world.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.pointerWorld);
    return hit ? { x: this.pointerWorld.x, z: this.pointerWorld.z } : null;
  }

  currentInput() {
    let x = 0;
    let z = 0;
    if (this.keyboard.up) z -= 1;
    if (this.keyboard.down) z += 1;
    if (this.keyboard.left) x -= 1;
    if (this.keyboard.right) x += 1;
    let active = false;
    if (Math.abs(x) + Math.abs(z) > 0.1) {
      active = true;
    } else if (this.joyPointer !== null && this.joyInput) {
      x = this.joyInput.x;
      z = this.joyInput.z;
      active = Math.hypot(x, z) > 0.08;
    } else if (this.pointerInside) {
      x = this.mouseDirection.x;
      z = this.mouseDirection.z;
      active = true;
    }
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    const boost =
      this.keyboard.boost ||
      this.mouseBoost ||
      this.boostPointers.size > 0 ||
      (this.joyTouch && this.joyPointer !== null && this.joyInput && this.joyInput.z < -0.72 && this.joyInput.x > 0.72);
    return { x, z, active, boost };
  }

  updateBotAI(bot, dt) {
    bot.aiTimer -= dt;
    if (bot.aiTimer <= 0 || !bot.aiTarget) {
      bot.aiTimer = 0.28 + Math.random() * 0.42;
      const centerDistance = Math.hypot(bot.x, bot.z);
      if (centerDistance > ARENA_RADIUS - 16) {
        bot.aiTarget = { x: -bot.x * 0.7, z: -bot.z * 0.7 };
      } else {
        let best = null;
        let bestDistance = 44 * 44;
        for (let i = 0; i < this.world.food.count; i += 1) {
          const item = this.world.food.items[i];
          const distance = distanceSq(bot.x, bot.z, item.x, item.z);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = item;
          }
        }
        if (!best || Math.random() < 0.12) {
          bot.aiTarget = randomPointInCircle(ARENA_RADIUS - 22);
        } else {
          bot.aiTarget = { x: best.x, z: best.z };
        }
      }
      bot.boostPlan = bot.length > 74 && Math.random() < 0.2;
    }

    const target = bot.aiTarget || { x: 0, z: 0 };
    const dx = target.x - bot.x;
    const dz = target.z - bot.z;
    const length = Math.hypot(dx, dz);
    if (length < 1.2 && !bot.boostPlan) {
      bot.aiTimer = 0;
      return { x: Math.sin(bot.angle), z: Math.cos(bot.angle), active: true, boost: false };
    }
    return {
      x: length > 0.001 ? dx / length : 0,
      z: length > 0.001 ? dz / length : 1,
      active: true,
      boost: bot.boostPlan && length > 14,
    };
  }

  updateBots(dt) {
    for (let i = 0; i < this.bots.length; i += 1) {
      const bot = this.bots[i];
      if (bot.alive) {
        const input = this.updateBotAI(bot, dt);
        bot.update(dt, this.time, input, ARENA_RADIUS);
        if (bot.boosting) {
          const tail = bot.positions[bot.positions.length - 1];
          if (tail && Math.random() < 0.12) {
            this.world.sparkles.emit(tail.x, 0.9, tail.z, bot.skin.glow, 1, 0.8);
          }
        }
      } else if (this.time >= bot.respawnAt) {
        this.spawnBot(bot, i);
      }
    }
  }

  consumeFood(worm) {
    if (!worm.alive) return;
    const items = this.world.food.items;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const range = HEAD_RADIUS + 0.9 + (item.big ? 0.35 : 0);
      if (distanceSq(worm.x, worm.z, item.x, item.z) <= range * range) {
        worm.eat(item.value);
        this.world.food.respawn(i);
        if (worm === this.player) {
          this.audio.eat(item.value);
          this.world.sparkles.emit(item.x, 1.1, item.z, item.color, item.big ? 9 : 4, 2.6);
          if (item.big) this.onToast("Orbe gigante · +9");
        }
      }
    }
  }

  checkCollisions() {
    if (!this.player.alive || this.playerStalled || this.time < this.invulnerableUntil) return;
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      if (hitsCircle(this.player.x, this.player.z, bot.x, bot.z, HEAD_RADIUS * 1.62)) {
        this.killBot(bot);
        this.killPlayer("Chocaste de cabeza con otro gusano.");
        return;
      }
      for (let i = 0; i < bot.positions.length; i += 2) {
        const point = bot.positions[i];
        if (hitsCircle(this.player.x, this.player.z, point.x, point.z, HEAD_RADIUS + 0.9)) {
          this.killPlayer(`Te estrellaste contra ${bot.name}.`);
          return;
        }
      }
      for (let i = 0; i < this.player.positions.length; i += 2) {
        const point = this.player.positions[i];
        if (hitsCircle(bot.x, bot.z, point.x, point.z, HEAD_RADIUS + 0.9)) {
          this.killBot(bot);
          break;
        }
      }
    }
  }

  updateCamera(dt) {
    const follow = this.state === "playing" || this.state === "dead" || this.state === "paused";
    if (this.cameraMode === "orbit" && this.state === "menu") {
      const orbit = this.time * 0.055;
      this.cameraDesired.set(Math.cos(orbit) * 72, 42 + Math.sin(this.time * 0.09) * 3.5, Math.sin(orbit) * 72);
      this.cameraLook.lerp(new THREE.Vector3(0, 0, 0), 1 - Math.exp(-dt * 2.2));
    } else if (follow) {
      const focusX = this.player.alive ? this.player.x : this.deathFocus.x;
      const focusZ = this.player.alive ? this.player.z : this.deathFocus.z;
      const portrait = this.world.camera.aspect < 0.78;
      const height = portrait ? 35 : 29;
      const back = portrait ? 26 : 30;
      if (this.state === "dead") {
        this.cameraDesired.set(focusX, height + 3, focusZ + back);
      } else {
        this.cameraDesired.set(focusX, height, focusZ + back);
      }
      const target = new THREE.Vector3(focusX, 0.7, focusZ);
      this.cameraLook.lerp(target, 1 - Math.exp(-dt * 6));
    }
    this.world.camera.position.lerp(this.cameraDesired, 1 - Math.exp(-dt * 3.4));
    if (this.state === "dead" && this.time - this.deathAt < 0.55) {
      const shake = (1 - (this.time - this.deathAt) / 0.55) * 0.65;
      this.world.camera.position.x += (Math.random() - 0.5) * shake;
      this.world.camera.position.y += (Math.random() - 0.5) * shake;
    }
    this.world.camera.lookAt(this.cameraLook);
  }

  drawMinimap() {
    const canvas = this.elements.minimap;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 4;
    const colors = this.theme.minimap;
    context.clearRect(0, 0, size, size);
    context.save();
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, size, size);

    const gradient = context.createRadialGradient(center, center, 10, center, center, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.05)");
    gradient.addColorStop(1, "rgba(0,0,0,0.25)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    context.strokeStyle = "rgba(255,255,255,0.07)";
    context.lineWidth = 1;
    for (let i = 1; i <= 3; i += 1) {
      context.beginPath();
      context.arc(center, center, (radius * i) / 4, 0, Math.PI * 2);
      context.stroke();
    }
    context.beginPath();
    context.moveTo(center, 4);
    context.lineTo(center, size - 4);
    context.moveTo(4, center);
    context.lineTo(size - 4, center);
    context.stroke();

    const scale = (radius - 4) / ARENA_RADIUS;
    const toX = (x) => center + x * scale;
    const toY = (z) => center + z * scale;

    for (const bot of this.bots) {
      if (!bot.alive) continue;
      context.beginPath();
      context.fillStyle = bot.skin.primary;
      context.globalAlpha = 0.9;
      context.arc(toX(bot.x), toY(bot.z), bot === this.player ? 4 : 2.8, 0, Math.PI * 2);
      context.fill();
    }

    if (this.player.alive) {
      context.globalAlpha = 1;
      context.save();
      context.translate(toX(this.player.x), toY(this.player.z));
      context.rotate(-this.player.angle + Math.PI);
      context.beginPath();
      context.moveTo(0, -6.5);
      context.lineTo(4.5, 5);
      context.lineTo(-4.5, 5);
      context.closePath();
      context.fillStyle = colors.player;
      context.shadowColor = colors.player;
      context.shadowBlur = 10;
      context.fill();
      context.restore();
    }
    context.restore();

    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.strokeStyle = colors.ring;
    context.globalAlpha = 0.7;
    context.lineWidth = 1.5;
    context.stroke();
    context.globalAlpha = 1;
  }

  emitHud(force = false) {
    if (!force && this.time - this.lastHudAt < 0.16) return;
    this.lastHudAt = this.time;
    const ranked = rankWorms([this.player, ...this.bots]);
    const playerIndex = ranked.indexOf(this.player);
    const leaderboard = ranked.slice(0, 6).map((worm, index) => ({
      rank: index + 1,
      name: worm.name,
      score: worm.score,
      you: worm === this.player,
      skin: worm.skin,
    }));
    this.onHud({
      state: this.state,
      score: this.player.score,
      length: Math.round(this.player.length),
      rank: playerIndex >= 0 ? playerIndex + 1 : 0,
      boostReady: this.player.length > MIN_BOOST_LENGTH,
      leaderboard,
      online: this.bots.filter((bot) => bot.alive).length + 1,
    });

    if (this.player.alive && this.elements.boostBtn) {
      this.elements.boostBtn.classList.toggle("is-empty", this.player.length <= MIN_BOOST_LENGTH);
    }
    if (this.time - this.lastMinimapAt > 0.1) {
      this.lastMinimapAt = this.time;
      this.drawMinimap();
    }
  }

  update(dt) {
    this.time += dt;
    this.world.updateAmbient(this.time);
    this.world.food.update(this.time);
    this.world.sparkles.update(dt);

    if (this.state === "playing") {
      const input = this.currentInput();
      if (input.active) {
        if (this.playerStalled) this.invulnerableUntil = Math.max(this.invulnerableUntil, this.time + 1.2);
        this.playerStalled = false;
      }
      if (this.playerStalled) input.stalled = true;
      this.player.update(dt, this.time, input, ARENA_RADIUS);
      if (this.player.boosting) {
        this.audio.boost();
        this.trailTimer -= dt;
        if (this.trailTimer <= 0) {
          this.trailTimer = 0.035;
          const tail = this.player.positions[this.player.positions.length - 1];
          if (tail) {
            this.world.sparkles.emit(
              tail.x + (Math.random() - 0.5) * 0.5,
              0.8,
              tail.z + (Math.random() - 0.5) * 0.5,
              this.player.skin.glow,
              1,
              1.3,
            );
          }
        }
      }
    } else if (this.state === "dead") {
      this.world.sparkles.emit(this.deathFocus.x, 1.1, this.deathFocus.z, this.player.skin.glow, 1, 2);
    }

    this.updateBots(dt);
    if (this.state === "playing") {
      this.consumeFood(this.player);
      for (const bot of this.bots) if (bot.alive) this.consumeFood(bot);
      this.checkCollisions();
      this.emitHud();
    } else if (this.state === "menu" || this.state === "dead") {
      for (const bot of this.bots) if (bot.alive) this.consumeFood(bot);
      this.emitHud();
    }

    this.updateCamera(dt);
  }

  loop(now) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, Math.max(0.0001, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    if (this.state !== "paused") {
      this.update(dt);
    }
    this.world.render();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.world.renderer.dispose();
  }
}
