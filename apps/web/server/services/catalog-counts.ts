import type { OwnerDb } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { useOwnerRepositories } from "#server/utils/repositories";

/**
 * Số lượng trò chơi công khai — `BR-LND-09`.
 *
 * Chỉ đếm `status = 'published'`: đó là tập mà `GAME-CATALOG-PUBLIC` §BR-GCP-06
 * cho khách thấy.
 */
export interface PublishedLevelCounts {
  total: number;
  /** Khoá là nhãn band `"3-4"` · `"4-5"` · `"5-6"`. */
  by_age_band: Record<string, number>;
  /** Khoá là `access_tier`: `free` · `login` · `standard` · `premium`. */
  by_access_tier: Record<string, number>;
}

export async function countPublishedLevels(
  db?: OwnerDb
): Promise<PublishedLevelCounts> {
  const { gameLevels } = db ? createRepositories(db) : useOwnerRepositories();
  const stats = await gameLevels.countPublishedStats();

  return {
    total: stats.total,
    by_age_band: stats.byAgeBand,
    by_access_tier: stats.byAccessTier,
  };
}

/**
 * "230+" từ 239 — giữ sắc thái tiếp thị mà không nói sai.
 *
 * Làm tròn **xuống** bội của 10 nên con số luôn là lời hứa dưới mức thực tế.
 * Dưới 10 level thì không có gì để "+", trả nguyên số.
 */
export function roundedLibrarySize(total: number): string {
  if (total < 10) {
    return String(total);
  }
  return `${Math.floor(total / 10) * 10}+`;
}
