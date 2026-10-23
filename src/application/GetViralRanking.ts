import type { Clock, PostRepository } from "../domain/ports";
import type { Post } from "../domain/Post";

export interface RankingEntry {
  post: Post;
  score: number;
}

export class GetViralRanking {
  constructor(
    private readonly repo: PostRepository,
    private readonly clock: Clock,
  ) {}

  async execute(limit = 10): Promise<RankingEntry[]> {
    const now = this.clock.now();
    const posts = await this.repo.findAll();

    return posts
      .map((post) => ({ post, score: post.viralScore(now) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(0, limit));
  }
}
