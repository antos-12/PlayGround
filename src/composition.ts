import { CancelScheduledPost } from "./application/CancelScheduledPost";
import { CreatePost } from "./application/CreatePost";
import { EngageWithPost } from "./application/EngageWithPost";
import { GetDashboardStats } from "./application/GetDashboardStats";
import { GetFeed } from "./application/GetFeed";
import { GetScheduledPosts } from "./application/GetScheduledPosts";
import { GetViralRanking } from "./application/GetViralRanking";
import { PublishDuePosts } from "./application/PublishDuePosts";
import { PublishScheduledPost } from "./application/PublishScheduledPost";
import { SchedulePost } from "./application/SchedulePost";
import { GoViralApi } from "./interfaces/api/GoViralApi";
import { BrowserNotifier } from "./infrastructure/BrowserNotifier";
import { CryptoIdGenerator } from "./infrastructure/CryptoIdGenerator";
import { LocalStoragePostRepository } from "./infrastructure/LocalStoragePostRepository";
import { LocalStorageScheduledPostRepository } from "./infrastructure/LocalStorageScheduledPostRepository";
import { SystemClock } from "./infrastructure/SystemClock";
import { resetDemoContent, seedDemoContent } from "./infrastructure/seed";

export function createComposition() {
  const clock = new SystemClock();
  const ids = new CryptoIdGenerator();
  const notifier = new BrowserNotifier();
  const postRepository = new LocalStoragePostRepository();
  const scheduledRepository = new LocalStorageScheduledPostRepository();

  const api = new GoViralApi({
    createPost: new CreatePost(postRepository, notifier, clock, ids),
    feed: new GetFeed(postRepository, clock),
    ranking: new GetViralRanking(postRepository, clock),
    engage: new EngageWithPost(postRepository),
    schedule: new SchedulePost(scheduledRepository, notifier, clock, ids),
    scheduledQueue: new GetScheduledPosts(scheduledRepository, clock),
    cancelScheduled: new CancelScheduledPost(scheduledRepository, notifier),
    publishScheduled: new PublishScheduledPost(
      postRepository,
      scheduledRepository,
      notifier,
      clock,
      ids,
    ),
    publishDue: new PublishDuePosts(
      postRepository,
      scheduledRepository,
      notifier,
      clock,
      ids,
    ),
    stats: new GetDashboardStats(postRepository, scheduledRepository, clock),
    resetDemo: () => resetDemoContent(postRepository, scheduledRepository, clock),
  });

  return {
    api,
    notifier,
    seed: () => seedDemoContent(postRepository, scheduledRepository, clock),
  };
}
