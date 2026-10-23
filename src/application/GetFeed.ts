import type { Clock, PostRepository } from "../domain/ports";
import type { Post } from "../domain/Post";

export interface FeedEntry {
  post: Post;
  score: number;
}

export class GetFeed {
  constructor(
    private readonly repo: PostRepository,
    private readonly clock: Clock,
  ) {}

  async execute(sort: "recent" | "viral" = "recent"): Promise<FeedEntry[]> {
    const now = this.clock.now();
    const posts = await this.repo.findAll();
    const entries = posts.map((post) => ({ post, score: post.viralScore(now) }));

    return entries.sort((a, b) =>
      sort === "viral"
        ? b.score - a.score
        : b.post.createdAt.getTime() - a.post.createdAt.getTime(),
    );
  }
}
