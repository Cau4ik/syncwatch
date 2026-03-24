import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Link2, Sparkles, UsersRound } from "lucide-react";

import { SourceGrid } from "@/components/source/source-grid";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-5 py-10 lg:px-8 lg:py-14">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80">
            <Sparkles className="h-4 w-4 text-flare" />
            Запуск комнаты через источник
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-semibold leading-none tracking-tight text-white md:text-7xl">
            Сначала выбери источник видео. Комната создается только после выбора нужного ролика.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
            SyncWatch теперь начинается с самого источника: YouTube, VK Видео, Rutube, Twitch, ссылка на файл или
            публичная веб-ссылка. Выбери источник, вставь нужное видео и сразу попади в готовую комнату.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/launch/youtube"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950"
            >
              Начать с YouTube
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white"
            >
              Открыть мои комнаты
            </Link>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(255,161,99,0.16),transparent_22%),radial-gradient(circle_at_70%_10%,rgba(124,247,212,0.12),transparent_20%),linear-gradient(180deg,#111f2f,#08111b)] p-6 shadow-glow">
          <div className="rounded-[28px] border border-white/8 bg-[#0a131f]/85 p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.24em] text-mist">Как это работает</div>
            <div className="space-y-4">
              <MiniStep title="1. Выбери источник" text="Нажми YouTube, VK Видео, Rutube, Twitch, ссылку на файл или веб-ссылку." />
              <MiniStep title="2. Выбери нужное видео" text="Открой платформу, скопируй выбранный ролик и верни ссылку сюда." />
              <MiniStep title="3. Поделись готовой комнатой" text="Комната создается уже с прикрепленным источником. Потом просто пригласи друзей." />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <MiniStat icon={<UsersRound className="h-4 w-4" />} label="Комната, чат и инвайт" />
              <MiniStat icon={<Link2 className="h-4 w-4" />} label="Источник сразу в комнате" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <div className="mb-2 text-sm uppercase tracking-[0.24em] text-mist">Источники</div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-white">
            Запускай комнату прямо из источника видео, а не из пустого дашборда.
          </h2>
        </div>
        <SourceGrid />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <InfoCard
          title="Без пустых комнат"
          text="Создатель не должен сначала попадать в пустую комнату. Источник выбирается до создания комнаты."
        />
        <InfoCard
          title="Одна ссылка после выбора"
          text="Как только источник выбран, комната создается и ссылка для приглашения сразу готова."
        />
        <InfoCard
          title="Временные сессии"
          text="Комнаты, созданные из источника, работают как watch-сессии и живут еще немного после выхода всех участников."
        />
      </section>
    </div>
  );
}

function MiniStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-2 text-lg font-semibold text-white">{title}</div>
      <div className="text-sm leading-6 text-mist">{text}</div>
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

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-[28px] border border-white/8 bg-[#0a131f]/80 p-6">
      <div className="mb-3 text-2xl font-semibold text-white">{title}</div>
      <p className="leading-7 text-mist">{text}</p>
    </article>
  );
}
