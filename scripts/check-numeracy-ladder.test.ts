/**
 * Unit test cho cổng check-numeracy-ladder (Task #268 / BR-NRL-01..06 / BR-ERC-13).
 *
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import type { SkillDataset, SkillIdentity } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { validateDatasetLadder } from "./check-numeracy-ladder.js";

function createMockIdentity(
  overrides: Partial<SkillIdentity> = {}
): SkillIdentity {
  return {
    code: "C1.TEST.01",
    strand_code: "C1.TEST",
    competency_code: "C1",
    name: "Kỹ năng thử nghiệm",
    age_min: 5,
    age_max: 6,
    difficulty: 2,
    thinking_processes: ["count"],
    tier: "basic",
    prerequisites: [],
    ...overrides,
  };
}

function createMockDataset(
  overrides: Partial<SkillDataset> = {}
): SkillDataset {
  return {
    skill_code: "C1.TEST.01",
    concept_label: "Kỹ năng thử nghiệm",
    surface: "game",
    items: [
      { id: "item_1", label: "một", value: 1 },
      { id: "item_2", label: "hai", value: 2 },
    ],
    ladder: [
      {
        rung: 1,
        dimension: "range",
        description: "Bậc 1",
        representation: "discrete-object",
      },
      {
        rung: 2,
        dimension: "range",
        description: "Bậc 2",
        representation: "ten-frame",
      },
    ],
    phrasing: {
      prompt_template: "Bé chọn đáp án đúng nhé",
    },
    ...overrides,
  };
}

describe("check-numeracy-ladder", () => {
  it("BR-NRL-01: Ca âm — Bậc ladder không có representation khi các bậc khác đã khai", () => {
    const dataset = createMockDataset({
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "discrete-object",
        },
        {
          rung: 2,
          dimension: "range",
          description: "Bậc 2",
          // representation bị thiếu
        },
      ],
    });
    const identity = createMockIdentity();
    const violations = validateDatasetLadder(dataset, identity);

    expect(violations.some((v) => v.rule === "BR-NRL-01" && v.rung === 2)).toBe(
      true
    );
    expect(violations[0]?.message).toContain("không có trường representation");
  });

  it("BR-NRL-01: Ca âm — Khai representation không thuộc từ vựng đóng", () => {
    const dataset = createMockDataset({
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          // @ts-expect-error test ca âm
          representation: "alien-symbol",
        },
      ],
    });
    const identity = createMockIdentity();
    const violations = validateDatasetLadder(dataset, identity);

    expect(violations.some((v) => v.rule === "BR-NRL-01")).toBe(true);
    expect(violations[0]?.message).toContain("không thuộc từ vựng đóng");
  });

  it("BR-NRL-02: Ca âm — Nhảy hai tầng giữa hai bậc liền kề (concrete -> abstract)", () => {
    const dataset = createMockDataset({
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "discrete-object", // tier 0: concrete
        },
        {
          rung: 2,
          dimension: "range",
          description: "Bậc 2",
          representation: "numeral", // tier 3: abstract (nhảy 3 - 0 = 3, bỏ qua 2 tầng)
        },
      ],
    });
    const identity = createMockIdentity({ age_min: 5, age_max: 6 });
    const violations = validateDatasetLadder(dataset, identity);

    const v02 = violations.find((v) => v.rule === "BR-NRL-02");
    expect(v02).toBeDefined();
    expect(v02?.message).toContain(
      "bước nhảy từ concrete sang abstract bỏ qua hai tầng"
    );
  });

  it("BR-NRL-03: Ca âm — Dùng ten-frame ở band 3-4", () => {
    const dataset = createMockDataset({
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "ten-frame",
        },
      ],
    });
    const identity = createMockIdentity({ age_min: 3, age_max: 4 });
    const violations = validateDatasetLadder(dataset, identity);

    const v03 = violations.find((v) => v.rule === "BR-NRL-03");
    expect(v03).toBeDefined();
    expect(v03?.message).toContain(
      "ten-frame là semi-concrete, ngoài trần của band 3-4"
    );
  });

  it("BR-NRL-04: Ca âm — Ký hiệu số (numeral) đứng một mình dưới 5 tuổi", () => {
    const dataset = createMockDataset({
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "numeral",
        },
      ],
    });
    const identity = createMockIdentity({ age_min: 4, age_max: 4 });
    const violations = validateDatasetLadder(dataset, identity);

    const v04 = violations.find((v) => v.rule === "BR-NRL-04");
    expect(v04).toBeDefined();
    expect(v04?.message).toContain("không có biểu diễn lượng kèm theo");
  });

  it("BR-NRL-05: Ca âm — dot-pattern vượt khoảng tối đa (dạy số > 6)", () => {
    const dataset = createMockDataset({
      items: [{ id: "item_10", label: "mười", value: 10 }],
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "dot-pattern",
        },
      ],
    });
    const identity = createMockIdentity({ age_min: 4, age_max: 5 });
    const violations = validateDatasetLadder(dataset, identity);

    const v05 = violations.find((v) => v.rule === "BR-NRL-05");
    expect(v05).toBeDefined();
    expect(v05?.message).toContain("dot-pattern chỉ phủ tới 6");
  });

  it("BR-NRL-06 / BR-ERC-13: Ca âm — Khai representation 'finger' chưa có call site trong engine", () => {
    const dataset = createMockDataset({
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "finger",
        },
      ],
    });
    const identity = createMockIdentity();
    const violations = validateDatasetLadder(dataset, identity);

    const v06 = violations.find((v) => v.rule === "BR-NRL-06");
    expect(v06).toBeDefined();
    expect(v06?.message).toContain(
      "finger chưa có call site trong tầng engine"
    );
  });

  it("Ca dương: Thang CPA hợp lệ (concrete -> semi-concrete -> semi-abstract) hoàn toàn hợp thức", () => {
    const dataset = createMockDataset({
      items: [
        { id: "n1", label: "một", value: 1 },
        { id: "n5", label: "năm", value: 5 },
      ],
      ladder: [
        {
          rung: 1,
          dimension: "range",
          description: "Bậc 1",
          representation: "discrete-object", // concrete (0)
        },
        {
          rung: 2,
          dimension: "range",
          description: "Bậc 2",
          representation: "ten-frame", // semi-concrete (1)
        },
        {
          rung: 3,
          dimension: "range",
          description: "Bậc 3",
          representation: "number-line", // semi-abstract (2)
        },
      ],
    });
    const identity = createMockIdentity({ age_min: 5, age_max: 6 });
    const violations = validateDatasetLadder(dataset, identity);

    expect(violations).toHaveLength(0);
  });
});
