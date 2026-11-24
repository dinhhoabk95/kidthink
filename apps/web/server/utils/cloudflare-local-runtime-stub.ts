/**
 * Thay `@mindkid/local-runtime` trong bundle Nitro khi `MINDKID_RUNTIME=cloudflare`
 * (D15, `BR-JOB-16`): engine DO chạy trong tiến trình trên `node:sqlite` chỉ dành cho
 * dev/test; Cloudflare dùng binding Durable Object thật. Dùng sai thì ném lỗi rõ ràng
 * thay vì kéo adapter SQLite vào bundle workerd.
 */
function unavailable(): never {
  throw new Error("local-runtime is not available on the Cloudflare runtime");
}

export function resolveLocalEnginePath(): string {
  return unavailable();
}

export function startLocalAuthRuntime(): never {
  return unavailable();
}

export function startLocalQueueProducer(): never {
  return unavailable();
}
