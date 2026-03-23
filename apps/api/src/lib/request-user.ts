import type { FastifyRequest } from "fastify";

import { demoAuthStore } from "./demo-auth-store.js";

function getBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

export function getRequestUser(request: FastifyRequest) {
  return demoAuthStore.getUserFromAccessToken(getBearerToken(request) ?? undefined);
}
