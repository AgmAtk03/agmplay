"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveMidrollSeconds } from "@/lib/ads/stub";
import type { AdConfig, AdCreative, PlayerPhase } from "@/lib/ads/types";
import { fetchAdConfig, fetchPlayback, fetchTitle } from "@/lib/client-api";
import { formatClock } from "@/lib/format";
import { attachSource, type AttachedStream } from "@/lib/player/attach";
import { getProgress, saveProgress } from "@/lib/progress";
import type { PlaybackSession, PlaybackSource, Title } from "@/lib/types";

interface MediaPlayerProps {
  titleId: string;
}

export function MediaPlayer({ titleId }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const attached = useRef<AttachedStream | null>(null);
  const firedCues = useRef<Set<number>>(new Set());
  const resumeAt = useRef(0);
  const hideTimer = useRef<number | null>(null);

  const [title, setTitle] = useState<Title | null>(null);
  const [session, setSession] = useState<PlaybackSession | null>(null);
  const [ads, setAds] = useState<AdConfig | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [phase, setPhase] = useState<PlayerPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [controlsOn, setControlsOn] = useState(true);
  const [skipLeft, setSkipLeft] = useState<number | null>(null);
  const [overlayOn, setOverlayOn] = useState(false);
  const [rate, setRate] = useState(1);

  const isAd = phase === "preroll" || phase === "midroll";
  const contentSources = session?.sources ?? [];
  const contentSource = contentSources[sourceIndex] ?? null;

  const activeCreative: AdCreative | null = useMemo(() => {
    if (phase === "preroll") return ads?.preroll.creative ?? null;
    if (phase === "midroll") return ads?.midroll.creative ?? null;
    return null;
  }, [ads, phase]);

  const bumpControls = useCallback(() => {
    setControlsOn(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!paused && phase !== "loading") setControlsOn(false);
    }, 2800);
  }, [paused, phase]);

  const detach = useCallback(() => {
    attached.current?.destroy();
    attached.current = null;
  }, []);

  const loadSource = useCallback(
    async (source: PlaybackSource, autoplay: boolean, startAt = 0) => {
      const video = videoRef.current;
      if (!video) return;
      detach();
      try {
        attached.current = await attachSource(video, source, false);
        if (startAt > 1) {
          const seek = () => {
            video.currentTime = startAt;
            video.removeEventListener("loadedmetadata", seek);
          };
          if (video.readyState >= 1) video.currentTime = startAt;
          else video.addEventListener("loadedmetadata", seek);
        }
        if (autoplay) await video.play().catch(() => undefined);
      } catch (err) {
        throw err instanceof Error ? err : new Error("Unable to attach source");
      }
    },
    [detach],
  );

  const startContent = useCallback(
    async (index = 0, startAt = 0) => {
      if (!session) return;
      const source = session.sources[index];
      if (!source) {
        setError("No playable source");
        setPhase("error");
        return;
      }
      setSourceIndex(index);
      setError(null);
      try {
        await loadSource(source, true, startAt);
        setPhase("content");
      } catch {
        if (index + 1 < session.sources.length) {
          await startContent(index + 1, startAt);
          return;
        }
        setError("Playback failed for every available source");
        setPhase("error");
      }
    },
    [loadSource, session],
  );

  const startAd = useCallback(
    async (next: "preroll" | "midroll", creative: AdCreative) => {
      if (creative.type !== "video" || !creative.url) {
        setPhase("content");
        return;
      }
      setSkipLeft(creative.skipOffsetSeconds ?? 5);
      setPhase(next);
      try {
        await loadSource(
          { protocol: "mp4", url: creative.url, mimeType: "video/mp4" },
          true,
        );
      } catch {
        setPhase("content");
        await startContent(sourceIndex, resumeAt.current);
      }
    },
    [loadSource, sourceIndex, startContent],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, p, a] = await Promise.all([
        fetchTitle(titleId),
        fetchPlayback(titleId),
        fetchAdConfig(),
      ]);
      if (cancelled) return;
      setTitle(t);
      setAds(a);
      setSession(p);
      if (!p) {
        setError("No playback URL for this title");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  useEffect(() => {
    if (!session) return;
    const saved = getProgress(titleId)?.seconds ?? 0;
    resumeAt.current = saved > 5 ? saved : 0;
    if (ads?.enabled && ads.preroll.enabled && ads.preroll.creative.url) {
      void startAd("preroll", ads.preroll.creative);
    } else {
      void startContent(0, resumeAt.current);
    }
    return () => detach();
    // Start once session/ads arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ads]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      const t = video.currentTime;
      const d = video.duration || 0;
      setCurrent(t);
      setDuration(d);
      if (video.buffered.length) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      if (isAd && activeCreative) {
        const skipAt = activeCreative.skipOffsetSeconds ?? 5;
        setSkipLeft(Math.max(0, Math.ceil(skipAt - t)));
      }
      if (phase === "content" && ads?.enabled) {
        if (
          ads.overlay.enabled &&
          t >= ads.overlay.startSeconds &&
          t <= ads.overlay.endSeconds
        ) {
          setOverlayOn(true);
        } else {
          setOverlayOn(false);
        }
        if (ads.midroll.enabled && d > 0) {
          ads.midroll.cuePoints.forEach((cue, i) => {
            const at = resolveMidrollSeconds(d, cue);
            if (at == null || firedCues.current.has(i)) return;
            if (t >= at) {
              firedCues.current.add(i);
              resumeAt.current = t;
              void startAd("midroll", ads.midroll.creative);
            }
          });
        }
        saveProgress({
          titleId,
          seconds: t,
          duration: d,
          updatedAt: Date.now(),
        });
      }
    };

    const onEnded = () => {
      if (phase === "preroll") {
        void startContent(0, resumeAt.current);
        return;
      }
      if (phase === "midroll") {
        void startContent(sourceIndex, resumeAt.current);
        return;
      }
      setPhase("ended");
    };

    const onError = () => {
      if (phase === "preroll" || phase === "midroll") {
        void startContent(sourceIndex, resumeAt.current);
        return;
      }
      if (session && sourceIndex + 1 < session.sources.length) {
        void startContent(sourceIndex + 1, video.currentTime || resumeAt.current);
        return;
      }
      setError("The stream could not be loaded");
      setPhase("error");
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onTime);
    video.addEventListener("progress", onTime);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.addEventListener("play", () => setPaused(false));
    video.addEventListener("pause", () => setPaused(true));
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onTime);
      video.removeEventListener("progress", onTime);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [
    activeCreative,
    ads,
    isAd,
    phase,
    session,
    sourceIndex,
    startAd,
    startContent,
    titleId,
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        if (video.paused) void video.play();
        else video.pause();
      }
      if (event.key === "ArrowRight") video.currentTime += isAd ? 0 : 10;
      if (event.key === "ArrowLeft") video.currentTime -= isAd ? 0 : 10;
      if (event.key === "f") void toggleFullscreen();
      if (event.key === "m") {
        video.muted = !video.muted;
        setMuted(video.muted);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAd]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
    bumpControls();
  };

  const skipAd = () => {
    if (skipLeft !== 0) return;
    if (phase === "preroll") void startContent(0, resumeAt.current);
    if (phase === "midroll") void startContent(sourceIndex, resumeAt.current);
  };

  const seek = (value: number) => {
    const video = videoRef.current;
    if (!video || isAd) return;
    video.currentTime = value;
    setCurrent(value);
  };

  const toggleFullscreen = async () => {
    const node = wrapRef.current;
    if (!node) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await node.requestFullscreen().catch(() => undefined);
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await video.requestPictureInPicture().catch(() => undefined);
    }
  };

  const cycleRate = () => {
    if (isAd) return;
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const switchProtocol = (index: number) => {
    if (isAd) return;
    resumeAt.current = current;
    void startContent(index, current);
  };

  return (
    <div
      ref={wrapRef}
      className="player-shell"
      onMouseMove={bumpControls}
      onTouchStart={bumpControls}
    >
      <video
        ref={videoRef}
        className="player-video"
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {phase === "loading" && <div className="player-status">Loading stream…</div>}
      {phase === "error" && (
        <div className="player-status">
          <p>{error ?? "Playback error"}</p>
          <Link href={title ? `/title/${title.id}` : "/"} className="player-back-link">
            Go back
          </Link>
        </div>
      )}
      {phase === "ended" && (
        <div className="player-status">
          <p>Finished</p>
          <button
            type="button"
            onClick={() => {
              firedCues.current.clear();
              resumeAt.current = 0;
              void startContent(sourceIndex, 0);
            }}
          >
            Play again
          </button>
        </div>
      )}

      {overlayOn && ads?.overlay.html && phase === "content" && (
        <div
          className="player-overlay-ad"
          dangerouslySetInnerHTML={{ __html: ads.overlay.html }}
        />
      )}

      {isAd && (
        <div className="player-ad-chrome">
          <span>{activeCreative?.label ?? "Advertisement"}</span>
          {skipLeft !== null && skipLeft > 0 && <em>Skip in {skipLeft}s</em>}
          {skipLeft === 0 && (
            <button type="button" onClick={skipAd}>
              Skip
            </button>
          )}
        </div>
      )}

      <div className={`player-chrome ${controlsOn || paused ? "on" : ""}`}>
        <div className="player-top">
          <Link href={title ? `/title/${title.id}` : "/"} className="player-back">
            ← Back
          </Link>
          <div>
            <p className="player-kicker">
              {isAd ? "Ad break" : contentSource?.protocol.toUpperCase()}
            </p>
            <h1>{isAd ? activeCreative?.label ?? "Ad" : title?.title ?? session?.title}</h1>
          </div>
        </div>

        <button
          type="button"
          className="player-center"
          onClick={togglePlay}
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? "▶" : "❚❚"}
        </button>

        <div className="player-bottom">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            disabled={isAd}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek"
            style={
              {
                "--buf": duration
                  ? `${Math.min(100, (buffered / duration) * 100)}%`
                  : "0%",
                "--pos": duration
                  ? `${Math.min(100, (current / duration) * 100)}%`
                  : "0%",
              } as React.CSSProperties
            }
          />
          <div className="player-row">
            <button type="button" onClick={togglePlay}>
              {paused ? "Play" : "Pause"}
            </button>
            <span className="player-time">
              {formatClock(current)} / {formatClock(duration)}
            </span>
            <label className="player-vol">
              <button
                type="button"
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.muted = !video.muted;
                  setMuted(video.muted);
                }}
              >
                {muted || volume === 0 ? "Mute" : "Vol"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setVolume(next);
                  setMuted(next === 0);
                  if (videoRef.current) {
                    videoRef.current.volume = next;
                    videoRef.current.muted = next === 0;
                  }
                }}
              />
            </label>
            <button type="button" onClick={cycleRate} disabled={isAd}>
              {rate}×
            </button>
            <button type="button" onClick={() => void togglePip()}>
              PiP
            </button>
            <button type="button" onClick={() => void toggleFullscreen()}>
              Full
            </button>
          </div>
          {!isAd && contentSources.length > 1 && (
            <div className="player-sources">
              {contentSources.map((source, index) => (
                <button
                  key={`${source.protocol}-${index}`}
                  type="button"
                  className={index === sourceIndex ? "active" : ""}
                  onClick={() => switchProtocol(index)}
                >
                  {source.protocol.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
