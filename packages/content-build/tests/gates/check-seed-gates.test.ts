import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  evaluateSeedGates,
  formatSeedGatesReport,
  readSeedGatesBaseline,
} from "#src/cli/check-seed-gates";
import { runEightGates } from "#src/gates/runner";
import type { ContentSeed, GateResult } from "#src/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Cổng thẩm định seed gates runner (Task #271 LA)", () => {
  it("toàn bộ ALL_SEED_LEVELS hiện tại đạt chuẩn (hoặc khớp baseline)", () => {
    const baseline = readSeedGatesBaseline();
    const report = evaluateSeedGates();

    expect(report.gate9Issues.length).toBeLessThanOrEqual(
      baseline.maxGate9Violations
    );
    const totalViolations =
      report.gate9Issues.length + report.otherIssues.length;
    expect(totalViolations).toBeLessThanOrEqual(baseline.maxTotalViolations);
  });

  describe("Ca âm Cổng 9 (TA.5)", () => {
    it("cổng đỏ và nêu đúng mã level và mã kỹ năng khi level không hiển thị bất kỳ glyph nào", () => {
      const skillCode = "C1.NREC.02";
      const levelCode = "GL-C1-TEST-NOGLYPH-01";

      const dataset: SkillDataset = {
        skill_code: skillCode,
        concept_label: "Số 0 đến 5",
        surface: "game",
        items: [
          { id: "n1", label: "một", glyph: "1" },
          { id: "n2", label: "hai", glyph: "2" },
        ],
        ladder: [],
        phrasing: { prompt_template: "Bé chọn số {label}" },
      };

      const seedWithoutGlyph: ContentSeed = {
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: levelCode,
          skill_codes: [skillCode],
        },
        content_pack: {
          prompt: "Bé bấm vào chú thỏ dễ thương",
          options: [
            { item_id: "rabbit", asset: { kind: "emoji", ref: "🐰" } },
            { item_id: "carrot", asset: { kind: "emoji", ref: "🥕" } },
          ],
        },
      };

      const results: GateResult[] = runEightGates(
        seedWithoutGlyph,
        new Set<string>(),
        undefined,
        undefined,
        dataset
      );

      const gate9 = results.find((g) => g.gate === 9);
      expect(gate9).toBeDefined();
      expect(gate9?.passed).toBe(false);

      const issue = gate9?.issues.find(
        (i) => i.code === "CONCEPT_GLYPH_MISSING"
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain(skillCode);
      expect(issue?.message).toContain(levelCode);
    });

    it("formatSeedGatesReport in ra đúng dòng cảnh báo khi có vi phạm Gate 9", () => {
      const report = {
        totalLevels: 10,
        passedLevels: 9,
        failedLevels: 1,
        gateStats: {
          9: { name: "Khái niệm hiện ra", failCount: 1 },
        },
        gate9Issues: [
          {
            levelCode: "GL-C1-SAMPLE-01",
            skillCode: "C1.NREC.01",
            issue: {
              code: "CONCEPT_GLYPH_MISSING",
              message:
                "[BR-SDS-03] Dataset kỹ năng C1.NREC.01 có glyph nhưng level GL-C1-SAMPLE-01 không hiển thị",
            },
          },
        ],
        otherIssues: [],
      };

      const formatted = formatSeedGatesReport(report, {
        maxGate9Violations: 0,
        maxTotalViolations: 0,
      });

      expect(formatted).toContain("GL-C1-SAMPLE-01");
      expect(formatted).toContain("C1.NREC.01");
      expect(formatted).toContain("CONCEPT_GLYPH_MISSING");
      expect(formatted).toContain("Phát hiện vi phạm vượt trần baseline");
    });
  });
});
