import { useCookie, useUserSession } from "#imports";
import { useApi } from "~/composables/use-api";
import { clearOfflinePackClientData } from "~/composables/use-offline-pack";

export function useMindKidAuth() {
  const api = useApi();
  const { fetch: fetchSession, clear: clearSession } = useUserSession();
  const csrf = useCookie<string | null>("tm_u_csrf");

  async function getSession(_options?: { force?: boolean }): Promise<void> {
    await fetchSession();
  }

  async function refreshSession(): Promise<void> {
    if (!csrf.value) {
      await getSession({ force: true });
    }
    if (!csrf.value) {
      throw new Error("Không thể khởi tạo phiên bảo mật.");
    }
    await api("/api/users/auth/restore", {
      method: "POST",
      headers: { "x-csrf-token": csrf.value },
    });
    await getSession({ force: true });
  }

  async function logout(): Promise<void> {
    try {
      await api("/api/users/auth/logout", {
        method: "POST",
      });
    } finally {
      await clearOfflinePackClientData({ reason: "logout" });
      await clearSession();
    }
  }

  async function logoutAll(): Promise<void> {
    try {
      await api("/api/users/auth/logout-all", {
        method: "POST",
      });
    } finally {
      await clearOfflinePackClientData({ reason: "logout" });
      await clearSession();
    }
  }

  return {
    refreshSession,
    logout,
    logoutAll,
  };
}
