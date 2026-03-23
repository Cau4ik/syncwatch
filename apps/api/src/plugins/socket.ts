import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";
import type { ChatMessage, Participant } from "@syncwatch/shared";

import { store } from "../lib/store.js";
import { env } from "../config/env.js";

export function registerSocketLayer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.WEB_URL,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
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
        status: "online"
      });

      if (!room) {
        socket.emit("room:error", { message: "Room not found" });
        return;
      }

      store.addSystemMessage(roomSlug, `${name} joined the room.`);

      io.to(roomSlug).emit("room:state", room);
      io.to(roomSlug).emit("room:users", room.participants);
      }
    );

    socket.on("chat:send", ({ roomSlug, text, authorName }: { roomSlug: string; text: string; authorName: string }) => {
      const message = store.addMessage(roomSlug, {
        authorId: socket.id,
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

    socket.on("voice:signal", ({ roomSlug, payload }: { roomSlug: string; payload: unknown }) => {
      socket.to(roomSlug).emit("voice:signal", { from: socket.id, payload });
    });

    socket.on("disconnecting", () => {
      const roomSlug = socket.data.roomSlug as string | undefined;
      const participantId = socket.data.participantId as string | undefined;
      if (!roomSlug || !participantId) return;

      const room = store.removeParticipant(roomSlug, participantId);
      if (!room) return;

      store.addSystemMessage(roomSlug, "A participant left the room.");
      io.to(roomSlug).emit("room:state", room);
      io.to(roomSlug).emit("room:users", room.participants);
    });
  });

  return io;
}
