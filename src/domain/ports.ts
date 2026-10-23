import type { Post } from "./Post";
import type { ScheduledPost } from "./ScheduledPost";

export interface PostRepository {
  save(post: Post): Promise<void>;
  findAll(): Promise<Post[]>;
  findById(id: string): Promise<Post | null>;
}

export interface ScheduledPostRepository {
  save(post: ScheduledPost): Promise<void>;
  findAll(): Promise<ScheduledPost[]>;
  findById(id: string): Promise<ScheduledPost | null>;
  remove(id: string): Promise<void>;
}

export type NotificationTone = "success" | "info" | "warn" | "error";

export interface Notifier {
  notify(message: string, tone?: NotificationTone): void;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
