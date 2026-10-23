import { PenLine, Radio } from "lucide-react";
import { formatClock } from "../format";

interface TopbarProps {
  title: string;
  subtitle: string;
  now: number;
  onCompose: () => void;
}

export function Topbar({ title, subtitle, now, onCompose }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        <div className="live-pill" title="Datos guardados en tu navegador">
          <span className="live-dot" />
          <Radio size={13} />
          <span>En vivo · {formatClock(now)}</span>
        </div>
        <button type="button" className="button-primary compact" onClick={onCompose}>
          <PenLine size={15} />
          Nueva publicación
        </button>
        <div className="user-chip" title="Tu espacio de trabajo">
          AT
        </div>
      </div>
    </header>
  );
}
