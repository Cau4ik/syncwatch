import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { z } from "zod";

import { store } from "../../lib/store.js";

const createRoomSchema = z.object({
  title: z.string().min(3).max(80)
});

const joinRoomSchema = z.object({
  name: z.string().min(2).max(24)
});

export async function roomRoutes(app: FastifyInstance) {
  app.get("/api/rooms", async () => store.listRooms());

  app.post("/api/rooms", async (request, reply) => {
    const body = createRoomSchema.parse(request.body);
    const room = store.createRoom(body.title);
    return reply.code(201).send(room);
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
    const body = joinRoomSchema.parse(request.body);
    const participantId = `guest-${nanoid(8)}`;

    const room = store.upsertParticipant(params.slug, {
      id: participantId,
      name: body.name,
      role: "guest",
      avatar: body.name.charAt(0).toUpperCase(),
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
