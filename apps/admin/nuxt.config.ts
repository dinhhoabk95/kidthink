import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["@sidebase/nuxt-auth"],
  auth: {
    baseURL: "/api",
    disableInternalRouting: false,
    provider: {
      type: "local",
      endpoints: {
        signIn: { path: "/guest/auth/managers/login", method: "post" },
        signOut: { path: "/managers/auth/logout", method: "post" },
        signUp: false,
        getSession: { path: "/managers/auth/session", method: "get" },
      },
      pages: {
        login: "/login",
      },
      token: {
        signInResponseTokenPointer: "/access_token",
        type: "Bearer",
        cookieName: "kidthink-manager-access",
        headerName: "Authorization",
        maxAgeInSeconds: 15 * 60,
        sameSiteAttribute: "lax",
        secureCookieAttribute: !import.meta.dev,
        cookieDomain: "",
        httpOnlyCookieAttribute: true,
      },
      session: {
        dataType: {
          manager_id: "number",
          display_name: "string",
          session_id: "string",
          refresh_token_version: "number",
          role: '"super_admin" | "content_reviewer"',
        },
        dataResponsePointer: "/",
      },
      // Manager refresh is also a backend-owned opaque HttpOnly cookie and
      // must never enter Sidebase's JavaScript-visible refresh-token state.
      refresh: {
        isEnabled: false,
      },
    },
  },
});
