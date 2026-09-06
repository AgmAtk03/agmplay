import { getLibraryProvider } from "@/lib/providers";
import { apiError, apiOk, apiOptions } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const result = await getLibraryProvider().search(q);
    return apiOk(result);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Search failed");
  }
}
