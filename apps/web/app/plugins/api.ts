import { defineNuxtPlugin } from "#imports";
import { useApi } from "~/composables/use-api";

/**
 * Plugin gán client API fetcher vào globalThis.$fetch ở phía client — Task #254 (WP254.3).
 *
 * Cho phép 18 file đang gọi `$fetch` trần được tự động gắn CSRF và bắt lỗi
 * qua interceptor của `useApi` mà không cần sửa call site.
 *
 * Chỉ chạy client — request SSR đi thẳng, không bị bọc.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    const api = useApi();
    globalThis.$fetch = api;
  }
});
