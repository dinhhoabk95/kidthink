import type { JobName } from "@mindkid/queue";
import type { ErasedConsumer } from "#src/consumers/index";

/**
 * Ca âm cho bảng consumer (`BR-TYP-07` đòi mỗi cổng có ca âm).
 *
 * Bảng thật trong `src/consumers/index.ts` là `Record<JobName, ErasedConsumer>`,
 * nên thiếu một job là lỗi biên dịch. Fixture này chứng minh điều đó: bảng dưới
 * đây cố ý chỉ khai một job. Nếu tính phủ-đủ mất đi, `@ts-expect-error` trở
 * thành thừa và `pnpm typecheck:worker` đỏ — cổng tự phát hiện chính nó hỏng.
 *
 * Trước Task này bảng là `switch`, nên thiếu `account:purge` chỉ im lặng rơi
 * vào `default`.
 */
// @ts-expect-error — cố ý thiếu 14 job còn lại
export const INCOMPLETE_CONSUMERS: Record<JobName, ErasedConsumer> = {
  "email:send": () => Promise.resolve(),
};
