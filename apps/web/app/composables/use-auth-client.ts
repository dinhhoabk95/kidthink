import {
  createMindKidUserAuthClient,
  type MindKidUserAuthClient,
} from "@mindkid/auth/client";
import { computed } from "vue";
import { useRequestHeaders, useRuntimeConfig, useState } from "#imports";
import {
  classifySessionProbe,
  hasAuthHint,
  probeSessionWithBackoff,
  type SessionProbeResponse,
  type SessionProbeStatus,
  writeAuthHint,
} from "~/composables/auth-session-status";

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

export function useUserSession() {
  const state = useState<AppUserSessionState>(
    "mindkid-user-auth-session",
    () => ({
      user: null,
      sessionId: null,
      sessionToken: null,
    })
  );

  function clearState(): void {
    state.value = { user: null, sessionId: null, sessionToken: null };
  }

  /** Một lần hỏi `get-session`; `unavailable` KHÔNG đụng vào state cũ. */
  async function probeSession(): Promise<SessionProbeStatus> {
    const client = useUserAuthClient();
    let cookieHeaders: Record<string, string> | undefined;
    if (typeof window === "undefined") {
      try {
        const reqHeaders = useRequestHeaders(["cookie"]);
        if (reqHeaders.cookie) {
          cookieHeaders = { cookie: reqHeaders.cookie };
        } else {
          clearState();
          return "anonymous";
        }
      } catch {
        // Ignore when outside SSR request context
      }
    }

    let res: SessionProbeResponse | null = null;
    try {
      res = (await client.getSession({
        fetchOptions: cookieHeaders ? { headers: cookieHeaders } : undefined,
      })) as SessionProbeResponse | null;
    } catch {
      return "unavailable";
    }
    const status = classifySessionProbe(res);
    if (status === "unavailable") {
      return status;
    }
    const payload = (res?.data ?? null) as RawBetterAuthSessionPayload | null;
    if (
      status === "anonymous" ||
      !(payload?.user && payload.session) ||
      payload.user.status === "suspended" ||
      payload.user.status === "deleted"
    ) {
      clearState();
      return "anonymous";
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
    return "authenticated";
  }

  /** Ba trạng thái + retry backoff; ghi/xoá hint đăng nhập ở client. */
  async function fetchSessionStatus(): Promise<SessionProbeStatus> {
    const status =
      typeof window === "undefined"
        ? await probeSession()
        : await probeSessionWithBackoff(probeSession);
    if (typeof window !== "undefined" && status !== "unavailable") {
      writeAuthHint(status === "authenticated");
    }
    return status;
  }

  /** `true` nếu đã đăng nhập (kể cả khi get-session tạm không xác định mà state cũ còn). */
  async function fetchSession(): Promise<boolean> {
    const status = await fetchSessionStatus();
    return (
      status === "authenticated" ||
      (status === "unavailable" && Boolean(state.value.user))
    );
  }

  /** Có gợi ý đã đăng nhập gần đây (sessionStorage, không chứa token). */
  function hasRecentAuthHint(): boolean {
    return typeof window !== "undefined" && hasAuthHint();
  }

  function clearSession(): Promise<void> {
    clearState();
    if (typeof window !== "undefined") {
      writeAuthHint(false);
    }
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
    fetchStatus: fetchSessionStatus,
    hasRecentAuthHint,
    clear: clearSession,
  };
}
