import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";
import { env } from "./env";

const isDevelopment = env.NODE_ENV === "development";
const isCloudflareTarget = process.env.MINDKID_RUNTIME === "cloudflare";

/**
 * Helper CJS của `@babel/runtime` theo tên import → đường dẫn tệp CJS thật. Xem `nitro.alias`.
 * `@babel/runtime` là phụ thuộc bắc cầu của mjml.
 */
function babelRuntimeCjsHelperAliases(): Record<string, string> {
  // packages/notification -> mjml -> mjml-core -> @babel/runtime (pnpm không hoist).
  const packageJsonPath = fileURLToPath(
    new URL("../../packages/notification/package.json", import.meta.url)
  );
  const runtimePackageJson = ["mjml", "mjml-core", "@babel/runtime"].reduce(
    (from, name) => createRequire(from).resolve(`${name}/package.json`),
    packageJsonPath
  );
  const helpersDir = join(dirname(runtimePackageJson), "helpers");
  return Object.fromEntries(
    readdirSync(helpersDir)
      .filter((file) => file.endsWith(".js"))
      .map((file) => [
        `@babel/runtime/helpers/${file.slice(0, -3)}`,
        join(helpersDir, file),
      ])
  );
}

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
  modules: ["nuxt-security"],
  nitro: {
    preset: isCloudflareTarget ? "cloudflare_module" : undefined,
    alias: isCloudflareTarget
      ? {
          "#server": fileURLToPath(new URL("./server", import.meta.url)),
          sharp: fileURLToPath(
            new URL(
              "./server/utils/cloudflare-empty-addon-stub.ts",
              import.meta.url
            )
          ),
          // BR-JOB-11: hàng đợi chạy qua Durable Object, không kéo BullMQ/ioredis vào bundle.
          bullmq: fileURLToPath(
            new URL("./server/utils/cloudflare-bullmq-stub.ts", import.meta.url)
          ),
          // htmlnano (qua mjml-core, chỉ dùng khi `minify`) nạp module động mà wrangler không giải được.
          htmlnano: fileURLToPath(
            new URL(
              "./server/utils/cloudflare-htmlnano-stub.ts",
              import.meta.url
            )
          ),
          // mjml-core (CJS) đọc `require("@babel/runtime/helpers/x").default`. Điều kiện "import" của
          // Nitro chọn bản ESM `helpers/esm/x` (chỉ có default export) và `requireReturnsDefault:
          // "auto"` trả thẳng hàm, nên `.default` là undefined và web crash lúc nạp module
          // ("B38 is not a function"). Ép về bản CJS (có `module.exports.default = module.exports`).
          ...babelRuntimeCjsHelperAliases(),
          ioredis: fileURLToPath(
            new URL(
              "./server/utils/cloudflare-ioredis-stub.ts",
              import.meta.url
            )
          ),
        }
      : {
          "#server": fileURLToPath(new URL("./server", import.meta.url)),
        },
    externals: isCloudflareTarget
      ? undefined
      : {
          // sharp là native addon (chỉ dùng khi MINDKID_RUNTIME=vps).
          external: ["sharp"],
        },
    // tsyringe (qua @peculiar/x509 <- @simplewebauthn/server <- @better-auth/passkey) cần polyfill
    // `reflect-metadata` nạp bằng import side-effect; Rollup treeshake của Nitro 2 sẽ bỏ import đó
    // và web crash lúc khởi tạo trên workerd ("tsyringe requires a reflect polyfill").
    moduleSideEffects: ["reflect-metadata/"],

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
  // Trang `/` KHÔNG prerender: nó gọi `/api/guest/home` (cần D1) nên prerender lúc build
  // vỡ "D1 binding is not registered". Chỉ prerender các trang tĩnh thuần (BR-LND-03).
  routeRules: {
    ...(isCloudflareTarget
      ? {
          "/guide": { prerender: true },
          "/terms": { prerender: true },
          "/privacy": { prerender: true },
          "/child-privacy": { prerender: true },
        }
      : {}),
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
    appSecret: env.NUXT_SESSION_PASSWORD,
    // Ranh giới public/private rõ ràng (BR-CFO-12)
    public: {
      apiBaseUrl: env.NUXT_PUBLIC_API_BASE_URL ?? "",
      siteUrl: env.SITE_URL,
    },
  },
});
