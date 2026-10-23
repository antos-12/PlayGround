import { useCallback, useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import type { SnapshotDto } from "../api/dto";
import type { FeedSort, GoViralApi } from "../api/GoViralApi";
import type { EngagementKind } from "../../application/EngageWithPost";
import type { BrowserNotifier, NotificationEvent } from "../../infrastructure/BrowserNotifier";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { StatsGrid } from "./components/StatsGrid";
import { Composer, type ComposeInput } from "./components/Composer";
import { RankingPanel } from "./components/RankingPanel";
import { Feed } from "./components/Feed";
import { RankingView } from "./components/RankingView";
import { ScheduledView } from "./components/ScheduledView";
import { Toasts } from "./components/Toasts";
import type { View } from "./types";

interface AppProps {
  api: GoViralApi;
  notifier: BrowserNotifier;
}

const COPY: Record<View, { title: string; subtitle: string }> = {
  panel: {
    title: "Panel de control",
    subtitle: "El pulso de tu contenido, en un solo lugar.",
  },
  ranking: {
    title: "Ranking viral",
    subtitle: "Quién está dominando la conversación ahora mismo.",
  },
  scheduled: {
    title: "Programados",
    subtitle: "Tu calendario editorial, listo para disparar.",
  },
};

export function App({ api, notifier }: AppProps) {
  const [view, setView] = useState<View>("panel");
  const [sort, setSort] = useState<FeedSort>("recent");
  const [snapshot, setSnapshot] = useState<SnapshotDto | null>(null);
  const [toasts, setToasts] = useState<NotificationEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const processing = useRef(false);
  const mutating = useRef(false);

  const refresh = useCallback(
    async (nextSort: FeedSort = sort) => {
      setSnapshot(await api.snapshot(nextSort));
    },
    [api, sort],
  );

  useEffect(() => {
    let alive = true;
    api
      .snapshot(sort)
      .then((next) => {
        if (alive) setSnapshot(next);
      })
      .catch(() => {
        if (alive) notifier.notify("No pudimos cargar tu estudio", "error");
      });
    return () => {
      alive = false;
    };
  }, [api, notifier, sort]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(
    () =>
      notifier.subscribe((event) => {
        setToasts((current) => [...current, event]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== event.id));
        }, 4_200);
      }),
    [notifier],
  );

  useEffect(() => {
    if (!snapshot || processing.current) return;
    if (!snapshot.scheduled.some((item) => item.due)) return;

    processing.current = true;
    api
      .publishDue()
      .then(() => refresh())
      .catch(() => notifier.notify("No pudimos publicar la cola", "error"))
      .finally(() => {
        processing.current = false;
      });
  }, [now, snapshot, api, notifier, refresh]);

  function compose() {
    setView("panel");
    window.setTimeout(() => {
      const element = document.querySelector("[data-composer]");
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        document.querySelector<HTMLTextAreaElement>("#content")?.focus();
      }, 320);
    }, 40);
  }

  async function handleCompose(input: ComposeInput) {
    if (input.publishAt) {
      await api.schedule(input.author, input.content, input.publishAt);
    } else {
      await api.publish(input.author, input.content);
    }
    await refresh();
  }

  function handleEngage(id: string, kind: EngagementKind) {
    if (mutating.current) return;
    mutating.current = true;
    api
      .engage(id, kind)
      .then(() => {
        if (kind === "share") notifier.notify("Compartido con tu audiencia", "info");
        return refresh();
      })
      .catch(() => notifier.notify("No pudimos registrar la interacción", "error"))
      .finally(() => {
        mutating.current = false;
      });
  }

  function handlePublishNow(id: string) {
    if (mutating.current) return;
    mutating.current = true;
    api
      .publishNow(id)
      .then(() => refresh())
      .catch(() => notifier.notify("No pudimos publicar la pieza", "error"))
      .finally(() => {
        mutating.current = false;
      });
  }

  function handleCancel(id: string) {
    if (mutating.current) return;
    mutating.current = true;
    api
      .cancelScheduled(id)
      .then(() => refresh())
      .catch(() => notifier.notify("No pudimos cancelar la programación", "error"))
      .finally(() => {
        mutating.current = false;
      });
  }

  function handleReset() {
    const confirmed = window.confirm(
      "¿Reiniciar la demo? Se van a borrar las publicaciones y programaciones de este navegador.",
    );
    if (!confirmed) return;

    api
      .resetDemo()
      .then(() => refresh())
      .then(() => notifier.notify("Demo reiniciada con contenido de ejemplo", "info"))
      .catch(() => notifier.notify("No pudimos reiniciar la demo", "error"));
  }

  if (!snapshot) {
    return (
      <div className="splash">
        <div className="splash-mark">
          <Flame size={26} strokeWidth={2.4} />
        </div>
        <span>Go Viral</span>
        <p>Calentando el algoritmo...</p>
      </div>
    );
  }

  const copy = COPY[view];

  return (
    <div className="app-shell">
      <div className="bg-glow glow-a" />
      <div className="bg-glow glow-b" />
      <Sidebar
        view={view}
        scheduledCount={snapshot.stats.scheduledCount}
        onView={setView}
        onCompose={compose}
        onReset={handleReset}
      />

      <main className="main">
        <Topbar
          title={copy.title}
          subtitle={copy.subtitle}
          now={now}
          onCompose={compose}
        />

        {view === "panel" ? (
          <>
            <StatsGrid stats={snapshot.stats} />
            <div className="dashboard">
              <div className="dashboard-left">
                <Composer onSubmit={handleCompose} />
              </div>
              <div className="dashboard-right">
                <RankingPanel
                  ranking={snapshot.ranking}
                  onViewRanking={() => setView("ranking")}
                />
                <Feed
                  posts={snapshot.posts}
                  sort={sort}
                  now={now}
                  onSort={setSort}
                  onEngage={handleEngage}
                  onCompose={compose}
                />
              </div>
            </div>
          </>
        ) : null}

        {view === "ranking" ? (
          <RankingView ranking={snapshot.ranking} now={now} />
        ) : null}

        {view === "scheduled" ? (
          <ScheduledView
            scheduled={snapshot.scheduled}
            now={now}
            onPublishNow={handlePublishNow}
            onCancel={handleCancel}
            onCompose={compose}
          />
        ) : null}
      </main>

      <Toasts
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((current) => current.filter((item) => item.id !== id))
        }
      />
    </div>
  );
}
