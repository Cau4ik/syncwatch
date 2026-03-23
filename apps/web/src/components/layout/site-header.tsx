import Link from "next/link";
import { Clapperboard, Link2, Users } from "lucide-react";
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
            <div className="text-xs text-mist">watch together, stay in sync</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-mist md:flex">
          <Link href="/" className="transition hover:text-white">Главная</Link>
          <Link href="/dashboard" className="transition hover:text-white">Мои комнаты</Link>
          <Link href="/rooms/cyber-city-night" className="transition hover:text-white">Демо-комната</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 lg:flex lg:items-center lg:gap-2">
            <Users className="h-4 w-4" />
            8 участников
          </button>
          <button className="hidden rounded-full border border-white/10 bg-white/5 p-3 text-white/90 lg:block">
            <Link2 className="h-4 w-4" />
          </button>
          <SessionMenu />
        </div>
      </div>
    </header>
  );
}
