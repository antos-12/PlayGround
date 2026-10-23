import type { PostRepository } from "../domain/ports";
import type { Post } from "../domain/Post";

export type EngagementKind = "like" | "comment" | "share";

export class EngageWithPost {
  constructor(private readonly repo: PostRepository) {}

  async execute(id: string, kind: EngagementKind): Promise<Post> {
    const post = await this.repo.findById(id);
    if (!post) throw new Error("Publicación no encontrada.");

    if (kind === "like") post.like();
    if (kind === "comment") post.comment();
    if (kind === "share") post.share();

    await this.repo.save(post);
    return post;
  }
}
