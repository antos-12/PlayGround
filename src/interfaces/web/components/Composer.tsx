import { useRef, useState, type FormEvent } from "react";
import {
  CalendarClock,
  PenLine,
  Rocket,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  avatarVariant,
  defaultScheduleValue,
  initials,
  toDateTimeLocal,
} from "../format";

export interface ComposeInput {
  author: string;
  content: string;
  publishAt?: Date;
}

interface ComposerProps {
  onSubmit: (input: ComposeInput) => Promise<void>;
}

const TEMPLATES = [
  {
    label: "Lanzamiento",
    text: "Estoy lanzando algo nuevo. Primeras impresiones en los comentarios.",
  },
  {
    label: "Detrás de cámara",
    text: "Detrás de cámara: así se ve un día creando contenido.",
  },
  {
    label: "Pregunta",
    text: "Pregunta seria para mi audiencia: ¿qué querés ver la próxima semana?",
  },
];

function storedAuthor(): string {
  try {
    return localStorage.getItem("go-viral:author") ?? "Ana Torres";
  } catch {
    return "Ana Torres";
  }
}

export function Composer({ onSubmit }: ComposerProps) {
  const [author, setAuthor] = useState(storedAuthor);
  const [content, setContent] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() =>
    defaultScheduleValue(Date.now()),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = 280 - content.length;
  const ratio = Math.min(100, (content.length / 280) * 100);
  const nearLimit = remaining <= 30;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    const cleanContent = content.trim();
    if (!author.trim()) {
      setError("Escribí un nombre de autor.");
      return;
    }
    if (!cleanContent) {
      setError("El contenido no puede estar vacío.");
      return;
    }

    let publishAt: Date | undefined;
    if (scheduleMode) {
      publishAt = new Date(scheduleAt);
      if (Number.isNaN(publishAt.getTime())) {
        setError("Elegí una fecha válida.");
        return;
      }
      if (publishAt.getTime() <= Date.now()) {
        setError("Elegí una fecha futura para programar.");
        return;
      }
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit({ author: author.trim(), content: cleanContent, publishAt });
      try {
        localStorage.setItem("go-viral:author", author.trim());
      } catch {
        void 0;
      }
      setContent("");
      setScheduleMode(false);
      setScheduleAt(defaultScheduleValue(Date.now()));
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No pudimos publicar. Probá de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  function useTemplate(text: string) {
    setContent(text);
    setError(null);
    textareaRef.current?.focus();
  }

  return (
    <section className="panel composer" data-composer>
      <div className="panel-head">
        <div className="panel-title">
          <span className="panel-icon">
            <PenLine size={15} />
          </span>
          Nueva publicación
        </div>
        <span className="soft-tag">280 caracteres</span>
      </div>

      <form className="composer-body" onSubmit={submit}>
        <div className="field-group">
          <label htmlFor="author">Autor</label>
          <div className="author-field">
            <span className={`avatar avatar-sm ${avatarVariant(author || "?")}`}>
              {initials(author) || "?"}
            </span>
            <input
              id="author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              maxLength={40}
            />
          </div>
        </div>

        <div className="field-group">
          <div className="label-row">
            <label htmlFor="content">Contenido</label>
            <span className={`char-count ${nearLimit ? "warn" : ""}`}>
              {remaining} restantes
            </span>
          </div>
          <textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(event) => {
              setContent(event.target.value.slice(0, 280));
              setError(null);
            }}
            placeholder="¿Qué va a hacer explotar tu feed hoy?"
            rows={5}
            maxLength={280}
          />
          <div className="meter">
            <span
              className={nearLimit ? "near" : ""}
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>

        <div className="template-row">
          <span className="template-label">
            <Wand2 size={12} /> Ideas
          </span>
          {TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              className="chip"
              onClick={() => useTemplate(template.text)}
            >
              {template.label}
            </button>
          ))}
        </div>

        <div className="schedule-row">
          <div className="schedule-copy">
            <span className="schedule-title">
              <CalendarClock size={14} /> Programar
            </span>
            <span className="schedule-hint">Elegí cuándo sale al aire</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={scheduleMode}
            aria-label="Programar publicación"
            className={`switch ${scheduleMode ? "on" : ""}`}
            onClick={() => {
              setScheduleMode((value) => !value);
              setError(null);
            }}
          >
            <span />
          </button>
        </div>

        {scheduleMode ? (
          <div className="field-group reveal">
            <label htmlFor="schedule-at">Fecha y hora</label>
            <input
              id="schedule-at"
              type="datetime-local"
              className="date-input"
              value={scheduleAt}
              min={toDateTimeLocal(new Date(Date.now() + 60_000))}
              onChange={(event) => setScheduleAt(event.target.value)}
            />
          </div>
        ) : null}

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="button-primary" disabled={busy}>
          {scheduleMode ? <CalendarClock size={16} /> : <Rocket size={16} />}
          {busy
            ? "Procesando..."
            : scheduleMode
              ? "Programar publicación"
              : "Publicar ahora"}
        </button>

        <p className="composer-note">
          <Sparkles size={11} />
          Score = engagement / (horas + 2)<sup>1.5</sup>
        </p>
      </form>
    </section>
  );
}
