import { describe, expect, it } from "vitest";
import { C1_SEED_LEVELS } from "#src/seed-content/c1/levels";
import { C2_SEED_LEVELS } from "#src/seed-content/c2/levels";
import { C3_SEED_LEVELS } from "#src/seed-content/c3/levels";
import { C4_SEED_LEVELS } from "#src/seed-content/c4/levels";
import { C5_SEED_LEVELS } from "#src/seed-content/c5/levels";
import { C6_SEED_LEVELS } from "#src/seed-content/c6/levels";
import {
  checkGateMontessori,
  checkGateMontessoriCorpus,
  checkMontessoriBatchRules,
  checkMontessoriItemRules,
  checkMontessoriQuotas,
  isMontessoriLevel,
} from "#src/seed-content/gates/montessori-gate";
import type { ContentSeed } from "#src/seed-content/types";

describe("Montessori Batch & Quota Gate (BR-MGL-01, BR-MGL-02, BR-MGL-07, BR-MGL-12, BR-MCM-06)", () => {
  it("Negative Case 1: Cổng hạn ngạch báo lỗi khi C1 vượt 36 level (BR-MGL-01)", () => {
    // Tạo 37 level Montessori cho C1
    const levels: ContentSeed[] = Array.from({ length: 37 }, (_, i) => ({
      kind: "game_level",
      header: {
        code: `GL-C1-CNT-CARD-${String(101 + i).padStart(4, "0")}`,
        content_version: 1,
        template_code: "GT-001",
        title: `Bài đếm ${i + 1}`,
        instruction: "Bé chọn số đúng",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free",
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1-CNT-01-01"],
        what_tags: ["numbers"],
        thinking_tags: ["count"],
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: { options: [1, 2, 3] },
      difficulty_params: { itemCount: 3 },
    }));

    const issues = checkMontessoriQuotas(levels);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.code).toBe("MONTESSORI_QUOTA_EXCEEDED");
    expect(issues[0]?.message).toContain("C1");
    expect(issues[0]?.message).toContain("37 > 36");
  });

  it("Negative Case 2: Cổng tier báo lỗi khi difficulty 1 khai access_tier premium (BR-MGL-12, D-RR)", () => {
    const invalidSeed: ContentSeed = {
      kind: "game_level",
      header: {
        code: "GL-C1-CNT-CARD-0101",
        content_version: 1,
        template_code: "GT-001",
        title: "Bài tập Montessori số 1",
        instruction: "Chạm vào số đúng",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "premium", // SAI: diff 1 phải là free
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1-CNT-01-01"],
        what_tags: ["numbers"],
        thinking_tags: ["count"],
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {},
      difficulty_params: {},
    };

    const issues = checkMontessoriItemRules(invalidSeed, "SEED-MONT-A01");
    expect(
      issues.some((i) => i.code === "MONTESSORI_TIER_DIFFICULTY_MISMATCH")
    ).toBe(true);
  });

  it("Negative Case 3: Cổng mã báo lỗi khi số thứ tự < 0101 (BR-MGL-02)", () => {
    const invalidSeed: ContentSeed = {
      kind: "game_level",
      header: {
        code: "GL-C1-CNT-CARD-0005", // SAI: đụng dải 0001..0020 cũ, phải >= 0101
        content_version: 1,
        template_code: "GT-001",
        title: "Bài tập Montessori số 1",
        instruction: "Chạm vào số đúng",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free",
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1-CNT-01-01"],
        what_tags: ["numbers"],
        thinking_tags: ["count"],
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {},
      difficulty_params: {},
    };

    const issues = checkMontessoriItemRules(invalidSeed, "SEED-MONT-A01");
    expect(
      issues.some((i) => i.code === "MONTESSORI_CODE_SEQUENCE_INVALID")
    ).toBe(true);
  });

  it("Negative Case 4: Cổng batch báo lỗi khi 1 batch trộn nhiều workbook (BR-MGL-07)", () => {
    const mixedSeeds: ContentSeed[] = [
      {
        kind: "game_level",
        header: {
          code: "GL-C1-CNT-CARD-0101",
          content_version: 1,
          template_code: "GT-001",
          title: "Bài WB01",
          instruction: "Đếm",
          age_min: 3,
          age_max: 4,
          difficulty: 1,
          access_tier: "free",
          skill_codes: ["C1.CNT.01"],
          learning_objective_codes: ["LO-C1-CNT-01-01"],
          what_tags: ["wb01"],
          thinking_tags: ["count"],
          origin: "human",
          authored_in: "repo_seed",
        },
        content_pack: {},
        difficulty_params: {},
      },
      {
        kind: "game_level",
        header: {
          code: "GL-C1-CNT-CARD-0102",
          content_version: 1,
          template_code: "GT-001",
          title: "Bài WB02",
          instruction: "Đếm",
          age_min: 3,
          age_max: 4,
          difficulty: 1,
          access_tier: "free",
          skill_codes: ["C1.CNT.01"],
          learning_objective_codes: ["LO-C1-CNT-01-01"],
          what_tags: ["wb02"], // Trộn WB02 vào batch A01
          thinking_tags: ["count"],
          origin: "human",
          authored_in: "repo_seed",
        },
        content_pack: {},
        difficulty_params: {},
      },
    ];

    const issues = checkMontessoriBatchRules(mixedSeeds, "SEED-MONT-A01");
    expect(
      issues.some((i) => i.code === "MONTESSORI_BATCH_WORKBOOK_MIXED")
    ).toBe(true);
  });

  it("Negative Case 5: Cổng an toàn chặn tên bài test thương mại & IQ claim (BR-MCM-06)", () => {
    const commercialSeed: ContentSeed = {
      kind: "game_level",
      header: {
        code: "GL-C3-MTX-CARD-0101",
        content_version: 1,
        template_code: "GT-001",
        title: "Bài test Raven Progressive Matrices kiểm tra IQ trẻ",
        instruction: "Chọn hình đúng",
        age_min: 5,
        age_max: 6,
        difficulty: 3,
        access_tier: "standard",
        skill_codes: ["C3.MTX.01"],
        learning_objective_codes: ["LO-C3-MTX-01-01"],
        what_tags: ["shapes"],
        thinking_tags: ["pattern"],
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: {},
      difficulty_params: {},
    };

    const issues = checkMontessoriItemRules(commercialSeed, "SEED-MONT-A21");
    expect(
      issues.some((i) => i.code === "MONTESSORI_COMMERCIAL_TEST_BLOCKED")
    ).toBe(true);
  });

  it("Positive Case: Seed hợp lệ của Lô Montessori vượt qua cổng", () => {
    const validSeed: ContentSeed = {
      kind: "game_level",
      header: {
        code: "GL-C1-NREC-CARD-0101",
        content_version: 1,
        template_code: "GT-001",
        title: "Nhận biết số 1 trong phạm vi 10",
        instruction: "Bé hãy chạm vào số 1 nhé!",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free",
        skill_codes: ["C1.NREC.01"],
        learning_objective_codes: ["LO-C1-NREC-01-01"],
        what_tags: ["numbers"],
        thinking_tags: ["identify"],
        origin: "human",
        authored_in: "repo_seed",
      },
      content_pack: { target: 1, options: [1, 5, 8] },
      difficulty_params: { count: 3 },
    };

    const result = checkGateMontessori(validSeed, "SEED-MONT-A01");
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});

describe("Cổng corpus lô Montessori (BR-MGL-01, BR-MGL-02)", () => {
  const ALL_LEVELS = [
    ...C1_SEED_LEVELS,
    ...C2_SEED_LEVELS,
    ...C3_SEED_LEVELS,
    ...C4_SEED_LEVELS,
    ...C5_SEED_LEVELS,
    ...C6_SEED_LEVELS,
  ];

  it("nhận đúng level Montessori theo sàn số thứ tự 0101, không nhận level nền", () => {
    const montessori = ALL_LEVELS.filter(isMontessoriLevel);
    const base = ALL_LEVELS.filter((lvl) => !isMontessoriLevel(lvl));

    expect(montessori.length).toBeGreaterThan(0);
    for (const lvl of montessori) {
      const seq = Number.parseInt(lvl.header.code.split("-").at(-1) ?? "", 10);
      expect(seq).toBeGreaterThanOrEqual(101);
    }
    for (const lvl of base) {
      const seq = Number.parseInt(lvl.header.code.split("-").at(-1) ?? "", 10);
      expect(seq).toBeLessThan(101);
    }
  });

  it("không đỏ giả trên riêng lô level nền", () => {
    const base = ALL_LEVELS.filter((lvl) => !isMontessoriLevel(lvl));
    const result = checkGateMontessoriCorpus(base);

    expect(result.passed).toBe(true);
  });

  it("lô Montessori thật không vượt hạn ngạch competency nào (BR-MGL-01)", () => {
    const result = checkGateMontessoriCorpus(ALL_LEVELS);

    expect(result.issues).toEqual([]);
    expect(result.passed).toBe(true);
  });
});
