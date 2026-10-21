import assert from "node:assert/strict";
import test from "node:test";
import {
  ARENA_RADIUS,
  MAX_SEGMENTS,
  angleDelta,
  distanceSq,
  foodValue,
  hitsCircle,
  initialsFor,
  lengthToSegments,
  rankWorms,
  safeSpawnPoint,
  samplePathBatch,
  sanitizeNickname,
  trimPath,
  turnToward,
} from "../src/logic.js";

test("sanitizeNickname trims, collapses whitespace and limits length", () => {
  assert.equal(sanitizeNickname("   Luna   Sol  "), "Luna Sol");
  assert.equal(sanitizeNickname("", "Invitado"), "Invitado");
  assert.equal(sanitizeNickname("   "), "Invitado");
  assert.equal(sanitizeNickname("abcdefghijklmnopqrstuvwxyz"), "abcdefghijklmn");
  assert.equal(sanitizeNickname("a\u0000b"), "ab");
});

test("initialsFor handles one and two word names", () => {
  assert.equal(initialsFor("Luna"), "LU");
  assert.equal(initialsFor("Luna Sol"), "LS");
  assert.equal(initialsFor(""), "IN");
});

test("angleDelta wraps around the shortest path", () => {
  assert.ok(Math.abs(angleDelta(Math.PI - 0.1, -Math.PI + 0.1) - 0.2) < 1e-9);
  assert.ok(Math.abs(angleDelta(0, Math.PI / 2) - Math.PI / 2) < 1e-9);
});

test("turnToward clamps the turn step and crosses the angle boundary correctly", () => {
  const result = turnToward(3.13, -3.13, 0.5);
  assert.ok(result > 3.13);
  assert.equal(turnToward(0, 1, 10), 1);
});

test("lengthToSegments grows and caps", () => {
  assert.equal(lengthToSegments(0), 10);
  assert.equal(lengthToSegments(34), 27);
  assert.equal(lengthToSegments(10000), MAX_SEGMENTS);
});

test("rankWorms sorts by score then length and drops removed worms", () => {
  const worms = [
    { name: "A", score: 10, length: 40, removed: false },
    { name: "B", score: 30, length: 20, removed: false },
    { name: "C", score: 30, length: 50, removed: false },
    { name: "D", score: 999, length: 999, removed: true },
  ];
  assert.deepEqual(
    rankWorms(worms).map((worm) => worm.name),
    ["C", "B", "A"],
  );
});

test("samplePathBatch follows a straight line at the requested spacing", () => {
  const path = [
    { x: 0, z: 0 },
    { x: 0, z: -10 },
  ];
  const points = samplePathBatch(path, 4, 2);
  assert.deepEqual(
    points.map((point) => [Number(point.x.toFixed(5)), Number(point.z.toFixed(5))]),
    [
      [0, -2],
      [0, -4],
      [0, -6],
      [0, -8],
    ],
  );
});

test("samplePathBatch clamps beyond the end of the path", () => {
  const points = samplePathBatch([{ x: 1, z: 1 }, { x: 1, z: 0 }], 3, 5);
  assert.equal(points[0].z, 0);
  assert.equal(points[2].z, 0);
});

test("trimPath keeps the head and discards distant history", () => {
  const path = [
    { x: 0, z: 0 },
    { x: 1, z: 0 },
    { x: 2, z: 0 },
    { x: 3, z: 0 },
    { x: 4, z: 0 },
  ];
  assert.equal(trimPath(path, 2.5).length, 4);
  assert.equal(path[0].x, 0);
});

test("safeSpawnPoint stays inside the arena and avoids nearby worms", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const avoid = [{ x: 0, z: 0 }];
  for (let i = 0; i < 30; i += 1) {
    const point = safeSpawnPoint(60, avoid, random);
    assert.ok(Math.hypot(point.x, point.z) <= 60.0001);
    assert.ok(distanceSq(point.x, point.z, 0, 0) >= 22 * 22);
  }
});

test("collision helper and arena constants are coherent", () => {
  assert.equal(hitsCircle(0, 0, 1, 0, 1.01), true);
  assert.equal(hitsCircle(0, 0, 2, 0, 1), false);
  assert.ok(ARENA_RADIUS > 90);
});

test("foodValue returns the expected ranges", () => {
  assert.equal(foodValue(false, () => 0), 3);
  assert.equal(foodValue(true, () => 0), 8);
  assert.equal(foodValue(false, () => 0.999), 5);
  assert.equal(foodValue(true, () => 0.999), 12);
});
