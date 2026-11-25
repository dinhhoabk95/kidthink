export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetchStatus, hasRecentAuthHint } = useUserSession();
  if (loggedIn.value) {
    return;
  }
  const status = await fetchStatus();
  // `get-session` 429/5xx/mạng: không phải logout — để request thật tự xử lý 401.
  if (
    status === "authenticated" ||
    (status === "unavailable" && hasRecentAuthHint())
  ) {
    return;
  }
  const redirectTarget = to.fullPath;
  if (redirectTarget && redirectTarget !== "/login" && redirectTarget !== "/") {
    return navigateTo(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }
  return navigateTo("/login");
});
