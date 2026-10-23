const numberFormat = new Intl.NumberFormat("es-AR");
const decimalFormat = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value));
}

export function formatScore(value: number): string {
  return decimalFormat.format(value);
}

export function formatRelative(iso: string, now: number): string {
  const date = new Date(iso).getTime();
  const diff = Math.max(0, now - date);
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatCountdown(iso: string, now: number): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "Ahora";

  const totalMinutes = Math.ceil(diff / 60_000);
  if (totalMinutes < 60) return `en ${totalMinutes} min`;

  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) {
    const minutes = totalMinutes % 60;
    return `en ${totalHours} h ${String(minutes).padStart(2, "0")} min`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `en ${days} d ${hours} h`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatClock(now: number): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

export function initials(author: string): string {
  return author
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function handleFromName(author: string): string {
  const clean = author
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return `@${clean || "creador"}`;
}

export function avatarVariant(author: string): string {
  let hash = 0;
  for (const char of author) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `avatar-${hash % 5}`;
}

export function monthShort(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { month: "short" })
    .format(new Date(iso))
    .replace(".", "")
    .toUpperCase();
}

export function dayNumber(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit" }).format(
    new Date(iso),
  );
}

export function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultScheduleValue(now: number): string {
  return toDateTimeLocal(new Date(now + 2 * 3_600_000));
}

export function percentOf(score: number, top: number): number {
  if (!top || top <= 0) return 0;
  return Math.max(4, Math.min(100, (score / top) * 100));
}
