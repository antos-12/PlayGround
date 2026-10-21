import * as THREE from "three";
import { ARENA_RADIUS, randomPointInCircle } from "./logic.js";
import { HEART_GEOMETRY } from "./worm.js";

const GLOW_TEXTURE = createGlowTexture();
const SPHERE_GEOMETRY = new THREE.IcosahedronGeometry(0.42, 1);
const RING_GEOMETRY = new THREE.RingGeometry(ARENA_RADIUS - 0.7, ARENA_RADIUS + 1.4, 192);

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawHeart(context, x, y, size, color, rotation = 0) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(size, size);
  context.beginPath();
  context.moveTo(0, 0.3);
  context.bezierCurveTo(0.02, 0.52, 0.28, 0.66, 0.52, 0.55);
  context.bezierCurveTo(0.95, 0.36, 0.94, -0.08, 0.54, -0.36);
  context.bezierCurveTo(0.25, -0.57, 0.04, -0.7, 0, -0.82);
  context.bezierCurveTo(-0.04, -0.7, -0.25, -0.57, -0.54, -0.36);
  context.bezierCurveTo(-0.94, -0.08, -0.95, 0.36, -0.52, 0.55);
  context.bezierCurveTo(-0.28, 0.66, -0.02, 0.52, 0, 0.3);
  context.fillStyle = color;
  context.fill();
  context.restore();
}

function createGroundTexture(theme) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  const base = new THREE.Color(theme.ground).getStyle();
  const edge = new THREE.Color(theme.groundEdge).getStyle();
  const accent = theme.accent;

  context.fillStyle = base;
  context.fillRect(0, 0, 1024, 1024);

  const radial = context.createRadialGradient(512, 512, 54, 512, 512, 560);
  radial.addColorStop(0, rgba(theme.accent, 0.08));
  radial.addColorStop(0.45, rgba(theme.accent, 0.02));
  radial.addColorStop(1, edge);
  context.fillStyle = radial;
  context.fillRect(0, 0, 1024, 1024);

  context.strokeStyle = rgba(theme.accent, 0.075);
  context.lineWidth = 2;
  for (let radius = 120; radius < 760; radius += 84) {
    context.beginPath();
    context.arc(512, 512, radius, 0, Math.PI * 2);
    context.stroke();
  }

  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 120; i += 1) {
    const x = random() * 1024;
    const y = random() * 1024;
    const size = 8 + random() * 22;
    drawHeart(context, x, y, size, rgba(theme.accent, 0.026 + random() * 0.04), (random() - 0.5) * 0.5);
  }

  for (let i = 0; i < 320; i += 1) {
    const x = random() * 1024;
    const y = random() * 1024;
    const radius = 0.6 + random() * 1.8;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = rgba(theme.accent, 0.05 + random() * 0.09);
    context.fill();
  }

  context.strokeStyle = rgba(theme.accent, 0.04);
  context.lineWidth = 18;
  for (let i = 0; i < 14; i += 1) {
    context.beginPath();
    context.moveTo(random() * 1024, random() * 1024);
    context.bezierCurveTo(random() * 1024, random() * 1024, random() * 1024, random() * 1024, random() * 1024, random() * 1024);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.4, 2.4);
  texture.anisotropy = 4;
  return texture;
}

class FoodField {
  constructor(scene, theme, count = 410) {
    this.scene = scene;
    this.count = count;
    this.theme = theme;
    this.items = [];
    this.orbCount = 0;
    this.heartCount = 0;

    this.orbMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      emissive: 0xffffff,
      emissiveIntensity: 0.18,
    });
    this.heartMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.24,
      metalness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      emissive: 0xffffff,
      emissiveIntensity: 0.12,
      side: THREE.DoubleSide,
    });

    this.orbMesh = new THREE.InstancedMesh(SPHERE_GEOMETRY, this.orbMaterial, count);
    this.heartMesh = new THREE.InstancedMesh(HEART_GEOMETRY, this.heartMaterial, count);
    this.orbMesh.frustumCulled = false;
    this.heartMesh.frustumCulled = false;
    this.orbMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.heartMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.orbMesh);
    scene.add(this.heartMesh);

    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const type = Math.random() < 0.52 ? "heart" : "orb";
      const point = randomPointInCircle(ARENA_RADIUS - 6);
      const big = Math.random() < 0.2;
      const item = {
        x: point.x,
        z: point.z,
        type,
        big,
        value: big ? 9 : 3,
        color: new THREE.Color(theme.food[Math.floor(Math.random() * theme.food.length)]),
        phase: Math.random() * Math.PI * 2,
        spin: 0.3 + Math.random() * 1.1,
        scale: (big ? 1.34 : 1) * (0.86 + Math.random() * 0.28),
        index: type === "heart" ? this.heartCount++ : this.orbCount++,
      };
      this.items.push(item);
      const mesh = type === "heart" ? this.heartMesh : this.orbMesh;
      mesh.setColorAt(item.index, item.color);
    }

    this.orbMesh.count = this.orbCount;
    this.heartMesh.count = this.heartCount;
    if (this.orbMesh.instanceColor) this.orbMesh.instanceColor.needsUpdate = true;
    if (this.heartMesh.instanceColor) this.heartMesh.instanceColor.needsUpdate = true;

    this.glowPositions = new Float32Array(count * 3);
    this.glowColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const item = this.items[i];
      this.glowColors[i * 3] = item.color.r;
      this.glowColors[i * 3 + 1] = item.color.g;
      this.glowColors[i * 3 + 2] = item.color.b;
    }
    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute("position", new THREE.BufferAttribute(this.glowPositions, 3));
    glowGeometry.setAttribute("color", new THREE.BufferAttribute(this.glowColors, 3));
    this.glow = new THREE.Points(
      glowGeometry,
      new THREE.PointsMaterial({
        map: GLOW_TEXTURE,
        size: 2.3,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
      }),
    );
    this.glow.frustumCulled = false;
    scene.add(this.glow);

    this.writeInitialMatrices();
  }

  writeInitialMatrices() {
    for (let i = 0; i < this.count; i += 1) this.writeItem(i, 0, true);
    this.orbMesh.instanceMatrix.needsUpdate = true;
    this.heartMesh.instanceMatrix.needsUpdate = true;
    this.glow.geometry.attributes.position.needsUpdate = true;
    this.glow.geometry.attributes.color.needsUpdate = true;
  }

  writeItem(i, time, initial = false) {
    const item = this.items[i];
    const bob = Math.sin(time * 1.7 + item.phase) * 0.17;
    const y = 0.9 + bob + (item.big ? 0.12 : 0);
    const mesh = item.type === "heart" ? this.heartMesh : this.orbMesh;
    this.dummy.position.set(item.x, y, item.z);
    if (item.type === "heart") {
      this.dummy.rotation.set(-0.32, time * item.spin + item.phase, 0);
      this.dummy.scale.setScalar(0.6 * item.scale);
    } else {
      this.dummy.rotation.set(0, time * item.spin + item.phase, 0);
      this.dummy.scale.setScalar(0.64 * item.scale);
    }
    this.dummy.updateMatrix();
    mesh.setMatrixAt(item.index, this.dummy.matrix);

    this.glowPositions[i * 3] = item.x;
    this.glowPositions[i * 3 + 1] = y + 0.15;
    this.glowPositions[i * 3 + 2] = item.z;
  }

  update(time) {
    for (let i = 0; i < this.count; i += 1) this.writeItem(i, time);
    this.orbMesh.instanceMatrix.needsUpdate = true;
    this.heartMesh.instanceMatrix.needsUpdate = true;
    this.glow.geometry.attributes.position.needsUpdate = true;
  }

  respawn(i) {
    const item = this.items[i];
    const point = randomPointInCircle(ARENA_RADIUS - 6);
    item.x = point.x;
    item.z = point.z;
    item.big = Math.random() < 0.2;
    item.value = item.big ? 9 : 3;
    item.scale = (item.big ? 1.34 : 1) * (0.86 + Math.random() * 0.28);
    item.phase = Math.random() * Math.PI * 2;
    item.spin = 0.3 + Math.random() * 1.1;
    item.color.set(this.theme.food[Math.floor(Math.random() * this.theme.food.length)]);
    const mesh = item.type === "heart" ? this.heartMesh : this.orbMesh;
    mesh.setColorAt(item.index, item.color);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.glowColors[i * 3] = item.color.r;
    this.glowColors[i * 3 + 1] = item.color.g;
    this.glowColors[i * 3 + 2] = item.color.b;
    this.glow.geometry.attributes.color.needsUpdate = true;
  }

  setTheme(theme) {
    this.theme = theme;
    for (let i = 0; i < this.count; i += 1) {
      const item = this.items[i];
      item.color.set(theme.food[Math.floor(Math.random() * theme.food.length)]);
      const mesh = item.type === "heart" ? this.heartMesh : this.orbMesh;
      mesh.setColorAt(item.index, item.color);
      this.glowColors[i * 3] = item.color.r;
      this.glowColors[i * 3 + 1] = item.color.g;
      this.glowColors[i * 3 + 2] = item.color.b;
    }
    if (this.orbMesh.instanceColor) this.orbMesh.instanceColor.needsUpdate = true;
    if (this.heartMesh.instanceColor) this.heartMesh.instanceColor.needsUpdate = true;
    this.glow.geometry.attributes.color.needsUpdate = true;
  }
}

class Sparkles {
  constructor(scene, count = 320) {
    this.count = count;
    this.particles = [];
    this.cursor = 0;
    this.positions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: GLOW_TEXTURE,
        size: 0.72,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: true,
      }),
    );
    this.points.frustumCulled = false;
    scene.add(this.points);
    for (let i = 0; i < count; i += 1) {
      this.particles.push({ life: 0, maxLife: 1, vx: 0, vy: 0, vz: 0 });
      this.positions[i * 3 + 1] = -999;
    }
  }

  emit(x, y, z, color, count = 5, power = 3) {
    const colorValue = color instanceof THREE.Color ? color : new THREE.Color(color);
    for (let n = 0; n < count; n += 1) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.count;
      const particle = this.particles[i];
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.3 + Math.random() * 0.7);
      particle.life = 0.35 + Math.random() * 0.5;
      particle.maxLife = particle.life;
      particle.vx = Math.cos(angle) * speed;
      particle.vz = Math.sin(angle) * speed;
      particle.vy = 1 + Math.random() * power;
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      this.colors[i * 3] = colorValue.r;
      this.colors[i * 3 + 1] = colorValue.g;
      this.colors[i * 3 + 2] = colorValue.b;
    }
    this.points.geometry.attributes.color.needsUpdate = true;
  }

  update(dt) {
    for (let i = 0; i < this.count; i += 1) {
      const particle = this.particles[i];
      if (particle.life <= 0) continue;
      particle.life -= dt;
      if (particle.life <= 0) {
        this.positions[i * 3 + 1] = -999;
        continue;
      }
      particle.vy -= 3.2 * dt;
      this.positions[i * 3] += particle.vx * dt;
      this.positions[i * 3 + 1] += particle.vy * dt;
      this.positions[i * 3 + 2] += particle.vz * dt;
      particle.vx *= 0.98;
      particle.vz *= 0.98;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

export class World {
  constructor(canvas, theme) {
    this.canvas = canvas;
    this.theme = theme;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setClearColor(new THREE.Color(theme.skyBottom), 1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(theme.skyBottom);
    this.scene.fog = new THREE.FogExp2(theme.fog, 0.0082);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);
    this.camera.position.set(0, 38, 62);
    this.camera.lookAt(0, 0, 0);

    this.buildSky();
    this.buildLights();
    this.buildGround();
    this.buildAmbience();

    this.food = new FoodField(this.scene, theme);
    this.sparkles = new Sparkles(this.scene);
    this.setTheme(theme);
    this.resize(window.innerWidth, window.innerHeight);
  }

  buildSky() {
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(this.theme.skyTop) },
        bottomColor: { value: new THREE.Color(this.theme.skyBottom) },
        offset: { value: 36 },
        exponent: { value: 0.72 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          float mixValue = pow(max(h, 0.0), exponent);
          gl_FragColor = vec4(mix(bottomColor, topColor, mixValue), 1.0);
        }
      `,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(430, 32, 18), this.skyMaterial);
    this.scene.add(this.sky);

    const starCount = 260;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const color = new THREE.Color();
    for (let i = 0; i < starCount; i += 1) {
      const radius = 250 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.44;
      positions[i * 3] = Math.cos(theta) * Math.sin(phi) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.82;
      positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
      color.set(i % 3 === 0 ? this.theme.accent : "#ffffff");
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        map: GLOW_TEXTURE,
        size: 2.4,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        fog: false,
      }),
    );
    this.scene.add(this.stars);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(this.theme.hemiSky, this.theme.hemiGround, 1.35);
    this.scene.add(this.hemi);

    this.keyLight = new THREE.DirectionalLight(this.theme.key, 1.9);
    this.keyLight.position.set(38, 82, 24);
    this.scene.add(this.keyLight);

    this.pointA = new THREE.PointLight(this.theme.pointA, 320, 180, 1.5);
    this.pointA.position.set(-52, 30, 28);
    this.scene.add(this.pointA);

    this.pointB = new THREE.PointLight(this.theme.pointB, 280, 180, 1.6);
    this.pointB.position.set(48, 24, -40);
    this.scene.add(this.pointB);

    const ambient = new THREE.AmbientLight(this.theme.ambient, 0.42);
    this.scene.add(ambient);
    this.ambient = ambient;
  }

  buildGround() {
    this.groundTexture = createGroundTexture(this.theme);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      color: 0xffffff,
      roughness: 0.58,
      metalness: 0.22,
    });
    this.ground = new THREE.Mesh(new THREE.CircleGeometry(ARENA_RADIUS + 10, 96), this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.scene.add(this.ground);

    this.base = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_RADIUS + 11, ARENA_RADIUS + 7, 3.2, 128),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(this.theme.groundEdge), roughness: 0.8, metalness: 0.18 }),
    );
    this.base.position.y = -1.7;
    this.scene.add(this.base);

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.theme.ring),
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ring = new THREE.Mesh(RING_GEOMETRY, this.ringMaterial);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.06;
    this.scene.add(this.ring);

    this.ringGlowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.theme.ring),
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.ringGlow = new THREE.Mesh(new THREE.RingGeometry(ARENA_RADIUS + 1, ARENA_RADIUS + 8, 128), this.ringGlowMaterial);
    this.ringGlow.rotation.x = -Math.PI / 2;
    this.ringGlow.position.y = 0.04;
    this.scene.add(this.ringGlow);
  }

  buildAmbience() {
    const count = 38;
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.ambientHearts = new THREE.InstancedMesh(HEART_GEOMETRY, material, count);
    this.ambientHearts.frustumCulled = false;
    this.ambientHeartData = [];
    this.ambientDummy = new THREE.Object3D();
    this.ambientColor = new THREE.Color();
    const random = (min, max) => min + Math.random() * (max - min);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = random(12, 128);
      const data = {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: random(7, 32),
        scale: random(0.8, 3.1),
        speed: random(0.08, 0.3),
        phase: Math.random() * Math.PI * 2,
        spin: random(-0.2, 0.2),
      };
      this.ambientHeartData.push(data);
      this.ambientColor.set(this.theme.food[i % this.theme.food.length]);
      this.ambientHearts.setColorAt(i, this.ambientColor);
      this.ambientDummy.position.set(data.x, data.y, data.z);
      this.ambientDummy.scale.setScalar(data.scale);
      this.ambientDummy.updateMatrix();
      this.ambientHearts.setMatrixAt(i, this.ambientDummy.matrix);
    }
    if (this.ambientHearts.instanceColor) this.ambientHearts.instanceColor.needsUpdate = true;
    this.scene.add(this.ambientHearts);

    this.rimHearts = new THREE.InstancedMesh(
      HEART_GEOMETRY,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.theme.ring),
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      18,
    );
    this.rimHearts.frustumCulled = false;
    this.rimDummy = new THREE.Object3D();
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.2;
      const radius = ARENA_RADIUS + 4;
      this.rimDummy.position.set(Math.cos(angle) * radius, 2.2 + Math.random() * 4, Math.sin(angle) * radius);
      this.rimDummy.rotation.set(-0.1, -angle, 0);
      this.rimDummy.scale.setScalar(2.4 + Math.random() * 3.4);
      this.rimDummy.updateMatrix();
      this.rimHearts.setMatrixAt(i, this.rimDummy.matrix);
    }
    this.scene.add(this.rimHearts);
  }

  setTheme(theme) {
    this.theme = theme;
    this.renderer.setClearColor(new THREE.Color(theme.skyBottom), 1);
    this.scene.background = new THREE.Color(theme.skyBottom);
    this.scene.fog.color.set(theme.fog);
    this.skyMaterial.uniforms.topColor.value.set(theme.skyTop);
    this.skyMaterial.uniforms.bottomColor.value.set(theme.skyBottom);
    this.hemi.color.set(theme.hemiSky);
    this.hemi.groundColor.set(theme.hemiGround);
    this.hemi.intensity = 1.35;
    this.keyLight.color.set(theme.key);
    this.pointA.color.set(theme.pointA);
    this.pointB.color.set(theme.pointB);
    this.ambient.color.set(theme.ambient);

    const oldTexture = this.groundTexture;
    this.groundTexture = createGroundTexture(theme);
    this.groundMaterial.map = this.groundTexture;
    this.groundMaterial.needsUpdate = true;
    oldTexture?.dispose();
    this.base.material.color.set(theme.groundEdge);
    this.ringMaterial.color.set(theme.ring);
    this.ringGlowMaterial.color.set(theme.ring);
    this.rimHearts.material.color.set(theme.ring);

    for (let i = 0; i < this.ambientHeartData.length; i += 1) {
      this.ambientColor.set(theme.food[i % theme.food.length]);
      this.ambientHearts.setColorAt(i, this.ambientColor);
    }
    if (this.ambientHearts.instanceColor) this.ambientHearts.instanceColor.needsUpdate = true;
    this.food?.setTheme(theme);
  }

  updateAmbient(time) {
    for (let i = 0; i < this.ambientHeartData.length; i += 1) {
      const data = this.ambientHeartData[i];
      const drift = time * data.speed + data.phase;
      const x = data.x + Math.cos(drift) * 3.2;
      const y = data.y + Math.sin(drift * 0.8) * 1.3;
      const z = data.z + Math.sin(drift) * 3.2;
      this.ambientDummy.position.set(x, y, z);
      const cameraDistance = Math.hypot(x - this.camera.position.x, y - this.camera.position.y, z - this.camera.position.z);
      const fade = THREE.MathUtils.smoothstep(cameraDistance, 9, 24);
      this.ambientDummy.rotation.set(-0.12, time * data.spin + data.phase, Math.sin(drift * 0.5) * 0.12);
      this.ambientDummy.scale.setScalar(data.scale * fade);
      this.ambientDummy.updateMatrix();
      this.ambientHearts.setMatrixAt(i, this.ambientDummy.matrix);
    }
    this.ambientHearts.instanceMatrix.needsUpdate = true;
    this.rimHearts.rotation.y = time * 0.02;
    this.stars.rotation.y = time * 0.004;
  }

  resize(width, height) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.fov = this.camera.aspect < 0.78 ? 60 : 53;
    this.camera.updateProjectionMatrix();
  }

  setQuality(quality) {
    const ratio = quality === "low" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(ratio);
    this.food.glow.visible = quality !== "low";
    this.stars.visible = quality !== "low";
    this.ambientHearts.visible = quality !== "low";
    this.resize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
