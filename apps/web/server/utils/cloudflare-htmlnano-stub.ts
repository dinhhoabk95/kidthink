/**
 * Thay `htmlnano` trong bundle Nitro khi `MINDKID_RUNTIME=cloudflare`.
 *
 * `htmlnano` (kéo vào qua `mjml-core`) nạp module con bằng `import("./_modules/" + name)` động,
 * wrangler không giải được nên `wrangler deploy` chết. Chỉ nhánh `minify` của MJML dùng nó và
 * `packages/notification` không bật `minify`, nên stub này không bao giờ chạy; nếu ai bật `minify`
 * thì ném lỗi rõ ràng thay vì im lặng bỏ qua.
 */
const htmlnano = {
  process(): never {
    throw new Error(
      "htmlnano is not available on the Cloudflare runtime (MJML minify is disabled)"
    );
  },
};

export default htmlnano;
