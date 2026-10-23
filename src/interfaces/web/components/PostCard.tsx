import { useState } from "react";
import { Flame, Heart, MessageCircle, Share2 } from "lucide-react";
import type { PostDto } from "../../api/dto";
import type { EngagementKind } from "../../../application/EngageWithPost";
import {
  avatarVariant,
  formatNumber,
  formatRelative,
  formatScore,
  handleFromName,
  initials,
} from "../format";

interface PostCardProps {
  post: PostDto;
  now: number;
  onEngage: (id: string, kind: EngagementKind) => void;
}

export function PostCard({ post, now, onEngage }: PostCardProps) {
  const [bump, setBump] = useState<string | null>(null);

  function engage(kind: EngagementKind) {
    onEngage(post.id, kind);
    setBump(kind);
    window.setTimeout(() => setBump(null), 380);
  }

  const isNew = now - new Date(post.createdAt).getTime() < 3_600_000;

  return (
    <article className="panel post-card">
      <div className="post-head">
        <span className={`avatar ${avatarVariant(post.author)}`}>
          {initials(post.author)}
        </span>
        <div className="post-identity">
          <div className="post-name">
            {post.author}
            {isNew ? <span className="tag-new">Nuevo</span> : null}
          </div>
          <div className="post-meta">
            {handleFromName(post.author)} · {formatRelative(post.createdAt, now)}
          </div>
        </div>
        <span className="score-chip large">
          <Flame size={12} />
          {formatScore(post.score)}
        </span>
      </div>

      <p className="post-content">{post.content}</p>

      <div className="post-foot">
        <div className="post-actions">
          <button
            type="button"
            className={`metric ${bump === "like" ? "bump" : ""}`}
            onClick={() => engage("like")}
            aria-label={`Me gusta (${post.likes})`}
          >
            <Heart size={15} />
            <span>{formatNumber(post.likes)}</span>
          </button>
          <button
            type="button"
            className={`metric ${bump === "comment" ? "bump" : ""}`}
            onClick={() => engage("comment")}
            aria-label={`Comentar (${post.comments})`}
          >
            <MessageCircle size={15} />
            <span>{formatNumber(post.comments)}</span>
          </button>
          <button
            type="button"
            className={`metric ${bump === "share" ? "bump" : ""}`}
            onClick={() => engage("share")}
            aria-label={`Compartir (${post.shares})`}
          >
            <Share2 size={15} />
            <span>{formatNumber(post.shares)}</span>
          </button>
        </div>
        <span className="engagement-label">
          {formatNumber(post.engagement)} de engagement
        </span>
      </div>
    </article>
  );
}
