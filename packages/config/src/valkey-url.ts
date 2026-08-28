import { requireEnv } from "./require-env.js";

/**
 * Chuỗi kết nối Valkey, đã chuẩn hoá về scheme mà client hiểu.
 *
 * `env-contract.md` §7.2 chốt **tên biến** là `VALKEY_URL`, và giá trị mẫu
 * trong `.env.example` là `valkey://127.0.0.1:6380`. Nhưng ioredis chỉ nhận
 * `redis://` và `rediss://`; đưa `valkey://` vào, nó coi cả chuỗi là đường dẫn
 * unix socket và chết bằng `connect ENOENT //127.0.0.1:6380`.
 *
 * Lỗi này ẩn được lâu vì `apps/web/tests/setup.ts:42` đặt `redis://` cho test,
 * nên mọi cổng đều xanh trong khi không môi trường thật nào kết nối được.
 *
 * Chuẩn hoá ở một chỗ giữ được cả hai: tài liệu vẫn viết `valkey://` đúng theo
 * tên sản phẩm, client vẫn nhận scheme nó hiểu.
 */
const VALKEY_SCHEME = /^valkey(s)?:\/\//;

export function normalizeValkeyUrl(url: string): string {
  return url.replace(VALKEY_SCHEME, (_match, secure) =>
    secure ? "rediss://" : "redis://"
  );
}

export function requireValkeyUrl(): string {
  return normalizeValkeyUrl(requireEnv("VALKEY_URL"));
}
