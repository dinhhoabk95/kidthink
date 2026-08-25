import { fileURLToPath } from "node:url";
import { defineNuxtConfig } from "nuxt/config";

// @mindkid/ui — Canonical Nuxt Layer (Nuxt UI v4 + Tailwind v4 + Self-hosted Fonts)
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxt/fonts"],
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
