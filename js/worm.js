import * as THREE from 'three';
import { ARENA_RADIUS, MAX_SEGMENTS } from './config.js';
import {
  angleDelta, clamp, damp, dampAngle, makeHeartGeometry, makeNameSprite, pick, rand, randomPointInCircle, tintColor
} from './utils.js';

const shared = {
  bodyGeometry: new THREE.SphereGeometry(1, 18, 14),
  hatGeometry: makeHeartGeometry(),
  bodyMaterial: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    sheen: 0.8,
    sheenColor: 0xffffff,
    sheenRoughness: 0.35
  }),
  eyeGeometry: new THREE.SphereGeometry(1, 14, 12),
  pupilGeometry: new THREE.SphereGeometry(1, 12, 10),
  eyeMaterial: new THREE.MeshStandardMaterial({ color: 0xfdf6fb, roughness: 0.08, metalness: 0.02 }),
  pupilMaterial: new THREE.MeshStandardMaterial({ color: 0x170b16, roughness: 0.15, metalness: 0.05 }),
  shineMaterial: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  mouthGeometry: new THREE.TorusGeometry(0.16, 0.026, 6, 18, Math.PI),
  mouthMaterial: new THREE.MeshStandardMaterial({ color: 0x3a1225, roughness: 0.6 }),
  zAxis: new THREE.Vector3(0, 0, 1)
};

export class Worm {
  constructor(scene, { name, skin, isPlayer = false }) {
    this.scene = scene;
    this.name = name;
    this.skin = skin;
    this.isPlayer = isPlayer;
    this.alive = false;
    this.score = 0;
    this.segmentCount = 14;
    this.headRadius = 1;
    this.path = [];
    this.bodyPoints = [];
    this.segmentPositions = [];
    this.heading = 0;
    this.targetHeading = 0;
    this.boostMeter = 100;
    this.boosting = false;
    this.aiTimer = 0;
    this.aiTarget = randomPointInCircle(60);
    this.invulnerable = 0;
    this.time = 0;
    this._cum = [];
    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
    this._tangent = new THREE.Vector3();
    this._quat = new THREE.Quaternion();

    this.bodyMesh = new THREE.InstancedMesh(shared.bodyGeometry, shared.bodyMaterial, MAX_SEGMENTS);
    this.bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.bodyMesh.frustumCulled = false;
    this.bodyMesh.visible = false;
    scene.add(this.bodyMesh);

    this.headGroup = new THREE.Group();
    this.headMaterial = new THREE.MeshPhysicalMaterial({
      color: skin.main,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      emissive: skin.glow,
      emissiveIntensity: 0.14
    });
    this.hatMaterial = new THREE.MeshBasicMaterial({ color: skin.accent, toneMapped: false });
    this.headMesh = new THREE.Mesh(shared.bodyGeometry, this.headMaterial);
    this.headGroup.add(this.headMesh);
    this.buildFace();
    this.headGroup.visible = false;
    scene.add(this.headGroup);

    this.nameSprite = makeNameSprite(name, skin.main, isPlayer);
    this.nameSprite.visible = false;
    scene.add(this.nameSprite);

    this.ring = null;
    if (isPlayer) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: skin.glow,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      this.ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.62, 56), ringMaterial);
      this.ring.rotation.x = -Math.PI / 2;
      this.ring.visible = false;
      scene.add(this.ring);
    }

    this.paintBody();
  }

  buildFace() {
    this.face = new THREE.Group();
    const eyeGeometry = shared.eyeGeometry;
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(eyeGeometry, shared.eyeMaterial);
      eye.position.set(side * 0.37, 0.52, 0.5);
      eye.scale.setScalar(0.3);
      this.face.add(eye);
      const pupil = new THREE.Mesh(shared.pupilGeometry, shared.pupilMaterial);
      pupil.position.set(side * 0.37, 0.62, 0.64);
      pupil.scale.setScalar(0.145);
      this.face.add(pupil);
      const shine = new THREE.Mesh(shared.pupilGeometry, shared.shineMaterial);
      shine.position.set(side * 0.37 - 0.05, 0.68, 0.72);
      shine.scale.setScalar(0.046);
      this.face.add(shine);
    });
    const mouth = new THREE.Mesh(shared.mouthGeometry, shared.mouthMaterial);
    mouth.position.set(0, -0.2, 0.93);
    mouth.rotation.z = Math.PI;
    this.face.add(mouth);

    const hat = new THREE.Mesh(shared.hatGeometry, this.hatMaterial);
    hat.position.set(0, 1.02, -0.08);
    hat.rotation.x = -Math.PI / 2;
    hat.scale.setScalar(0.4);
    this.face.add(hat);
    this.headGroup.add(this.face);
  }

  paintBody() {
    const main = new THREE.Color(this.skin.main);
    const accent = new THREE.Color(this.skin.accent);
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      const t = i / Math.max(1, MAX_SEGMENTS - 1);
      const shade = main.clone().lerp(accent, clamp(0.28 - t * 0.36 + Math.sin(i * 0.55) * 0.08, 0, 1));
      this.bodyMesh.setColorAt(i, shade);
    }
    if (this.bodyMesh.instanceColor) this.bodyMesh.instanceColor.needsUpdate = true;
  }

  applySkin(skin) {
    this.skin = skin;
    this.headMaterial.color.set(skin.main);
    this.headMaterial.emissive.set(skin.glow);
    this.hatMaterial.color.set(skin.accent);
    this.paintBody();
    if (this.ring) this.ring.material.color.set(skin.glow);
    this.rebuildName();
  }

  setName(name) {
    this.name = name;
    this.rebuildName();
  }

  rebuildName() {
    this.scene.remove(this.nameSprite);
    this.nameSprite.material.map.dispose();
    this.nameSprite.material.dispose();
    this.nameSprite = makeNameSprite(this.name, this.skin.main, this.isPlayer);
    this.nameSprite.visible = this.alive;
    this.scene.add(this.nameSprite);
  }

  reset(position, heading, score = 0) {
    this.x = position.x;
    this.z = position.z;
    this.heading = heading;
    this.targetHeading = heading;
    this.score = score;
    this.boostMeter = 100;
    this.boosting = false;
    this.invulnerable = 2.4;
    this.aiTimer = 0;
    this.aiTarget = randomPointInCircle(70);
    this.updateSize();
    this.segmentCount = this.computeSegments();
    this.path = [];
    const maxDistance = (MAX_SEGMENTS + 4) * this.spacing();
    for (let d = 0; d <= maxDistance; d += 0.16) {
      this.path.push({
        x: this.x - Math.cos(heading) * d,
        z: this.z - Math.sin(heading) * d
      });
    }
    this.alive = true;
    this.bodyMesh.visible = true;
    this.headGroup.visible = true;
    this.nameSprite.visible = true;
    if (this.ring) this.ring.visible = true;
    this.updateBody(0, 0);
  }

  kill() {
    this.alive = false;
    this.bodyMesh.visible = false;
    this.headGroup.visible = false;
    this.nameSprite.visible = false;
    if (this.ring) this.ring.visible = false;
  }

  updateSize() {
    this.headRadius = 1.04 + Math.min(this.score / 1500, 0.58);
  }

  computeSegments() {
    return clamp(13 + Math.floor(this.score / 24), 13, MAX_SEGMENTS);
  }

  spacing() {
    return this.headRadius * 0.43;
  }

  addScore(value) {
    this.score = Math.max(0, this.score + value);
    this.updateSize();
    const next = this.computeSegments();
    if (next > this.segmentCount) {
      this.segmentCount = next;
      this.ensurePath();
    }
  }

  ensurePath() {
    const needed = (this.segmentCount + 3) * this.spacing();
    let length = 0;
    for (let i = 1; i < this.path.length; i++) {
      length += Math.hypot(this.path[i].x - this.path[i - 1].x, this.path[i].z - this.path[i - 1].z);
    }
    while (length < needed && this.path.length > 1) {
      const last = this.path[this.path.length - 1];
      const prev = this.path[this.path.length - 2];
      const dx = last.x - prev.x;
      const dz = last.z - prev.z;
      const d = Math.hypot(dx, dz) || 1;
      const point = { x: last.x + (dx / d) * 0.16, z: last.z + (dz / d) * 0.16 };
      this.path.push(point);
      length += 0.16;
    }
  }

  pushPath() {
    const head = this.path[0];
    const dx = this.x - head.x;
    const dz = this.z - head.z;
    if (dx * dx + dz * dz > 0.024) {
      this.path.unshift({ x: this.x, z: this.z });
      const maxPoints = Math.ceil(((this.segmentCount + 3) * this.spacing()) / 0.16) + 24;
      if (this.path.length > maxPoints) this.path.length = maxPoints;
    } else {
      head.x = this.x;
      head.z = this.z;
    }
  }

  sample(distance, cumulative, cursorRef) {
    let cursor = cursorRef.value;
    while (cursor < this.path.length - 1 && cumulative[cursor] < distance) cursor++;
    cursorRef.value = cursor;
    const a = this.path[Math.max(0, cursor - 1)];
    const b = this.path[Math.min(this.path.length - 1, cursor)];
    const start = cumulative[Math.max(0, cursor - 1)];
    const end = cumulative[Math.min(this.path.length - 1, cursor)];
    const span = Math.max(0.0001, end - start);
    const t = clamp((distance - start) / span, 0, 1);
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  }

  updateBody(dt, time) {
    const count = this.segmentCount;
    this.bodyMesh.count = count;
    const cumulative = this._cum;
    cumulative.length = this.path.length;
    cumulative[0] = 0;
    for (let i = 1; i < this.path.length; i++) {
      cumulative[i] = cumulative[i - 1] + Math.hypot(
        this.path[i].x - this.path[i - 1].x,
        this.path[i].z - this.path[i - 1].z
      );
    }

    const spacing = this.spacing();
    const cursor = { value: 1 };
    const positions = this.segmentPositions;
    positions.length = count;
    this.bodyPoints.length = count;
    const headY = this.headRadius * 0.9 + 0.3;

    for (let i = 0; i < count; i++) {
      const distance = (i + 1) * spacing;
      const point = this.sample(distance, cumulative, cursor);
      positions[i] = point;
      const taper = 0.96 - (i / Math.max(1, count - 1)) * 0.34;
      const radius = this.headRadius * taper;
      const bob = Math.sin(time * 3.1 - i * 0.28 + this.heading) * 0.045;
      this.bodyPoints[i] = { x: point.x, z: point.z, r: radius };

      let tangentX;
      let tangentZ;
      if (i === 0) {
        tangentX = this.x - point.x;
        tangentZ = this.z - point.z;
      } else {
        tangentX = positions[i - 1].x - point.x;
        tangentZ = positions[i - 1].z - point.z;
      }
      const length = Math.hypot(tangentX, tangentZ) || 1;
      this._tangent.set(tangentX / length, 0, tangentZ / length);
      this._quat.setFromUnitVectors(shared.zAxis, this._tangent);

      this._dummy.position.set(point.x, radius * 0.88 + 0.28 + bob, point.z);
      this._dummy.quaternion.copy(this._quat);
      this._dummy.scale.set(radius, radius * 0.96, radius * 1.3);
      this._dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, this._dummy.matrix);
    }
    this.bodyMesh.instanceMatrix.needsUpdate = true;

    const headBob = Math.sin(time * 3.1 + this.heading) * 0.05;
    this.headGroup.position.set(this.x, headY + headBob, this.z);
    this.headGroup.scale.setScalar(this.headRadius);
    this.headGroup.rotation.set(0, Math.PI / 2 - this.heading, 0);

    this.nameSprite.position.set(this.x, headY + this.headRadius * 1.55 + 0.75, this.z);
    if (this.ring) {
      const pulse = 1 + Math.sin(time * 4) * 0.05;
      this.ring.position.set(this.x, 0.07, this.z);
      this.ring.scale.setScalar(this.headRadius * pulse);
      this.ring.rotation.z = time * 0.5;
    }
    this.headY = headY;
  }

  update(dt, time) {
    if (!this.alive) return;
    this.time = time;
    const boostWanted = this.isPlayer ? this.boosting : this.wantsBoost;
    const canBoost = boostWanted && this.boostMeter > 1;
    this.boosting = canBoost;

    if (canBoost) {
      this.boostMeter = Math.max(0, this.boostMeter - dt * 28);
    } else {
      this.boostMeter = Math.min(100, this.boostMeter + dt * 18);
    }

    const baseSpeed = 10.6 + this.headRadius * 1.5;
    const speed = baseSpeed * (canBoost ? 1.8 : 1);
    const turn = canBoost ? 2.5 : (this.isPlayer ? 4.4 : 2.9);
    this.heading = dampAngle(this.heading, this.targetHeading, turn, dt);
    this.x += Math.cos(this.heading) * speed * dt;
    this.z += Math.sin(this.heading) * speed * dt;

    const fromCenter = Math.hypot(this.x, this.z);
    if (fromCenter > ARENA_RADIUS - 1.5) {
      const outward = Math.atan2(this.z, this.x);
      this.heading = dampAngle(this.heading, outward + Math.PI, 9, dt);
      this.targetHeading = this.heading;
      this.x = Math.cos(outward) * (ARENA_RADIUS - 1.5);
      this.z = Math.sin(outward) * (ARENA_RADIUS - 1.5);
    }

    if (this.invulnerable > 0) this.invulnerable -= dt;
    this.pushPath();
    this.updateBody(dt, time);

    if (this.ring) {
      this.ring.material.opacity = this.invulnerable > 0
        ? 0.25 + Math.sin(time * 12) * 0.2
        : 0.4 + Math.sin(time * 3) * 0.12;
    }
  }

  think(dt, time, candyField, worms) {
    if (!this.alive) return;
    this.aiTimer -= dt;
    if (this.aiTimer <= 0) {
      let best = null;
      let bestDist = 48 * 48;
      candyField.orbs.forEach((candy) => {
        if (!candy.active) return;
        const dx = candy.x - this.x;
        const dz = candy.z - this.z;
        const dist = dx * dx + dz * dz;
        if (dist < bestDist) {
          bestDist = dist;
          best = candy;
        }
      });
      candyField.hearts.forEach((candy) => {
        if (!candy.active) return;
        const dx = candy.x - this.x;
        const dz = candy.z - this.z;
        const dist = (dx * dx + dz * dz) * 0.55;
        if (dist < bestDist) {
          bestDist = dist;
          best = candy;
        }
      });
      this.aiTarget = best
        ? { x: best.x, z: best.z }
        : randomPointInCircle(ARENA_RADIUS - 18);
      this.aiTimer = rand(1.8, 3.6);
    }

    let ax = this.aiTarget.x - this.x;
    let az = this.aiTarget.z - this.z;
    const distanceToCenter = Math.hypot(this.x, this.z);
    if (distanceToCenter > ARENA_RADIUS - 16) {
      ax += -this.x * 1.4;
      az += -this.z * 1.4;
    }

    worms.forEach((other) => {
      if (other === this || !other.alive) return;
      const dx = this.x - other.x;
      const dz = this.z - other.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 8 && dist > 0.001) {
        const weight = (1 - dist / 8) * 1.5;
        ax += (dx / dist) * weight;
        az += (dz / dist) * weight;
      }
    });

    let desired = Math.atan2(az, ax);
    desired += Math.sin(time * 0.7 + this.aiTarget.x * 0.05) * 0.12;
    this.targetHeading = desired;
    this.wantsBoost = this.boostMeter > 55 && Math.random() < dt * 0.08;
  }

  faceTarget(x, z) {
    this.targetHeading = Math.atan2(z - this.z, x - this.x);
  }

  tailPosition() {
    if (this.bodyPoints.length === 0) return { x: this.x, z: this.z };
    return this.bodyPoints[this.bodyPoints.length - 1];
  }

  headPoint() {
    return { x: this.x, z: this.z, r: this.headRadius };
  }
}

export function makeBot(scene, name, skin) {
  const worm = new Worm(scene, { name, skin, isPlayer: false });
  return worm;
}

export function randomSkin(skins) {
  return pick(skins);
}
