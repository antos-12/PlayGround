import type {
  Clock,
  PostRepository,
  ScheduledPostRepository,
} from "../domain/ports";

export interface DashboardStats {
  totalPosts: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageScore: number;
  topScore: number;
  scheduledCount: number;
}

export class GetDashboardStats {
  constructor(
    private readonly posts: PostRepository,
    private readonly scheduled: ScheduledPostRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<DashboardStats> {
    const now = this.clock.now();
    const [posts, scheduled] = await Promise.all([
      this.posts.findAll(),
      this.scheduled.findAll(),
    ]);

    const scores = posts.map((post) => post.viralScore(now));
    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    return {
      totalPosts: posts.length,
      totalEngagement: posts.reduce((sum, post) => sum + post.engagement, 0),
      totalLikes: posts.reduce((sum, post) => sum + post.likes, 0),
      totalComments: posts.reduce((sum, post) => sum + post.comments, 0),
      totalShares: posts.reduce((sum, post) => sum + post.shares, 0),
      averageScore: posts.length ? totalScore / posts.length : 0,
      topScore: scores.length ? Math.max(...scores) : 0,
      scheduledCount: scheduled.length,
    };
  }
}
