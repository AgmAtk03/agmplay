export interface WatchProgress {
  titleId: string;
  seconds: number;
  duration: number;
  updatedAt: number;
}

const KEY = "agmplay.progress";

export function loadProgressMap(): Record<string, WatchProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, WatchProgress>;
  } catch {
    return {};
  }
}

export function getProgress(titleId: string): WatchProgress | null {
  return loadProgressMap()[titleId] ?? null;
}

export function saveProgress(entry: WatchProgress): void {
  if (typeof window === "undefined") return;
  const map = loadProgressMap();
  map[entry.titleId] = entry;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function continueWatchingIds(): string[] {
  return Object.values(loadProgressMap())
    .filter((item) => item.seconds > 5 && item.duration - item.seconds > 5)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((item) => item.titleId);
}
