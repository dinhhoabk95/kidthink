import { defineNuxtRouteMiddleware, navigateTo } from "#imports";
import { useAdminAuth } from "~/composables/use-admin-auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetchSession } = useAdminAuth();

  // Allow unrestricted access to /login if not logged in
  if (to.path === "/login") {
    if (loggedIn.value) {
      return navigateTo("/");
    }
    return;
  }

  // For all protected routes, verify session
  if (!loggedIn.value) {
    const ok = await fetchSession();
    if (!(ok && loggedIn.value)) {
      return navigateTo("/login");
    }
  }
});
