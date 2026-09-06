export type AdCreativeType = "video" | "html";

export interface AdCreative {
  type: AdCreativeType;
  url?: string;
  durationSeconds?: number;
  skipOffsetSeconds?: number;
  clickThrough?: string | null;
  label?: string;
  html?: string;
}

export interface MidrollCue {
  atPercent?: number;
  atSeconds?: number;
}

export interface AdConfig {
  enabled: boolean;
  provider: "stub" | "vast" | "ssai";
  preroll: {
    enabled: boolean;
    creative: AdCreative;
  };
  midroll: {
    enabled: boolean;
    cuePoints: MidrollCue[];
    creative: AdCreative;
  };
  overlay: {
    enabled: boolean;
    startSeconds: number;
    endSeconds: number;
    html: string;
  };
}

export type PlayerPhase =
  | "loading"
  | "preroll"
  | "content"
  | "midroll"
  | "ended"
  | "error";
