import {
  useUserAuthClient,
  useUserSession,
} from "~/composables/use-auth-client";
import { clearOfflinePackClientData } from "~/composables/use-offline-pack";

export function useMindKidAuth() {
  const authClient = useUserAuthClient();
  const { fetch: fetchSession, clear: clearSession } = useUserSession();

  async function refreshSession(): Promise<void> {
    const ok = await fetchSession();
    if (!ok) {
      throw new Error("Không thể khởi tạo phiên bảo mật.");
    }
  }

  async function logout(): Promise<void> {
    try {
      await authClient.signOut();
    } finally {
      await clearOfflinePackClientData({ reason: "logout" });
      await clearSession();
    }
  }

  async function logoutAll(): Promise<void> {
    try {
      await authClient.revokeSessions();
      await authClient.signOut();
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
