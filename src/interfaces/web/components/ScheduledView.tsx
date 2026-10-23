import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Rocket,
  Trash2,
} from "lucide-react";
import type { ScheduledPostDto } from "../../api/dto";
import {
  avatarVariant,
  dayNumber,
  formatCountdown,
  formatDateTime,
  handleFromName,
  initials,
  monthShort,
} from "../format";

interface ScheduledViewProps {
  scheduled: ScheduledPostDto[];
  now: number;
  onPublishNow: (id: string) => void;
  onCancel: (id: string) => void;
  onCompose: () => void;
}

export function ScheduledView({
  scheduled,
  now,
  onPublishNow,
  onCancel,
  onCompose,
}: ScheduledViewProps) {
  const next = scheduled[0];

  return (
    <div className="scheduled-view">
      <section className="panel schedule-hero">
        <div>
          <span className="leader-kicker">
            <CalendarClock size={13} /> Cola de publicación
          </span>
          <h2>
            {scheduled.length === 0
              ? "No hay nada programado"
              : `${scheduled.length} ${scheduled.length === 1 ? "pieza" : "piezas"} en la fila`}
          </h2>
          <p>
            {next
              ? `La próxima sale ${formatCountdown(next.publishAt, now)}.`
              : "Programá una publicación para que el estudio trabaje mientras descansás."}
          </p>
        </div>
        <button type="button" className="button-primary compact" onClick={onCompose}>
          <CalendarDays size={15} />
          Programar una nueva
        </button>
      </section>

      {scheduled.length === 0 ? (
        <div className="panel empty-state tall">
          <span className="empty-icon">
            <Clock3 size={22} />
          </span>
          <h3>Tu calendario está libre</h3>
          <p>Activá «Programar» en el compositor y elegí el momento exacto.</p>
          <button type="button" className="button-primary compact" onClick={onCompose}>
            Ir al compositor
          </button>
        </div>
      ) : (
        <div className="scheduled-grid">
          {scheduled.map((post) => (
            <article
              key={post.id}
              className={`panel scheduled-card ${post.due ? "due" : ""}`}
            >
              <div className="scheduled-top">
                <div className="date-chip">
                  <span>{monthShort(post.publishAt)}</span>
                  <strong>{dayNumber(post.publishAt)}</strong>
                </div>
                <div className="scheduled-author">
                  <span className={`avatar avatar-sm ${avatarVariant(post.author)}`}>
                    {initials(post.author)}
                  </span>
                  <div>
                    <strong>{post.author}</strong>
                    <span>{handleFromName(post.author)}</span>
                  </div>
                </div>
                <span className={`queue-pill ${post.due ? "ready" : ""}`}>
                  {post.due ? "Lista" : formatCountdown(post.publishAt, now)}
                </span>
              </div>

              <p className="scheduled-content">{post.content}</p>

              <div className="scheduled-foot">
                <span className="scheduled-date">
                  <CalendarClock size={13} />
                  {formatDateTime(post.publishAt)}
                </span>
                <div className="scheduled-actions">
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => onPublishNow(post.id)}
                  >
                    <Rocket size={14} />
                    Publicar ahora
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    aria-label="Cancelar programación"
                    onClick={() => onCancel(post.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
