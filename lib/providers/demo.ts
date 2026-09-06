import catalog from "@/data/demo-catalog.json";
import type {
  CatalogPage,
  PlaybackSession,
  PlaybackSource,
  SearchResult,
  Title,
} from "@/lib/types";
import type { LibraryProvider, ListTitlesOptions } from "@/lib/providers/types";

type DemoRecord = Title & { sources: PlaybackSource[] };

const titles = catalog.titles as DemoRecord[];

function toTitle(record: DemoRecord): Title {
  const { sources: _sources, ...title } = record;
  void _sources;
  return title;
}

function filterRecords(opts?: ListTitlesOptions): DemoRecord[] {
  return titles.filter((item) => {
    if (opts?.collection && item.collection !== opts.collection) return false;
    if (opts?.type && item.type !== opts.type) return false;
    return true;
  });
}

export class DemoLibraryProvider implements LibraryProvider {
  readonly name = "demo";

  async listTitles(opts?: ListTitlesOptions): Promise<CatalogPage> {
    const items = filterRecords(opts).map(toTitle);
    const limit = opts?.limit;
    return {
      items: typeof limit === "number" ? items.slice(0, limit) : items,
      provider: this.name,
    };
  }

  async getTitle(id: string): Promise<Title | null> {
    const record = titles.find((item) => item.id === id);
    return record ? toTitle(record) : null;
  }

  async getPlayback(id: string): Promise<PlaybackSession | null> {
    const record = titles.find((item) => item.id === id);
    if (!record || record.sources.length === 0) return null;
    return {
      titleId: record.id,
      title: record.title,
      preferred: record.sources[0].protocol,
      sources: record.sources,
    };
  }

  async search(q: string): Promise<SearchResult> {
    const query = q.trim().toLowerCase();
    if (!query) {
      return { items: titles.map(toTitle), query: q, provider: this.name };
    }
    const items = titles
      .filter((item) => {
        const hay = [item.title, item.description, ...(item.tags ?? [])]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      })
      .map(toTitle);
    return { items, query: q, provider: this.name };
  }
}
