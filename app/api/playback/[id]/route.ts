import { getLibraryProvider } from "@/lib/providers";
import { apiError, apiOk, apiOptions } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const session = await getLibraryProvider().getPlayback(id);
    if (!session) return apiError("Playback not available", 404);
    return apiOk(session, 200, 5);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Playback failed");
  }
}
