export function formatDuration(total?: number): string {
  if (!total || total <= 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  if (total >= 60) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

export function formatClock(total: number): string {
  if (!Number.isFinite(total) || total < 0) return "0:00";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = Math.floor(total % 60);
  const mm = hours > 0 ? minutes.toString().padStart(2, "0") : String(minutes);
  const ss = seconds.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function typeLabel(type: string): string {
  if (type === "movie") return "Film";
  if (type === "episode") return "Episode";
  if (type === "live") return "Live";
  return "Clip";
}
