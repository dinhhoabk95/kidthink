import {
  type AdminManager,
  useAdminAuth as useBaseAdminAuth,
} from "~/composables/use-admin-auth";
import { apiFetch } from "~/composables/use-api-client";

export type ManagerRole = NonNullable<AdminManager["role"]>;

export function useAdminAuth() {
  const base = useBaseAdminAuth();

  async function reauth(password: string): Promise<void> {
    await apiFetch("/api/managers/auth/reauth", {
      method: "POST",
      body: { password },
    });
  }

  return {
    ...base,
    reauth,
  };
}
