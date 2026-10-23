import { describe, expect, it } from "vitest";
import { Post } from "../domain/Post";
import { ScheduledPost } from "../domain/ScheduledPost";

describe("Post", () => {
  it("rechaza contenido vacío", () => {
    expect(() => new Post("1", "Ana", "   ")).toThrow(
      "El contenido no puede estar vacío.",
    );
  });

  it("rechaza contenido de más de 280 caracteres", () => {
    expect(() => new Post("1", "Ana", "a".repeat(281))).toThrow(
      "Máximo 280 caracteres.",
    );
  });

  it("pondera comentarios y shares en el engagement", () => {
    const post = new Post("1", "Ana", "Hola", 10, 2, 1);
    expect(post.engagement).toBe(17);
    expect(post.likes).toBe(10);
  });

  it("calcula el score viral con la fórmula del dominio", () => {
    const now = new Date("2026-10-23T12:00:00.000Z");
    const post = new Post(
      "1",
      "Ana",
      "Hola",
      10,
      2,
      1,
      new Date("2026-10-23T11:00:00.000Z"),
    );
    expect(post.viralScore(now)).toBeCloseTo(17 / Math.pow(3, 1.5), 6);
  });

  it("incrementa las métricas", () => {
    const post = new Post("1", "Ana", "Hola");
    post.like();
    post.like();
    post.comment();
    post.share();
    expect(post.likes).toBe(2);
    expect(post.comments).toBe(1);
    expect(post.shares).toBe(1);
  });

  it("sobrevive a la serialización", () => {
    const post = new Post("1", "Ana", "Hola", 1, 2, 3);
    const copy = Post.fromSnapshot(post.snapshot());
    expect(copy.snapshot()).toEqual(post.snapshot());
  });
});

describe("ScheduledPost", () => {
  it("detecta cuándo está listo para publicar", () => {
    const now = new Date("2026-10-23T12:00:00.000Z");
    const scheduled = new ScheduledPost(
      "1",
      "Ana",
      "Hola",
      new Date("2026-10-23T11:59:00.000Z"),
    );
    expect(scheduled.isDue(now)).toBe(true);
  });
});
