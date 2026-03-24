import Link from "next/link";
import { Clapperboard, Sparkles } from "lucide-react";

import { SessionMenu } from "@/components/layout/session-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#08111bcc]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Clapperboard className="h-5 w-5 text-signal" />
          </div>
          <div>
            <div className="font-display text-lg font-semibold tracking-tight">SyncWatch</div>
            <div className="text-xs text-mist">выбери источник и смотри вместе</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-mist md:flex">
          <Link href="/" className="transition hover:text-white">
            Источники
          </Link>
          <Link href="/launch/youtube" className="transition hover:text-white">
            Запуск комнаты
          </Link>
          <Link href="/dashboard" className="transition hover:text-white">
            Мои комнаты
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/launch/youtube"
            className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 lg:inline-flex"
          >
            <Sparkles className="h-4 w-4 text-flare" />
            Начать с источника
          </Link>
          <SessionMenu />
        </div>
      </div>
    </header>
  );
}
