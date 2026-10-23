import type { CSSProperties } from "react";
import {
  Flame,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { PostDto } from "../../api/dto";
import {
  avatarVariant,
  formatNumber,
  formatRelative,
  formatScore,
  handleFromName,
  initials,
  percentOf,
} from "../format";

interface RankingViewProps {
  ranking: PostDto[];
  now: number;
}

export function RankingView({ ranking, now }: RankingViewProps) {
  const leader = ranking[0];
  const topScore = leader?.score ?? 0;

  if (!leader) {
    return (
      <div className="panel empty-state tall">
        <span className="empty-icon">
          <Trophy size={22} />
        </span>
        <h3>El ranking está esperando</h3>
        <p>Publicá algo para empezar a competir por el primer puesto.</p>
      </div>
    );
  }

  const ringStyle = {
    "--pct": `${percentOf(leader.score, topScore)}%`,
  } as CSSProperties;

  return (
    <div className="ranking-view">
      <section className="leader-card">
        <div className="leader-copy">
          <span className="leader-kicker">
            <Sparkles size={13} /> Líder viral
          </span>
          <p className="leader-quote">{leader.content}</p>
          <div className="leader-author">
            <span className={`avatar ${avatarVariant(leader.author)}`}>
              {initials(leader.author)}
            </span>
            <div>
              <strong>{leader.author}</strong>
              <span>
                {handleFromName(leader.author)} ·{" "}
                {formatRelative(leader.createdAt, now)}
              </span>
            </div>
          </div>
          <div className="leader-metrics">
            <span>
              <Heart size={13} /> {formatNumber(leader.likes)}
            </span>
            <span>
              <MessageCircle size={13} /> {formatNumber(leader.comments)}
            </span>
            <span>
              <Share2 size={13} /> {formatNumber(leader.shares)}
            </span>
          </div>
        </div>

        <div className="score-ring" style={ringStyle}>
          <div className="score-ring-inner">
            <Flame size={18} />
            <strong>{formatScore(leader.score)}</strong>
            <span>score viral</span>
          </div>
        </div>
      </section>

      <section className="panel ranking-table">
        <div className="panel-head">
          <div className="panel-title">
            <span className="panel-icon accent-fire">
              <Trophy size={15} />
            </span>
            Ranking completo
          </div>
          <span className="soft-tag">{ranking.length} publicaciones</span>
        </div>

        <div className="table-head">
          <span>Puesto</span>
          <span>Autor</span>
          <span>Publicación</span>
          <span>Engagement</span>
          <span>Score</span>
        </div>

        <div className="table-body">
          {ranking.map((post, index) => (
            <div className={`table-row ${index === 0 ? "leading" : ""}`} key={post.id}>
              <span className="table-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="table-author">
                <span className={`avatar avatar-xs ${avatarVariant(post.author)}`}>
                  {initials(post.author)}
                </span>
                {post.author}
              </span>
              <span className="table-content" title={post.content}>
                {post.content}
              </span>
              <span className="table-engagement">
                <Heart size={11} /> {formatNumber(post.likes)}
                <MessageCircle size={11} /> {formatNumber(post.comments)}
                <Share2 size={11} /> {formatNumber(post.shares)}
              </span>
              <span className="table-score">
                <strong>{formatScore(post.score)}</strong>
                <i style={{ width: `${percentOf(post.score, topScore)}%` }} />
              </span>
            </div>
          ))}
        </div>

        <div className="formula-note">
          score = (likes + comentarios × 2 + shares × 3) / (horas + 2)
          <sup>1.5</sup>
        </div>
      </section>
    </div>
  );
}
