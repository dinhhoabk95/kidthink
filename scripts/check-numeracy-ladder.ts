/**
 * Cổng NUMERACY REPRESENTATION LADDER (Task #268 / BR-NRL-01..10 / BR-ERC-13).
 *
 * Kiểm tra:
 * - BR-NRL-01: Mọi bậc ladder của dataset C1 bắt buộc khai representation.
 * - BR-NRL-02: Thang không nhảy cóc quá một tầng giữa hai bậc liền kề (concreteness tier jump <= 1).
 * - BR-NRL-03: Trần tầng biểu diễn theo band tuổi (3-4 chỉ concrete; 4-5 tới semi-concrete; 5-6 tới semi-abstract).
 * - BR-NRL-04: Ký hiệu số (numeral) không đứng một mình dưới 5 tuổi.
 * - BR-NRL-05: Khoảng số nằm trong khoảng của kind (ví dụ dot-pattern chỉ tới 6).
 * - BR-NRL-06 / BR-ERC-13: Representation phải có hàm vẽ và call site thật trong engine.
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { SKILL_DATASETS, SKILL_IDENTITIES } from "@mindkid/content";
import type { SkillDataset, SkillIdentity } from "@mindkid/shared";

export type NumeracyRuleId =
  | "BR-NRL-01"
  | "BR-NRL-02"
  | "BR-NRL-03"
  | "BR-NRL-04"
  | "BR-NRL-05"
  | "BR-NRL-06";

export interface NumeracyLadderViolation {
  readonly skill_code: string;
  readonly rung: number;
  readonly rule: NumeracyRuleId;
  readonly representation?: string;
  readonly message: string;
}

export interface NumeracyLadderBaseline {
  readonly max_unannotated_skills: number;
  readonly unannotated_skills: readonly string[];
  readonly note?: string;
}

export const BASELINE_PATH = repoPath(
  "scripts",
  "numeracy-ladder-baseline.json"
);

/**
 * Bảng 7.1: Tầng biểu diễn và concreteness rank:
 * 0: concrete (Cụ thể)
 * 1: semi-concrete (Bán cụ thể)
 * 2: semi-abstract (Bán trừu tượng)
 * 3: abstract (Trừu tượng)
 */
export const REPRESENTATION_TIERS: Readonly<
  Record<string, { tier: number; name: string }>
> = {
  "discrete-object": { tier: 0, name: "concrete" },
  finger: { tier: 0, name: "concrete" },
  "number-rod": { tier: 0, name: "concrete" },
  "dot-pattern": { tier: 1, name: "semi-concrete" },
  "ten-frame": { tier: 1, name: "semi-concrete" },
  rekenrek: { tier: 1, name: "semi-concrete" },
  tally: { tier: 2, name: "semi-abstract" },
  "number-line": { tier: 2, name: "semi-abstract" },
  numeral: { tier: 3, name: "abstract" },
};

/**
 * Danh sách primitive biểu diễn lượng có hàm vẽ và call site thật trong engine (BR-NRL-06 / BR-ERC-13).
 * Lưu ý: 'finger' thuộc từ vựng đóng nhưng chưa có renderer / call site trong game-engine (hoãn theo L4).
 */
export const ENGINE_SUPPORTED_REPRESENTATIONS: ReadonlySet<string> = new Set([
  "discrete-object",
  "number-rod",
  "rekenrek",
  "ten-frame",
  "dot-pattern",
  "tally",
  "number-line",
  "numeral",
]);

/**
 * Giới hạn giá trị tối đa của từng primitive (BR-NRL-05).
 */
export const REPRESENTATION_MAX_VALUES: Readonly<Record<string, number>> = {
  "dot-pattern": 6,
  "discrete-object": 10,
  "number-rod": 10,
  finger: 10,
  "ten-frame": 20,
  rekenrek: 20,
  tally: 20,
  "number-line": 20,
  numeral: 20,
};

function getDatasetMaxValue(dataset: SkillDataset): number {
  let max = 0;
  for (const item of dataset.items) {
    if (typeof item.value === "number" && item.value > max) {
      max = item.value;
    }
  }
  return max;
}

interface AnnotatedRung {
  readonly rung: number;
  readonly rep: string;
  readonly tier: number;
}

function checkAgeCeiling(
  rep: string,
  tier: number,
  tierName: string,
  rungNumber: number,
  skillCode: string,
  identity?: SkillIdentity
): NumeracyLadderViolation[] {
  const violations: NumeracyLadderViolation[] = [];
  if (!identity) {
    return violations;
  }

  const isBand34 =
    identity.age_max <= 3 || (identity.age_min <= 3 && identity.age_max <= 4);
  const isBand45 = identity.age_max === 4;

  if (isBand34 && tier > 0) {
    violations.push({
      skill_code: skillCode,
      rung: rungNumber,
      rule: "BR-NRL-03",
      representation: rep,
      message: `${rep} là ${tierName}, ngoài trần của band 3-4`,
    });
  } else if (isBand45 && tier > 1) {
    const isDatTally = rep === "tally" && identity.strand_code === "C1.DAT";
    if (!isDatTally) {
      violations.push({
        skill_code: skillCode,
        rung: rungNumber,
        rule: "BR-NRL-03",
        representation: rep,
        message: `${rep} là ${tierName}, ngoài trần của band 4-5`,
      });
    }
  }

  if (identity.age_max < 5 && rep === "numeral") {
    violations.push({
      skill_code: skillCode,
      rung: rungNumber,
      rule: "BR-NRL-04",
      representation: rep,
      message: `bậc ${rungNumber} không có biểu diễn lượng kèm theo`,
    });
  }

  return violations;
}

function checkRangeLimit(
  rep: string,
  rungNumber: number,
  dataset: SkillDataset
): NumeracyLadderViolation | null {
  const maxAllowed = REPRESENTATION_MAX_VALUES[rep];
  if (maxAllowed === undefined) {
    return null;
  }
  const datasetMax = getDatasetMaxValue(dataset);
  if (datasetMax > maxAllowed) {
    return {
      skill_code: dataset.skill_code,
      rung: rungNumber,
      rule: "BR-NRL-05",
      representation: rep,
      message: `${rep} chỉ phủ tới ${maxAllowed}`,
    };
  }
  return null;
}

function formatSkipWord(skipped: number): string {
  if (skipped === 1) {
    return "một tầng";
  }
  if (skipped === 2) {
    return "hai tầng";
  }
  return `${skipped} tầng`;
}

function checkProgression(
  annotated: readonly AnnotatedRung[],
  skillCode: string
): NumeracyLadderViolation[] {
  const violations: NumeracyLadderViolation[] = [];
  for (let i = 0; i < annotated.length - 1; i++) {
    const current = annotated[i];
    const next = annotated[i + 1];
    if (current && next) {
      const diff = next.tier - current.tier;
      if (diff > 1) {
        const skipped = diff - 1;
        const fromName = REPRESENTATION_TIERS[current.rep]?.name ?? current.rep;
        const toName = REPRESENTATION_TIERS[next.rep]?.name ?? next.rep;
        violations.push({
          skill_code: skillCode,
          rung: next.rung,
          rule: "BR-NRL-02",
          representation: next.rep,
          message: `bước nhảy từ ${fromName} sang ${toName} bỏ qua ${formatSkipWord(skipped)}`,
        });
      }
    }
  }
  return violations;
}

/**
 * Kiểm tra các luật của một dataset C1 đã tham gia ladder.
 */
export function validateDatasetLadder(
  dataset: SkillDataset,
  identity?: SkillIdentity
): NumeracyLadderViolation[] {
  const violations: NumeracyLadderViolation[] = [];
  const ladder = dataset.ladder;

  if (!ladder || ladder.length === 0) {
    return violations;
  }

  const missingRungs: number[] = [];
  const annotatedRungs: AnnotatedRung[] = [];

  for (const item of ladder) {
    if (!item.representation) {
      missingRungs.push(item.rung);
      continue;
    }

    const rep = item.representation;
    const tierInfo = REPRESENTATION_TIERS[rep];

    if (!tierInfo) {
      violations.push({
        skill_code: dataset.skill_code,
        rung: item.rung,
        rule: "BR-NRL-01",
        representation: rep,
        message: `Khai representation '${rep}' không thuộc từ vựng đóng c1-quantity-rep hoặc numeral`,
      });
      continue;
    }

    if (!ENGINE_SUPPORTED_REPRESENTATIONS.has(rep)) {
      violations.push({
        skill_code: dataset.skill_code,
        rung: item.rung,
        rule: "BR-NRL-06",
        representation: rep,
        message: `${rep} chưa có call site trong tầng engine`,
      });
    }

    violations.push(
      ...checkAgeCeiling(
        rep,
        tierInfo.tier,
        tierInfo.name,
        item.rung,
        dataset.skill_code,
        identity
      )
    );

    const rangeErr = checkRangeLimit(rep, item.rung, dataset);
    if (rangeErr) {
      violations.push(rangeErr);
    }

    annotatedRungs.push({
      rung: item.rung,
      rep,
      tier: tierInfo.tier,
    });
  }

  if (annotatedRungs.length > 0 && missingRungs.length > 0) {
    for (const rung of missingRungs) {
      violations.push({
        skill_code: dataset.skill_code,
        rung,
        rule: "BR-NRL-01",
        message: `dataset của ${dataset.skill_code} có bậc ${rung} không có trường representation`,
      });
    }
  }

  violations.push(...checkProgression(annotatedRungs, dataset.skill_code));

  return violations;
}

export interface NumeracyLadderReport {
  readonly totalC1Skills: number;
  readonly annotatedSkills: number;
  readonly unannotatedSkills: readonly string[];
  readonly violations: readonly NumeracyLadderViolation[];
}

export function readBaseline(filePath = BASELINE_PATH): NumeracyLadderBaseline {
  if (!existsSync(filePath)) {
    return {
      max_unannotated_skills: 93,
      unannotated_skills: [],
      note: "Nợ khai representation cho ladder C1",
    };
  }
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as NumeracyLadderBaseline;
}

export function writeBaseline(
  data: NumeracyLadderBaseline,
  filePath = BASELINE_PATH
): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function validateAllNumeracyLadders(
  datasets: Record<string, SkillDataset>,
  identities: Record<string, SkillIdentity>,
  baseline: NumeracyLadderBaseline
): NumeracyLadderReport {
  const violations: NumeracyLadderViolation[] = [];
  const unannotatedSkills: string[] = [];
  let annotatedSkills = 0;
  let totalC1Skills = 0;

  const baselineAllowed = new Set(baseline.unannotated_skills);

  for (const [code, dataset] of Object.entries(datasets)) {
    const identity = identities[code];
    const isC1 = code.startsWith("C1.") || identity?.competency_code === "C1";
    if (!isC1) {
      continue;
    }

    totalC1Skills++;

    const hasAnyRep = dataset.ladder.some((rung) =>
      Boolean(rung.representation)
    );

    if (!hasAnyRep) {
      unannotatedSkills.push(code);
      if (
        !baselineAllowed.has(code) &&
        baseline.unannotated_skills.length > 0
      ) {
        violations.push({
          skill_code: code,
          rung: 1,
          rule: "BR-NRL-01",
          message: `dataset của ${code} có một bậc ladder không có trường representation`,
        });
      }
      continue;
    }

    annotatedSkills++;
    violations.push(...validateDatasetLadder(dataset, identity));
  }

  return {
    totalC1Skills,
    annotatedSkills,
    unannotatedSkills: unannotatedSkills.sort(),
    violations,
  };
}

function runCli(): void {
  const isUpdate = process.argv.includes("--update");
  const baseline = readBaseline();

  console.log(
    "=== CỔNG NUMERACY REPRESENTATION LADDER (Task #268 / BR-NRL) ==="
  );
  const report = validateAllNumeracyLadders(
    SKILL_DATASETS,
    SKILL_IDENTITIES,
    baseline
  );

  console.log(`- Tổng số kỹ năng C1: ${report.totalC1Skills}`);
  console.log(`- Đã gắn representation: ${report.annotatedSkills}`);
  console.log(`- Chưa gắn (nợ baseline): ${report.unannotatedSkills.length}`);
  console.log(
    `- Trần nợ baseline hiện tại: ${baseline.max_unannotated_skills}`
  );

  if (isUpdate) {
    if (report.unannotatedSkills.length > baseline.max_unannotated_skills) {
      console.error(
        `❌ TỪ CHỐI CẬP NHẬT: Nợ tăng từ ${baseline.max_unannotated_skills} lên ${report.unannotatedSkills.length}. Nợ chỉ được giảm!`
      );
      process.exit(1);
    }
    const newBaseline: NumeracyLadderBaseline = {
      max_unannotated_skills: report.unannotatedSkills.length,
      unannotated_skills: report.unannotatedSkills,
      note: "Nợ khai representation cho ladder C1. Nợ chỉ được GIẢM khi mở rộng primitive.",
    };
    writeBaseline(newBaseline);
    console.log(
      `✅ Đã cập nhật baseline: max_unannotated_skills = ${newBaseline.max_unannotated_skills}`
    );
    process.exit(0);
  }

  if (report.unannotatedSkills.length > baseline.max_unannotated_skills) {
    console.error(
      `❌ VI PHẠM RATCHET: Số kỹ năng C1 chưa gắn representation (${report.unannotatedSkills.length}) vượt trần baseline (${baseline.max_unannotated_skills})!`
    );
    process.exit(1);
  }

  if (report.violations.length > 0) {
    console.error(`❌ Phát hiện ${report.violations.length} vi phạm:`);
    for (const v of report.violations) {
      console.error(
        `  - [${v.rule}] ${v.skill_code} (bậc ${v.rung}): ${v.message}`
      );
    }
    process.exit(1);
  }

  console.log("✅ Cổng Numeracy Ladder XANH: 0 vi phạm.");
}

// Chạy trực tiếp nếu là CLI entrypoint
if (process.argv[1]?.endsWith("check-numeracy-ladder.ts")) {
  try {
    runCli();
  } catch (err: unknown) {
    console.error("Lỗi thực thi cổng:", err);
    process.exit(1);
  }
}
