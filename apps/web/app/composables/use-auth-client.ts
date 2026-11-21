import {
  createMindKidUserAuthClient,
  type MindKidUserAuthClient,
} from "@mindkid/auth/client";
import { computed, type Ref, ref } from "vue";
import { useRequestHeaders, useRuntimeConfig, useState } from "#imports";

export interface AppUserSessionIdentity {
  id: string;
  user_id: number;
  uuid?: string;
  email: string;
  name: string;
  display_name: string;
  status?: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
}

export interface AppUserSessionState {
  user: AppUserSessionIdentity | null;
  sessionId: string | null;
  sessionToken: string | null;
}

const TRAILING_SLASH_REGEX = /\/$/;

let cachedBrowserClient: MindKidUserAuthClient | null = null;
let cachedBaseUrl = "";

function resolveUserAuthBaseUrl(): string {
  try {
    const config = useRuntimeConfig();
    const publicSite = String(
      (config?.public as { siteUrl?: string } | undefined)?.siteUrl ?? ""
    ).replace(TRAILING_SLASH_REGEX, "");
    if (publicSite) {
      return `${publicSite}/api/auth/users`;
    }
  } catch {
    // Fallback when called outside Nuxt runtime context in unit tests
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/auth/users`;
  }
  return "http://localhost:3000/api/auth/users";
}

export function useUserAuthClient(): MindKidUserAuthClient {
  const baseURL = resolveUserAuthBaseUrl();
  if (typeof window !== "undefined") {
    if (cachedBrowserClient && cachedBaseUrl === baseURL) {
      return cachedBrowserClient;
    }
    cachedBrowserClient = createMindKidUserAuthClient({ baseURL });
    cachedBaseUrl = baseURL;
    return cachedBrowserClient;
  }
  return createMindKidUserAuthClient({ baseURL });
}

interface RawBetterAuthSessionPayload {
  user?: {
    id: string | number;
    uuid?: string;
    email: string;
    name?: string;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
    status?: string;
  };
  session?: {
    id: string | number;
    token: string;
  };
}

function createUserSessionState(): Ref<AppUserSessionState> {
  const initial = (): AppUserSessionState => ({
    user: null,
    sessionId: null,
    sessionToken: null,
  });
  try {
    if (typeof useState === "function") {
      return useState<AppUserSessionState>(
        "mindkid-user-auth-session",
        initial
      );
    }
  } catch {
    // Fallback for component tests that mock "#imports" without useState
  }
  return ref<AppUserSessionState>(initial());
}

export function useUserSession() {
  const state = createUserSessionState();

  async function fetchSession(): Promise<boolean> {
    const client = useUserAuthClient();
    let cookieHeaders: Record<string, string> | undefined;
    if (typeof window === "undefined") {
      try {
        const reqHeaders = useRequestHeaders(["cookie"]);
        if (reqHeaders.cookie) {
          cookieHeaders = { cookie: reqHeaders.cookie };
        } else {
          state.value = { user: null, sessionId: null, sessionToken: null };
          return false;
        }
      } catch {
        // Ignore when outside SSR request context
      }
    }

    try {
      const res = await client.getSession({
        fetchOptions: cookieHeaders ? { headers: cookieHeaders } : undefined,
      });
      const payload = (res?.data ?? null) as RawBetterAuthSessionPayload | null;
      if (
        !(payload?.user && payload.session) ||
        payload.user.status === "suspended" ||
        payload.user.status === "deleted"
      ) {
        state.value = { user: null, sessionId: null, sessionToken: null };
        return false;
      }

      const displayName = payload.user.name || payload.user.email;
      state.value = {
        user: {
          id: String(payload.user.id),
          user_id: Number(payload.user.id),
          uuid: payload.user.uuid,
          email: payload.user.email,
          name: displayName,
          display_name: displayName,
          status: payload.user.status,
          email_verified: Boolean(payload.user.emailVerified),
          two_factor_enabled: Boolean(payload.user.twoFactorEnabled),
        },
        sessionId: String(payload.session.id),
        sessionToken: payload.session.token,
      };
      return true;
    } catch {
      state.value = { user: null, sessionId: null, sessionToken: null };
      return false;
    }
  }

  function clearSession(): Promise<void> {
    state.value = { user: null, sessionId: null, sessionToken: null };
    return Promise.resolve();
  }

  return {
    loggedIn: computed(() => Boolean(state.value.user)),
    user: computed(() => state.value.user),
    session: computed(() => ({
      user: state.value.user,
      id: state.value.sessionId,
      token: state.value.sessionToken,
    })),
    fetch: fetchSession,
    clear: clearSession,
  };
}
