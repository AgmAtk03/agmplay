import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-library">
      <h1>Not found</h1>
      <p className="muted">That route is not part of AgmPlay.</p>
      <Link href="/" className="btn btn-ghost">
        Library
      </Link>
    </div>
  );
}
