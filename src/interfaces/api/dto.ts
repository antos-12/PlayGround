import type { Post } from "../../domain/Post";
import type { ScheduledPost } from "../../domain/ScheduledPost";
import type { DashboardStats } from "../../application/GetDashboardStats";

export interface PostDto {
  id: string;
  author: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  score: number;
  createdAt: string;
}

export interface ScheduledPostDto {
  id: string;
  author: string;
  content: string;
  publishAt: string;
  due: boolean;
}

export interface SnapshotDto {
  posts: PostDto[];
  ranking: PostDto[];
  scheduled: ScheduledPostDto[];
  stats: DashboardStats;
}

export function toPostDto(post: Post, score: number): PostDto {
  return {
    id: post.id,
    author: post.author,
    content: post.content,
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    engagement: post.engagement,
    score: Number(score.toFixed(2)),
    createdAt: post.createdAt.toISOString(),
  };
}

export function toScheduledDto(
  scheduled: ScheduledPost,
  due: boolean,
): ScheduledPostDto {
  return {
    id: scheduled.id,
    author: scheduled.author,
    content: scheduled.content,
    publishAt: scheduled.publishAt.toISOString(),
    due,
  };
}
