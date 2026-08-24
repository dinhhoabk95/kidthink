import { fileURLToPath } from "node:url";
import { requireEnv } from "@mindkid/config";
import { defineNuxtConfig } from "nuxt/config";
import {
  SESSION_MAX_AGE_SECONDS,
  USER_SESSION_COOKIE,
} from "./server/utils/session-runtime";

const allowedOrigins = requireEnv("NUXT_ALLOWED_ORIGINS")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export default defineNuxtConfig({
  alias: {
    "#server": fileURLToPath(new URL("./server", import.meta.url)),
  },
  modules: ["nuxt-auth-utils", "nuxt-security"],
  nitro: {
    alias: {
      "#server": fileURLToPath(new URL("./server", import.meta.url)),
    },
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
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"],
      allowHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    },
  },
  runtimeConfig: {
    session: {
      name: USER_SESSION_COOKIE,
      maxAge: SESSION_MAX_AGE_SECONDS,
      cookie: {
        name: USER_SESSION_COOKIE,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
  },
});
