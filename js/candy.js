import * as THREE from 'three';
import { ARENA_RADIUS, MAX_HEARTS, MAX_ORBS } from './config.js';
import { makeGlowTexture, makeHeartGeometry, pick, rand, randomPointInCircle, tintInstanceEmissive } from './utils.js';

export class CandyField {
  constructor(scene, theme) {
    this.scene = scene;
    this.theme = theme;
    this.orbs = [];
    this.hearts = [];
    this.dropCursor = 0;
    this.dummy = new THREE.Object3D();
    this.dummy.rotation.order = 'YXZ';
    this.color = new THREE.Color();
    this.glowTexture = makeGlowTexture();

    const orbGeometry = new THREE.SphereGeometry(1, 16, 12);
    this.orbMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.12,
      emissive: 0xffffff,
      emissiveIntensity: 0.19
    });
    tintInstanceEmissive(this.orbMaterial);
    this.orbMesh = new THREE.InstancedMesh(orbGeometry, this.orbMaterial, MAX_ORBS);
    this.orbMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.orbMesh.frustumCulled = false;

    const heartGeometry = makeHeartGeometry();
    this.heartMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.26,
      metalness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      emissive: 0xffffff,
      emissiveIntensity: 0.22
    });
    tintInstanceEmissive(this.heartMaterial);
    this.heartMesh = new THREE.InstancedMesh(heartGeometry, this.heartMaterial, MAX_HEARTS);
    this.heartMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.heartMesh.frustumCulled = false;

    const haloGeometry = new THREE.PlaneGeometry(1, 1);
    this.haloMaterial = new THREE.MeshBasicMaterial({
      map: this.glowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    this.haloMesh = new THREE.InstancedMesh(haloGeometry, this.haloMaterial, MAX_ORBS + MAX_HEARTS);
    this.haloMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.haloMesh.frustumCulled = false;

    scene.add(this.orbMesh, this.heartMesh, this.haloMesh);
    this.reset(theme);
  }

  reset(theme) {
    this.theme = theme;
    for (let i = 0; i < MAX_ORBS; i++) {
      const point = randomPointInCircle(ARENA_RADIUS - 7);
      this.orbs[i] = {
        x: point.x,
        z: point.z,
        radius: rand(0.24, 0.48),
        color: pick(theme.palette),
        value: 3,
        phase: rand(0, Math.PI * 2),
        spin: rand(0.3, 1.1),
        active: true,
        respawnAt: 0
      };
      this.orbs[i].value = Math.round(4 + this.orbs[i].radius * 14);
      this.paintOrb(i);
    }
    for (let i = 0; i < MAX_HEARTS; i++) {
      const point = randomPointInCircle(ARENA_RADIUS - 9);
      this.hearts[i] = {
        x: point.x,
        z: point.z,
        radius: 0.72,
        color: pick([0xff4d79, 0xff7aa2, 0xffe066, 0xd18bff, 0x66f2c1]),
        value: 26,
        phase: rand(0, Math.PI * 2),
        spin: rand(0.4, 0.8),
        active: true,
        respawnAt: 0
      };
      this.hearts[i].value = Math.round(rand(22, 38));
      this.paintHeart(i);
    }
    this.orbMesh.instanceColor.needsUpdate = true;
    this.heartMesh.instanceColor.needsUpdate = true;
    this.haloMesh.instanceColor.needsUpdate = true;
  }

  paintOrb(index) {
    const candy = this.orbs[index];
    this.orbMesh.setColorAt(index, this.color.set(candy.color));
    this.haloMesh.setColorAt(index, this.color.set(candy.color));
  }

  paintHeart(index) {
    const candy = this.hearts[index];
    this.heartMesh.setColorAt(index, this.color.set(candy.color));
    this.haloMesh.setColorAt(MAX_ORBS + index, this.color.set(candy.color));
  }

  setTheme(theme) {
    this.theme = theme;
    this.orbs.forEach((candy, index) => {
      if (!candy.active) return;
      candy.color = pick(theme.palette);
      this.paintOrb(index);
    });
    this.hearts.forEach((candy, index) => {
      if (!candy.active) return;
      candy.color = pick(theme.palette);
      this.paintHeart(index);
    });
    this.orbMesh.instanceColor.needsUpdate = true;
    this.heartMesh.instanceColor.needsUpdate = true;
    this.haloMesh.instanceColor.needsUpdate = true;
  }

  respawnOrb(index, time, avoidX = 0, avoidZ = 0) {
    const candy = this.orbs[index];
    let point = randomPointInCircle(ARENA_RADIUS - 7);
    for (let attempt = 0; attempt < 8; attempt++) {
      const dx = point.x - avoidX;
      const dz = point.z - avoidZ;
      if (dx * dx + dz * dz > 900) break;
      point = randomPointInCircle(ARENA_RADIUS - 7);
    }
    candy.x = point.x;
    candy.z = point.z;
    candy.radius = rand(0.24, 0.48);
    candy.color = pick(this.theme.palette);
    candy.value = Math.round(4 + candy.radius * 14);
    candy.phase = rand(0, Math.PI * 2);
    candy.spin = rand(0.3, 1.1);
    candy.active = true;
    candy.respawnAt = 0;
    this.paintOrb(index);
    this.orbMesh.instanceColor.needsUpdate = true;
    this.haloMesh.instanceColor.needsUpdate = true;
    void time;
  }

  respawnHeart(index) {
    const candy = this.hearts[index];
    const point = randomPointInCircle(ARENA_RADIUS - 9);
    candy.x = point.x;
    candy.z = point.z;
    candy.color = pick(this.theme.palette);
    candy.value = Math.round(rand(26, 42));
    candy.phase = rand(0, Math.PI * 2);
    candy.spin = rand(0.4, 0.8);
    candy.active = true;
    candy.respawnAt = 0;
    this.paintHeart(index);
    this.heartMesh.instanceColor.needsUpdate = true;
    this.haloMesh.instanceColor.needsUpdate = true;
  }

  drop(x, z, color, value) {
    const index = this.dropCursor % MAX_ORBS;
    this.dropCursor += 1;
    const candy = this.orbs[index];
    candy.x = x;
    candy.z = z;
    candy.radius = rand(0.3, 0.52);
    candy.color = color;
    candy.value = value;
    candy.phase = rand(0, Math.PI * 2);
    candy.spin = rand(0.5, 1.3);
    candy.active = true;
    candy.respawnAt = 0;
    this.paintOrb(index);
    this.orbMesh.instanceColor.needsUpdate = true;
    this.haloMesh.instanceColor.needsUpdate = true;
  }

  eatNear(x, z, radius, time, headX = x, headZ = z) {
    const eaten = [];
    this.orbs.forEach((candy, index) => {
      if (!candy.active) return;
      const dx = candy.x - x;
      const dz = candy.z - z;
      if (dx * dx + dz * dz <= (radius + candy.radius) * (radius + candy.radius)) {
        candy.active = false;
        candy.respawnAt = time + rand(1.6, 3.2);
        eaten.push({ kind: 'orb', value: candy.value, color: candy.color, x: candy.x, z: candy.z });
        void headX;
        void headZ;
        void index;
      }
    });
    this.hearts.forEach((candy, index) => {
      if (!candy.active) return;
      const dx = candy.x - x;
      const dz = candy.z - z;
      if (dx * dx + dz * dz <= (radius + candy.radius) * (radius + candy.radius)) {
        candy.active = false;
        candy.respawnAt = time + rand(4, 7);
        eaten.push({ kind: 'heart', value: candy.value, color: candy.color, x: candy.x, z: candy.z });
        void index;
      }
    });
    return eaten;
  }

  update(dt, time, player) {
    const attraction = 6.4;
    for (let i = 0; i < MAX_ORBS; i++) {
      const candy = this.orbs[i];
      if (!candy.active && candy.respawnAt && time >= candy.respawnAt) this.respawnOrb(i, time);
      if (candy.active && player && player.alive) {
        const dx = player.x - candy.x;
        const dz = player.z - candy.z;
        const dist = Math.hypot(dx, dz);
        if (dist < attraction && dist > 0.01) {
          const pull = (1 - dist / attraction) * 9.5 * dt;
          candy.x += (dx / dist) * pull;
          candy.z += (dz / dist) * pull;
        }
      }
      const activeScale = candy.active ? candy.radius : 0;
      const bob = Math.sin(time * 2.1 + candy.phase) * 0.09;
      this.dummy.position.set(candy.x, activeScale + bob + 0.38, candy.z);
      this.dummy.rotation.set(0, time * candy.spin + candy.phase, 0);
      this.dummy.scale.setScalar(activeScale);
      this.dummy.updateMatrix();
      this.orbMesh.setMatrixAt(i, this.dummy.matrix);

      this.dummy.position.set(candy.x, 0.045, candy.z);
      this.dummy.rotation.set(-Math.PI / 2, 0, time * 0.08 + candy.phase);
      this.dummy.scale.setScalar(candy.active ? candy.radius * 6.2 : 0);
      this.dummy.updateMatrix();
      this.haloMesh.setMatrixAt(i, this.dummy.matrix);
    }

    for (let i = 0; i < MAX_HEARTS; i++) {
      const candy = this.hearts[i];
      if (!candy.active && candy.respawnAt && time >= candy.respawnAt) this.respawnHeart(i);
      const scale = candy.active ? candy.radius : 0;
      const bob = Math.sin(time * 1.7 + candy.phase) * 0.2;
      this.dummy.position.set(candy.x, 1.15 + bob, candy.z);
      this.dummy.rotation.set(-Math.PI / 2, time * candy.spin + candy.phase, 0);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.heartMesh.setMatrixAt(i, this.dummy.matrix);

      this.dummy.position.set(candy.x, 0.05, candy.z);
      this.dummy.rotation.set(-Math.PI / 2, 0, 0);
      this.dummy.scale.setScalar(candy.active ? scale * 7 : 0);
      this.dummy.updateMatrix();
      this.haloMesh.setMatrixAt(MAX_ORBS + i, this.dummy.matrix);
    }

    this.orbMesh.instanceMatrix.needsUpdate = true;
    this.heartMesh.instanceMatrix.needsUpdate = true;
    this.haloMesh.instanceMatrix.needsUpdate = true;
  }
}
