"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronRight, Link2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { saveRoomPresence } from "@/lib/room-presence";
import { loadSession, subscribeSessionChange, type SessionState } from "@/lib/session";
import type { LaunchSourceDefinition } from "@/lib/sources";

export function SourceLaunchForm({ source }: { source: LaunchSourceDefinition }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [hostName, setHostName] = useState("");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSession = () => {
      const next = loadSession();
      setSession(next);
      setHostName(next?.user.username ?? "");
    };

    syncSession();
    return subscribeSessionChange(syncSession);
  }, []);

  async function submit() {
    if (!value.trim()) {
      setError("Paste a source link first.");
      return;
    }

    if (!hostName.trim()) {
      setError("Enter your name so the room owner is known.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiFetch<{
        slug: string;
        participantId: string;
        participantName: string;
      }>("/api/rooms/from-source", {
        method: "POST",
        token: session?.accessToken,
        body: JSON.stringify({
          source: source.id,
          title: title.trim() || undefined,
          value: value.trim(),
          hostName: hostName.trim()
        })
      });

      saveRoomPresence(result.slug, {
        name: result.participantName,
        participantId: result.participantId
      });

      router.push(`/rooms/${result.slug}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[36px] border border-white/8 bg-[linear-gradient(180deg,#111f2f,#08111b)] p-8 lg:p-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80">
            <Sparkles className="h-4 w-4 text-flare" />
            Source-first watch party flow
          </div>
          <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-white">{source.label} launcher</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-mist">{source.helper}</p>

          <div className="mt-8 grid gap-4 rounded-[30px] border border-white/8 bg-white/[0.03] p-6 md:grid-cols-3">
            <StepCard index="01" title="Open source" text="Browse the service in a new tab and choose the exact video or stream." />
            <StepCard index="02" title="Paste link" text="Bring the public link back here. Add a room title if you want a custom name." />
            <StepCard index="03" title="Create room" text="The room is generated with that source already attached. Then you just share the invite." />
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            {source.externalUrl ? (
              <a
                href={source.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Open {source.label}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to sources
            </Link>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/8 bg-[#0a131f]/90 p-8">
          <div className="mb-6 text-3xl font-semibold text-white">Create room from {source.label}</div>

          <div className="space-y-4">
            <Field
              label={session ? "Room owner" : "Your name"}
              placeholder="Host name"
              value={hostName}
              onChange={setHostName}
            />

            <Field
              label="Room title"
              placeholder={`${source.label} watch party`}
              value={title}
              onChange={setTitle}
            />

            <Field
              label="Video or stream link"
              placeholder={source.placeholder}
              value={value}
              onChange={setValue}
            />
          </div>

          <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-6 text-mist">
            <div className="mb-2 flex items-center gap-2 text-white">
              <Link2 className="h-4 w-4 text-signal" />
              Practical MVP note
            </div>
            <p>
              This flow opens the source, lets you copy the chosen video URL, and creates the room from that URL. It avoids fake empty-room-first UX.
            </p>
          </div>

          {error ? <div className="mt-4 text-sm text-amber-200">{error}</div> : null}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "Creating room..." : "Create room and continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/85">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist"
      />
    </label>
  );
}

function StepCard({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[#08111b] p-5">
      <div className="mb-3 text-xs uppercase tracking-[0.24em] text-flare">{index}</div>
      <div className="mb-2 text-xl font-semibold text-white">{title}</div>
      <p className="text-sm leading-6 text-mist">{text}</p>
    </div>
  );
}
