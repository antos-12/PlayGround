import { Post } from "../domain/Post";
import type {
  Clock,
  IdGenerator,
  Notifier,
  PostRepository,
  ScheduledPostRepository,
} from "../domain/ports";

export class PublishDuePosts {
  constructor(
    private readonly posts: PostRepository,
    private readonly scheduled: ScheduledPostRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(): Promise<Post[]> {
    const now = this.clock.now();
    const queue = await this.scheduled.findAll();
    const due = queue.filter((item) => item.isDue(now)).sort(
      (a, b) => a.publishAt.getTime() - b.publishAt.getTime(),
    );
    const published: Post[] = [];

    for (const item of due) {
      const post = new Post(
        this.ids.next(),
        item.author,
        item.content,
        0,
        0,
        0,
        item.publishAt,
      );
      await this.posts.save(post);
      await this.scheduled.remove(item.id);
      published.push(post);
    }

    if (published.length === 1) {
      this.notifier.notify(
        `${published[0].author} publicó una pieza programada`,
        "success",
      );
    } else if (published.length > 1) {
      this.notifier.notify(
        `${published.length} publicaciones programadas salieron al aire`,
        "success",
      );
    }

    return published;
  }
}
