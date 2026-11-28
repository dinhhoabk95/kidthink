import { GT016_HINT_AFTER_MS_BY_STEP } from "@mindkid/game-engine/generators";
import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { projectGT016 } from "#src/builders/gt-016";
import {
  STEP_30_WITHOUT_SAME_HOUR_TRAP,
  STEP_60_WITH_HALF_HOUR_OPTION,
} from "./fixtures/gt-016-violating-options";
import { findGT016Violations } from "./helpers/gt-016-rules";

const DATASET: SkillDataset = {
  skill_code: "C1.TEST.CLOCK",
  concept_label: "Đọc đồng hồ",
  surface: "game",
  ladder: [{ rung: 1, dimension: "test", description: "test" }],
  phrasing: { prompt_template: "Bé đọc giờ nhé!" },
  items: [],
};

const SEEDS = Array.from({ length: 80 }, (_, i) => 1000 + i * 7919);
/** Độ khó 1-2 ở bậc minute_step 60, 3+ ở bậc 30 (engine-difficulty-params.json). */
const STEP_60_DIFFICULTIES = [1, 2];
const STEP_30_DIFFICULTIES = [3, 4];

function project(difficulty: number, seed: number) {
  const pack = projectGT016.project(DATASET, {
    band: "5-6",
    difficulty,
    theme: "school",
    seed,
  });
  const content = pack.content_pack as {
    target_time: { hour: number; minute: number };
    options: { hour: number; minute: number; is_correct: boolean }[];
  };
  return { content, params: pack.difficulty_params };
}

describe("GT-016 builder (BR-E016-04)", () => {
  it("bậc 60: mọi phương án phút = 0, hint 9000", () => {
    for (const difficulty of STEP_60_DIFFICULTIES) {
      for (const seed of SEEDS) {
        const { content, params } = project(difficulty, seed);
        expect(findGT016Violations(60, content.options)).toEqual([]);
        expect(params.hint_after_ms).toBe(GT016_HINT_AFTER_MS_BY_STEP[60]);
      }
    }
  });

  it("bậc 30: luôn có bẫy cùng giờ khác phút, hint 12000", () => {
    for (const difficulty of STEP_30_DIFFICULTIES) {
      for (const seed of SEEDS) {
        const { content, params } = project(difficulty, seed);
        expect(findGT016Violations(30, content.options)).toEqual([]);
        expect(params.hint_after_ms).toBe(GT016_HINT_AFTER_MS_BY_STEP[30]);
      }
    }
  });

  it("số phương án khớp distractor_count và giờ nhiễu đổi theo seed", () => {
    const distractorHours = new Set<string>();
    for (const seed of SEEDS) {
      const { content, params } = project(2, seed);
      expect(content.options).toHaveLength(
        (params.distractor_count as number) + 1
      );
      distractorHours.add(
        content.options
          .filter((o) => !o.is_correct)
          .map((o) => o.hour - content.target_time.hour)
          .map((d) => (d + 12) % 12)
          .sort()
          .join(",")
      );
    }
    expect(distractorHours.size).toBeGreaterThan(3);
  });

  it("ca âm: hàm kiểm báo vi phạm trên fixture", () => {
    expect(findGT016Violations(60, STEP_60_WITH_HALF_HOUR_OPTION)).not.toEqual(
      []
    );
    expect(findGT016Violations(30, STEP_30_WITHOUT_SAME_HOUR_TRAP)).not.toEqual(
      []
    );
  });
});
