import Link from "next/link";
import { assetUrl } from "@/lib/asset";
import { formatDuration, typeLabel } from "@/lib/format";
import type { Title } from "@/lib/types";

export function MediaCard({
  title,
  progress,
}: {
  title: Title;
  progress?: number;
}) {
  return (
    <Link href={`/title/${title.id}`} className="media-card">
      <div
        className={`poster poster-${(title.id.charCodeAt(0) % 5) + 1}`}
        style={
          title.posterUrl
            ? { backgroundImage: `url(${assetUrl(title.posterUrl)})` }
            : undefined
        }
      >
        <span className="poster-type">{typeLabel(title.type)}</span>
        {typeof progress === "number" && progress > 0 && (
          <i className="poster-progress" style={{ width: `${progress}%` }} />
        )}
      </div>
      <div className="media-meta">
        <h3>{title.title}</h3>
        <p>
          {[title.year, formatDuration(title.durationSeconds)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}
