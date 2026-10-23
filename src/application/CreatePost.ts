import { Post } from "../domain/Post";
import type { Clock, IdGenerator, Notifier, PostRepository } from "../domain/ports";

export class CreatePost {
  constructor(
    private readonly repo: PostRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(author: string, content: string): Promise<Post> {
    const post = new Post(
      this.ids.next(),
      author,
      content,
      0,
      0,
      0,
      this.clock.now(),
    );

    await this.repo.save(post);
    this.notifier.notify(`${post.author} publicó algo nuevo`, "success");
    return post;
  }
}
