import { MediaPlayer } from "@/components/Player/MediaPlayer";
import { demoTitleIds } from "@/lib/demo-ids";

export function generateStaticParams() {
  return demoTitleIds().map((id) => ({ id }));
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MediaPlayer titleId={id} />;
}
