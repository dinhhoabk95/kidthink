import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";

// @mindkid/ui — Canonical Nuxt Layer (Nuxt UI v4 + Tailwind v4 + Self-hosted Fonts)
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxt/fonts"],
  vue: {
    compilerOptions: {
      // <search> là phần tử HTML thật (WHATWG 2023) nhưng chưa có trong
      // HTML_TAGS của @vue/shared 3.5.41, nên Vue đi hỏi component tên "search"
      // rồi cảnh báo "Failed to resolve component". Khai native ở đây để giữ
      // được landmark search cho screen reader thay vì hạ xuống div[role].
      isCustomElement: (tag: string) => tag === "search",
    },
  },
  css: [fileURLToPath(new URL("./assets/css/tailwind.css", import.meta.url))],
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700, 800],
      styles: ["normal"],
      subsets: ["vietnamese", "latin"],
    },
    families: [
      { name: "Baloo 2", provider: "google" },
      { name: "Be Vietnam Pro", provider: "google" },
    ],
  },
  ui: {
    theme: {
      colors: [
        "primary",
        "secondary",
        "success",
        "info",
        "warning",
        "error",
        "neutral",
        "cta",
        "retry",
      ],
    },
  },
});
