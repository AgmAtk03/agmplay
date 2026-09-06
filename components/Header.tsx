"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getSession } from "@/lib/session";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getSession()?.email ?? null);
  }, [pathname]);

  if (pathname.startsWith("/watch")) return null;

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = q.trim();
    router.push(query ? `/browse?q=${encodeURIComponent(query)}` : "/browse");
  };

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">▶</span>
        <span className="brand-name">AgmPlay</span>
      </Link>
      <nav className="site-nav">
        <Link href="/" className={pathname === "/" ? "active" : ""}>
          Library
        </Link>
        <Link
          href="/browse"
          className={pathname.startsWith("/browse") ? "active" : ""}
        >
          Browse
        </Link>
      </nav>
      <form className="header-search" onSubmit={onSearch}>
        <input
          type="search"
          placeholder="Search titles"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          aria-label="Search titles"
        />
      </form>
      <Link href="/login" className="header-account">
        {email ? email.split("@")[0] : "Sign in"}
      </Link>
    </header>
  );
}
