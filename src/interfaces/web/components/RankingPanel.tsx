import { ArrowUpRight, Flame, Trophy } from "lucide-react";
import type { PostDto } from "../../api/dto";
import { avatarVariant, formatScore, handleFromName, initials } from "../format";

interface RankingPanelProps {
  ranking: PostDto[];
  onViewRanking: () => void;
}

export function RankingPanel({ ranking, onViewRanking }: RankingPanelProps) {
  return (
    <section className="panel ranking-panel">
      <div className="panel-head">
        <div className="panel-title">
          <span className="panel-icon accent-fire">
            <Trophy size={15} />
          </span>
          Top viral
        </div>
        <button type="button" className="link-button" onClick={onViewRanking}>
          Ver todo <ArrowUpRight size={13} />
        </button>
      </div>

      {ranking.length === 0 ? (
        <div className="mini-empty">Todavía no hay publicaciones.</div>
      ) : (
        <ol className="ranking-list">
          {ranking.slice(0, 5).map((post, index) => (
            <li key={post.id} className={`ranking-item rank-${index + 1}`}>
              <span className="rank-number">{index + 1}</span>
              <span className={`avatar avatar-sm ${avatarVariant(post.author)}`}>
                {initials(post.author)}
              </span>
              <div className="ranking-copy">
                <span className="ranking-author">{post.author}</span>
                <span className="ranking-content">{post.content}</span>
              </div>
              <span className="score-chip">
                <Flame size={11} />
                {formatScore(post.score)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="ranking-foot">
        <span>{handleFromName("Go Viral")}</span>
        <span>actualizado en vivo</span>
      </div>
    </section>
  );
}
