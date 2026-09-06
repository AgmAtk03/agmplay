import type { PlaybackSource } from "@/lib/types";

export interface AttachedStream {
  protocol: PlaybackSource["protocol"];
  destroy: () => void;
}

export async function attachSource(
  video: HTMLVideoElement,
  source: PlaybackSource,
  autoplay: boolean,
): Promise<AttachedStream> {
  if (source.protocol === "hls") {
    const native = Boolean(video.canPlayType("application/vnd.apple.mpegurl"));
    if (native) {
      video.src = source.url;
      if (autoplay) void video.play().catch(() => undefined);
      return {
        protocol: "hls",
        destroy: () => {
          video.removeAttribute("src");
          video.load();
        },
      };
    }
    const Hls = (await import("hls.js")).default;
    if (!Hls.isSupported()) {
      throw new Error("HLS is not supported in this browser");
    }
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
    });
    hls.loadSource(source.url);
    hls.attachMedia(video);
    if (autoplay) {
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => undefined);
      });
    }
    return {
      protocol: "hls",
      destroy: () => {
        hls.destroy();
        video.removeAttribute("src");
        video.load();
      },
    };
  }

  if (source.protocol === "dash") {
    const dashjs = (await import("dashjs")).default;
    const player = dashjs.MediaPlayer().create();
    player.initialize(video, source.url, autoplay);
    return {
      protocol: "dash",
      destroy: () => {
        player.reset();
        video.removeAttribute("src");
        video.load();
      },
    };
  }

  video.src = source.url;
  if (autoplay) void video.play().catch(() => undefined);
  return {
    protocol: "mp4",
    destroy: () => {
      video.removeAttribute("src");
      video.load();
    },
  };
}
