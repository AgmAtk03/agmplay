import { Suspense } from "react";
import { BrowseLibrary } from "@/components/BrowseLibrary";

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="page-status">Loading library…</div>}>
      <BrowseLibrary />
    </Suspense>
  );
}
