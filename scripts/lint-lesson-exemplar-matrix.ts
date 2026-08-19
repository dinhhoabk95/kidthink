#!/usr/bin/env tsx
/**
 * CLI Quality Gate for Lesson Exemplar Matrix (BR-LEX-01..11).
 * Spec: docs/specs/05-content/lesson-exemplar-set.md
 */

import postgres from "postgres";
import {
  AGE_BANDS,
  COMPETENCIES,
  evaluateExemplarMatrix,
  type LessonExemplarRecord,
} from "./lint-lesson-exemplar-matrix-lib.ts";

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5433/mindkid";
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    const rows = await sql<
      Array<{
        id: number;
        code: string;
        title: string;
        exemplar_competency: string | null;
        exemplar_age_band: string | null;
        is_exemplar: boolean;
        status: string;
      }>
    >`
      SELECT id, code, title, exemplar_competency, exemplar_age_band, is_exemplar, status
      FROM lessons
      WHERE is_exemplar = true
    `;

    const records: LessonExemplarRecord[] = rows.map((r) => ({
      id: Number(r.id),
      code: r.code,
      title: r.title,
      competency: r.exemplar_competency,
      ageBand: r.exemplar_age_band,
      isExemplar: Boolean(r.is_exemplar),
      status: r.status,
    }));

    const result = evaluateExemplarMatrix(records, { isPhase4: false });

    console.log(
      "================================================================================"
    );
    console.log(
      "MA TRẬN BỘ TIẾT HỌC MẪU (BR-LEX-07, BR-LEX-08) — 6 Competency × 3 Band tuổi"
    );
    console.log(
      "================================================================================"
    );
    console.log(
      `Tổng số tiết học mẫu: ${result.totalExemplars} (đã lấp ${result.filledCellsCount}/18 ô)`
    );
    console.log(
      "--------------------------------------------------------------------------------"
    );

    for (const c of COMPETENCIES) {
      const counts = AGE_BANDS.map((b) => `${b}: ${result.matrix[c][b]}`).join(
        "   "
      );
      console.log(`  ${c}  ${counts}`);
    }

    console.log(
      "--------------------------------------------------------------------------------"
    );

    if (result.emptyCells.length > 0) {
      console.log(
        `ℹ️  Có ${result.emptyCells.length} ô chưa có tiết học mẫu (cảnh báo P3, chặn từ P4 khi đủ seeder).`
      );
    }

    if (!result.isValid) {
      console.error("\n❌ VI PHẠM MA TRẬN TIẾT HỌC MẪU:");
      for (const v of result.violations) {
        console.error(`  - ${v}`);
      }
      process.exit(1);
    }

    console.log("✅ Cổng ma trận bộ tiết học mẫu đạt chuẩn.");
    process.exit(0);
  } catch (err) {
    console.error("Lỗi khi kiểm tra ma trận bộ tiết học mẫu:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
