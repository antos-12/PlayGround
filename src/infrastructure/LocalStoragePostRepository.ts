import { Post, type PostSnapshot } from "../domain/Post";
import type { PostRepository } from "../domain/ports";
import { readJson, writeJson } from "./storage";

export const POSTS_KEY = "go-viral:posts:v1";

export class LocalStoragePostRepository implements PostRepository {
  private readonly key: string;

  constructor(key = POSTS_KEY) {
    this.key = key;
  }

  private load(): PostSnapshot[] {
    return readJson<PostSnapshot[]>(this.key, []);
  }

  async save(post: Post): Promise<void> {
    const posts = this.load();
    const snapshot = post.snapshot();
    const index = posts.findIndex((item) => item.id === post.id);

    if (index === -1) posts.push(snapshot);
    else posts[index] = snapshot;

    writeJson(this.key, posts);
  }

  async findAll(): Promise<Post[]> {
    return this.load().map((snapshot) => Post.fromSnapshot(snapshot));
  }

  async findById(id: string): Promise<Post | null> {
    const snapshot = this.load().find((item) => item.id === id);
    return snapshot ? Post.fromSnapshot(snapshot) : null;
  }
}
