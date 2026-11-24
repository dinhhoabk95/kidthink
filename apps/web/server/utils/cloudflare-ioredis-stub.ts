/**
 * Thay `ioredis` trong bundle Nitro khi `MINDKID_RUNTIME=cloudflare` (không có Valkey).
 */
export class Redis {
  constructor() {
    throw new Error("ioredis is not available on the Cloudflare runtime");
  }
}
