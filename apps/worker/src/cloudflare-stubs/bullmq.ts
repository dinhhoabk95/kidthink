/**
 * Thay `bullmq` trong bundle Cloudflare (`wrangler.jsonc` → `alias`) — `BR-JOB-11`.
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
