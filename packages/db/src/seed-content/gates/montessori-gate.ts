/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: gate validation logic */

/**
 * Spec sở hữu: docs/specs/05-content/montessori-game-level-batch.md
 * Rule sở hữu: BR-MGL-01, BR-MGL-02, BR-MGL-07, BR-MGL-12, BR-MCM-06, BR-MLS-08, BR-MLS-09, D-RR
 */

import type {
  AnyContentSeed,
  ContentSeed,
  GateIssue,
  GateResult,
} from "#src/seed-content/types";

export const MONTESSORI_QUOTA_LIMITS: Record<string, number> = {
  C1: 36,
  C2: 9,
  C3: 15,
  C4: 9,
  C5: 0,
  C6: 0,
};

const COMMERCIAL_TEST_KEYWORDS = [
  "raven",
  "iq",
  "trí tuệ",
  "chỉ số thông minh",
  "wisc",
  "stanford-binet",
  "mensa",
];

const MONTESSORI_BATCH_REGEX = /^SEED-MONT-(?:[ABLM])(\d{2})$/;

function isContentSeed(seed: AnyContentSeed): seed is ContentSeed {
  return seed.kind !== "activity" && seed.kind !== "lesson";
}

/**
 * Kiểm tra 1 seed item thuộc lô Montessori
 */
export function checkMontessoriItemRules(
  seed: AnyContentSeed,
  batchCode?: string
): GateIssue[] {
  const issues: GateIssue[] = [];
  const header = seed.header;
  const isMontessoriBatch =
    batchCode?.startsWith("SEED-MONT-") ||
    header.code.includes("-01") ||
    header.code.includes("-02") ||
    header.what_tags?.includes("montessori") ||
    header.thinking_tags?.includes("montessori");

  if (!isMontessoriBatch) {
    return issues;
  }

  // 1. Kiểm tra dải mã (BR-MGL-02, BR-MLS-08) - phải từ 0101 trở lên
  const codeParts = header.code.split("-");
  const seqStr = codeParts.at(-1);
  const seqNum = seqStr ? Number.parseInt(seqStr, 10) : Number.NaN;

  if (!Number.isNaN(seqNum) && seqNum < 101) {
    issues.push({
      code: "MONTESSORI_CODE_SEQUENCE_INVALID",
      message: `Mã Montessori ${header.code} phải có số thứ tự >= 0101 (nhận: ${seqNum}).`,
    });
  }

  // 2. Kiểm tra access_tier khớp difficulty cho game level (BR-MGL-12, D-RR)
  if (isContentSeed(seed)) {
    const diff = seed.header.difficulty;
    const tier = seed.header.access_tier;

    let expectedTier: "free" | "login" | "standard" | "premium" = "free";
    if (diff === 1) {
      expectedTier = "free";
    } else if (diff === 2) {
      expectedTier = "login";
    } else if (diff === 3) {
      expectedTier = "standard";
    } else if (diff === 4 || diff === 5) {
      expectedTier = "premium";
    }

    if (tier !== expectedTier) {
      issues.push({
        code: "MONTESSORI_TIER_DIFFICULTY_MISMATCH",
        message: `Mức độ khó difficulty=${diff} của Montessori level phải có access_tier='${expectedTier}' (nhận: '${tier}').`,
      });
    }
  }

  // 3. Kiểm tra tên bài test thương mại & tuyên bố đo trí tuệ (BR-MCM-06)
  const instructionStr =
    "instruction" in header && typeof header.instruction === "string"
      ? header.instruction
      : "";
  const fullText = `${header.title || ""} ${instructionStr}`.toLowerCase();
  for (const keyword of COMMERCIAL_TEST_KEYWORDS) {
    // Check whole word or substring for test names
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(fullText)) {
      issues.push({
        code: "MONTESSORI_COMMERCIAL_TEST_BLOCKED",
        message: `Nội dung chứa từ khóa cấm/test thương mại/tuyên bố trí tuệ: '${keyword}'.`,
      });
    }
  }

  return issues;
}

/**
 * Kiểm tra tính nhất quán của một batch Montessori (BR-MGL-07, BR-MLS-09)
 */
export function checkMontessoriBatchRules(
  seeds: AnyContentSeed[],
  batchCode: string
): GateIssue[] {
  const issues: GateIssue[] = [];

  if (!batchCode.startsWith("SEED-MONT-")) {
    return issues;
  }

  const match = MONTESSORI_BATCH_REGEX.exec(batchCode);
  if (!match) {
    issues.push({
      code: "MONTESSORI_BATCH_CODE_FORMAT_INVALID",
      message: `Mã batch Montessori '${batchCode}' không đúng định dạng 'SEED-MONT-<Lô><Workbook 2 chữ số>' (ví dụ: SEED-MONT-A01).`,
    });
    return issues;
  }

  const wbNum = match[1]; // e.g. "01"
  if (!wbNum) {
    return issues;
  }
  // Kiểm tra mọi seed trong batch phải cùng 1 workbook (dựa vào code hoặc workbook metadata)
  for (const seed of seeds) {
    const wbTag = seed.header.what_tags?.find(
      (t) => t.startsWith("wb") || t.startsWith("wb-")
    );
    if (wbTag && !wbTag.includes(wbNum)) {
      issues.push({
        code: "MONTESSORI_BATCH_WORKBOOK_MIXED",
        message: `Batch '${batchCode}' cho Workbook ${wbNum} nhưng chứa item thuộc tag '${wbTag}'. Một batch chỉ chứa 1 workbook.`,
      });
    }
  }

  return issues;
}

/**
 * Kiểm tra hạn ngạch tổng thể theo competency (BR-MGL-01)
 */
export function checkMontessoriQuotas(
  montessoriLevels: ContentSeed[]
): GateIssue[] {
  const issues: GateIssue[] = [];
  const counts: Record<string, number> = {
    C1: 0,
    C2: 0,
    C3: 0,
    C4: 0,
    C5: 0,
    C6: 0,
  };

  for (const lvl of montessoriLevels) {
    const parts = lvl.header.code.split("-");
    if (parts.length >= 2) {
      const comp = parts[1]; // "C1", "C2", etc.
      if (comp && counts[comp] !== undefined) {
        counts[comp] = (counts[comp] ?? 0) + 1;
      }
    }
  }

  for (const [comp, max] of Object.entries(MONTESSORI_QUOTA_LIMITS)) {
    const count = counts[comp] || 0;
    if (count > max) {
      issues.push({
        code: "MONTESSORI_QUOTA_EXCEEDED",
        message: `Competency ${comp} vượt hạn ngạch tối đa của Lô Montessori: ${count} > ${max} (vượt ${count - max} level).`,
      });
    }
  }

  return issues;
}

/**
 * Gate runner wrapper cho Montessori Gate
 */
export function checkGateMontessori(
  seed: AnyContentSeed,
  batchCode?: string
): GateResult {
  const issues = checkMontessoriItemRules(seed, batchCode);
  return {
    gate: 8,
    name: "Cổng Lô Montessori",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Sàn số thứ tự của mã Montessori (BR-MGL-02). Level nền dừng ở 0020, nên sàn này
 * tách hai lô mà không cần cột đánh dấu riêng.
 */
const MONTESSORI_SEQ_FLOOR = 101;

export function isMontessoriLevel(seed: AnyContentSeed): boolean {
  if (seed.kind === "activity" || seed.kind === "lesson") {
    return false;
  }
  const seq = Number.parseInt(seed.header.code.split("-").at(-1) ?? "", 10);
  return Number.isInteger(seq) && seq >= MONTESSORI_SEQ_FLOOR;
}

/**
 * Cổng mức corpus: hạn ngạch competency của cả lô (BR-MGL-01).
 * Chạy một lần trên toàn bộ seed, không chạy theo từng item.
 */
export function checkGateMontessoriCorpus(seeds: AnyContentSeed[]): GateResult {
  const montessoriLevels = seeds
    .filter(isContentSeed)
    .filter(isMontessoriLevel);
  const issues = checkMontessoriQuotas(montessoriLevels);
  return {
    gate: 9,
    name: "Hạn ngạch lô Montessori",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}
