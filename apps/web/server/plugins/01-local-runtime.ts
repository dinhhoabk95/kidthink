import { isCloudflareRuntime } from "@mindkid/config";
import {
  type LocalAuthRuntime,
  type LocalQueueRuntime,
  resolveLocalEnginePath,
  startLocalAuthRuntime,
  startLocalQueueProducer,
} from "@mindkid/local-runtime";
import { defineNitroPlugin } from "nitropack/runtime";

interface LocalRuntimeHandles {
  readonly auth: LocalAuthRuntime;
  readonly queue: LocalQueueRuntime;
}

/** Giữ qua hot-reload của `nuxt dev`: plugin chạy lại nhưng không mở thêm handle SQLite. */
const HANDLES_KEY = Symbol.for("mindkid.local-runtime.handles");

interface GlobalWithHandles {
  [HANDLES_KEY]?: LocalRuntimeHandles;
}

/**
 * Dev (không phải Cloudflare): nối engine DO chạy trong tiến trình trên SQLite vào các
 * port auth/cache/rate limit/queue (D15, `BR-JOB-16`). Web chỉ là producer của queue;
 * `apps/worker` dev drain cùng file `do-queue.sqlite`. Cloudflare nối binding thật ở
 * `00-cloudflare-bindings.ts`.
 */
export default defineNitroPlugin((nitroApp) => {
  if (isCloudflareRuntime()) {
    return;
  }
  const holder = globalThis as GlobalWithHandles;
  holder[HANDLES_KEY] ??= {
    auth: startLocalAuthRuntime(resolveLocalEnginePath("auth")),
    queue: startLocalQueueProducer(resolveLocalEnginePath("queue")),
  };
  nitroApp.hooks.hook("close", () => {
    holder[HANDLES_KEY]?.queue.close();
    holder[HANDLES_KEY]?.auth.close();
    holder[HANDLES_KEY] = undefined;
  });
});
