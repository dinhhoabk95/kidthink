import { defineWorkspaceTest } from "@mindkid/config/vitest";
import vue from "@vitejs/plugin-vue";

export default defineWorkspaceTest(
  {
    plugins: [vue()],
  },
  { database: false }
);
