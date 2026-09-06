"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/asset";
import { fetchPlayback, fetchTitle } from "@/lib/client-api";
import { formatDuration, typeLabel } from "@/lib/format";
import { getProgress } from "@/lib/progress";
import type { PlaybackSession, Title } from "@/lib/types";

export function TitleDetail({ id }: { id: string }) {
  const [title, setTitle] = useState<Title | null | undefined>(undefined);
  const [playback, setPlayback] = useState<PlaybackSession | null>(null);
  const [resume, setResume] = useState(0);

  useEffect(() => {
    fetchTitle(id).then(setTitle);
    fetchPlayback(id).then(setPlayback);
    const saved = getProgress(id);
    setResume(saved && saved.seconds > 5 ? saved.seconds : 0);
  }, [id]);

  if (title === undefined) {
    return <div className="page-status">Loading title…</div>;
  }
  if (!title) {
    return (
      <div className="empty-library">
        <h1>Title not found</h1>
        <p>This id is not in the current library provider.</p>
        <Link href="/" className="btn btn-ghost">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <article className="detail">
      <div
        className={`detail-art poster-${(title.id.charCodeAt(0) % 5) + 1}`}
        style={
          title.backdropUrl
            ? { backgroundImage: `url(${assetUrl(title.backdropUrl)})` }
            : undefined
        }
      />
      <div className="detail-copy">
        <p className="eyebrow">
          {typeLabel(title.type)}
          {title.year ? ` · ${title.year}` : ""}
          {title.durationSeconds
            ? ` · ${formatDuration(title.durationSeconds)}`
            : ""}
        </p>
        <h1>{title.title}</h1>
        <p className="hero-syn">{title.description}</p>
        {title.license && <p className="license">{title.license}</p>}
        <div className="hero-actions">
          <Link href={`/watch/${title.id}`} className="btn btn-play">
            {resume > 0 ? "Resume" : "Play"}
          </Link>
          <Link href="/browse" className="btn btn-ghost">
            Browse
          </Link>
        </div>
        <section className="detail-panel">
          <h2>Playback sources</h2>
          {playback?.sources?.length ? (
            <ul>
              {playback.sources.map((source) => (
                <li key={`${source.protocol}-${source.url}`}>
                  <strong>{source.protocol.toUpperCase()}</strong>
                  <span>{source.mimeType ?? source.url}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No source from the provider yet.</p>
          )}
        </section>
        <section className="detail-panel">
          <h2>Cast</h2>
          <p className="muted">
            Placeholder — wire credits when the library API exposes them.
          </p>
        </section>
      </div>
    </article>
  );
}
