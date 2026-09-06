import { getLibraryProvider } from "@/lib/providers";
import { apiError, apiOk, apiOptions } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const collection = url.searchParams.get("collection") ?? undefined;
    const type = url.searchParams.get("type") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const page = await getLibraryProvider().listTitles({
      collection,
      type,
      cursor,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return apiOk(page);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Catalog failed");
  }
}
