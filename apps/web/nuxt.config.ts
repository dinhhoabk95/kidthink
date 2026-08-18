import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["nuxt-auth-utils", "nuxt-security"],
  nitro: {
    // ERROR-CODES §4 + §8: chỗ duy nhất dựng body lỗi cho `/api/*`.
    // Nitro nối handler mặc định vào cuối chuỗi, nên trang lỗi Nuxt (SSR, 404
    // trang) vẫn do Nitro xử lý như trước — `server/error.ts` return sớm cho
    // mọi đường không phải `/api/`.
    errorHandler: fileURLToPath(new URL("./server/error.ts", import.meta.url)),
  },
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
      name: "mindkid-user-session",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  },
});
