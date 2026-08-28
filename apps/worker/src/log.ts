import type { JobName } from "@mindkid/queue";
import type { JobContext } from "./consumers/types.js";

/**
 * Một dòng tổng kết cho mỗi job chạy xong.
 *
 * Trước Task này sáu consumer chép tay cùng một `console.info` với sáu cách
 * ghép chuỗi khác nhau, và hai consumer quên hẳn — nên không ai đọc log biết
 * `sweep:pdf-cleanup` có chạy hay không.
 */
export function logJobDone(
  name: JobName,
  ctx: JobContext,
  fields: Record<string, string | number> = {}
): void {
  const detail = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  console.info(
    `[${name}] job=${ctx.jobId} attempt=${ctx.attempt}${detail ? ` ${detail}` : ""}`
  );
}
