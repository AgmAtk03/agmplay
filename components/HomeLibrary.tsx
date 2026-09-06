"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MediaRow } from "@/components/MediaRow";
import { assetUrl } from "@/lib/asset";
import { fetchCatalog } from "@/lib/client-api";
import { formatDuration } from "@/lib/format";
import { continueWatchingIds, loadProgressMap } from "@/lib/progress";
import type { Title } from "@/lib/types";

export function HomeLibrary() {
  const [items, setItems] = useState<Title[] | null>(null);
  const [provider, setProvider] = useState("demo");
  const [watchIds, setWatchIds] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCatalog().then((page) => {
      setItems(page.items);
      setProvider(page.provider);
    });
    const map = loadProgressMap();
    const pct: Record<string, number> = {};
    Object.values(map).forEach((entry) => {
      if (entry.duration > 0) {
        pct[entry.titleId] = Math.min(
          99,
          Math.round((entry.seconds / entry.duration) * 100),
        );
      }
    });
    setProgressMap(pct);
    setWatchIds(continueWatchingIds());
  }, []);

  const featured = useMemo(
    () => items?.filter((item) => item.collection === "featured") ?? [],
    [items],
  );
  const openMovies = useMemo(
    () => items?.filter((item) => item.collection === "open-movies") ?? [],
    [items],
  );
  const samples = useMemo(
    () => items?.filter((item) => item.collection === "samples") ?? [],
    [items],
  );
  const continueItems = useMemo(
    () =>
      watchIds
        .map((id) => items?.find((item) => item.id === id))
        .filter((item): item is Title => Boolean(item)),
    [items, watchIds],
  );
  const hero = featured[0] ?? items?.[0] ?? null;

  if (!items) {
    return <div className="page-status">Loading library…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="empty-library">
        <p className="eyebrow">Library provider · {provider}</p>
        <h1>No titles yet</h1>
        <p>
          The connector is live. Point <code>LIBRARY_PROVIDER</code> at your
          catalog API or S3/R2 manifest and this shelf will fill.
        </p>
      </div>
    );
  }

  return (
    <div>
      {hero && (
        <section className="hero">
          <div
            className={`hero-art poster-${(hero.id.charCodeAt(0) % 5) + 1}`}
            style={
              hero.backdropUrl
                ? { backgroundImage: `url(${assetUrl(hero.backdropUrl)})` }
                : undefined
            }
          />
          <div className="hero-copy">
            <p className="eyebrow">Now playing stack · {provider}</p>
            <h1>{hero.title}</h1>
            <p className="hero-syn">{hero.description}</p>
            <p className="hero-meta">
              {[hero.year, formatDuration(hero.durationSeconds), hero.license]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="hero-actions">
              <Link href={`/watch/${hero.id}`} className="btn btn-play">
                Play
              </Link>
              <Link href={`/title/${hero.id}`} className="btn btn-ghost">
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      <MediaRow
        heading="Continue watching"
        items={continueItems}
        progressMap={progressMap}
        empty="Start a title and it will land here."
      />
      <MediaRow heading="Featured" items={featured} />
      <MediaRow heading="Open movies" items={openMovies} />
      <MediaRow heading="Protocol samples" items={samples} />
    </div>
  );
}
