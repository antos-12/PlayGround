import { Post } from "../domain/Post";
import type {
  Clock,
  IdGenerator,
  Notifier,
  PostRepository,
  ScheduledPostRepository,
} from "../domain/ports";

export class PublishScheduledPost {
  constructor(
    private readonly posts: PostRepository,
    private readonly scheduled: ScheduledPostRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(id: string): Promise<Post> {
    const item = await this.scheduled.findById(id);
    if (!item) throw new Error("Publicación programada no encontrada.");

    const post = new Post(
      this.ids.next(),
      item.author,
      item.content,
      0,
      0,
      0,
      this.clock.now(),
    );

    await this.posts.save(post);
    await this.scheduled.remove(item.id);
    this.notifier.notify(`${post.author} publicó una pieza programada`, "success");
    return post;
  }
}
