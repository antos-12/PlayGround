export const TAU = Math.PI * 2;
export const ARENA_RADIUS = 96;
export const SEGMENT_SPACING = 0.82;
export const HEAD_RADIUS = 1.35;
export const BODY_RADIUS = 1.02;
export const BASE_SPEED = 15.5;
export const BOOST_MULTIPLIER = 1.8;
export const TURN_RATE = 4.1;
export const BOOST_TURN_RATE = 2.9;
export const MIN_BOOST_LENGTH = 26;
export const START_LENGTH = 34;
export const MAX_SEGMENTS = 140;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function damp(current, target, smoothing, dt) {
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}

export function angleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function turnToward(current, target, maxStep) {
  return current + clamp(angleDelta(current, target), -maxStep, maxStep);
}

export function lengthToSegments(length) {
  return clamp(10 + Math.floor(length * 0.52), 10, MAX_SEGMENTS);
}

export function distanceSq(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export function hitsCircle(ax, az, bx, bz, radius) {
  return distanceSq(ax, az, bx, bz) <= radius * radius;
}

export function rankWorms(worms) {
  return [...worms]
    .filter((worm) => !worm.removed)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.length - a.length;
    });
}

export function sanitizeNickname(value, fallback = "Invitado") {
  const clean = Array.from(String(value ?? ""))
    .filter((char) => char.charCodeAt(0) >= 32)
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14);
  return clean || fallback;
}

export function initialsFor(name) {
  const clean = sanitizeNickname(name, "IN");
  const words = clean.split(" ").filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function randomPointInCircle(radius, random = Math.random) {
  const angle = random() * TAU;
  const distance = Math.sqrt(random()) * radius;
  return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance };
}

export function safeSpawnPoint(radius, avoid = [], random = Math.random) {
  let best = null;
  let bestDistance = -1;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const point = randomPointInCircle(radius, random);
    let nearest = Infinity;
    for (const other of avoid) {
      const current = distanceSq(point.x, point.z, other.x, other.z);
      if (current < nearest) nearest = current;
    }
    if (nearest > bestDistance) {
      bestDistance = nearest;
      best = point;
    }
    if (nearest > 22 * 22) break;
  }
  return best || { x: 0, z: 0 };
}

export function samplePathBatch(path, count, spacing) {
  const points = new Array(count);
  if (!path.length) return points;
  if (path.length === 1) {
    for (let i = 0; i < count; i += 1) points[i] = { x: path[0].x, z: path[0].z };
    return points;
  }

  let index = 0;
  let travelled = 0;
  let segLength = Math.hypot(path[1].x - path[0].x, path[1].z - path[0].z);

  for (let i = 0; i < count; i += 1) {
    const target = (i + 1) * spacing;
    while (index < path.length - 2 && travelled + segLength < target) {
      travelled += segLength;
      index += 1;
      segLength = Math.hypot(path[index + 1].x - path[index].x, path[index + 1].z - path[index].z);
    }
    if (segLength <= 0.000001) {
      points[i] = { x: path[index].x, z: path[index].z };
      continue;
    }
    const t = clamp((target - travelled) / segLength, 0, 1);
    points[i] = {
      x: lerp(path[index].x, path[index + 1].x, t),
      z: lerp(path[index].z, path[index + 1].z, t),
    };
  }
  return points;
}

export function trimPath(path, maxDistance) {
  if (path.length < 2) return path;
  let total = 0;
  let keep = 1;
  for (let i = 0; i < path.length - 1; i += 1) {
    total += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].z - path[i].z);
    keep = i + 2;
    if (total >= maxDistance) break;
  }
  if (keep >= path.length) return path;
  path.length = keep;
  return path;
}

export function softenLengthAfterBoost(length, dt) {
  return Math.max(MIN_BOOST_LENGTH, length - 16 * dt);
}

export function foodValue(big, random = Math.random) {
  return big ? 8 + Math.floor(random() * 5) : 3 + Math.floor(random() * 3);
}
