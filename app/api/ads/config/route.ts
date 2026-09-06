import { getStubAdConfig } from "@/lib/ads/stub";
import { apiOk, apiOptions } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return apiOptions();
}

export async function GET() {
  return apiOk(getStubAdConfig(), 200, 30);
}
