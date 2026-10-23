import { Post } from "../domain/Post";
import { ScheduledPost } from "../domain/ScheduledPost";
import type {
  Clock,
  IdGenerator,
  NotificationTone,
  Notifier,
  PostRepository,
  ScheduledPostRepository,
} from "../domain/ports";

export class InMemoryPostRepository implements PostRepository {
  private readonly items = new Map<string, Post>();

  async save(post: Post): Promise<void> {
    this.items.set(post.id, Post.fromSnapshot(post.snapshot()));
  }

  async findAll(): Promise<Post[]> {
    return [...this.items.values()];
  }

  async findById(id: string): Promise<Post | null> {
    return this.items.get(id) ?? null;
  }
}

export class InMemoryScheduledPostRepository
  implements ScheduledPostRepository
{
  private readonly items = new Map<string, ScheduledPost>();

  async save(post: ScheduledPost): Promise<void> {
    this.items.set(post.id, ScheduledPost.fromSnapshot(post.snapshot()));
  }

  async findAll(): Promise<ScheduledPost[]> {
    return [...this.items.values()];
  }

  async findById(id: string): Promise<ScheduledPost | null> {
    return this.items.get(id) ?? null;
  }

  async remove(id: string): Promise<void> {
    this.items.delete(id);
  }
}

export class FakeClock implements Clock {
  private current: Date;

  constructor(current = new Date("2026-10-23T12:00:00.000Z")) {
    this.current = current;
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private value = 0;

  next(): string {
    this.value += 1;
    return `id-${this.value}`;
  }
}

export class RecordingNotifier implements Notifier {
  readonly messages: Array<{ message: string; tone: NotificationTone }> = [];

  notify(message: string, tone: NotificationTone = "info"): void {
    this.messages.push({ message, tone });
  }
}
