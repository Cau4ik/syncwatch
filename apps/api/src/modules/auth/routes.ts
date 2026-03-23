import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { verifyPassword } from "../../lib/auth.js";
import { demoAuthStore } from "../../lib/demo-auth-store.js";
import { env } from "../../config/env.js";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerSchema = authSchema.extend({
  username: z.string().min(3).max(20)
});

const refreshSchema = z.object({
  refreshToken: z.string().optional()
});

const refreshCookieName = "syncwatch_refresh";

function setRefreshCookie(reply: FastifyReply, refreshToken: string) {
  reply.setCookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(refreshCookieName, {
    path: "/"
  });
}

function getBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    try {
      const user = demoAuthStore.createUser(body);
      const tokens = demoAuthStore.issueSessions(user.id);
      setRefreshCookie(reply, tokens.refreshToken);

      return reply.code(201).send(demoAuthStore.toAuthPayload(user, tokens.accessToken));
    } catch (error) {
      return reply.code(409).send({
        message: error instanceof Error ? error.message : "Unable to register"
      });
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
    const body = authSchema.parse(request.body);
    const user = demoAuthStore.findByEmail(body.email);

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const tokens = demoAuthStore.issueSessions(user.id);
    setRefreshCookie(reply, tokens.refreshToken);

    return demoAuthStore.toAuthPayload(user, tokens.accessToken);
  });

  app.post("/api/auth/refresh", async (request, reply) => {
    const body = refreshSchema.parse(request.body ?? {});
    const rawToken = request.cookies[refreshCookieName] || body.refreshToken;
    const nextTokens = rawToken ? demoAuthStore.rotateRefreshToken(rawToken) : null;

    if (!nextTokens) {
      clearRefreshCookie(reply);
      return reply.code(401).send({ message: "Refresh token is invalid or expired" });
    }

    const user = demoAuthStore.getUserFromAccessToken(nextTokens.accessToken);
    if (!user) {
      clearRefreshCookie(reply);
      return reply.code(401).send({ message: "Session is invalid" });
    }

    setRefreshCookie(reply, nextTokens.refreshToken);

    return demoAuthStore.toAuthPayload(user, nextTokens.accessToken);
  });

  app.post("/api/auth/logout", async (request, reply) => {
    demoAuthStore.revokeRefreshToken(request.cookies[refreshCookieName]);
    clearRefreshCookie(reply);
    return reply.code(204).send();
  });

  app.get("/api/auth/me", async (request, reply) => {
    const user = demoAuthStore.getUserFromAccessToken(getBearerToken(request) ?? undefined);

    if (!user) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio
    };
  });
}
