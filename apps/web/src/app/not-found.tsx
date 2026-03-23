import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-4xl items-center px-5 py-12 lg:px-8">
      <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/85 p-10">
        <div className="mb-3 text-sm uppercase tracking-[0.24em] text-mist">404</div>
        <h1 className="mb-4 font-display text-5xl font-semibold text-white">Комната или страница не найдена.</h1>
        <p className="mb-8 text-lg text-mist">Проверь slug комнаты или вернись на главную, чтобы создать новую сессию.</p>
        <Link href="/" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
          На главную
        </Link>
      </div>
    </div>
  );
}
