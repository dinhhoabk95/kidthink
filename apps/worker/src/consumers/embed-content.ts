import type { Consumer } from "./types.js";

/**
 * Job add-on chưa tới lượt triển khai (`07-addon/semantic-search.md` §7.2).
 *
 * Bảng consumer là kiểu mapped phủ đủ `JobName`, nên bỏ trống một job là lỗi
 * biên dịch. Ném tường minh ở đây trung thực hơn: job vẫn vào `failed` queue và
 * phát alert theo `BR-JOB-05` thay vì biến mất im lặng.
 */
export const embedContent: Consumer<"embed:content"> = () => {
  return Promise.reject(
    new Error(
      "Job 'embed:content' chưa có consumer — xem docs/specs/07-addon/semantic-search.md §7.2."
    )
  );
};
