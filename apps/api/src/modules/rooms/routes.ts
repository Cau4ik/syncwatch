import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { LaunchSource } from "@syncwatch/shared";

import { buildPlaybackFromLaunch, getSourceCategory } from "../../lib/source-playback.js";
import { getRequestUser } from "../../lib/request-user.js";
import { store } from "../../lib/store.js";

const createRoomSchema = z.object({
  title: z.string().min(3).max(80)
});

const launchRoomSchema = z.object({
  source: z.enum(["youtube", "vkvideo", "rutube", "twitch", "file", "link"]),
  value: z.string().min(2).max(2048),
  title: z.string().min(2).max(120).optional(),
  hostName: z.string().min(2).max(24).optional()
});

const joinRoomSchema = z.object({
  name: z.string().min(2).max(24).optional()
});

function createFallbackPlayback() {
  return buildPlaybackFromLaunch({
    source: "youtube",
    rawValue: "jNQXAC9IVRw",
    title: "Quick room"
  });
}

export async function roomRoutes(app: FastifyInstance) {
  app.get("/api/rooms", async (request) => {
    const user = getRequestUser(request);
    return store.listRooms(user?.id);
  });

  app.post("/api/rooms", async (request, reply) => {
    const user = getRequestUser(request);
    if (!user) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const body = createRoomSchema.parse(request.body);
    const created = store.createRoom({
      title: body.title,
      ownerId: user.id,
      ownerName: user.username,
      playback: createFallbackPlayback(),
      category: "YouTube"
    });

    return reply.code(201).send({ slug: created.room.slug, participantId: created.participantId });
  });

  app.post("/api/rooms/from-source", async (request, reply) => {
    const user = getRequestUser(request);
    const body = launchRoomSchema.parse(request.body);

    const ownerName = user?.username ?? body.hostName?.trim();
    if (!ownerName) {
      return reply.code(400).send({ message: "Host name is required" });
    }

    const source = body.source as LaunchSource;
    const playback = buildPlaybackFromLaunch({
      source,
      rawValue: body.value,
      title: body.title
    });

    const created = store.createRoom({
      title: body.title?.trim() || `${getSourceCategory(source)} room`,
      ownerId: user?.id ?? `guest-host-${nanoid(8)}`,
      ownerName,
      playback,
      category: getSourceCategory(source)
    });

    return reply.code(201).send({
      slug: created.room.slug,
      participantId: created.participantId,
      participantName: ownerName
    });
  });

  app.get("/api/rooms/:slug", async (request, reply) => {
    const params = z.object({ slug: z.string() }).parse(request.params);
    const room = store.getRoom(params.slug);

    if (!room) {
      return reply.code(404).send({ message: "Room not found" });
    }

    return room;
  });

  app.post("/api/rooms/:slug/join", async (request, reply) => {
    const params = z.object({ slug: z.string() }).parse(request.params);
    const body = joinRoomSchema.parse(request.body ?? {});
    const currentRoom = store.getRoom(params.slug);

    if (!currentRoom) {
      return reply.code(404).send({ message: "Room not found" });
    }

    const user = getRequestUser(request);
    const participantId = user?.id ?? `guest-${nanoid(8)}`;
    const participantName = user?.username ?? body.name?.trim();

    if (!participantName) {
      return reply.code(400).send({ message: "Name is required" });
    }

    const room = store.upsertParticipant(params.slug, {
      id: participantId,
      name: participantName,
      role: user ? (currentRoom.hostId === user.id ? "host" : "user") : "guest",
      avatar: participantName.charAt(0).toUpperCase(),
      status: "online"
    });

    if (!room) {
      return reply.code(404).send({ message: "Room not found" });
    }

    return {
      ...room,
      participantId
    };
  });
}
