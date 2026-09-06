export type MediaType = "movie" | "episode" | "clip" | "live";
export type PlaybackProtocol = "hls" | "dash" | "mp4";

export interface Title {
  id: string;
  title: string;
  description?: string;
  type: MediaType;
  year?: number;
  durationSeconds?: number;
  posterUrl?: string;
  backdropUrl?: string;
  tags?: string[];
  collection?: string;
  license?: string;
}

export interface PlaybackSource {
  protocol: PlaybackProtocol;
  url: string;
  mimeType?: string;
  drm?: {
    type: string;
    licenseUrl: string;
  } | null;
}

export interface PlaybackSession {
  titleId: string;
  title: string;
  preferred: PlaybackProtocol;
  sources: PlaybackSource[];
}

export interface CatalogPage {
  items: Title[];
  nextCursor?: string;
  provider: string;
}

export interface SearchResult {
  items: Title[];
  query: string;
  provider: string;
}
