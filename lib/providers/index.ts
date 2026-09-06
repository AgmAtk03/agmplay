import { DemoLibraryProvider } from "@/lib/providers/demo";
import { HttpLibraryProvider } from "@/lib/providers/http";
import { S3LibraryProvider } from "@/lib/providers/s3";
import type { LibraryProvider } from "@/lib/providers/types";

let cached: LibraryProvider | null = null;

export function getLibraryProvider(): LibraryProvider {
  if (cached) return cached;
  const kind = (process.env.LIBRARY_PROVIDER ?? "demo").trim().toLowerCase();
  if (kind === "http") cached = new HttpLibraryProvider();
  else if (kind === "s3") cached = new S3LibraryProvider();
  else cached = new DemoLibraryProvider();
  return cached;
}

export function resetLibraryProvider(): void {
  cached = null;
}
