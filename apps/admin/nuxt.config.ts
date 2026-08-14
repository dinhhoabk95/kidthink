import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["nuxt-auth-utils", "nuxt-security"],
  security: {
    headers: {
      crossOriginEmbedderPolicy:
        process.env.NODE_ENV === "development" ? "unsafe-none" : "require-corp",
      contentSecurityPolicy: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "font-src": ["'self'", "https:", "data:"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
        "object-src": ["'none'"],
        "script-src-attr": ["'none'"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "script-src": ["'self'", "'wasm-unsafe-eval'"],
        "upgrade-insecure-requests": true,
      },
    },
    rateLimiter: false,
    csrf: false,
    requestSizeLimiter: {
      maxRequestSizeInBytes: 10 * 1024 * 1024,
      maxUploadFileRequestInBytes: 10 * 1024 * 1024,
    },
    corsHandler: {
      origin: process.env.NUXT_ALLOWED_ORIGINS || "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      allowHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    },
  },
  userSession: {
    maxAge: 3600,
    cookie: {
      name: "kidthink-manager-session",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
});
