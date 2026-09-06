import { getLibraryProvider } from "@/lib/providers";
import { apiOk, apiOptions } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

export async function GET() {
  const provider = getLibraryProvider();
  return apiOk({
    ok: true,
    service: "agmplay",
    provider: provider.name,
    ads: "stub",
  });
}
