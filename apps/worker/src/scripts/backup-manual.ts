import { runPostgresBackup } from "#src/consumers/backup-postgres";
import { readErrorMessage } from "#src/errors";

/**
 * Chạy `backup:postgres` một lần bằng tay, ngoài hàng đợi.
 *
 * Bản cũ nằm ở gốc `apps/worker/` (ngoài `src/`, nên ngoài cả tsconfig lẫn
 * vitest), không script nào khai, và `.catch(console.error).finally(() =>
 * process.exit(0))` khiến nó **luôn thoát mã 0** kể cả khi backup hỏng — đúng
 * thứ `BR-BAK-04` cấm ("Fail Cấm — NEVER im lặng").
 */
runPostgresBackup("manual")
  .then(() => {
    console.info("[backup:postgres] Xong.");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(`[backup:postgres] Thất bại: ${readErrorMessage(error)}`);
    process.exit(1);
  });
