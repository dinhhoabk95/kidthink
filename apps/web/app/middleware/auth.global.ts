export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith("/me")) {
    const { loggedIn, fetch: fetchSession } = useUserSession();
    if (!loggedIn.value) {
      await fetchSession();
      if (!loggedIn.value) {
        const redirectTarget = to.fullPath;
        if (
          redirectTarget &&
          redirectTarget !== "/login" &&
          redirectTarget !== "/"
        ) {
          return navigateTo(
            `/login?redirect=${encodeURIComponent(redirectTarget)}`
          );
        }
        return navigateTo("/login");
      }
    }
  }
});
