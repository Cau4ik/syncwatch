"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch, type RoomSummary } from "@/lib/api";
import { SourceGrid } from "@/components/source/source-grid";
import { loadSession, subscribeSessionChange, type SessionState } from "@/lib/session";
import { getSourceLabel } from "@/lib/sources";

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
          <div className="mb-3 text-sm uppercase tracking-[0.24em] text-mist">Дашборд источников</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white">
            Запускай комнату из того источника, который хочешь смотреть.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">
            Этот дашборд больше не про пустые комнаты. Сначала выбери источник, потом нужное видео, и только после этого
            создается комната.
          </p>
        </div>

        <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/90 p-8">
          <div className="mb-4 text-xl font-semibold text-white">Текущий аккаунт</div>
          {session ? (
            <div className="space-y-3 text-sm text-mist">
              <div>@{session.user.username}</div>
              <div>{session.user.email}</div>
              <div>{rooms.length} активных комнат создано этим аккаунтом</div>
            </div>
          ) : (
            <div className="text-sm text-mist">Войди в аккаунт, чтобы видеть только свои активные сессии просмотра.</div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-sm uppercase tracking-[0.24em] text-mist">Начать с источника</div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-white">Выбери, откуда будет видео.</h2>
          </div>
        </div>
        <SourceGrid compact />
      </section>

      <section className="rounded-[36px] border border-white/8 bg-[#0a131f]/85 p-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-sm uppercase tracking-[0.24em] text-mist">Мои активные комнаты</div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-white">
              Комнаты, созданные текущим аккаунтом.
            </h2>
          </div>
        </div>

        {error ? <div className="mb-4 text-sm text-amber-200">{error}</div> : null}

        {loading ? (
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 text-mist">Загрузка текущих сессий комнат...</div>
        ) : !session ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-mist">
            Сначала войди в аккаунт, и здесь будут показываться только твои активные комнаты.
          </div>
        ) : !rooms.length ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-mist">
            Пока нет активных комнат. Запусти одну из источника выше, и она появится здесь, пока сессия активна.
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
                    Источник: {getSourceLabel(room.sourceType)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {room.participantsCount} участников
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                    {getPlaybackStateLabel(room.playbackState)}
                  </span>
                  <Link href={`/rooms/${room.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-flare">
                    Открыть комнату
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

function getPlaybackStateLabel(state: RoomSummary["playbackState"]) {
  switch (state) {
    case "playing":
      return "Идет просмотр";
    case "paused":
      return "На паузе";
    default:
      return "Ожидание";
  }
}
