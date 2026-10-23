import type { CancelScheduledPost } from "../../application/CancelScheduledPost";
import type { CreatePost } from "../../application/CreatePost";
import type {
  EngagementKind,
  EngageWithPost,
} from "../../application/EngageWithPost";
import type { GetDashboardStats } from "../../application/GetDashboardStats";
import type { GetFeed } from "../../application/GetFeed";
import type { GetScheduledPosts } from "../../application/GetScheduledPosts";
import type { GetViralRanking } from "../../application/GetViralRanking";
import type { PublishDuePosts } from "../../application/PublishDuePosts";
import type { PublishScheduledPost } from "../../application/PublishScheduledPost";
import type { SchedulePost } from "../../application/SchedulePost";
import {
  toPostDto,
  toScheduledDto,
  type SnapshotDto,
} from "./dto";

export type FeedSort = "recent" | "viral";

export interface GoViralApiDeps {
  createPost: CreatePost;
  feed: GetFeed;
  ranking: GetViralRanking;
  engage: EngageWithPost;
  schedule: SchedulePost;
  scheduledQueue: GetScheduledPosts;
  cancelScheduled: CancelScheduledPost;
  publishScheduled: PublishScheduledPost;
  publishDue: PublishDuePosts;
  stats: GetDashboardStats;
  resetDemo: () => Promise<void>;
}

export class GoViralApi {
  constructor(private readonly deps: GoViralApiDeps) {}

  async snapshot(sort: FeedSort = "recent"): Promise<SnapshotDto> {
    const [feed, ranking, scheduled, stats] = await Promise.all([
      this.deps.feed.execute(sort),
      this.deps.ranking.execute(10),
      this.deps.scheduledQueue.execute(),
      this.deps.stats.execute(),
    ]);

    return {
      posts: feed.map((entry) => toPostDto(entry.post, entry.score)),
      ranking: ranking.map((entry) => toPostDto(entry.post, entry.score)),
      scheduled: scheduled.map((entry) =>
        toScheduledDto(entry.scheduled, entry.due),
      ),
      stats,
    };
  }

  async publish(author: string, content: string): Promise<SnapshotDto> {
    await this.deps.createPost.execute(author, content);
    return this.snapshot();
  }

  async schedule(
    author: string,
    content: string,
    publishAt: Date,
  ): Promise<SnapshotDto> {
    await this.deps.schedule.execute(author, content, publishAt);
    return this.snapshot();
  }

  async engage(id: string, kind: EngagementKind): Promise<SnapshotDto> {
    await this.deps.engage.execute(id, kind);
    return this.snapshot();
  }

  async publishNow(id: string): Promise<SnapshotDto> {
    await this.deps.publishScheduled.execute(id);
    return this.snapshot();
  }

  async publishDue(): Promise<SnapshotDto> {
    await this.deps.publishDue.execute();
    return this.snapshot();
  }

  async cancelScheduled(id: string): Promise<SnapshotDto> {
    await this.deps.cancelScheduled.execute(id);
    return this.snapshot();
  }

  async resetDemo(): Promise<SnapshotDto> {
    await this.deps.resetDemo();
    return this.snapshot();
  }
}
