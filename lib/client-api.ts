import { assetUrl } from "@/lib/asset";
import type { AdConfig } from "@/lib/ads/types";
import type {
  CatalogPage,
  PlaybackSession,
  SearchResult,
  Title,
} from "@/lib/types";

const STATIC = process.env.NEXT_PUBLIC_STATIC_PAGES === "1";

async function tryJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface StaticCatalog {
  titles: Title[];
}

async function staticCatalog(): Promise<Title[]> {
  const data = await tryJson<StaticCatalog>(
    assetUrl("/data/demo-catalog.json") ?? "/data/demo-catalog.json",
  );
  return data?.titles ?? [];
}

export async function fetchCatalog(params?: {
  collection?: string;
  type?: string;
}): Promise<CatalogPage> {
  if (!STATIC) {
    const qs = new URLSearchParams();
    if (params?.collection) qs.set("collection", params.collection);
    if (params?.type) qs.set("type", params.type);
    const suffix = qs.toString() ? `?${qs}` : "";
    const live = await tryJson<CatalogPage>(`/api/catalog${suffix}`);
    if (live) return live;
  }
  let items = await staticCatalog();
  if (params?.collection) {
    items = items.filter((item) => item.collection === params.collection);
  }
  if (params?.type) {
    items = items.filter((item) => item.type === params.type);
  }
  return { items, provider: "demo" };
}

export async function fetchTitle(id: string): Promise<Title | null> {
  if (!STATIC) {
    const live = await tryJson<Title>(`/api/catalog/${encodeURIComponent(id)}`);
    if (live && !("error" in live)) return live;
  }
  const items = await staticCatalog();
  return items.find((item) => item.id === id) ?? null;
}

export async function fetchPlayback(id: string): Promise<PlaybackSession | null> {
  if (!STATIC) {
    const live = await tryJson<PlaybackSession>(
      `/api/playback/${encodeURIComponent(id)}`,
    );
    if (live && live.sources) return live;
  }
  const data = await tryJson<{
    titles: (Title & { sources: PlaybackSession["sources"] })[];
  }>(assetUrl("/data/demo-catalog.json") ?? "/data/demo-catalog.json");
  const record = data?.titles.find((item) => item.id === id);
  if (!record?.sources?.length) return null;
  return {
    titleId: record.id,
    title: record.title,
    preferred: record.sources[0].protocol,
    sources: record.sources,
  };
}

export async function fetchSearch(q: string): Promise<SearchResult> {
  if (!STATIC) {
    const live = await tryJson<SearchResult>(
      `/api/search?q=${encodeURIComponent(q)}`,
    );
    if (live) return live;
  }
  const items = await staticCatalog();
  const query = q.trim().toLowerCase();
  return {
    query: q,
    provider: "demo",
    items: query
      ? items.filter((item) =>
          [item.title, item.description, ...(item.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : items,
  };
}

export async function fetchAdConfig(): Promise<AdConfig | null> {
  if (!STATIC) {
    const live = await tryJson<AdConfig>("/api/ads/config");
    if (live) return live;
  }
  return {
    enabled: true,
    provider: "stub",
    preroll: {
      enabled: true,
      creative: {
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        durationSeconds: 15,
        skipOffsetSeconds: 5,
        label: "Advertisement",
      },
    },
    midroll: {
      enabled: true,
      cuePoints: [{ atPercent: 40 }],
      creative: {
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        durationSeconds: 15,
        skipOffsetSeconds: 5,
        label: "Advertisement",
      },
    },
    overlay: {
      enabled: true,
      startSeconds: 12,
      endSeconds: 22,
      html: `<div class="agm-ad-overlay-inner">AgmPlay · overlay slot <span>swap for your ad network</span></div>`,
    },
  };
}
