import type { ThinkingProcess } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  parseTaxonomyDocs,
  validateTaxonomyInvariants,
} from "#src/seed-master/taxonomy/index";

const CANONICAL_TAXONOMY_THINKING_PROCESSES: ReadonlySet<ThinkingProcess> =
  new Set<ThinkingProcess>([
    "observe",
    "compare",
    "sort",
    "match",
    "count",
    "sequence",
    "infer",
    "predict",
    "deduce",
    "solve",
    "verify",
    "create",
    "plan",
    "recall",
    "inhibit",
    "shift",
    "describe",
    "listen",
  ]);

const ERR_INVALID_THINKING_REGEX =
  /BR-TAX-04 violation: Skill .* has invalid thinking process/;

describe("Task #192 — Đóng từ vựng thinking trong taxonomy docs", () => {
  it("toàn bộ skill trong docs/taxonomy đều dùng thinking process chuẩn", () => {
    const skills = parseTaxonomyDocs("../../docs/taxonomy");
    expect(skills.length).toBeGreaterThanOrEqual(408);

    const invalidEntries: Array<{ skill: string; invalid: string[] }> = [];

    for (const skill of skills) {
      const invalid = skill.thinking_processes.filter(
        (tp) =>
          !CANONICAL_TAXONOMY_THINKING_PROCESSES.has(tp as ThinkingProcess)
      );
      if (invalid.length > 0) {
        invalidEntries.push({ skill: skill.code, invalid });
      }
    }

    expect(
      invalidEntries,
      `Phát hiện thinking process ngoài union: ${JSON.stringify(invalidEntries)}`
    ).toHaveLength(0);
  });

  it("mọi thinking process canonical đều có ít nhất một skill sử dụng", () => {
    const skills = parseTaxonomyDocs("../../docs/taxonomy");
    const usedThinking = new Set<string>();
    for (const s of skills) {
      for (const t of s.thinking_processes) {
        usedThinking.add(t);
      }
    }

    for (const canonical of CANONICAL_TAXONOMY_THINKING_PROCESSES) {
      expect(
        usedThinking.has(canonical),
        `Thinking process '${canonical}' chưa được skill nào dùng`
      ).toBe(true);
    }
  });

  it("Ca âm: thêm một giá trị lạ vào thinking_processes làm validateTaxonomyInvariants ném lỗi", () => {
    const skills = parseTaxonomyDocs("../../docs/taxonomy");
    const corruptedSkills = JSON.parse(JSON.stringify(skills));
    corruptedSkills[0].thinking_processes = ["fabricated_alien_thinking"];

    expect(() => validateTaxonomyInvariants(corruptedSkills)).toThrow(
      ERR_INVALID_THINKING_REGEX
    );
  });
});
