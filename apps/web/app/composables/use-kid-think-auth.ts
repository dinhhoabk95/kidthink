import { useAuth, useCookie, useNuxtApp } from "#imports";

export function useMindKidAuth() {
  const { getSession } = useAuth();
  const { $fetch } = useNuxtApp();
  const csrf = useCookie<string | null>("tm_u_csrf");

  async function refreshSession(): Promise<void> {
    if (!csrf.value) {
      await getSession({ force: true });
    }
    if (!csrf.value) {
      throw new Error("Không thể khởi tạo phiên bảo mật.");
    }
    await $fetch("/api/users/auth/refresh", {
      method: "POST",
      headers: { "x-csrf-token": csrf.value },
    });
    await getSession({ force: true });
  }

  return { refreshSession };
}
