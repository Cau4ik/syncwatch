import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  bio?: string;
}

export interface AccessSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface RefreshSession {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

const ACCESS_TTL_MS = 1000 * 60 * 30;
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;

  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function createOpaqueToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAccessSession(userId: string): AccessSession {
  return {
    token: createOpaqueToken(),
    userId,
    expiresAt: Date.now() + ACCESS_TTL_MS
  };
}

export function createRefreshSession(userId: string) {
  const rawToken = createOpaqueToken();

  return {
    rawToken,
    session: {
      tokenHash: hashToken(rawToken),
      userId,
      expiresAt: Date.now() + REFRESH_TTL_MS
    } satisfies RefreshSession
  };
}

export function isExpired(expiresAt: number) {
  return expiresAt <= Date.now();
}

