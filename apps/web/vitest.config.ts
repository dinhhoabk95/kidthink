import { defineWorkspaceTest, nuxtAppAliases } from "@mindkid/config/vitest";
import vue from "@vitejs/plugin-vue";

export default defineWorkspaceTest({
  // `tests/component/` mount component thật; không có plugin vue thì Vite coi
  // .vue là JS và vỡ ngay ở import.
  plugins: [vue()],
  resolve: {
    alias: nuxtAppAliases(import.meta.dirname),
  },
  test: { setupFiles: ["./tests/setup.ts"] },
});
