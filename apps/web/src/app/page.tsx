import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, AudioLines, ShieldCheck, Sparkles, TvMinimalPlay, UsersRound } from "lucide-react";

import { dashboardRooms, featureCards } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-5 py-10 lg:px-8 lg:py-14">
      <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80">
            <Sparkles className="h-4 w-4 text-flare" />
            Watch party MVP with lawful sources
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-semibold leading-none tracking-tight text-white md:text-7xl">
            Комнаты, чат и синхронное видео в одном сильном веб-интерфейсе.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
            SyncWatch делает совместный просмотр как отдельный room product: один canonical playback state, голос,
            чат, invite link и быстрый вход без ощущения старого мобильного клона.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/rooms/cyber-city-night"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950"
            >
              Открыть демо-комнату
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white"
            >
              Посмотреть комнаты
            </Link>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/85 p-6 shadow-glow">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(145deg,rgba(255,209,140,0.16),rgba(124,247,212,0.08)),linear-gradient(180deg,#111f2f,#08111b)] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-2xl font-semibold text-white">Live room</div>
                <div className="text-sm text-mist">Cyber City Night</div>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100">
                In sync
              </div>
            </div>
            <div className="aspect-video rounded-[24px] bg-[radial-gradient(circle_at_30%_30%,rgba(255,134,92,0.35),transparent_24%),radial-gradient(circle_at_70%_25%,rgba(124,247,212,0.26),transparent_18%),linear-gradient(180deg,#1c2940,#07101a)]" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <MiniStat icon={<UsersRound className="h-4 w-4" />} label="8 viewers" />
              <MiniStat icon={<AudioLines className="h-4 w-4" />} label="voice ready" />
              <MiniStat icon={<TvMinimalPlay className="h-4 w-4" />} label="YT / HLS / upload" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {featureCards.map((card) => (
          <article key={card.title} className="rounded-[28px] border border-white/8 bg-[#0a131f]/80 p-6">
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 p-3">
              <ShieldCheck className="h-5 w-5 text-signal" />
            </div>
            <div className="mb-3 text-2xl font-semibold text-white">{card.title}</div>
            <p className="leading-7 text-mist">{card.text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[36px] border border-white/8 bg-[#0a131f]/80 p-8 lg:p-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="mb-2 text-sm uppercase tracking-[0.24em] text-mist">Room presets</div>
            <h2 className="font-display text-4xl font-semibold tracking-tight text-white">Комнаты, которые уже готовы к запуску</h2>
          </div>
          <Link href="/dashboard" className="text-sm text-signal">
            Открыть dashboard
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {dashboardRooms.map((room) => (
            <div key={room.slug} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
              <div className="mb-6 aspect-[4/3] rounded-[22px] bg-[linear-gradient(180deg,#223046,#0a131f)]" />
              <div className="mb-2 text-2xl font-semibold text-white">{room.title}</div>
              <div className="mb-4 text-sm text-mist">
                {room.category} - {room.members} участников
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">{room.status}</span>
                <Link href={`/rooms/${room.slug}`} className="text-sm font-medium text-flare">
                  Зайти
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-white/90">
      <div className="mb-2 text-flare">{icon}</div>
      <div>{label}</div>
    </div>
  );
}
