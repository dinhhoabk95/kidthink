import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { gameLevels } from "#src/schema/game";

/**
 * Số lượng trò chơi công khai — `BR-LND-09`.
 *
 * Trang chủ từng in số cứng (24 · 48 · 48 cho ba band, "120+" cho thư viện)
 * trong khi DB có 239 level published chia 60 · 84 · 95. Người lớn bấm vào
 * "Xem 48 trò chơi" rồi thấy một con số khác — mọi số trên bề mặt công khai
 * phải đi qua hàm này.
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
  db: PostgresJsDatabase<Record<string, unknown>>
): Promise<PublishedLevelCounts> {
  const rows = await db
    .select({
      ageMin: gameLevels.ageMin,
      ageMax: gameLevels.ageMax,
      accessTier: gameLevels.accessTier,
      count: sql<number>`count(*)::int`,
    })
    .from(gameLevels)
    .where(eq(gameLevels.status, "published"))
    .groupBy(gameLevels.ageMin, gameLevels.ageMax, gameLevels.accessTier);

  const byAgeBand: Record<string, number> = {};
  const byAccessTier: Record<string, number> = {};
  let total = 0;

  for (const row of rows) {
    const count = Number(row.count);
    total += count;

    if (row.ageMin != null && row.ageMax != null) {
      const band = `${row.ageMin}-${row.ageMax}`;
      byAgeBand[band] = (byAgeBand[band] ?? 0) + count;
    }
    byAccessTier[row.accessTier] = (byAccessTier[row.accessTier] ?? 0) + count;
  }

  return { total, by_age_band: byAgeBand, by_access_tier: byAccessTier };
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
