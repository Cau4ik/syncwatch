import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";

import { env } from "./config/env.js";
import { healthRoutes } from "./modules/health/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { roomRoutes } from "./modules/rooms/routes.js";
import { uploadRoutes } from "./modules/uploads/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";

export async function createApp() {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: env.WEB_URL,
    credentials: true
  });

  await app.register(cookie, {
    hook: "onRequest"
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(roomRoutes);
  await app.register(uploadRoutes);
  await app.register(reportRoutes);

  return app;
}

