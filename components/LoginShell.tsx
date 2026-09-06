"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession, setSession } from "@/lib/session";

export function LoginShell() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    setCurrent(session?.email ?? null);
    if (session) {
      setEmail(session.email);
      setName(session.name);
    }
  }, []);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSession({
      email: email.trim() || "viewer@agmplay.local",
      name: name.trim() || "AgmPlay viewer",
    });
    router.push("/");
  };

  return (
    <div className="login-shell">
      <p className="eyebrow">Account shell</p>
      <h1>Sign in</h1>
      <p className="muted">
        Mocked UI only — nothing is sent to a server. Swap this for Clerk,
        Auth0, or your SSO when accounts go live.
      </p>
      {current && <p className="license">Signed in as {current}</p>}
      <form onSubmit={onSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@agmbizz.com"
          />
        </label>
        <button type="submit" className="btn btn-play">
          Continue
        </button>
      </form>
      {current && (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            clearSession();
            setCurrent(null);
          }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
