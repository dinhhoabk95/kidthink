import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["@sidebase/nuxt-auth"],
  runtimeConfig: {
    webJwtSecret: "",
  },
  auth: {
    baseURL: "/api",
    disableInternalRouting: false,
    provider: {
      type: "local",
      endpoints: {
        signIn: { path: "/guest/auth/users/login", method: "post" },
        signOut: { path: "/users/auth/logout", method: "post" },
        signUp: false,
        getSession: { path: "/users/auth/session", method: "get" },
      },
      pages: {
        login: "/dang-nhap",
      },
      token: {
        signInResponseTokenPointer: "/access_token",
        type: "Bearer",
        cookieName: "kidthink-user-access",
        headerName: "Authorization",
        maxAgeInSeconds: 15 * 60,
        sameSiteAttribute: "lax",
        secureCookieAttribute: !import.meta.dev,
        cookieDomain: "",
        httpOnlyCookieAttribute: true,
      },
      session: {
        dataType: {
          user_id: "number",
          display_name: "string",
          session_id: "string",
          refresh_token_version: "number",
          active_child_id: "number | undefined",
        },
        dataResponsePointer: "/",
      },
      // KidThink owns the opaque HttpOnly refresh cookie. Sidebase's built-in
      // refresh flow serializes that token through JavaScript-visible state.
      refresh: {
        isEnabled: false,
      },
    },
  },
});
