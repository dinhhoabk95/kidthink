import { getOwnerDb } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { alert } from "@mindkid/queue";

export const GRADUATION_TARGET_DAU = 1000;
export const GRADUATION_WARNING_DAU = 850;
export const FREE_DAILY_WRITE_BUDGET = 100_000;
export const GRADUATION_WARNING_QUOTA_RATIO = 0.65;

export interface GraduationReadinessSnapshot {
  readonly rolling7DayAvgDau: number;
  readonly peakSingleDayDau: number;
  readonly estimatedDailyWrites: number;
  readonly estimatedWriteQuotaRatio: number;
  readonly shouldPrepareVpsCutover: boolean;
}

/**
 * Cảm biến tự động theo dõi ngưỡng chuyển đổi từ Giai đoạn 1 (Cloudflare Free)
 * sang Giai đoạn 2 (Hybrid Cloudflare Free + VPS Tự Build PostgreSQL 18 / Garage S3):
 * Phát cảnh báo sớm cho Manager ngay khi chạm 850 DAU (85% của mốc 1.000 DAU)
 * hoặc ước tính tiêu thụ >= 65% hạn ngạch ghi D1 ngày.
 */
export async function checkGraduationReadiness(
  now = new Date(),
  estimatedWritesPerActiveChild = 20
): Promise<GraduationReadinessSnapshot> {
  const repos = createRepositories(getOwnerDb());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const summary =
    await repos.playSessions.getWindowActivitySummary(sevenDaysAgo);

  const distinct7d = summary.activeChildren;
  const totalSessions7d = summary.totalSessions;

  const rolling7DayAvgDau = Math.round(totalSessions7d / 7 / 2);
  const peakSingleDayDau = Math.max(
    rolling7DayAvgDau,
    Math.round(distinct7d / 3)
  );
  const estimatedDailyWrites = peakSingleDayDau * estimatedWritesPerActiveChild;
  const estimatedWriteQuotaRatio =
    estimatedDailyWrites / FREE_DAILY_WRITE_BUDGET;

  const shouldPrepareVpsCutover =
    peakSingleDayDau >= GRADUATION_WARNING_DAU ||
    estimatedWriteQuotaRatio >= GRADUATION_WARNING_QUOTA_RATIO;

  if (shouldPrepareVpsCutover) {
    await alert(
      "warning",
      "MindKid đạt ngưỡng chuẩn bị Cutover sang VPS (Giai đoạn 2 >= 1.000 DAU)",
      {
        peakSingleDayDau,
        rolling7DayAvgDau,
        estimatedDailyWrites,
        estimatedWriteQuotaRatio: Number(estimatedWriteQuotaRatio.toFixed(3)),
        action: "Chạy `pnpm cutover:cf-to-vps --rehearse` trên VPS đích",
      }
    );
  }

  return {
    rolling7DayAvgDau,
    peakSingleDayDau,
    estimatedDailyWrites,
    estimatedWriteQuotaRatio,
    shouldPrepareVpsCutover,
  };
}
