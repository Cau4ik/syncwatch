import { nanoid } from "nanoid";

import {
  type AuthUser,
  type AccessSession,
  createAccessSession,
  createRefreshSession,
  hashPassword,
  hashToken,
  isExpired,
  type RefreshSession
} from "./auth.js";

interface AuthPayload {
  user: {
    id: string;
    email: string;
    username: string;
    bio?: string;
  };
  accessToken: string;
}

const users = new Map<string, AuthUser>();
const accessSessions = new Map<string, AccessSession>();
const refreshSessions = new Map<string, RefreshSession>();

const demoUser: AuthUser = {
  id: "demo-user",
  email: "alex@example.com",
  username: "alexfilms",
  passwordHash: hashPassword("password123"),
  bio: "Host of late-night watch parties"
};

users.set(demoUser.id, demoUser);

export const demoAuthStore = {
  createUser(input: { email: string; username: string; password: string }) {
    const hasEmail = [...users.values()].some((user) => user.email === input.email);
    if (hasEmail) {
      throw new Error("Email already in use");
    }

    const hasUsername = [...users.values()].some((user) => user.username === input.username);
    if (hasUsername) {
      throw new Error("Username already in use");
    }

    const user: AuthUser = {
      id: nanoid(),
      email: input.email,
      username: input.username,
      passwordHash: hashPassword(input.password),
      bio: "New SyncWatch member"
    };

    users.set(user.id, user);
    return user;
  },

  findByEmail(email: string) {
    return [...users.values()].find((user) => user.email === email) ?? null;
  },

  findById(id: string) {
    return users.get(id) ?? null;
  },

  issueSessions(userId: string) {
    const access = createAccessSession(userId);
    const refresh = createRefreshSession(userId);
    accessSessions.set(access.token, access);
    refreshSessions.set(refresh.session.tokenHash, refresh.session);

    return {
      accessToken: access.token,
      refreshToken: refresh.rawToken
    };
  },

  revokeRefreshToken(rawToken?: string) {
    if (!rawToken) return;
    refreshSessions.delete(hashToken(rawToken));
  },

  rotateRefreshToken(rawToken: string) {
    const existing = refreshSessions.get(hashToken(rawToken));
    if (!existing || isExpired(existing.expiresAt)) {
      if (existing) {
        refreshSessions.delete(existing.tokenHash);
      }
      return null;
    }

    refreshSessions.delete(existing.tokenHash);
    return this.issueSessions(existing.userId);
  },

  getUserFromAccessToken(accessToken?: string) {
    if (!accessToken) return null;

    const session = accessSessions.get(accessToken);
    if (!session || isExpired(session.expiresAt)) {
      if (session) {
        accessSessions.delete(accessToken);
      }
      return null;
    }

    return this.findById(session.userId);
  },

  toAuthPayload(user: AuthUser, accessToken: string): AuthPayload {
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio
      }
    };
  }
};
