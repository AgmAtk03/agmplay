import type {
  CatalogPage,
  PlaybackSession,
  SearchResult,
  Title,
} from "@/lib/types";
import type { LibraryProvider, ListTitlesOptions } from "@/lib/providers/types";

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function fillPath(template: string, id: string): string {
  return template.replace(":id", encodeURIComponent(id));
}

/**
 * Talks to AgmBizz's existing library API.
 * Default paths match the AgmPlay mobile contract. Override with LIBRARY_PATH_*.
 */
export class HttpLibraryProvider implements LibraryProvider {
  readonly name = "http";
  private readonly base: string;
  private readonly headers: HeadersInit;

  constructor() {
    this.base = env("LIBRARY_API_URL").replace(/\/$/, "");
    const headerName = env("LIBRARY_AUTH_HEADER", "Authorization");
    const headerValue = env("LIBRARY_API_KEY");
    this.headers = {
      Accept: "application/json",
      ...(headerValue ? { [headerName]: headerValue } : {}),
    };
  }

  private async get<T>(path: string): Promise<T> {
    if (!this.base) {
      throw new Error("LIBRARY_API_URL is not set");
    }
    const url = `${this.base}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, { headers: this.headers, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Library API ${res.status} for ${path}`);
    }
    return (await res.json()) as T;
  }

  async listTitles(opts?: ListTitlesOptions): Promise<CatalogPage> {
    const path = env("LIBRARY_PATH_CATALOG", "/catalog");
    const params = new URLSearchParams();
    if (opts?.collection) params.set("collection", opts.collection);
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.cursor) params.set("cursor", opts.cursor);
    const qs = params.toString();
    const data = await this.get<CatalogPage | Title[]>(qs ? `${path}?${qs}` : path);
    if (Array.isArray(data)) {
      return { items: data, provider: this.name };
    }
    return { ...data, provider: data.provider ?? this.name };
  }

  async getTitle(id: string): Promise<Title | null> {
    const path = fillPath(env("LIBRARY_PATH_TITLE", "/catalog/:id"), id);
    try {
      const data = await this.get<Title | { item: Title }>(path);
      if ("item" in data && data.item) return data.item;
      return data as Title;
    } catch {
      return null;
    }
  }

  async getPlayback(id: string): Promise<PlaybackSession | null> {
    const path = fillPath(env("LIBRARY_PATH_PLAYBACK", "/playback/:id"), id);
    try {
      return await this.get<PlaybackSession>(path);
    } catch {
      return null;
    }
  }

  async search(q: string): Promise<SearchResult> {
    const path = env("LIBRARY_PATH_SEARCH", "/search");
    const data = await this.get<SearchResult | Title[]>(
      `${path}?q=${encodeURIComponent(q)}`,
    );
    if (Array.isArray(data)) {
      return { items: data, query: q, provider: this.name };
    }
    return { ...data, query: data.query ?? q, provider: data.provider ?? this.name };
  }
}
