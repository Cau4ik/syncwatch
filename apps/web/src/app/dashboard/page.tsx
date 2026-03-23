"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Rocket, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch, type RoomSummary } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<RoomSummary[]>("/api/rooms")
      .then(setRooms)
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  async function createRoom() {
    if (!title.trim()) {
      setError("Введите название комнаты.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const room = await apiFetch<{ slug: string }>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ title: title.trim() })
      });
      router.push(`/rooms/${room.slug}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать комнату.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,#111f2f,#08111b)] p-8">
          <div className="mb-3 text-sm uppercase tracking-[0.24em] text-mist">Dashboard</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white">Мои комнаты, быстрый запуск и последние просмотры.</h1>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название новой комнаты"
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist"
            />
            <button
              onClick={createRoom}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Создаем..." : "Создать комнату"}
            </button>
          </div>
          {error ? <div className="mt-4 text-sm text-amber-200">{error}</div> : null}
        </div>

        <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/90 p-8">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Search className="h-5 w-5 text-signal" />
            Поиск по комнатам
          </div>
          <input
            placeholder="Название комнаты или slug"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist"
          />
          <div className="mt-6 grid gap-3 text-sm text-mist">
            <div>{rooms.length} активных комнат в текущем in-memory MVP</div>
            <div>Сначала работаем на rooms, chat, voice и sync</div>
            <div>Следующий этап после MVP: друзья и история</div>
          </div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white">
            <Rocket className="h-4 w-4" />
            Quick start
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-white/8 bg-[#0a131f]/85 p-6 text-mist">Загружаем список комнат...</div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <article key={room.slug} className="rounded-[28px] border border-white/8 bg-[#0a131f]/85 p-5">
              <div className="mb-5 aspect-[5/4] rounded-[22px] bg-[linear-gradient(180deg,#223046,#0a131f)]" />
              <div className="mb-2 text-2xl font-semibold text-white">{room.title}</div>
              <div className="mb-4 flex items-center gap-2 text-sm text-mist">
                <Users className="h-4 w-4" />
                {room.participantsCount} участников - {room.category}
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">{room.playbackState}</span>
                <Link href={`/rooms/${room.slug}`} className="text-sm font-medium text-flare">
                  Открыть
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
