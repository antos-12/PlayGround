import {
  CalendarClock,
  Flame,
  LayoutDashboard,
  Layers,
  PlusCircle,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type { View } from "../types";

interface SidebarProps {
  view: View;
  scheduledCount: number;
  onView: (view: View) => void;
  onCompose: () => void;
  onReset: () => void;
}

const items = [
  { id: "panel" as const, label: "Panel", icon: LayoutDashboard },
  { id: "ranking" as const, label: "Ranking viral", icon: Trophy },
  { id: "scheduled" as const, label: "Programados", icon: CalendarClock },
];

export function Sidebar({
  view,
  scheduledCount,
  onView,
  onCompose,
  onReset,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Flame size={21} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-name">Go Viral</div>
          <div className="brand-sub">Content studio</div>
        </div>
      </div>

      <nav className="nav" aria-label="Navegación principal">
        <span className="nav-label">Estudio</span>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${view === item.id ? "active" : ""}`}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => onView(item.id)}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{item.label}</span>
              {item.id === "scheduled" && scheduledCount > 0 ? (
                <span className="nav-count">{scheduledCount}</span>
              ) : null}
            </button>
          );
        })}
        <button type="button" className="nav-item nav-action" onClick={onCompose}>
          <PlusCircle size={17} strokeWidth={2} />
          <span>Crear publicación</span>
        </button>
      </nav>

      <div className="sidebar-foot">
        <div className="arch-card">
          <div className="arch-title">
            <Layers size={14} />
            Arquitectura inversa
          </div>
          <p>
            El dominio manda. La interfaz, el almacenamiento y las notificaciones
            se enchufan desde afuera.
          </p>
          <div className="arch-path">
            <span>dominio</span>
            <i>→</i>
            <span>casos de uso</span>
            <i>→</i>
            <span>adaptadores</span>
          </div>
        </div>
        <button type="button" className="reset-button" onClick={onReset}>
          <RotateCcw size={13} />
          Reiniciar demo
        </button>
      </div>
    </aside>
  );
}
