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
    const title = await getLibraryProvider().getTitle(id);
    if (!title) return apiError("Title not found", 404);
    return apiOk(title);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Title failed");
  }
}
