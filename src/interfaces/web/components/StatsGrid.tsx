import {
  CalendarClock,
  FileText,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { DashboardStats } from "../../../application/GetDashboardStats";
import { formatNumber, formatScore } from "../format";

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="stats" aria-label="Resumen del estudio">
      <article className="stat-card">
        <div className="stat-top">
          <span className="stat-label">Publicaciones</span>
          <span className="stat-icon">
            <FileText size={15} />
          </span>
        </div>
        <div className="stat-value">{formatNumber(stats.totalPosts)}</div>
        <p className="stat-sub">piezas en circulación</p>
      </article>

      <article className="stat-card">
        <div className="stat-top">
          <span className="stat-label">Engagement</span>
          <span className="stat-icon accent-lime">
            <Zap size={15} />
          </span>
        </div>
        <div className="stat-value">{formatNumber(stats.totalEngagement)}</div>
        <p className="stat-sub">
          {formatNumber(stats.totalLikes)} likes ·{" "}
          {formatNumber(stats.totalComments)} comentarios ·{" "}
          {formatNumber(stats.totalShares)} shares
        </p>
      </article>

      <article className="stat-card stat-highlight">
        <div className="stat-top">
          <span className="stat-label">Score viral</span>
          <span className="stat-icon accent-fire">
            <TrendingUp size={15} />
          </span>
        </div>
        <div className="stat-value">
          {formatScore(stats.averageScore)}
          <span className="stat-unit">pts</span>
        </div>
        <p className="stat-sub">
          promedio · pico <strong>{formatScore(stats.topScore)}</strong>
        </p>
      </article>

      <article className="stat-card">
        <div className="stat-top">
          <span className="stat-label">En cola</span>
          <span className="stat-icon accent-violet">
            <CalendarClock size={15} />
          </span>
        </div>
        <div className="stat-value">{formatNumber(stats.scheduledCount)}</div>
        <p className="stat-sub">
          <Sparkles size={11} /> esperando su momento
        </p>
      </article>
    </section>
  );
}
