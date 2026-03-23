import type { FastifyInstance } from "fastify";
import { z } from "zod";

const reportSchema = z.object({
  targetType: z.enum(["user", "room", "message"]),
  targetId: z.string(),
  reason: z.string().min(5).max(400)
});

export async function reportRoutes(app: FastifyInstance) {
  app.post("/api/reports", async (request, reply) => {
    const body = reportSchema.parse(request.body);
    return reply.code(201).send({
      id: "report_demo_1",
      ...body,
      status: "open"
    });
  });
}

