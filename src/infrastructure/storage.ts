const memory = new Map<string, string>();

function storage(): Storage | null {
  try {
    const candidate = globalThis.localStorage;
    candidate.getItem("go-viral:probe");
    return candidate;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const store = storage();
  const raw = store ? store.getItem(key) : (memory.get(key) ?? null);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  const store = storage();
  if (store) {
    store.setItem(key, raw);
    return;
  }
  memory.set(key, raw);
}

export function removeKey(key: string): void {
  const store = storage();
  if (store) {
    store.removeItem(key);
    return;
  }
  memory.delete(key);
}

export function hasFlag(key: string): boolean {
  const store = storage();
  return store ? store.getItem(key) !== null : memory.has(key);
}

export function setFlag(key: string, value = "1"): void {
  const store = storage();
  if (store) {
    store.setItem(key, value);
    return;
  }
  memory.set(key, value);
}
