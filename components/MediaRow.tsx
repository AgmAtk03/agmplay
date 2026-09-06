import { MediaCard } from "@/components/MediaCard";
import type { Title } from "@/lib/types";

export function MediaRow({
  heading,
  items,
  progressMap,
  empty,
}: {
  heading: string;
  items: Title[];
  progressMap?: Record<string, number>;
  empty?: string;
}) {
  return (
    <section className="media-row">
      <h2>{heading}</h2>
      {items.length === 0 ? (
        <p className="row-empty">{empty ?? "Nothing in this row yet."}</p>
      ) : (
        <div className="row-scroller">
          {items.map((item) => (
            <MediaCard
              key={item.id}
              title={item}
              progress={progressMap?.[item.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
