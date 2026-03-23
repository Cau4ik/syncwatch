"use client";

import { AudioLines, Copy, Heart, Link2, Mic, PanelRight, ShieldCheck, UsersRound, Video } from "lucide-react";
import type { ChatMessage, RoomState } from "@syncwatch/shared";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { PlayerFrame } from "@/components/room/player-frame";
import { ChatPanel } from "@/components/room/chat-panel";
import { ParticipantsPanel } from "@/components/room/participants-panel";
import { apiFetch } from "@/lib/api";
import { socketUrl } from "@/lib/config";

const roomJoinStorageKey = (slug: string) => `syncwatch-room-${slug}`;

export function RoomShell({ slug }: { slug: string }) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [guestName, setGuestName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let active = true;

    const storedName = window.localStorage.getItem(roomJoinStorageKey(slug));
    if (storedName) {
      setGuestName(storedName);
    }

    apiFetch<RoomState>(`/api/rooms/${slug}`)
      .then((data) => {
        if (!active) return;
        setRoom(data);
      })
      .catch((cause: Error) => {
        if (!active) return;
        setError(cause.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [slug]);

  useEffect(() => {
    if (!participantId || !guestName || socketRef.current) {
      return;
    }

    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("room:join", {
        roomSlug: slug,
        name: guestName,
        participantId
      });
    });

    socket.on("room:state", (nextRoom: RoomState) => {
      setRoom(nextRoom);
    });

    socket.on("room:users", (participants: RoomState["participants"]) => {
      setRoom((current) => (current ? { ...current, participants } : current));
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setRoom((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, message]
            }
          : current
      );
    });

    socket.on("video:state", (playback: RoomState["playback"]) => {
      setRoom((current) => (current ? { ...current, playback } : current));
    });

    socket.on("room:error", ({ message }: { message: string }) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [guestName, participantId, slug]);

  const canInteract = Boolean(room && participantId && guestName);

  async function joinRoom() {
    if (!guestName.trim()) {
      setError("Введите имя для входа в комнату.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const joined = await apiFetch<RoomState & { participantId: string }>(`/api/rooms/${slug}/join`, {
        method: "POST",
        body: JSON.stringify({ name: guestName.trim() })
      });

      window.localStorage.setItem(roomJoinStorageKey(slug), guestName.trim());
      setParticipantId(joined.participantId);
      setRoom(joined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось войти в комнату.");
    } finally {
      setJoining(false);
    }
  }

  async function sendChat(text: string) {
    if (!socketRef.current || !canInteract) return;
    socketRef.current.emit("chat:send", {
      roomSlug: slug,
      text,
      authorName: guestName
    });
  }

  function togglePlayback() {
    if (!socketRef.current || !room) return;
    socketRef.current.emit(room.playback.state === "playing" ? "video:pause" : "video:play", {
      roomSlug: slug
    });
  }

  function seek(deltaSeconds: number) {
    if (!socketRef.current || !room) return;
    const nextTime = Math.max(0, Math.min(room.playback.duration, room.playback.currentTime + deltaSeconds));
    socketRef.current.emit("video:seek", {
      roomSlug: slug,
      currentTime: nextTime
    });
  }

  if (loading) {
    return <RoomStateCard title="Загружаем комнату..." description="Получаем room snapshot и состояние участников." />;
  }

  if (error && !room) {
    return <RoomStateCard title="Комната недоступна" description={error} />;
  }

  if (!room) {
    return <RoomStateCard title="Комната не найдена" description="Проверь slug или создай новую комнату." />;
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1.45fr)_420px] lg:px-8">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
          <ShieldCheck className="h-4 w-4" />
          Private room - Host authority enabled
        </div>

        <PlayerFrame playback={room.playback} onTogglePlayback={togglePlayback} onSeek={seek} />

        <section className="grid gap-5 rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-2 text-4xl font-semibold tracking-tight text-white">{room.title}</div>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-mist">
              <span>Создал host</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{room.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{room.participants.length} участников</span>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-mist">Ссылка на комнату</div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#08111b] px-4 py-4 text-white">
                <div className="truncate">{room.inviteUrl}</div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <button className="flex items-center justify-center gap-3 rounded-[22px] bg-white px-5 py-4 text-base font-semibold text-slate-950">
              <Video className="h-5 w-5" />
              Добавить видео
            </button>
            <button className="flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-medium text-white">
              <AudioLines className="h-5 w-5" />
              Включить голосовой чат
            </button>
            <button className="flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-medium text-white">
              <PanelRight className="h-5 w-5" />
              Открыть side panels
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ActionPill icon={<UsersRound className="h-5 w-5" />} label="Пригласить" />
          <ActionPill icon={<Mic className="h-5 w-5" />} label="Микрофон" />
          <ActionPill icon={<Video className="h-5 w-5" />} label="Камера" />
          <ActionPill icon={<Heart className="h-5 w-5" />} label="Реакции" />
        </section>

        {!canInteract ? (
          <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-6">
            <div className="mb-3 text-2xl font-semibold text-white">Войти в комнату</div>
            <p className="mb-5 text-sm text-mist">Для синхронизации, чата и голоса нужно зайти по имени. Регистрация не обязательна.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Твое имя"
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist"
              />
              <button
                onClick={joinRoom}
                disabled={joining}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {joining ? "Подключаем..." : "Войти"}
              </button>
            </div>
            {error ? <div className="mt-3 text-sm text-amber-200">{error}</div> : null}
          </section>
        ) : null}
      </div>

      <div className="space-y-6">
        <ChatPanel messages={room.messages} onSend={sendChat} disabled={!canInteract} />
        <ParticipantsPanel participants={room.participants} />
        <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-5">
          <div className="mb-3 flex items-center gap-3 text-white">
            <Link2 className="h-5 w-5 text-signal" />
            Voice & sync panel
          </div>
          <div className="space-y-3 text-sm text-mist">
            <p>Voice channel: connected</p>
            <p>Socket latency: 42 ms</p>
            <p>Soft resync: every 4 seconds</p>
            <p>Host controls locked to room owner</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ActionPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="flex items-center justify-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-5 text-base text-white transition hover:bg-white/[0.05]">
      {icon}
      {label}
    </button>
  );
}

function RoomStateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-4xl items-center px-5 py-12 lg:px-8">
      <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/85 p-10">
        <div className="mb-4 text-4xl font-semibold text-white">{title}</div>
        <div className="text-lg text-mist">{description}</div>
      </div>
    </div>
  );
}
