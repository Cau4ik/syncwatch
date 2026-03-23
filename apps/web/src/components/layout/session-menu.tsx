"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { clearSession, loadSession, subscribeSessionChange, type SessionState } from "@/lib/session";

export function SessionMenu() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const sync = () => setSession(loadSession());
    sync();
    return subscribeSessionChange(sync);
  }, []);

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST"
      });
    } finally {
      clearSession();
      setSession(null);
      router.push("/");
      router.refresh();
    }
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-gradient-to-r from-[#ffe1af] via-[#ff9e66] to-[#ff6f6f] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-95"
      >
        Войти
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 md:block">
        @{session.user.username}
      </div>
      <button
        onClick={logout}
        className="rounded-full bg-gradient-to-r from-[#ffe1af] via-[#ff9e66] to-[#ff6f6f] px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-95"
      >
        Выйти
      </button>
    </div>
  );
}
