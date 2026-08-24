import { computed } from "vue";
import { useState } from "#imports";
import { useApiClient } from "./use-api-client";

export interface AdminManager {
  manager_id?: number;
  display_name?: string;
  role?: "super_admin" | "content_reviewer";
  email?: string;
  [key: string]: unknown;
}

export function useAdminAuth() {
  const manager = useState<AdminManager | undefined>("admin-manager");
  const csrfToken = useState<string | undefined>("admin-csrf-token");
  const api = useApiClient();

  async function fetchSession(): Promise<boolean> {
    try {
      const response = await api.get<{
        manager: AdminManager;
        csrf_token: string;
      }>("/api/managers/auth/session");
      manager.value = response.manager;
      csrfToken.value = response.csrf_token;
      return true;
    } catch {
      manager.value = undefined;
      csrfToken.value = undefined;
      return false;
    }
  }

  async function clear(): Promise<void> {
    try {
      await api.post("/api/managers/auth/logout");
    } finally {
      manager.value = undefined;
      csrfToken.value = undefined;
    }
  }

  return {
    manager,
    user: manager,
    session: computed(() => ({ user: manager.value })),
    loggedIn: computed(() => Boolean(manager.value)),
    fetchSession,
    clear,
  };
}
