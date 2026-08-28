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
  // Trỏ thẳng vào thư mục layer. Cấm — NEVER dùng tên package "@mindkid/ui":
  // `exports["."]` của nó trỏ vào ./src/index.ts nên Nuxt lấy rootDir layer là
  // packages/ui/src, nơi không có nuxt.config.ts — layer bị bỏ qua trong im lặng
  // (mất @nuxt/ui, mất Tailwind, mất app.config).
  extends: [fileURLToPath(new URL("../../packages/ui", import.meta.url))],
  alias: {
    "#server": fileURLToPath(new URL("./server", import.meta.url)),
  },
  modules: ["nuxt-auth-utils", "nuxt-security"],
  nitro: {
    alias: {
      "#server": fileURLToPath(new URL("./server", import.meta.url)),
    },
    externals: {
      // argon2 là native addon phát bằng CommonJS + node-gyp-build. Rollup bundle
      // nó vào output ESM của Nitro thì thân CJS giữ nguyên `__dirname`, và server
      // build chết ngay lúc khởi động: "__dirname is not defined in ES module
      // scope". Nó tới qua @mindkid/auth (workspace package nên bị inline mặc
      // định), vì vậy phải khai external tường minh.
      external: ["argon2"],
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
        // `nuxt-security` gắn nonce vào mọi <script>/<link> khi render
        // (40-cspSsrNonce), nhưng chỉ thay `{{nonce}}` vào header nếu chuỗi này
        // có mặt (50-updateCsp). Vì `defuReplaceArray` **thay** mảng mặc định
        // chứ không gộp, thiếu nó nghĩa là trang gửi script inline có nonce
        // trong khi chính sách không liệt kê nonce nào — trình duyệt chặn cả
        // hai khối inline của Nuxt và trang không hydrate.
        //
        // `strict-dynamic` bịt lỗ của `'self'`: `/api/guest/storage/[...path]`
        // phục vụ file đã lưu từ **cùng origin**, nên `'self'` tin mọi thứ đọc
        // được qua đường đó. Với `strict-dynamic`, chỉ script mang nonce và
        // script do chúng nạp mới chạy.
        "script-src": [
          "'self'",
          "'wasm-unsafe-eval'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
        ],
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
