import type { AdConfig } from "@/lib/ads/types";

const SAMPLE_AD =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function getStubAdConfig(): AdConfig {
  const enabled = (process.env.ADS_ENABLED ?? "true").toLowerCase() !== "false";
  return {
    enabled,
    provider: "stub",
    preroll: {
      enabled,
      creative: {
        type: "video",
        url: SAMPLE_AD,
        durationSeconds: 15,
        skipOffsetSeconds: 5,
        clickThrough: null,
        label: "Advertisement",
      },
    },
    midroll: {
      enabled,
      cuePoints: [{ atPercent: 40 }],
      creative: {
        type: "video",
        url: SAMPLE_AD,
        durationSeconds: 15,
        skipOffsetSeconds: 5,
        clickThrough: null,
        label: "Advertisement",
      },
    },
    overlay: {
      enabled,
      startSeconds: 12,
      endSeconds: 22,
      html: `<div class="agm-ad-overlay-inner">AgmPlay · overlay slot <span>swap for your ad network</span></div>`,
    },
  };
}

export function resolveMidrollSeconds(
  duration: number,
  cue: { atPercent?: number; atSeconds?: number },
): number | null {
  if (typeof cue.atSeconds === "number" && Number.isFinite(cue.atSeconds)) {
    return Math.max(0, cue.atSeconds);
  }
  if (typeof cue.atPercent === "number" && duration > 0) {
    return Math.max(0, (duration * cue.atPercent) / 100);
  }
  return null;
}
