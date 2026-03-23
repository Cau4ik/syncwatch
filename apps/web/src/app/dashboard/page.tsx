"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch, type RoomSummary } from "@/lib/api";
import { loadSession, subscribeSessionChange, type SessionState } from "@/lib/session";
import { getSourceLabel } from "@/lib/sources";
import { SourceGrid } from "@/components/source/source-grid";

export default function DashboardPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSession = () => setSession(loadSession());
    syncSession();
    return subscribeSessionChange(syncSession);
  }, []);

  useEffect(() => {
    if (!session) {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    apiFetch<RoomSummary[]>("/api/rooms", {
      token: session.accessToken
    })
      .then(setRooms)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,#111f2f,#08111b)] p-8">
          <div className="mb-3 text-sm uppercase tracking-[0.24em] text-mist">Source-first dashboard</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white">Launch a room from the source you want to watch.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">
            This dashboard is no longer about blank rooms. Pick a source, choose the exact video, and only then create the room.
          </p>
        </div>

        <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/90 p-8">
          <div className="mb-4 text-xl font-semibold text-white">Current account</div>
          {session ? (
            <div className="space-y-3 text-sm text-mist">
              <div>@{session.user.username}</div>
              <div>{session.user.email}</div>
              <div>{rooms.length} active rooms created by this account</div>
            </div>
          ) : (
            <div className="text-sm text-mist">Sign in to keep a personal list of your active watch sessions.</div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-sm uppercase tracking-[0.24em] text-mist">Start from source</div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-white">Choose where the video comes from.</h2>
          </div>
        </div>
        <SourceGrid compact />
      </section>

      <section className="rounded-[36px] border border-white/8 bg-[#0a131f]/85 p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-sm uppercase tracking-[0.24em] text-mist">My active rooms</div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-white">Rooms created by the current account.</h2>
          </div>
        </div>

        {error ? <div className="mb-4 text-sm text-amber-200">{error}</div> : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 text-mist">Loading current room sessions...</div>
        ) : !session ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-mist">
            Sign in first, then this page will show only your own active rooms.
          </div>
        ) : !rooms.length ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-mist">
            No active rooms yet. Launch one from a source above and it will appear here while the session is active.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article key={room.slug} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-5 aspect-[5/4] rounded-[22px] bg-[linear-gradient(180deg,#223046,#0a131f)]" />
                <div className="mb-2 text-2xl font-semibold text-white">{room.title}</div>
                <div className="mb-4 space-y-2 text-sm text-mist">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {getSourceLabel(room.sourceType)} source
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {room.participantsCount} participants
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">{room.playbackState}</span>
                  <Link href={`/rooms/${room.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-flare">
                    Open room
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
