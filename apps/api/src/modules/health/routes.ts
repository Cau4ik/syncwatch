import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    ok: true,
    service: "syncwatch-api",
    timestamp: new Date().toISOString()
  }));
}
