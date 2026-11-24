import { beforeEach } from "vitest";
import { startLocalAuthRuntime } from "./auth-runtime.js";
import { startLocalQueueProducer } from "./queue-runtime.js";

/**
 * `setupFiles` cho workspace có test chạm auth keyspace, cache, rate limit hoặc
 * queue (`BR-TST-11`). Dựng engine DO thật trên SQLite `:memory:` và nối port; mỗi
 * file test có tiến trình/module riêng nên không rò sang file khác.
 *
 * Keyspace auth giữ nguyên giữa các test trong một file (như kho in-memory cũ);
 * chỉ bộ đếm rate limit được xoá trước mỗi test.
 */
const auth = startLocalAuthRuntime(":memory:");
startLocalQueueProducer(":memory:");

beforeEach(() => {
  auth.engine.clearRateLimits();
});
