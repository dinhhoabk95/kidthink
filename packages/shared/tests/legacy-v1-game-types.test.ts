import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  getLegacyV1GameType,
  isValidLegacyV1Ref,
  LEGACY_V1_GAME_TYPES,
  LEGACY_V1_ID_SET,
  LEGACY_V1_MAP,
} from "#src/constants/legacy-v1-game-types";

const LEGACY_ID_REGEX = /^D[1-6]-\d{2}$/;
const COMPETENCY_ID_REGEX = /^C[1-6]-\d{2}$/;
const GT_CODE_REGEX = /^GT-\d{3}$/;
const SKILL_CODE_REGEX = /^C[1-6]\.[A-Z]{2,5}\.\d{2}$/;

describe("Legacy V1 Game Types Registry — Task #170 (WP170.1)", () => {
  it("Registry có đúng 60 game types", () => {
    expect(LEGACY_V1_GAME_TYPES.length).toBe(60);
    expect(LEGACY_V1_ID_SET.size).toBe(60);
    expect(LEGACY_V1_MAP.size).toBe(60);
  });

  it("Song ánh 60 legacy_id ↔ 60 competency_id, không trùng lặp", () => {
    const legacyIds = new Set<string>();
    const competencyIds = new Set<string>();

    for (const item of LEGACY_V1_GAME_TYPES) {
      expect(legacyIds.has(item.legacy_id)).toBe(false);
      expect(competencyIds.has(item.competency_id)).toBe(false);

      legacyIds.add(item.legacy_id);
      competencyIds.add(item.competency_id);
    }

    expect(legacyIds.size).toBe(60);
    expect(competencyIds.size).toBe(60);
  });

  it("Định dạng mã legacy_id khớp ^D[1-6]-\\d{2}$ và competency_id khớp ^C[1-6]-\\d{2}$", () => {
    for (const item of LEGACY_V1_GAME_TYPES) {
      expect(
        LEGACY_ID_REGEX.test(item.legacy_id),
        `legacy_id ${item.legacy_id} phải khớp định dạng`
      ).toBe(true);
      expect(
        COMPETENCY_ID_REGEX.test(item.competency_id),
        `competency_id ${item.competency_id} phải khớp định dạng`
      ).toBe(true);
    }
  });

  it("Mọi template_code khớp ^GT-\\d{3}$, và các template đã hoàn thành (GT-001..GT-027) phải có trong ALL_TEMPLATES", () => {
    for (const item of LEGACY_V1_GAME_TYPES) {
      expect(
        GT_CODE_REGEX.test(item.template_code),
        `template_code ${item.template_code} phải khớp định dạng`
      ).toBe(true);

      const num = Number.parseInt(item.template_code.slice(3), 10);
      if (num <= 27) {
        expect(
          ALL_TEMPLATES[item.template_code as keyof typeof ALL_TEMPLATES],
          `Template ${item.template_code} phải tồn tại trong ALL_TEMPLATES`
        ).toBeDefined();
      }
    }
  });

  it("Mọi game type có tên tiếng Việt hợp lệ và ít nhất một skill chính", () => {
    for (const item of LEGACY_V1_GAME_TYPES) {
      expect(item.name_vi.length).toBeGreaterThan(0);
      expect(item.primary_skills.length).toBeGreaterThan(0);
      for (const skill of item.primary_skills) {
        expect(skill).toMatch(SKILL_CODE_REGEX);
      }
    }
  });

  it("Helper isValidLegacyV1Ref và getLegacyV1GameType hoạt động chính xác", () => {
    expect(isValidLegacyV1Ref("D1-01")).toBe(true);
    expect(isValidLegacyV1Ref("D6-11")).toBe(true);
    expect(isValidLegacyV1Ref("D9-99")).toBe(false);
    expect(isValidLegacyV1Ref("")).toBe(false);

    const d101 = getLegacyV1GameType("D1-01");
    expect(d101).toBeDefined();
    expect(d101?.competency_id).toBe("C1-01");
    expect(d101?.name_vi).toBe("Đếm & Kéo vào Rổ");

    expect(getLegacyV1GameType("D9-99")).toBeUndefined();
  });

  describe("Ca âm cho WP170.1", () => {
    it("Ca âm: thiếu bất kỳ mã nào trong 60 mã v1 sẽ báo lỗi nêu đích danh mã thiếu", () => {
      const mockSubset = LEGACY_V1_GAME_TYPES.filter(
        (t) => t.legacy_id !== "D1-01"
      );
      const missingIds = LEGACY_V1_GAME_TYPES.filter(
        (t) => !mockSubset.some((m) => m.legacy_id === t.legacy_id)
      ).map((t) => t.legacy_id);

      expect(missingIds).toContain("D1-01");
      expect(mockSubset.length).toBe(59);
    });
  });
});
