"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch, type AuthResponse } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password })
      });
      saveSession(data);
      router.push("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать аккаунт.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center px-5 py-10 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_520px]">
        <section className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,#111f2f,#08111b)] p-8 lg:p-10">
          <div className="mb-3 text-sm uppercase tracking-[0.24em] text-mist">Создание аккаунта</div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white">
            Создай профиль, комнаты и свою историю просмотров.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-mist">
            В текущем MVP регистрация уже идет через API. Потом это нужно перевести на настоящую базу данных и
            полноценное управление сессией.
          </p>
        </section>

        <form
          className="rounded-[36px] border border-white/8 bg-[#0a131f]/90 p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="mb-6 text-3xl font-semibold text-white">Регистрация</div>
          <div className="space-y-4">
            <Field label="Имя пользователя" placeholder="alexfilms" type="text" value={username} onChange={setUsername} />
            <Field label="Почта" placeholder="you@example.com" type="email" value={email} onChange={setEmail} />
            <Field label="Пароль" placeholder="Минимум 8 символов" type="password" value={password} onChange={setPassword} />
          </div>
          <button className="mt-6 w-full rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-slate-950" disabled={loading}>
            {loading ? "Создаем..." : "Создать аккаунт"}
          </button>
          {error ? <div className="mt-4 text-sm text-amber-200">{error}</div> : null}
          <div className="mt-6 text-sm text-mist">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-flare">
              Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/85">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist"
      />
    </label>
  );
}
