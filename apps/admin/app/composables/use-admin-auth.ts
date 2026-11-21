import { computed } from "vue";
import { useState } from "#imports";
import { useApiClient } from "~/composables/use-api-client";
import { useManagerAuthClient } from "~/composables/use-manager-auth-client";

export interface AdminManager {
  id?: number;
  manager_id?: number;
  uuid?: string;
  display_name?: string;
  role?: "super_admin" | "content_reviewer";
  email?: string;
  mfa_enabled?: boolean;
  session_id?: string;
  session_token?: string;
}

interface RawManagerSessionPayload {
  user?: {
    id: string | number;
    uuid?: string;
    email: string;
    name?: string;
    role?: string;
    isActive?: boolean;
    twoFactorEnabled?: boolean;
    mfaEnabled?: boolean;
  };
  session?: {
    id: string | number;
    token: string;
  };
}

export function useAdminAuth() {
  const manager = useState<AdminManager | undefined>("admin-manager");
  const csrfToken = useState<string | undefined>("admin-csrf-token");
  const api = useApiClient();

  async function fetchSession(): Promise<boolean> {
    try {
      const authClient = useManagerAuthClient();
      const res = await authClient.getSession();
      const payload = (res?.data ?? null) as RawManagerSessionPayload | null;
      if (
        !(payload?.user && payload.session) ||
        payload.user.isActive === false
      ) {
        manager.value = undefined;
        csrfToken.value = undefined;
        return false;
      }

      const numId = Number(payload.user.id);
      const role: "super_admin" | "content_reviewer" =
        payload.user.role === "content_reviewer"
          ? "content_reviewer"
          : "super_admin";

      manager.value = {
        id: numId,
        manager_id: numId,
        uuid: payload.user.uuid,
        display_name: payload.user.name || payload.user.email,
        email: payload.user.email,
        role,
        mfa_enabled: Boolean(
          payload.user.twoFactorEnabled ?? payload.user.mfaEnabled
        ),
        session_id: String(payload.session.id),
        session_token: payload.session.token,
      };
      return true;
    } catch {
      manager.value = undefined;
      csrfToken.value = undefined;
      return false;
    }
  }

  async function clear(): Promise<void> {
    try {
      const authClient = useManagerAuthClient();
      await authClient.signOut();
    } finally {
      manager.value = undefined;
      csrfToken.value = undefined;
    }
  }

  async function reauth(password: string): Promise<void> {
    await api.post("api/managers/auth/reauth", { body: { password } });
  }

  return {
    manager,
    user: manager,
    session: computed(() => ({ user: manager.value })),
    loggedIn: computed(() => Boolean(manager.value)),
    fetchSession,
    clear,
    reauth,
  };
}
