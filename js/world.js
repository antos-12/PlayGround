import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ARENA_RADIUS, BOT_COUNT, BOT_NAMES, MAX_SEGMENTS, SKINS, THEMES } from './config.js';
import { CandyField } from './candy.js';
import { Worm } from './worm.js';
import {
  damp, makeGlowTexture, makeGroundTexture, makeHeartGeometry, pick, rand, randomPointInCircle, tintInstanceEmissive
} from './utils.js';

export class Game {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.audio = audio;
    this.theme = THEMES.romantic;
    this.state = 'menu';
    this.time = 0;
    this.lastFrame = performance.now();
    this.fps = 60;
    this.combo = 0;
    this.comboTimer = 0;
    this.wasTop = false;
    this.lastRank = 1;
    this.deathTime = 0;
    this.boundaryTimer = 0;
    this.boundaryActive = false;
    this.prevBoost = false;
    this.quality = 'auto';
    this.autoQualityTimer = 0;
    this.autoQualityLow = false;
    this.cameraSnap = true;
    this.camLook = new THREE.Vector3(0, 2, 0);
    this.shake = 0;
    this.hudTimer = 0;
    this.events = new Map();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.theme.bg);
    this.scene.fog = new THREE.FogExp2(this.theme.fog, this.theme.fogDensity);

    this.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 900);
    this.camera.position.set(0, 32, 52);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.setClearColor(this.theme.bg, 1);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth * 0.75, window.innerHeight * 0.75),
      0.55,
      0.5,
      0.8
    );
    this.outputPass = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);

    this.glowTexture = makeGlowTexture();
    this.dummy = new THREE.Object3D();
    this.dummy.rotation.order = 'YXZ';
    this.tempColor = new THREE.Color();

    this.buildLights();
    this.buildEnvironment();
    this.buildParticles();
    this.applyTheme(this.theme, true);

    this.candies = new CandyField(this.scene, this.theme);
    this.createWorms();
    this.resetMenu();
    this.applyQuality('auto');

    this.onResize = this.onResize.bind(this);
    this.loop = this.loop.bind(this);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    this.onResize();
    requestAnimationFrame(this.loop);
  }

  on(name, callback) {
    if (!this.events.has(name)) this.events.set(name, new Set());
    this.events.get(name).add(callback);
    return () => this.events.get(name)?.delete(callback);
  }

  emit(name, payload) {
    this.events.get(name)?.forEach((callback) => callback(payload));
  }

  attachInput(input) {
    this.input = input;
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(this.theme.light.hemiSky, this.theme.light.hemiGround, this.theme.light.hemi);
    this.scene.add(this.hemi);

    this.dirLight = new THREE.DirectionalLight(this.theme.light.dir, this.theme.light.dirI);
    this.dirLight.position.set(55, 90, 38);
    this.scene.add(this.dirLight);

    this.fillLight = new THREE.DirectionalLight(this.theme.accent3, 0.95);
    this.fillLight.position.set(-60, 40, -50);
    this.scene.add(this.fillLight);

    this.arenaLight = new THREE.PointLight(this.theme.light.point, 340, 180, 1.8);
    this.arenaLight.position.set(0, 22, 0);
    this.scene.add(this.arenaLight);

    this.playerLight = new THREE.PointLight(this.theme.accent, 34, 18, 2);
    this.playerLight.position.set(0, 5, 0);
    this.scene.add(this.playerLight);
  }

  buildEnvironment() {
    const groundGeometry = new THREE.CircleGeometry(ARENA_RADIUS + 56, 128);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.62,
      metalness: 0.24,
      emissive: 0xffffff,
      emissiveIntensity: 0.28,
      color: 0xffffff
    });
    this.ground = new THREE.Mesh(groundGeometry, this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    const ringGeometry = new THREE.RingGeometry(ARENA_RADIUS - 0.2, ARENA_RADIUS + 1.1, 192);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: this.theme.ring,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    this.boundaryRing = new THREE.Mesh(ringGeometry, this.ringMaterial);
    this.boundaryRing.rotation.x = -Math.PI / 2;
    this.boundaryRing.position.y = 0.08;
    this.scene.add(this.boundaryRing);

    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: this.theme.accent,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    this.homeRing = new THREE.Mesh(new THREE.RingGeometry(3.2, 4.8, 72), innerRingMaterial);
    this.homeRing.rotation.x = -Math.PI / 2;
    this.homeRing.position.y = 0.06;
    this.scene.add(this.homeRing);

    this.auraRings = [];
    [23, 46, 69, 91].forEach((radius) => {
      const material = new THREE.MeshBasicMaterial({
        color: this.theme.accent,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.16, radius + 0.16, 160), material);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.045;
      this.auraRings.push(ring);
      this.scene.add(ring);
    });

    const auraMaterial = new THREE.MeshBasicMaterial({
      map: this.glowTexture,
      color: this.theme.accent,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    this.centerAura = new THREE.Mesh(new THREE.CircleGeometry(17, 64), auraMaterial);
    this.centerAura.rotation.x = -Math.PI / 2;
    this.centerAura.position.y = 0.03;
    this.scene.add(this.centerAura);

    const heartGeometry = makeHeartGeometry();
    this.centerHeart = new THREE.Mesh(heartGeometry, new THREE.MeshBasicMaterial({
      color: this.theme.accent,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide
    }));
    this.centerHeart.rotation.order = 'YXZ';
    this.centerHeart.rotation.set(-Math.PI / 2, 0, 0);
    this.centerHeart.position.y = 0.09;
    this.centerHeart.scale.setScalar(2.35);
    this.scene.add(this.centerHeart);

    this.decorMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    });
    this.decorMesh = new THREE.InstancedMesh(heartGeometry, this.decorMaterial, 46);
    this.decorMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.decorMesh.frustumCulled = false;
    this.decorData = [];
    for (let i = 0; i < 46; i++) {
      const angle = rand(0, Math.PI * 2);
      const radius = rand(14, ARENA_RADIUS + 22);
      this.decorData.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        baseY: rand(8, 26),
        scale: rand(0.25, 0.8),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.3, 0.9),
        spin: rand(0.08, 0.34)
      });
    }
    this.scene.add(this.decorMesh);

    const lollipopCount = 22;
    const stickGeometry = new THREE.CylinderGeometry(0.16, 0.24, 7.4, 8);
    const stickMaterial = new THREE.MeshStandardMaterial({
      color: this.theme.accent2,
      roughness: 0.5,
      metalness: 0.08,
      emissive: this.theme.accent2,
      emissiveIntensity: 0.1
    });
    const topMaterial = tintInstanceEmissive(new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.28,
      metalness: 0.08,
      emissive: 0xffffff,
      emissiveIntensity: 0.3
    }));
    this.lollipopSticks = new THREE.InstancedMesh(stickGeometry, stickMaterial, lollipopCount);
    this.lollipopTops = new THREE.InstancedMesh(heartGeometry, topMaterial, lollipopCount);
    this.lollipopSticks.frustumCulled = false;
    this.lollipopTops.frustumCulled = false;
    this.lollipopData = [];
    for (let i = 0; i < lollipopCount; i++) {
      const angle = (i / lollipopCount) * Math.PI * 2 + rand(-0.07, 0.07);
      const radius = rand(116, 132);
      const scale = rand(2.0, 3.2);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const topY = 7 + scale * 1.05;
      this.lollipopData.push({ angle, x, z, scale, topY });
      this.dummy.position.set(x, 3.7, z);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      this.lollipopSticks.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.set(x, topY, z);
      this.dummy.rotation.set(0, -Math.PI / 2 - angle, 0);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.lollipopTops.setMatrixAt(i, this.dummy.matrix);
      this.tempColor.set(pick(this.theme.palette));
      this.lollipopTops.setColorAt(i, this.tempColor);
    }
    this.lollipopSticks.instanceMatrix.needsUpdate = true;
    this.lollipopTops.instanceMatrix.needsUpdate = true;
    if (this.lollipopTops.instanceColor) this.lollipopTops.instanceColor.needsUpdate = true;
    this.scene.add(this.lollipopSticks, this.lollipopTops);

    const starCount = 720;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    this.starData = [];
    for (let i = 0; i < starCount; i++) {
      const angle = rand(0, Math.PI * 2);
      const radius = rand(90, 330);
      const y = rand(4, 130);
      starPositions[i * 3] = Math.cos(angle) * radius;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = Math.sin(angle) * radius;
      this.starData.push(i);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    this.starMaterial = new THREE.PointsMaterial({
      map: this.glowTexture,
      size: 2.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.bokeh = [];
    for (let i = 0; i < 12; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.glowTexture,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      });
      const sprite = new THREE.Sprite(material);
      const angle = rand(0, Math.PI * 2);
      const radius = rand(95, 185);
      sprite.position.set(Math.cos(angle) * radius, rand(7, 36), Math.sin(angle) * radius);
      const scale = rand(18, 42);
      sprite.scale.set(scale, scale, 1);
      sprite.userData.baseY = sprite.position.y;
      sprite.userData.phase = rand(0, Math.PI * 2);
      this.bokeh.push(sprite);
      this.scene.add(sprite);
    }
  }

  buildParticles() {
    this.particleCount = 600;
    this.particleData = [];
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const alphas = new Float32Array(this.particleCount);
    for (let i = 0; i < this.particleCount; i++) {
      this.particleData.push({
        x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1, size: 1, color: new THREE.Color()
      });
    }
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    this.particleGeometry.setDrawRange(0, this.particleCount);
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: this.glowTexture } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (420.0 / max(1.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 textureColor = texture2D(uTexture, gl_PointCoord);
          float alpha = textureColor.a * vAlpha;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
    this.particleCursor = 0;

    this.shockwaves = [];
    this.shockGeometry = new THREE.RingGeometry(0.65, 1, 64);
  }

  createWorms() {
    this.player = new Worm(this.scene, { name: 'Invitado', skin: SKINS[0], isPlayer: true });
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, BOT_COUNT);
    this.bots = names.map((name, index) => new Worm(this.scene, {
      name,
      skin: SKINS[(index + 1) % SKINS.length],
      isPlayer: false
    }));
    this.worms = [this.player, ...this.bots];
  }

  resetMenu() {
    this.state = 'menu';
    this.player.setName(this.player.name);
    this.player.reset({ x: 0, z: 0 }, rand(0, Math.PI * 2), 120);
    this.bots.forEach((bot, index) => {
      const point = randomPointInCircle(58);
      bot.reset(point, rand(0, Math.PI * 2), rand(60, 340) + index * 8);
      bot.respawnTimer = 0;
    });
    this.candies?.reset(this.theme);
    this.combo = 0;
    this.wasTop = false;
    this.boundaryActive = false;
    this.cameraSnap = true;
    this.emit('state', 'menu');
  }

  start(profile) {
    if (profile?.name) this.player.setName(profile.name);
    if (profile?.skin) this.setSkin(profile.skin);
    if (profile?.theme && profile.theme !== this.theme.id) this.setTheme(profile.theme);
    const point = randomPointInCircle(42);
    this.player.reset(point, Math.atan2(-point.z, -point.x) + rand(-0.35, 0.35), 0);
    this.bots.forEach((bot, index) => {
      const botPoint = randomPointInCircle(ARENA_RADIUS - 14);
      bot.reset(botPoint, rand(0, Math.PI * 2), rand(50, 290) + index * 12);
      bot.respawnTimer = 0;
    });
    this.candies.reset(this.theme);
    this.state = 'playing';
    this.combo = 0;
    this.comboTimer = 0;
    this.wasTop = false;
    this.boundaryActive = false;
    this.cameraSnap = true;
    this.audio?.spawn();
    this.emit('state', 'playing');
  }

  respawn() {
    const point = randomPointInCircle(48);
    this.player.reset(point, Math.atan2(-point.z, -point.x) + rand(-0.35, 0.35), 0);
    this.state = 'playing';
    this.combo = 0;
    this.wasTop = false;
    this.cameraSnap = true;
    this.audio?.spawn();
    this.emit('state', 'playing');
  }

  showMenu() {
    this.resetMenu();
    this.input?.setEnabled(false);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio?.stopBoost();
    this.emit('state', 'paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.emit('state', 'playing');
  }

  setSkin(id) {
    const skin = SKINS.find((item) => item.id === id) || SKINS[0];
    this.player.applySkin(skin);
    this.playerLight.color.set(skin.glow);
  }

  setTheme(id) {
    const theme = THEMES[id];
    if (!theme || theme.id === this.theme.id) return;
    this.applyTheme(theme);
    this.candies?.setTheme(theme);
  }

  applyTheme(theme, initial = false) {
    this.theme = theme;
    this.scene.background.set(theme.bg);
    this.scene.fog.color.set(theme.fog);
    this.scene.fog.density = theme.fogDensity;
    this.renderer.setClearColor(theme.bg, 1);

    if (!initial) {
      const oldMap = this.groundMaterial.map;
      const texture = makeGroundTexture(theme);
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      this.groundMaterial.map = texture;
      this.groundMaterial.emissiveMap = texture;
      this.groundMaterial.needsUpdate = true;
      oldMap?.dispose();
    } else {
      const texture = makeGroundTexture(theme);
      texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      this.groundMaterial.map = texture;
      this.groundMaterial.emissiveMap = texture;
    }

    this.hemi.color.set(theme.light.hemiSky);
    this.hemi.groundColor.set(theme.light.hemiGround);
    this.hemi.intensity = theme.light.hemi;
    this.dirLight.color.set(theme.light.dir);
    this.dirLight.intensity = theme.light.dirI;
    this.fillLight.color.set(theme.accent3);
    this.arenaLight.color.set(theme.light.point);
    this.ringMaterial.color.set(theme.ring);
    this.homeRing.material.color.set(theme.accent);
    this.centerHeart.material.color.set(theme.accent);
    this.centerAura.material.color.set(theme.accent);
    this.auraRings.forEach((ring) => ring.material.color.set(theme.accent));
    this.playerLight.color.set(theme.accent);

    this.decorData.forEach((data, index) => {
      this.tempColor.set(pick(theme.decor));
      this.decorMesh.setColorAt(index, this.tempColor);
    });
    if (this.decorMesh.instanceColor) this.decorMesh.instanceColor.needsUpdate = true;
    this.lollipopSticks.material.color.set(theme.accent2);
    this.lollipopSticks.material.emissive.set(theme.accent2);
    this.lollipopData.forEach((data, index) => {
      this.tempColor.set(pick(theme.palette));
      this.lollipopTops.setColorAt(index, this.tempColor);
    });
    if (this.lollipopTops.instanceColor) this.lollipopTops.instanceColor.needsUpdate = true;

    const colorAttribute = this.stars.geometry.getAttribute('color');
    for (let i = 0; i < this.starData.length; i++) {
      this.tempColor.set(pick(theme.stars));
      colorAttribute.setXYZ(i, this.tempColor.r, this.tempColor.g, this.tempColor.b);
    }
    colorAttribute.needsUpdate = true;

    this.bokeh.forEach((sprite, index) => {
      this.tempColor.set(theme.palette[index % theme.palette.length]);
      sprite.material.color.copy(this.tempColor);
    });

    if (this.player) this.playerLight.color.set(this.player.skin.glow);
  }

  applyQuality(quality) {
    this.quality = quality;
    this.autoQualityTimer = 0;
    this.autoQualityLow = false;
    const device = Math.min(window.devicePixelRatio || 1, 2);
    let ratio = device;
    if (quality === 'low') ratio = 1;
    if (quality === 'auto') ratio = Math.min(device, window.innerWidth < 900 ? 1.6 : 2);
    if (quality === 'high') ratio = Math.min(device, 2);
    this.renderer.setPixelRatio(ratio);
    this.composer.setPixelRatio?.(ratio);
    this.bloomPass.enabled = quality !== 'low';
    this.onResize();
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloomPass.setSize(Math.floor(width * 0.7), Math.floor(height * 0.7));
  }

  getLength() {
    return Math.max(1, Math.round(this.player.segmentCount * 0.6));
  }

  getLeaderboard(limit = 6) {
    return this.worms
      .filter((worm) => worm.alive)
      .sort((a, b) => b.score - a.score)
      .map((worm, index) => ({
        name: worm.name,
        score: Math.floor(worm.score),
        color: worm.skin.main,
        isPlayer: worm === this.player,
        rank: index + 1
      }))
      .slice(0, limit);
  }

  getPlayerRank() {
    if (!this.player.alive) return this.lastRank;
    const sorted = this.worms.filter((worm) => worm.alive).sort((a, b) => b.score - a.score);
    return sorted.indexOf(this.player) + 1;
  }

  getHudState() {
    return {
      state: this.state,
      score: Math.floor(this.player.score),
      length: this.getLength(),
      rank: this.getPlayerRank(),
      alive: this.player.alive,
      boost: this.player.boostMeter,
      combo: this.combo,
      leaderboard: this.getLeaderboard(6),
      worms: this.worms.filter((worm) => worm.alive).map((worm) => ({
        x: worm.x,
        z: worm.z,
        isPlayer: worm === this.player,
        color: worm.skin.main,
        radius: worm.headRadius
      }))
    };
  }

  updateMenu(dt) {
    const targetAngle = this.time * 0.22;
    this.player.faceTarget(Math.cos(targetAngle) * 30, Math.sin(targetAngle) * 30);
    this.player.update(dt, this.time);
    this.bots.forEach((bot) => {
      bot.think(dt, this.time, this.candies, this.worms);
      bot.update(dt, this.time);
    });
  }

  updatePlaying(dt) {
    if (this.input?.hasAngle) this.player.targetHeading = this.input.angle;
    this.player.boosting = !!this.input?.boost;
    this.player.update(dt, this.time);
    this.bots.forEach((bot) => {
      if (!bot.alive) return;
      bot.think(dt, this.time, this.candies, this.worms);
      bot.update(dt, this.time);
    });
    this.updateEating();
    this.updateCollisions();

    if (this.player.boosting && !this.prevBoost) this.audio?.startBoost();
    if (!this.player.boosting && this.prevBoost) this.audio?.stopBoost();
    this.prevBoost = this.player.boosting;

    if (this.player.boosting && this.player.alive && Math.random() < dt * 38) {
      const tail = this.player.tailPosition();
      this.spawnParticle(
        tail.x + rand(-0.4, 0.4),
        this.player.headY + rand(-0.3, 0.5),
        tail.z + rand(-0.4, 0.4),
        this.player.skin.glow,
        rand(-1.2, 1.2),
        rand(1, 3),
        rand(-1.2, 1.2),
        rand(0.6, 1.2),
        rand(0.35, 0.65)
      );
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.playerLight.position.set(this.player.x, this.player.headY + 3, this.player.z);

    const distance = Math.hypot(this.player.x, this.player.z);
    this.boundaryTimer -= dt;
    const nearEdge = this.player.alive && distance > ARENA_RADIUS - 12;
    if (nearEdge && !this.boundaryActive) {
      this.boundaryActive = true;
      this.emit('boundary', true);
    } else if (!nearEdge && this.boundaryActive) {
      this.boundaryActive = false;
      this.emit('boundary', false);
    }

    const rank = this.getPlayerRank();
    if (rank === 1 && this.player.alive && !this.wasTop) {
      this.wasTop = true;
      this.audio?.rankUp();
      this.emit('rank', 1);
    }
  }

  updateDead(dt) {
    this.deathTime += dt;
    this.bots.forEach((bot) => {
      if (!bot.alive) return;
      bot.think(dt, this.time, this.candies, this.worms);
      bot.update(dt, this.time);
    });
    this.updateEating(true);
    this.updateCollisions();
    this.audio?.stopBoost();
    this.prevBoost = false;
  }

  updateEating(skipPlayer = false) {
    this.worms.forEach((worm) => {
      if (!worm.alive) return;
      if (skipPlayer && worm === this.player) return;
      const eaten = this.candies.eatNear(worm.x, worm.z, worm.headRadius * 0.98, this.time);
      eaten.forEach((item) => {
        let value = item.value;
        if (worm === this.player) {
          this.combo += 1;
          this.comboTimer = 1.8;
          value = Math.round(value * (1 + Math.min(this.combo, 20) * 0.032));
          this.audio?.eat(this.combo);
          if (item.kind === 'heart') this.audio?.heart();
          this.emit('eat', { value, color: item.color, kind: item.kind, combo: this.combo });
          this.burst(
            item.x,
            item.kind === 'heart' ? 1.3 : 0.8,
            item.z,
            item.color,
            item.kind === 'heart' ? 24 : 9,
            item.kind === 'heart' ? 8 : 4.6,
            item.kind === 'heart' ? 1.8 : 0.95
          );
          if (item.kind === 'heart') this.spawnShockwave(item.x, item.z, item.color);
        }
        worm.addScore(value);
      });
    });
  }

  updateCollisions() {
    for (let a = 0; a < this.worms.length; a++) {
      const wormA = this.worms[a];
      if (!wormA.alive || wormA.invulnerable > 0) continue;
      for (let b = 0; b < this.worms.length; b++) {
        if (a === b) continue;
        const wormB = this.worms[b];
        if (!wormB.alive) continue;
        const head = wormA.headPoint();
        let hit = false;
        for (let i = 3; i < wormB.bodyPoints.length; i++) {
          const point = wormB.bodyPoints[i];
          const dx = point.x - head.x;
          const dz = point.z - head.z;
          const threshold = (point.r + head.r) * 0.78;
          if (dx * dx + dz * dz < threshold * threshold) {
            hit = true;
            break;
          }
        }
        if (hit) {
          this.killWorm(wormA, wormB);
          break;
        }
      }
      if (!this.player.alive && this.state === 'dead') break;
    }
  }

  respawnBot(bot) {
    let point = randomPointInCircle(ARENA_RADIUS - 22);
    for (let attempt = 0; attempt < 8; attempt++) {
      const dx = point.x - this.player.x;
      const dz = point.z - this.player.z;
      if (dx * dx + dz * dz > 900) break;
      point = randomPointInCircle(ARENA_RADIUS - 22);
    }
    bot.reset(point, rand(0, Math.PI * 2), rand(20, 260));
    bot.respawnTimer = 0;
    this.spawnShockwave(point.x, point.z, bot.skin.main);
    this.burst(point.x, 1.3, point.z, bot.skin.main, 16, 6, 1.3);
  }

  killWorm(worm, killer) {
    if (!worm.alive) return;
    const rank = worm === this.player ? this.getPlayerRank() : 0;
    const dropPoints = worm.bodyPoints.filter((point, index) => index > 2 && index % 4 === 0);
    worm.kill();
    this.spawnShockwave(worm.x, worm.z, worm.skin.main);
    this.burst(worm.x, worm.headY, worm.z, worm.skin.main, 44, 12, 2.3);
    dropPoints.slice(0, 12).forEach((point) => {
      this.candies.drop(point.x, point.z, worm.skin.main, Math.round(rand(7, 16)));
    });
    this.audio?.kill();

    if (worm === this.player) {
      this.lastRank = rank;
      this.deathPos = { x: worm.x, z: worm.z };
      this.deathTime = 0;
      this.state = 'dead';
      this.audio?.stopBoost();
      this.audio?.death();
      this.emit('death', {
        score: Math.floor(worm.score),
        length: this.getLength(),
        rank
      });
      this.emit('state', 'dead');
    } else {
      worm.respawnTimer = rand(2.4, 4);
      if (killer === this.player && this.state === 'playing') {
        this.player.addScore(32);
        this.emit('kill', { name: worm.name });
        this.burst(worm.x, worm.headY, worm.z, this.player.skin.glow, 26, 8, 1.7);
      }
    }
  }

  spawnParticle(x, y, z, color, vx, vy, vz, size, life) {
    const index = this.particleCursor;
    this.particleCursor = (this.particleCursor + 1) % this.particleCount;
    const particle = this.particleData[index];
    particle.x = x;
    particle.y = y;
    particle.z = z;
    particle.vx = vx;
    particle.vy = vy;
    particle.vz = vz;
    particle.life = life;
    particle.maxLife = life;
    particle.size = size;
    particle.color.set(color);
    const colorAttribute = this.particleGeometry.getAttribute('aColor');
    colorAttribute.setXYZ(index, particle.color.r, particle.color.g, particle.color.b);
    colorAttribute.needsUpdate = true;
  }

  burst(x, y, z, color, count = 12, speed = 6, size = 1.2) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const lift = rand(-0.2, 1);
      const radius = rand(0.2, 1);
      const magnitude = rand(speed * 0.35, speed);
      this.spawnParticle(
        x + Math.cos(angle) * radius,
        y + rand(-0.2, 0.7),
        z + Math.sin(angle) * radius,
        color,
        Math.cos(angle) * magnitude,
        lift * speed * 0.75,
        Math.sin(angle) * magnitude,
        size * rand(0.55, 1.25),
        rand(0.45, 1.15)
      );
    }
  }

  spawnShockwave(x, z, color) {
    if (this.shockwaves.length >= 5) return;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(this.shockGeometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.12, z);
    this.scene.add(mesh);
    this.shockwaves.push({ mesh, life: 0 });
  }

  updateParticles(dt) {
    const positions = this.particleGeometry.getAttribute('position');
    const sizes = this.particleGeometry.getAttribute('aSize');
    const alphas = this.particleGeometry.getAttribute('aAlpha');
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.particleData[i];
      if (particle.life <= 0) {
        alphas.setX(i, 0);
        sizes.setX(i, 0);
        continue;
      }
      particle.life -= dt;
      if (particle.life <= 0) {
        alphas.setX(i, 0);
        sizes.setX(i, 0);
        continue;
      }
      particle.vy -= dt * 4.2;
      const drag = Math.exp(-dt * 1.5);
      particle.vx *= drag;
      particle.vz *= drag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.z += particle.vz * dt;
      const progress = particle.life / particle.maxLife;
      positions.setXYZ(i, particle.x, particle.y, particle.z);
      sizes.setX(i, particle.size * (0.6 + progress * 0.7));
      alphas.setX(i, progress);
    }
    positions.needsUpdate = true;
    sizes.needsUpdate = true;
    alphas.needsUpdate = true;
  }

  updateShockwaves(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const wave = this.shockwaves[i];
      wave.life += dt;
      const scale = 1 + wave.life * 16;
      wave.mesh.scale.setScalar(scale);
      wave.mesh.material.opacity = Math.max(0, 0.8 - wave.life * 1.4);
      if (wave.life > 0.6) {
        this.scene.remove(wave.mesh);
        wave.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  updateEnvironment(dt) {
    this.ringMaterial.opacity = 0.45 + Math.sin(this.time * 0.9) * 0.1;
    this.homeRing.scale.setScalar(1 + Math.sin(this.time * 1.3) * 0.06);
    this.homeRing.material.opacity = 0.2 + Math.sin(this.time * 1.3) * 0.06;
    this.centerHeart.rotation.y = this.time * 0.22;
    this.centerHeart.material.opacity = 0.28 + Math.sin(this.time * 1.4) * 0.06;
    this.centerAura.material.opacity = 0.14 + Math.sin(this.time * 1.1) * 0.04;
    this.auraRings.forEach((ring, index) => {
      ring.material.opacity = 0.055 + Math.sin(this.time * 0.55 + index * 1.7) * 0.025;
    });
    this.decorData.forEach((data, index) => {
      const y = data.baseY + Math.sin(this.time * data.speed + data.phase) * 1.6;
      this.dummy.position.set(data.x, y, data.z);
      this.dummy.rotation.set(-Math.PI / 2, this.time * data.spin + data.phase, 0);
      const pulse = data.scale * (1 + Math.sin(this.time * 0.8 + data.phase) * 0.06);
      this.dummy.scale.setScalar(pulse);
      this.dummy.updateMatrix();
      this.decorMesh.setMatrixAt(index, this.dummy.matrix);
    });
    this.decorMesh.instanceMatrix.needsUpdate = true;
    this.stars.rotation.y = this.time * 0.006;
    this.bokeh.forEach((sprite) => {
      sprite.position.y = sprite.userData.baseY + Math.sin(this.time * 0.3 + sprite.userData.phase) * 2;
    });
    if (this.playerLight) {
      this.playerLight.intensity = 16 + Math.sin(this.time * 3) * 4;
    }
  }

  updateCamera(dt) {
    let desiredX;
    let desiredY;
    let desiredZ;
    let lookX;
    let lookY;
    let lookZ;
    const portrait = this.camera.aspect < 0.82;

    if (this.state === 'menu') {
      const angle = this.time * 0.08;
      desiredX = Math.cos(angle) * 39;
      desiredY = 24;
      desiredZ = Math.sin(angle) * 39;
      lookX = 0;
      lookY = 4.5;
      lookZ = 0;
    } else if (this.state === 'dead') {
      const angle = this.deathTime * 0.22 + 0.8;
      desiredX = this.deathPos.x + Math.cos(angle) * 21;
      desiredY = 14;
      desiredZ = this.deathPos.z + Math.sin(angle) * 21;
      lookX = this.deathPos.x;
      lookY = 1.6;
      lookZ = this.deathPos.z;
    } else {
      const height = portrait ? 41 : 35;
      const back = portrait ? 25 : 23;
      desiredX = this.player.x;
      desiredY = this.player.headY + height;
      desiredZ = this.player.z + back;
      lookX = this.player.x + Math.cos(this.player.heading) * 7;
      lookY = this.player.headY + 0.9;
      lookZ = this.player.z + Math.sin(this.player.heading) * 7;
    }

    if (this.cameraSnap) {
      this.camera.position.set(desiredX, desiredY, desiredZ);
      this.camLook.set(lookX, lookY, lookZ);
      this.cameraSnap = false;
    } else {
      const lambda = this.state === 'menu' ? 1.4 : 5.2;
      this.camera.position.x = damp(this.camera.position.x, desiredX, lambda, dt);
      this.camera.position.y = damp(this.camera.position.y, desiredY, lambda, dt);
      this.camera.position.z = damp(this.camera.position.z, desiredZ, lambda, dt);
      this.camLook.x = damp(this.camLook.x, lookX, lambda + 1, dt);
      this.camLook.y = damp(this.camLook.y, lookY, lambda + 1, dt);
      this.camLook.z = damp(this.camLook.z, lookZ, lambda + 1, dt);
    }

    this.camera.lookAt(this.camLook);
    const targetFov = (portrait ? 61 : 57) + (this.player.boosting && this.state === 'playing' ? 3.5 : 0);
    this.camera.fov = damp(this.camera.fov, targetFov, 5, dt);
    this.camera.updateProjectionMatrix();

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2.4);
      const amount = this.shake * 0.6;
      this.camera.position.x += rand(-amount, amount);
      this.camera.position.y += rand(-amount, amount);
      this.camera.position.z += rand(-amount, amount);
    }
  }

  loop(now) {
    const raw = (now - this.lastFrame) / 1000;
    this.lastFrame = now;
    const dt = Math.max(0, Math.min(0.05, raw));
    this.fps = this.fps * 0.94 + (1 / Math.max(0.0001, raw)) * 0.06;

    if (this.quality === 'auto' && !this.autoQualityLow && this.state === 'playing') {
      this.autoQualityTimer += raw;
      if (this.autoQualityTimer > 7) {
        this.autoQualityTimer = 0;
        if (this.fps < 24) {
          this.autoQualityLow = true;
          this.bloomPass.enabled = false;
          this.renderer.setPixelRatio(1);
          this.onResize();
        }
      }
    }

    if (this.state !== 'paused') {
      this.time += dt;
      this.updateEnvironment(dt);
      if (this.state === 'menu') this.updateMenu(dt);
      else if (this.state === 'playing') this.updatePlaying(dt);
      else if (this.state === 'dead') this.updateDead(dt);
      this.candies.update(dt, this.time, this.state === 'playing' ? this.player : null);
      this.updateParticles(dt);
      this.updateShockwaves(dt);
      this.updateCamera(dt);
      this.bots.forEach((bot) => {
        if (bot.alive || bot === this.player || this.state === 'menu') return;
        bot.respawnTimer = (bot.respawnTimer ?? 0) - dt;
        if (bot.respawnTimer <= 0) this.respawnBot(bot);
      });
    }

    this.composer.render();
    requestAnimationFrame(this.loop);
  }

  getDebugState() {
    return {
      state: this.state,
      fps: Math.round(this.fps),
      score: Math.floor(this.player.score),
      rank: this.getPlayerRank(),
      length: this.getLength(),
      worms: this.worms.filter((worm) => worm.alive).length,
      drawCalls: this.renderer.info.render.calls
    };
  }
}
