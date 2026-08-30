import { useCookie, useUserSession } from "#imports";

export function useMindKidAuth() {
  const { fetch: fetchSession } = useUserSession();
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
    await $fetch("/api/users/auth/restore", {
      method: "POST",
      headers: { "x-csrf-token": csrf.value },
    });
    await getSession({ force: true });
  }

  return { refreshSession };
}
