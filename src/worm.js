import * as THREE from "three";
import {
  BASE_SPEED,
  BOOST_MULTIPLIER,
  BOOST_TURN_RATE,
  HEAD_RADIUS,
  MAX_SEGMENTS,
  MIN_BOOST_LENGTH,
  SEGMENT_SPACING,
  START_LENGTH,
  TURN_RATE,
  clamp,
  lengthToSegments,
  samplePathBatch,
  trimPath,
  turnToward,
} from "./logic.js";

const BODY_GEOMETRY = new THREE.SphereGeometry(1, 12, 9);
const HEAD_GEOMETRY = new THREE.SphereGeometry(1.32, 20, 14);
const EYE_GEOMETRY = new THREE.SphereGeometry(0.3, 10, 8);
const PUPIL_GEOMETRY = new THREE.SphereGeometry(0.145, 8, 6);
const SHINE_GEOMETRY = new THREE.SphereGeometry(0.055, 6, 4);
export const HEART_GEOMETRY = createHeartGeometry();
const SHADOW_TEXTURE = createRadialTexture("rgba(0,0,0,0.62)", "rgba(0,0,0,0)");
const EYE_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: 0xfffafd,
  roughness: 0.16,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  emissive: 0xffeef6,
  emissiveIntensity: 0.14,
});
const PUPIL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x26101f, roughness: 0.35 });
const SHINE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffffff });

function createHeartGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.55);
  shape.bezierCurveTo(0.03, 0.83, 0.4, 1.04, 0.76, 0.88);
  shape.bezierCurveTo(1.37, 0.6, 1.36, -0.12, 0.78, -0.58);
  shape.bezierCurveTo(0.36, -0.92, 0.06, -1.12, 0, -1.25);
  shape.bezierCurveTo(-0.06, -1.12, -0.36, -0.92, -0.78, -0.58);
  shape.bezierCurveTo(-1.36, -0.12, -1.37, 0.6, -0.76, 0.88);
  shape.bezierCurveTo(-0.4, 1.04, -0.03, 0.83, 0, 0.55);
  const outline = shape.getPoints(4);
  const polygon = new THREE.Shape();
  polygon.moveTo(outline[0].x, outline[0].y);
  for (let i = 1; i < outline.length; i += 1) polygon.lineTo(outline[i].x, outline[i].y);
  polygon.closePath();
  const geometry = new THREE.ExtrudeGeometry(polygon, {
    depth: 0.28,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    curveSegments: 1,
    steps: 1,
  });
  geometry.center();
  return geometry;
}

export function createRadialTexture(inner, outer, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.45, inner);
  gradient.addColorStop(1, outer);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture(name, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 512, 128);
  context.font = '800 42px "Segoe UI", system-ui, sans-serif';
  const width = Math.min(480, Math.max(120, context.measureText(name).width + 64));
  const left = (512 - width) / 2;
  const top = 26;
  const height = 74;
  const radius = 30;
  context.beginPath();
  context.moveTo(left + radius, top);
  context.arcTo(left + width, top, left + width, top + height, radius);
  context.arcTo(left + width, top + height, left, top + height, radius);
  context.arcTo(left, top + height, left, top, radius);
  context.arcTo(left, top, left + width, top, radius);
  context.closePath();
  context.fillStyle = "rgba(12,4,19,0.68)";
  context.fill();
  context.strokeStyle = color;
  context.globalAlpha = 0.55;
  context.lineWidth = 2;
  context.stroke();
  context.globalAlpha = 1;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff7fb";
  context.shadowColor = "rgba(0,0,0,0.65)";
  context.shadowBlur = 8;
  context.fillText(name, 256, top + height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class Worm {
  constructor(scene, { name = "Gusano", skin, isPlayer = false }) {
    this.scene = scene;
    this.name = name;
    this.skin = skin;
    this.isPlayer = isPlayer;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.phase = Math.random() * Math.PI * 2;
    this.x = 0;
    this.z = 0;
    this.angle = 0;
    this.length = START_LENGTH;
    this.score = 0;
    this.alive = false;
    this.removed = false;
    this.boosting = false;
    this.boostWanted = false;
    this.positions = [];
    this.path = [];
    this.segmentCount = lengthToSegments(START_LENGTH);
    this.coloredCount = 0;
    this.skinDirty = true;

    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.27,
      metalness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      emissive: new THREE.Color(skin.glow),
      emissiveIntensity: 0.12,
    });
    this.bodyMesh = new THREE.InstancedMesh(BODY_GEOMETRY, this.bodyMaterial, MAX_SEGMENTS);
    this.bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodyMesh.frustumCulled = false;
    this.bodyMesh.count = 0;
    this.group.add(this.bodyMesh);
    this.dummy = new THREE.Object3D();
    this.tmpColor = new THREE.Color();
    this.colorPrimary = new THREE.Color(skin.primary);
    this.colorSecondary = new THREE.Color(skin.secondary);

    this.headGroup = new THREE.Group();
    this.group.add(this.headGroup);
    this.headMaterial = new THREE.MeshPhysicalMaterial({
      color: skin.primary,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color(skin.glow),
      emissiveIntensity: 0.28,
    });
    this.head = new THREE.Mesh(HEAD_GEOMETRY, this.headMaterial);
    this.head.scale.set(1.02, 0.94, 1.08);
    this.headGroup.add(this.head);

    this.eyeGroup = new THREE.Group();
    this.eyeGroup.position.set(0, 0.56, 0.55);
    this.headGroup.add(this.eyeGroup);
    const eyeOffsets = [-0.53, 0.53];
    for (const offset of eyeOffsets) {
      const eye = new THREE.Mesh(EYE_GEOMETRY, EYE_MATERIAL);
      eye.position.set(offset, 0.27, 0.1);
      eye.scale.set(1.05, 1.2, 0.86);
      this.eyeGroup.add(eye);
      const pupil = new THREE.Mesh(PUPIL_GEOMETRY, PUPIL_MATERIAL);
      pupil.position.set(offset * 1.05, 0.33, 0.37);
      this.eyeGroup.add(pupil);
      const shine = new THREE.Mesh(SHINE_GEOMETRY, SHINE_MATERIAL);
      shine.position.set(offset * 1.05 - 0.04, 0.38, 0.47);
      this.eyeGroup.add(shine);
    }

    this.crownMaterial = new THREE.MeshPhysicalMaterial({
      color: skin.secondary,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 1,
      emissive: new THREE.Color(skin.glow),
      emissiveIntensity: 0.42,
    });
    this.crownPivot = new THREE.Group();
    this.crownPivot.position.set(0, 1.25, -0.04);
    this.headGroup.add(this.crownPivot);
    this.crown = new THREE.Mesh(HEART_GEOMETRY, this.crownMaterial);
    this.crown.rotation.x = -Math.PI / 2;
    this.crown.scale.setScalar(0.42);
    this.crownPivot.add(this.crown);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: SHADOW_TEXTURE,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.scale.set(3.9, 3.9, 1);
    this.shadow.position.y = -0.93;
    this.shadow.renderOrder = 1;
    this.headGroup.add(this.shadow);

    this.labelTexture = createLabelTexture(name, skin.glow);
    this.label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.labelTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.94,
      }),
    );
    this.label.scale.set(6.6, 1.65, 1);
    this.label.position.set(0, 0, 0);
    this.group.add(this.label);

    this._pendingTime = 0;
  }

  get headX() {
    return this.x;
  }

  get headZ() {
    return this.z;
  }

  get headRadius() {
    return HEAD_RADIUS;
  }

  setName(name) {
    if (name === this.name) return;
    this.name = name;
    this.labelTexture.dispose();
    this.labelTexture = createLabelTexture(name, this.skin.glow);
    this.label.material.map = this.labelTexture;
    this.label.material.needsUpdate = true;
  }

  setSkin(skin) {
    this.skin = skin;
    this.colorPrimary.set(skin.primary);
    this.colorSecondary.set(skin.secondary);
    this.headMaterial.color.set(skin.primary);
    this.headMaterial.emissive.set(skin.glow);
    this.bodyMaterial.emissive.set(skin.glow);
    this.crownMaterial.color.set(skin.secondary);
    this.crownMaterial.emissive.set(skin.glow);
    this.skinDirty = true;
  }

  spawn({ x, z, angle = 0, length = START_LENGTH }) {
    this.x = x;
    this.z = z;
    this.angle = angle;
    this.length = length;
    this.score = 0;
    this.alive = true;
    this.removed = false;
    this.boosting = false;
    this.boostWanted = false;
    this.coloredCount = 0;
    this.skinDirty = true;
    this.segmentCount = lengthToSegments(length);
    this.path = [];
    const forwardX = Math.sin(angle);
    const forwardZ = Math.cos(angle);
    const pathLength = Math.ceil((this.segmentCount + 20) * SEGMENT_SPACING / 0.38);
    for (let i = 0; i < pathLength; i += 1) {
      this.path.push({ x: x - forwardX * i * 0.38, z: z - forwardZ * i * 0.38 });
    }
    this.group.visible = true;
    this.bodyMesh.visible = true;
    this.headGroup.visible = true;
    this.label.visible = true;
    this.headGroup.position.set(x, 1.02, z);
    this.label.position.set(x, 3.72, z);
  }

  kill() {
    this.alive = false;
    this.boosting = false;
    this.group.visible = false;
  }

  update(dt, time, input = { x: 0, z: 0, active: false, boost: false }, arenaRadius = 96) {
    if (!this.alive) return;

    const magnitude = Math.hypot(input.x || 0, input.z || 0);
    if (input.active && magnitude > 0.04) {
      const targetAngle = Math.atan2(input.x, input.z);
      const turnRate = this.boosting ? BOOST_TURN_RATE : TURN_RATE;
      const before = this.angle;
      this.angle = turnToward(this.angle, targetAngle, turnRate * dt);
      this._pendingTime = clamp((this.angle - before) * 6, -0.45, 0.45);
    } else {
      this._pendingTime *= Math.exp(-8 * dt);
    }

    this.boostWanted = Boolean(input.boost) && !input.stalled && this.length > MIN_BOOST_LENGTH;
    this.boosting = this.boostWanted;
    if (this.boosting) {
      this.length = Math.max(MIN_BOOST_LENGTH, this.length - 15.5 * dt);
    }

    const growth = 1 + Math.min(this.length, 420) * 0.00055;
    const speed = input.stalled ? 0 : BASE_SPEED * growth * (this.boosting ? BOOST_MULTIPLIER : 1);
    const stepX = Math.sin(this.angle) * speed * dt;
    const stepZ = Math.cos(this.angle) * speed * dt;
    this.x += stepX;
    this.z += stepZ;

    const distance = Math.hypot(this.x, this.z);
    const limit = arenaRadius - 3.5;
    if (distance > limit) {
      this.x = (this.x / distance) * limit;
      this.z = (this.z / distance) * limit;
      const inward = Math.atan2(-this.x, -this.z);
      this.angle = turnToward(this.angle, inward, 5.2 * dt);
    }

    const headPoint = { x: this.x, z: this.z };
    if (!this.path.length) {
      this.path.push(headPoint);
    } else {
      const headDistance = Math.hypot(headPoint.x - this.path[0].x, headPoint.z - this.path[0].z);
      if (headDistance > 0.2) this.path.unshift(headPoint);
      else this.path[0] = headPoint;
    }

    this.segmentCount = lengthToSegments(this.length);
    const needed = (this.segmentCount + 8) * SEGMENT_SPACING;
    if (this.path.length > 2) {
      let total = 0;
      for (let i = 0; i < this.path.length - 1; i += 1) {
        total += Math.hypot(this.path[i + 1].x - this.path[i].x, this.path[i + 1].z - this.path[i].z);
        if (total > needed) {
          this.path.length = i + 2;
          break;
        }
      }
    }
    trimPath(this.path, needed + 4);

    this.positions = samplePathBatch(this.path, this.segmentCount, SEGMENT_SPACING);
    this.bodyMesh.count = this.segmentCount;

    if (this.coloredCount !== this.segmentCount || this.skinDirty) {
      this.paintSegments();
    }

    const bob = Math.sin(time * 3.1 + this.phase) * 0.04;
    for (let i = 0; i < this.segmentCount; i += 1) {
      const point = this.positions[i] || headPoint;
      const tail = this.segmentCount - i;
      let taper = 1;
      if (tail < 9) taper = 0.52 + (tail / 9) * 0.48;
      const radius = 1.02 * taper;
      const segmentBob = Math.sin(time * 3.4 - i * 0.46 + this.phase) * 0.045;
      this.dummy.position.set(point.x, 0.98 + segmentBob + bob, point.z);
      this.dummy.scale.set(radius, radius * (0.92 + 0.08 * taper), radius);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.bodyMesh.instanceMatrix.needsUpdate = true;

    this.headGroup.position.set(this.x, 1.02 + bob * 0.6, this.z);
    this.headGroup.rotation.y = this.angle;
    this.headGroup.rotation.z = this._pendingTime;
    const blink = Math.sin((time + this.phase * 1.7) * 0.9) > 0.985 ? 0.14 : 1;
    this.eyeGroup.scale.y = blink;
    this.crownPivot.rotation.y = time * (this.boosting ? 5.2 : 1.6);
    const crownPulse = 1 + Math.sin(time * 4.2 + this.phase) * 0.06;
    this.crown.scale.setScalar(0.42 * crownPulse);
    this.crownPivot.position.y = 1.25 + Math.sin(time * 3.2 + this.phase) * 0.05;

    this.bodyMaterial.emissiveIntensity = this.boosting ? 0.34 : 0.12;
    this.headMaterial.emissiveIntensity = this.boosting ? 0.62 : 0.28;
    this.crownMaterial.emissiveIntensity = this.boosting ? 0.9 : 0.42;

    const labelDistance = Math.hypot(this.label.position.x - this.x, this.label.position.z - this.z);
    if (labelDistance > 0.2) {
      this.label.position.x = this.x;
      this.label.position.z = this.z;
    }
    this.label.position.y = 3.72 + Math.sin(time * 1.4 + this.phase) * 0.06 + (this.boosting ? 0.15 : 0);
  }

  paintSegments() {
    this.coloredCount = this.segmentCount;
    this.skinDirty = false;
    for (let i = 0; i < this.segmentCount; i += 1) {
      const stripe = i % 7 < 2;
      const tailFade = 1 - Math.min(0.3, (i / Math.max(1, this.segmentCount)) * 0.3);
      this.tmpColor.copy(stripe ? this.colorSecondary : this.colorPrimary).multiplyScalar(tailFade);
      this.bodyMesh.setColorAt(i, this.tmpColor);
    }
    if (this.bodyMesh.instanceColor) this.bodyMesh.instanceColor.needsUpdate = true;
  }

  eat(value) {
    this.length += value;
    this.score += Math.round(value * 1.35);
  }
}
