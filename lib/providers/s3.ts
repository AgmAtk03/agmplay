import type {
  CatalogPage,
  PlaybackSession,
  PlaybackSource,
  SearchResult,
  Title,
} from "@/lib/types";
import type { LibraryProvider, ListTitlesOptions } from "@/lib/providers/types";

type ManifestTitle = Title & {
  sources?: PlaybackSource[];
  /** Object key relative to LIBRARY_PUBLIC_BASE when sources[].url is omitted */
  key?: string;
  protocol?: PlaybackSource["protocol"];
};

interface Manifest {
  titles?: ManifestTitle[];
  items?: ManifestTitle[];
}

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function joinUrl(base: string, key: string): string {
  if (/^https?:\/\//i.test(key)) return key;
  const trimmed = base.replace(/\/$/, "");
  const path = key.replace(/^\//, "");
  return `${trimmed}/${path}`;
}

function inferProtocol(url: string): PlaybackSource["protocol"] {
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".m3u8")) return "hls";
  if (lower.endsWith(".mpd")) return "dash";
  return "mp4";
}

function sourcesFor(item: ManifestTitle, publicBase: string): PlaybackSource[] {
  if (item.sources?.length) {
    return item.sources.map((source) => ({
      ...source,
      url: joinUrl(publicBase, source.url),
    }));
  }
  if (item.key) {
    const url = joinUrl(publicBase, item.key);
    return [{ protocol: item.protocol ?? inferProtocol(url), url }];
  }
  return [];
}

/**
 * Reads a JSON manifest (R2/S3/CDN) and resolves playback URLs against LIBRARY_PUBLIC_BASE.
 *
 * Manifest shape:
 * {
 *   "titles": [
 *     {
 *       "id": "film-1",
 *       "title": "Film 1",
 *       "type": "movie",
 *       "sources": [{ "protocol": "hls", "url": "film-1/master.m3u8" }]
 *     }
 *   ]
 * }
 */
export class S3LibraryProvider implements LibraryProvider {
  readonly name = "s3";
  private cache: { at: number; titles: ManifestTitle[] } | null = null;

  private async load(): Promise<ManifestTitle[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < 30_000) return this.cache.titles;
    const url = env("LIBRARY_MANIFEST_URL");
    if (!url) throw new Error("LIBRARY_MANIFEST_URL is not set");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Manifest ${res.status}`);
    const json = (await res.json()) as Manifest;
    const titles = json.titles ?? json.items ?? [];
    this.cache = { at: now, titles };
    return titles;
  }

  private base(): string {
    return env("LIBRARY_PUBLIC_BASE");
  }

  async listTitles(opts?: ListTitlesOptions): Promise<CatalogPage> {
    const titles = await this.load();
    const items = titles.filter((item) => {
      if (opts?.collection && item.collection !== opts.collection) return false;
      if (opts?.type && item.type !== opts.type) return false;
      return true;
    });
    return { items, provider: this.name };
  }

  async getTitle(id: string): Promise<Title | null> {
    const titles = await this.load();
    return titles.find((item) => item.id === id) ?? null;
  }

  async getPlayback(id: string): Promise<PlaybackSession | null> {
    const titles = await this.load();
    const item = titles.find((record) => record.id === id);
    if (!item) return null;
    const sources = sourcesFor(item, this.base());
    if (!sources.length) return null;
    return {
      titleId: item.id,
      title: item.title,
      preferred: sources[0].protocol,
      sources,
    };
  }

  async search(q: string): Promise<SearchResult> {
    const query = q.trim().toLowerCase();
    const titles = await this.load();
    const items = !query
      ? titles
      : titles.filter((item) =>
          [item.title, item.description, ...(item.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(query),
        );
    return { items, query: q, provider: this.name };
  }
}
