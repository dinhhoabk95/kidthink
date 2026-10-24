import { useAdminAuth } from "~/composables/use-admin-auth";

export function useManagerSession() {
  return useAdminAuth();
}
