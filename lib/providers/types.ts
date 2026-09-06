import type { CatalogPage, SearchResult, Title, PlaybackSession } from "@/lib/types";

export interface ListTitlesOptions {
  collection?: string;
  type?: string;
  limit?: number;
  cursor?: string;
}

export interface LibraryProvider {
  readonly name: string;
  listTitles(opts?: ListTitlesOptions): Promise<CatalogPage>;
  getTitle(id: string): Promise<Title | null>;
  getPlayback(id: string): Promise<PlaybackSession | null>;
  search(q: string): Promise<SearchResult>;
}
