import type { Clock, ScheduledPostRepository } from "../domain/ports";
import type { ScheduledPost } from "../domain/ScheduledPost";

export interface ScheduledEntry {
  scheduled: ScheduledPost;
  due: boolean;
}

export class GetScheduledPosts {
  constructor(
    private readonly repo: ScheduledPostRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<ScheduledEntry[]> {
    const now = this.clock.now();
    const queue = await this.repo.findAll();

    return queue
      .map((scheduled) => ({ scheduled, due: scheduled.isDue(now) }))
      .sort(
        (a, b) =>
          a.scheduled.publishAt.getTime() - b.scheduled.publishAt.getTime(),
      );
  }
}
