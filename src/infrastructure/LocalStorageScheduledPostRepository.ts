import {
  ScheduledPost,
  type ScheduledPostSnapshot,
} from "../domain/ScheduledPost";
import type { ScheduledPostRepository } from "../domain/ports";
import { readJson, writeJson } from "./storage";

export const SCHEDULED_KEY = "go-viral:scheduled:v1";

export class LocalStorageScheduledPostRepository
  implements ScheduledPostRepository
{
  private readonly key: string;

  constructor(key = SCHEDULED_KEY) {
    this.key = key;
  }

  private load(): ScheduledPostSnapshot[] {
    return readJson<ScheduledPostSnapshot[]>(this.key, []);
  }

  async save(post: ScheduledPost): Promise<void> {
    const queue = this.load();
    const snapshot = post.snapshot();
    const index = queue.findIndex((item) => item.id === post.id);

    if (index === -1) queue.push(snapshot);
    else queue[index] = snapshot;

    writeJson(this.key, queue);
  }

  async findAll(): Promise<ScheduledPost[]> {
    return this.load().map((snapshot) => ScheduledPost.fromSnapshot(snapshot));
  }

  async findById(id: string): Promise<ScheduledPost | null> {
    const snapshot = this.load().find((item) => item.id === id);
    return snapshot ? ScheduledPost.fromSnapshot(snapshot) : null;
  }

  async remove(id: string): Promise<void> {
    writeJson(
      this.key,
      this.load().filter((item) => item.id !== id),
    );
  }
}
