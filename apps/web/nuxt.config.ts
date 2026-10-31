import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";
import { env } from "./env";
import {
  SESSION_MAX_AGE_SECONDS,
  USER_SESSION_COOKIE,
} from "./server/utils/session-runtime";

const isDevelopment = env.NODE_ENV === "development";
const isProduction = env.NODE_ENV === "production";

const allowedOrigins = env.NUXT_ALLOWED_ORIGINS.split(",")
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
      external: ["argon2", "sharp"],
    },
    // ERROR-CODES §4 + §8: chỗ duy nhất dựng body lỗi cho `/api/*`.
    // Nitro nối handler mặc định vào cuối chuỗi, nên trang lỗi Nuxt (SSR, 404
    // trang) vẫn do Nitro xử lý như trước — `server/error.ts` return sớm cho
    // mọi đường không phải `/api/`.
    errorHandler: fileURLToPath(new URL("./server/error.ts", import.meta.url)),
  },
  security: {
    nonce: true,
    sri: true,
    hidePoweredBy: true,
    headers: {
      crossOriginResourcePolicy: "same-origin",
      crossOriginOpenerPolicy: "same-origin",
      crossOriginEmbedderPolicy: isDevelopment ? "unsafe-none" : "require-corp",
      originAgentCluster: "?1",
      referrerPolicy: "strict-origin-when-cross-origin",
      strictTransportSecurity: isDevelopment
        ? false
        : {
            maxAge: 31_536_000,
            includeSubdomains: true,
            preload: true,
          },
      xContentTypeOptions: "nosniff",
      xDNSPrefetchControl: "off",
      xDownloadOptions: "noopen",
      xFrameOptions: "DENY",
      xPermittedCrossDomainPolicies: "none",
      xXSSProtection: "0",
      permissionsPolicy: {
        camera: [],
        "display-capture": [],
        fullscreen: ["self"],
        geolocation: [],
        microphone: [],
        payment: [],
        usb: [],
      },
      contentSecurityPolicy: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "connect-src": ["'self'", "https:"],
        "font-src": ["'self'", "https:", "data:"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'self'"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "media-src": ["'self'", "data:", "blob:", "https:"],
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
        "worker-src": ["'self'", "blob:"],
        "upgrade-insecure-requests": true,
      },
    },
    // BR-SEC-10: Rate limit thuộc @mindkid/cache, CSRF thuộc @mindkid/auth,
    // input validation thuộc Zod (BR-SEC-04) + @mindkid/moderation. Tắt
    // xssValidator nội bộ để không nuốt multipart stream/webhook raw body hay
    // chặn ký tự toán học (<, >).
    rateLimiter: false,
    csrf: false,
    xssValidator: false,
    removeLoggers: false,
    requestSizeLimiter: {
      maxRequestSizeInBytes: 10 * 1024 * 1024,
      maxUploadFileRequestInBytes: 10 * 1024 * 1024,
      throwError: true,
    },
    // CORS xử lý ở server/middleware/00-cors.ts để chạy đầu chuỗi middleware
    // và tránh lỗi corsHandler của nuxt-security@2.7.0 trả về boolean true
    // khiến h3 ghi đè header sau khi đã gửi 204 No Content cho OPTIONS preflight.
    corsHandler: false,
  },
  // BR-SEO2-01: Bề mặt tài khoản và bề mặt trẻ không được index
  routeRules: {
    "/me": {
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    },
    "/me/**": {
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    },
    "/play": {
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    },
    "/play/**": {
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    },
    // BR-LPV-01: Cho phép nhúng iframe xem trước từ origin admin đã allowlist
    "/play/preview-sandbox": {
      headers: { "X-Robots-Tag": "noindex, nofollow" },
      security: {
        headers: {
          xFrameOptions: false,
          contentSecurityPolicy: {
            "frame-ancestors": ["'self'", ...allowedOrigins],
          },
        },
      },
    },
  },
  runtimeConfig: {
    session: {
      name: USER_SESSION_COOKIE,
      maxAge: SESSION_MAX_AGE_SECONDS,
      cookie: {
        name: USER_SESSION_COOKIE,
        sameSite: "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
    // Ranh giới public/private rõ ràng (BR-CFO-12)
    public: {
      apiBaseUrl: env.NUXT_PUBLIC_API_BASE_URL ?? "",
      siteUrl: env.SITE_URL,
    },
  },
});
