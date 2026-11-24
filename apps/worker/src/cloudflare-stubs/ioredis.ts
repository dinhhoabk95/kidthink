/**
 * Thay `ioredis` trong bundle Cloudflare (`wrangler.jsonc` → `alias`): Valkey không
 * tồn tại ở runtime này, dùng sai thì ném lỗi rõ ràng thay vì kéo ~MB mã vào bundle.
 */
export class Redis {
  constructor() {
    throw new Error("ioredis is not available on the Cloudflare runtime");
  }
}
