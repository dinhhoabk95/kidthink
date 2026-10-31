import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";
import { env } from "./env";

export default defineNuxtConfig({
  // Trỏ thẳng vào thư mục layer. Cấm — NEVER dùng tên package "@mindkid/ui":
  // `exports["."]` của nó trỏ vào ./src/index.ts nên Nuxt lấy rootDir layer là
  // packages/ui/src, nơi không có nuxt.config.ts — layer bị bỏ qua trong im lặng
  // (mất @nuxt/ui, mất Tailwind, mất app.config).
  extends: [fileURLToPath(new URL("../../packages/ui", import.meta.url))],
  ssr: false,
  app: {
    head: {
      titleTemplate: "%s · MindKid Admin",
      title: "MindKid Admin",
    },
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
});
