import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";
import type { ChatMessage, Participant } from "@syncwatch/shared";

import { store } from "../lib/store.js";

export function registerSocketLayer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    function broadcastRoomUpdate(roomSlug: string, systemMessage?: string) {
      if (systemMessage) {
        store.addSystemMessage(roomSlug, systemMessage);
      }

      const nextRoom = store.getRoom(roomSlug);
      if (!nextRoom) {
        return;
      }

      io.to(roomSlug).emit("room:state", nextRoom);
      io.to(roomSlug).emit("room:users", nextRoom.participants);
    }

    function leaveCurrentRoom(systemMessage?: string) {
      const roomSlug = socket.data.roomSlug as string | undefined;
      const participantId = socket.data.participantId as string | undefined;
      if (!roomSlug || !participantId) {
        return;
      }

      const removal = store.removeParticipant(roomSlug, participantId);
      socket.leave(roomSlug);
      socket.data.roomSlug = undefined;
      socket.data.participantId = undefined;

      if (!removal.room) {
        return;
      }

      broadcastRoomUpdate(roomSlug, systemMessage);
    }

    socket.on(
      "room:join",
      ({
        roomSlug,
        name,
        role,
        participantId
      }: {
        roomSlug: string;
        name: string;
        role?: Participant["role"];
        participantId?: string;
      }) => {
        socket.join(roomSlug);
        socket.data.roomSlug = roomSlug;
        socket.data.participantId = participantId ?? socket.id;

        const room = store.upsertParticipant(roomSlug, {
          id: socket.data.participantId,
          name,
          role: role ?? "guest",
          avatar: name.charAt(0).toUpperCase(),
          status: "online",
          isMuted: true,
          cameraEnabled: false,
          isSpeaking: false
        });

        if (!room) {
          socket.emit("room:error", { message: "Room not found" });
          return;
        }

        broadcastRoomUpdate(roomSlug, `${name} joined the room.`);
      }
    );

    socket.on("room:leave", ({ roomSlug }: { roomSlug: string }, callback?: (payload: { ok: boolean }) => void) => {
      const activeRoomSlug = (socket.data.roomSlug as string | undefined) ?? roomSlug;
      if (!activeRoomSlug) {
        callback?.({ ok: true });
        return;
      }

      leaveCurrentRoom("A participant left the room.");
      callback?.({ ok: true });
    });

    socket.on("chat:send", ({ roomSlug, text, authorName }: { roomSlug: string; text: string; authorName: string }) => {
      const message = store.addMessage(roomSlug, {
        authorId: (socket.data.participantId as string | undefined) ?? socket.id,
        authorName,
        avatar: authorName.charAt(0).toUpperCase(),
        text,
        type: "user"
      }) as ChatMessage | null;

      if (!message) {
        socket.emit("room:error", { message: "Failed to send message" });
        return;
      }

      io.to(roomSlug).emit("chat:message", message);
    });

    socket.on("chat:relay", ({ roomSlug, message }: { roomSlug: string; message: ChatMessage }) => {
      io.to(roomSlug).emit("chat:message", message);
    });

    socket.on("video:play", ({ roomSlug }: { roomSlug: string }) => {
      const playback = store.updatePlayback(roomSlug, { state: "playing" });
      if (playback) io.to(roomSlug).emit("video:state", playback);
    });

    socket.on("video:pause", ({ roomSlug }: { roomSlug: string }) => {
      const playback = store.updatePlayback(roomSlug, { state: "paused" });
      if (playback) io.to(roomSlug).emit("video:state", playback);
    });

    socket.on("video:seek", ({ roomSlug, currentTime }: { roomSlug: string; currentTime: number }) => {
      const playback = store.updatePlayback(roomSlug, { currentTime });
      if (playback) io.to(roomSlug).emit("video:state", playback);
    });

    socket.on(
      "participant:media",
      ({
        roomSlug,
        patch
      }: {
        roomSlug: string;
        patch: Partial<Pick<Participant, "isMuted" | "cameraEnabled" | "isSpeaking" | "status">>;
      }) => {
        const participantId = socket.data.participantId as string | undefined;
        if (!participantId) {
          socket.emit("room:error", { message: "Participant not registered" });
          return;
        }

        const room = store.updateParticipant(roomSlug, participantId, patch);
        if (!room) {
          socket.emit("room:error", { message: "Room not found" });
          return;
        }

        io.to(roomSlug).emit("room:users", room.participants);
        io.to(roomSlug).emit("room:state", room);
      }
    );

    socket.on(
      "voice:signal",
      ({
        roomSlug,
        targetParticipantId,
        payload
      }: {
        roomSlug: string;
        targetParticipantId?: string;
        payload: unknown;
      }) => {
        socket.to(roomSlug).emit("voice:signal", {
          fromParticipantId: (socket.data.participantId as string | undefined) ?? socket.id,
          targetParticipantId,
          payload
        });
      }
    );

    socket.on("chat:history-sync", ({ roomSlug }: { roomSlug: string }) => {
      const room = store.getRoom(roomSlug);
      if (!room) {
        socket.emit("room:error", { message: "Room not found" });
        return;
      }

      socket.emit("room:state", room);
    });

    socket.on("disconnecting", () => {
      leaveCurrentRoom("A participant left the room.");
    });
  });

  return io;
}
