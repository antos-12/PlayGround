import { Clock3, Flame, PenLine } from "lucide-react";
import type { PostDto } from "../../api/dto";
import type { EngagementKind } from "../../../application/EngageWithPost";
import type { FeedSort } from "../../api/GoViralApi";
import { PostCard } from "./PostCard";

interface FeedProps {
  posts: PostDto[];
  sort: FeedSort;
  now: number;
  onSort: (sort: FeedSort) => void;
  onEngage: (id: string, kind: EngagementKind) => void;
  onCompose: () => void;
}

export function Feed({
  posts,
  sort,
  now,
  onSort,
  onEngage,
  onCompose,
}: FeedProps) {
  return (
    <section className="feed-section">
      <div className="section-head">
        <div>
          <h2>Actividad reciente</h2>
          <p>Lo último que salió al aire</p>
        </div>
        <div className="segmented" role="group" aria-label="Ordenar feed">
          <button
            type="button"
            className={sort === "recent" ? "active" : ""}
            onClick={() => onSort("recent")}
          >
            <Clock3 size={13} /> Recientes
          </button>
          <button
            type="button"
            className={sort === "viral" ? "active" : ""}
            onClick={() => onSort("viral")}
          >
            <Flame size={13} /> Virales
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="panel empty-state">
          <span className="empty-icon">
            <PenLine size={22} />
          </span>
          <h3>Tu feed está en blanco</h3>
          <p>Creá la primera publicación y empezá a medir su pulso viral.</p>
          <button type="button" className="button-primary compact" onClick={onCompose}>
            <PenLine size={15} />
            Escribir la primera
          </button>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} now={now} onEngage={onEngage} />
          ))}
        </div>
      )}
    </section>
  );
}
