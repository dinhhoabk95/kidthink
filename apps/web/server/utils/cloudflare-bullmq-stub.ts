/**
 * Thay `bullmq` trong bundle Nitro khi `MINDKID_RUNTIME=cloudflare`: hàng đợi chạy
 * qua Durable Object, nên BullMQ (và `@valkey/valkey-glide` kèm theo) không được
 * vào bundle. Dùng sai thì ném lỗi rõ ràng.
 */
function unavailable(): never {
  throw new Error("bullmq is not available on the Cloudflare runtime");
}

export class Queue {
  constructor() {
    unavailable();
  }
}

export class Worker {
  constructor() {
    unavailable();
  }
}
