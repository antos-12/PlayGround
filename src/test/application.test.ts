import { beforeEach, describe, expect, it } from "vitest";
import { CancelScheduledPost } from "../application/CancelScheduledPost";
import { CreatePost } from "../application/CreatePost";
import { EngageWithPost } from "../application/EngageWithPost";
import { GetDashboardStats } from "../application/GetDashboardStats";
import { GetViralRanking } from "../application/GetViralRanking";
import { PublishDuePosts } from "../application/PublishDuePosts";
import { PublishScheduledPost } from "../application/PublishScheduledPost";
import { SchedulePost } from "../application/SchedulePost";
import { Post } from "../domain/Post";
import {
  FakeClock,
  InMemoryPostRepository,
  InMemoryScheduledPostRepository,
  RecordingNotifier,
  SequentialIdGenerator,
} from "./fakes";

describe("casos de uso", () => {
  let posts: InMemoryPostRepository;
  let scheduled: InMemoryScheduledPostRepository;
  let clock: FakeClock;
  let notifier: RecordingNotifier;
  let ids: SequentialIdGenerator;

  beforeEach(() => {
    posts = new InMemoryPostRepository();
    scheduled = new InMemoryScheduledPostRepository();
    clock = new FakeClock();
    notifier = new RecordingNotifier();
    ids = new SequentialIdGenerator();
  });

  it("crea publicaciones y notifica", async () => {
    const create = new CreatePost(posts, notifier, clock, ids);
    const post = await create.execute("Ana Torres", "Mi primer post viral");

    expect(post.id).toBe("id-1");
    expect(await posts.findAll()).toHaveLength(1);
    expect(notifier.messages.at(-1)?.message).toBe(
      "Ana Torres publicó algo nuevo",
    );
  });

  it("ordena el ranking por score descendente y respeta el límite", async () => {
    await posts.save(
      new Post(
        "a",
        "Ana",
        "Viejo",
        10,
        0,
        0,
        new Date(clock.now().getTime() - 10 * 3_600_000),
      ),
    );
    await posts.save(
      new Post(
        "b",
        "Leo",
        "Nuevo",
        10,
        0,
        0,
        new Date(clock.now().getTime() - 60_000),
      ),
    );

    const ranking = await new GetViralRanking(posts, clock).execute(1);
    expect(ranking).toHaveLength(1);
    expect(ranking[0].post.id).toBe("b");
  });

  it("rechaza programar en el pasado", async () => {
    const schedule = new SchedulePost(scheduled, notifier, clock, ids);
    await expect(
      schedule.execute("Ana", "Hola", new Date(clock.now().getTime() - 1)),
    ).rejects.toThrow("Elegí una fecha futura para programar.");
  });

  it("publica la cola vencida y respeta la fecha original", async () => {
    const publishAt = new Date(clock.now().getTime() + 60_000);
    await new SchedulePost(scheduled, notifier, clock, ids).execute(
      "Ana",
      "Programado",
      publishAt,
    );
    clock.advance(120_000);

    const published = await new PublishDuePosts(
      posts,
      scheduled,
      notifier,
      clock,
      ids,
    ).execute();

    expect(published).toHaveLength(1);
    expect(published[0].createdAt.getTime()).toBe(publishAt.getTime());
    expect(await scheduled.findAll()).toHaveLength(0);
  });

  it("publica una pieza programada al instante", async () => {
    const item = await new SchedulePost(
      scheduled,
      notifier,
      clock,
      ids,
    ).execute("Ana", "Algo", new Date(clock.now().getTime() + 3_600_000));

    const post = await new PublishScheduledPost(
      posts,
      scheduled,
      notifier,
      clock,
      ids,
    ).execute(item.id);

    expect(post.author).toBe("Ana");
    expect(await scheduled.findAll()).toHaveLength(0);
  });

  it("cancela una programación", async () => {
    const item = await new SchedulePost(
      scheduled,
      notifier,
      clock,
      ids,
    ).execute("Ana", "Algo", new Date(clock.now().getTime() + 3_600_000));

    await new CancelScheduledPost(scheduled, notifier).execute(item.id);
    expect(await scheduled.findAll()).toHaveLength(0);
    expect(notifier.messages.at(-1)?.tone).toBe("warn");
  });

  it("registra interacciones", async () => {
    const post = await new CreatePost(posts, notifier, clock, ids).execute(
      "Ana",
      "Hola",
    );
    const engage = new EngageWithPost(posts);
    await engage.execute(post.id, "like");
    await engage.execute(post.id, "comment");
    await engage.execute(post.id, "share");

    const updated = await posts.findById(post.id);
    expect(updated?.likes).toBe(1);
    expect(updated?.comments).toBe(1);
    expect(updated?.shares).toBe(1);
  });

  it("agrega estadísticas del estudio", async () => {
    const create = new CreatePost(posts, notifier, clock, ids);
    await create.execute("Ana", "Uno");
    await create.execute("Leo", "Dos");
    await new SchedulePost(scheduled, notifier, clock, ids).execute(
      "Ana",
      "Tres",
      new Date(clock.now().getTime() + 60_000),
    );

    const stats = await new GetDashboardStats(posts, scheduled, clock).execute();
    expect(stats.totalPosts).toBe(2);
    expect(stats.scheduledCount).toBe(1);
    expect(stats.averageScore).toBe(0);
  });
});
