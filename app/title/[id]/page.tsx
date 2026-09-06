import { TitleDetail } from "@/components/TitleDetail";
import { demoTitleIds } from "@/lib/demo-ids";

export function generateStaticParams() {
  return demoTitleIds().map((id) => ({ id }));
}

export default async function TitlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TitleDetail id={id} />;
}
