import { requireEnv } from "@mindkid/config";
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  extends: ["@mindkid/ui"],
  ssr: false,
  runtimeConfig: {
    public: {
      apiBaseUrl: requireEnv("NUXT_PUBLIC_API_BASE_URL"),
    },
  },
});
