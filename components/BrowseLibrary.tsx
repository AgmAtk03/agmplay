"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MediaCard } from "@/components/MediaCard";
import { fetchCatalog, fetchSearch } from "@/lib/client-api";
import type { MediaType, Title } from "@/lib/types";

const TYPES: Array<{ id: "" | MediaType; label: string }> = [
  { id: "", label: "All" },
  { id: "movie", label: "Films" },
  { id: "clip", label: "Clips" },
  { id: "live", label: "Live" },
];

export function BrowseLibrary() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const [items, setItems] = useState<Title[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const page = q.trim()
        ? await fetchSearch(q)
        : await fetchCatalog(type ? { type } : undefined);
      if (!cancelled) {
        const next = type
          ? page.items.filter((item) => item.type === type)
          : page.items;
        setItems(next);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [q, type]);

  const sync = (nextQ: string, nextType: string) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextType) params.set("type", nextType);
    const qs = params.toString();
    router.replace(qs ? `/browse?${qs}` : "/browse");
  };

  const count = items?.length ?? 0;
  const heading = useMemo(() => {
    if (q.trim()) return `Results for “${q.trim()}”`;
    return "Browse library";
  }, [q]);

  return (
    <div className="browse">
      <h1>{heading}</h1>
      <div className="browse-tools">
        <input
          type="search"
          value={q}
          placeholder="Search by title, tag, or protocol"
          onChange={(event) => {
            const next = event.target.value;
            setQ(next);
            sync(next, type);
          }}
        />
        <div className="chips">
          {TYPES.map((item) => (
            <button
              key={item.id || "all"}
              type="button"
              className={type === item.id ? "active" : ""}
              onClick={() => {
                setType(item.id);
                sync(q, item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {items === null ? (
        <p className="page-status">Searching…</p>
      ) : items.length === 0 ? (
        <p className="row-empty">No titles match. The shelf stays empty until the provider returns rows.</p>
      ) : (
        <>
          <p className="browse-count">{count} title{count === 1 ? "" : "s"}</p>
          <div className="browse-grid">
            {items.map((item) => (
              <MediaCard key={item.id} title={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
