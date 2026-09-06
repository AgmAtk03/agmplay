export function assetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const prefix = (process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "").replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${clean}`;
}
