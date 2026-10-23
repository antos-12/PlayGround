import { ScheduledPost } from "../domain/ScheduledPost";
import type {
  Clock,
  IdGenerator,
  Notifier,
  ScheduledPostRepository,
} from "../domain/ports";

export class SchedulePost {
  constructor(
    private readonly repo: ScheduledPostRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(
    author: string,
    content: string,
    publishAt: Date,
  ): Promise<ScheduledPost> {
    if (publishAt.getTime() <= this.clock.now().getTime()) {
      throw new Error("Elegí una fecha futura para programar.");
    }

    const scheduled = new ScheduledPost(this.ids.next(), author, content, publishAt);
    await this.repo.save(scheduled);
    this.notifier.notify("Publicación programada", "info");
    return scheduled;
  }
}
