import * as THREE from 'three';

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function dampAngle(current, target, lambda, dt) {
  return current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt));
}

export function randomPointInCircle(radius) {
  const r = Math.sqrt(Math.random()) * radius;
  const a = Math.random() * Math.PI * 2;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

export function hexToRgba(hex, alpha) {
  const value = typeof hex === 'number' ? hex : parseInt(String(hex).replace('#', ''), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function makeGlowTexture() {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.75)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function heartPath(ctx, x, y, size, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(0, 0.35);
  ctx.bezierCurveTo(0, 0.9, 1.02, 1.02, 1.02, 0.15);
  ctx.bezierCurveTo(1.02, -0.55, 0.35, -0.92, 0, -1.25);
  ctx.bezierCurveTo(-0.35, -0.92, -1.02, -0.55, -1.02, 0.15);
  ctx.bezierCurveTo(-1.02, 1.02, 0, 0.9, 0, 0.35);
  ctx.closePath();
  ctx.restore();
}

export function makeGroundTexture(theme) {
  const canvas = makeCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  const [dark, mid, center, edge] = theme.ground;

  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, 1024, 1024);

  const gradient = ctx.createRadialGradient(512, 512, 16, 512, 512, 512);
  gradient.addColorStop(0, center);
  gradient.addColorStop(0.43, mid);
  gradient.addColorStop(0.86, dark);
  gradient.addColorStop(1, edge);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.globalCompositeOperation = 'screen';
  theme.palette.forEach((color, index) => {
    for (let i = 0; i < 3; i++) {
      const x = rand(40, 984);
      const y = rand(40, 984);
      const radius = rand(70, 240);
      const blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
      blob.addColorStop(0, hexToRgba(color, 0.06 + (index % 3) * 0.012));
      blob.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = blob;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  });

  for (let i = 0; i < 26; i++) {
    ctx.save();
    ctx.globalAlpha = rand(0.03, 0.09);
    ctx.fillStyle = pick(theme.decor);
    heartPath(ctx, rand(60, 964), rand(60, 964), rand(30, 105), rand(-0.5, 0.5));
    ctx.fill();
    ctx.restore();
  }

  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = hexToRgba(theme.palette[i % theme.palette.length], 0.075);
    ctx.beginPath();
    ctx.arc(512, 512, 180 + i * 76, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 620; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * 500;
    const x = 512 + Math.cos(a) * d;
    const y = 512 + Math.sin(a) * d;
    const r = rand(0.7, 2.6);
    ctx.globalAlpha = rand(0.12, 0.7);
    ctx.fillStyle = pick(theme.stars);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 140; i++) {
    ctx.globalAlpha = rand(0.04, 0.2);
    ctx.fillStyle = pick(theme.palette);
    const x = rand(0, 1024);
    const y = rand(0, 1024);
    ctx.fillRect(x, y, rand(1, 3), rand(1, 3));
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function tintInstanceEmissive(material) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'
    );
  };
  material.customProgramCacheKey = () => 'instance-emissive-tint';
  return material;
}

export function makeHeartGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.35);
  shape.bezierCurveTo(0, 0.9, 1.02, 1.02, 1.02, 0.15);
  shape.bezierCurveTo(1.02, -0.55, 0.35, -0.92, 0, -1.25);
  shape.bezierCurveTo(-0.35, -0.92, -1.02, -0.55, -1.02, 0.15);
  shape.bezierCurveTo(-1.02, 1.02, 0, 0.9, 0, 0.35);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.12,
    curveSegments: 18
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

export function makeNameSprite(name, color, isPlayer = false) {
  const canvas = makeCanvas(512, 128);
  const ctx = canvas.getContext('2d');
  const width = Math.max(190, ctx.measureText(name).width);
  const label = name.slice(0, 14).toUpperCase();
  ctx.font = '900 46px "Trebuchet MS", sans-serif';
  const measured = ctx.measureText(label).width;
  const pad = 34;
  const boxWidth = Math.min(480, measured + pad * 2);
  const x = (512 - boxWidth) / 2;
  ctx.fillStyle = isPlayer ? 'rgba(20, 5, 16, 0.82)' : 'rgba(12, 5, 16, 0.62)';
  ctx.beginPath();
  ctx.roundRect(x, 24, boxWidth, 80, 38);
  ctx.fill();
  ctx.lineWidth = isPlayer ? 4 : 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = isPlayer ? color : '#fff4fa';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillText(label, 256, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity: isPlayer ? 1 : 0.9
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.2, 1.3, 1);
  sprite.position.y = 3.3;
  sprite.renderOrder = 3;
  return sprite;
}

export function formatScore(value) {
  return Math.max(0, Math.floor(value)).toLocaleString('es-ES');
}

export function tintColor(hex, amount) {
  const color = new THREE.Color(hex);
  if (amount > 0) color.lerp(new THREE.Color(0xffffff), amount);
  else color.lerp(new THREE.Color(0x000000), -amount);
  return color;
}
