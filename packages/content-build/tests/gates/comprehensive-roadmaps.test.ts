import {
  ALL_ROADMAPS,
  COMPREHENSIVE_ROADMAPS,
  SKILL_IDENTITIES,
} from "@mindkid/content";
import { STRANDS } from "@mindkid/taxonomy";
import { describe, expect, it } from "vitest";
import { SHIPPABLE_SEED_LEVELS } from "#src/catalog";
import { loadContentDemandLedger } from "#src/gates/content-demand-file";
import { evaluateAuthoredRoadmaps } from "#src/gates/roadmap-seed-runner";

const FORBIDDEN_CLAIMS = [
  "thông minh hơn",
  "tăng iq",
  "vượt trội",
  "giỏi hơn",
  "thiên tài",
  "phát triển não bộ",
  "dạy trước chương trình",
  "không thua kém",
  "chắc chắn đỗ",
  "cam kết thành tài",
  "trở thành thiên tài",
  "đạt điểm 10",
  "giỏi nhất lớp",
] as const;

describe("Dòng chương trình Toàn diện / Chuyên sâu (BR-CMP-01..08)", () => {
  it("BR-CMP-01: hợp 24 lộ trình trong ALL_ROADMAPS phủ trọn 76/76 strands (0 strand bị bỏ rơi)", () => {
    const coveredStrands = new Set<string>();
    for (const roadmap of ALL_ROADMAPS) {
      for (const week of roadmap.weeks) {
        for (const session of week.sessions) {
          const skill = SKILL_IDENTITIES[session.skill_code];
          expect(
            skill,
            `Mã kỹ năng không tồn tại: ${session.skill_code}`
          ).toBeDefined();
          if (skill) {
            coveredStrands.add(skill.strand_code);
          }
        }
      }
    }

    const missingStrands = STRANDS.map((s) => s.code).filter(
      (code) => !coveredStrands.has(code)
    );
    expect(missingStrands).toEqual([]);
    expect(coveredStrands.size).toBe(STRANDS.length);
  });

  it("BR-CMP-02 & BR-CMP-03: COMPREHENSIVE_ROADMAPS gồm đúng 9 lộ trình (3 khoá 36w premium + 6 khoá 12w standard, nhịp 5 buổi/tuần) và đạt 100% cổng sư phạm", () => {
    expect(COMPREHENSIVE_ROADMAPS).toHaveLength(9);

    const yearRoadmaps = COMPREHENSIVE_ROADMAPS.filter(
      (r) => r.duration_weeks === 36
    );
    const shortRoadmaps = COMPREHENSIVE_ROADMAPS.filter(
      (r) => r.duration_weeks === 12
    );
    expect(yearRoadmaps).toHaveLength(3);
    expect(shortRoadmaps).toHaveLength(6);

    for (const rm of yearRoadmaps) {
      expect(rm.sessions_per_week).toBe(5);
      expect(rm.access_tier).toBe("premium");
    }
    for (const rm of shortRoadmaps) {
      expect(rm.sessions_per_week).toBe(5);
      expect(rm.access_tier).toBe("standard");
    }

    const rows = evaluateAuthoredRoadmaps();
    for (const rm of COMPREHENSIVE_ROADMAPS) {
      const row = rows.find((r) => r.program_code === rm.code);
      expect(row).toBeDefined();
      expect(row?.passed).toBe(true);
      expect(row?.violations).toEqual([]);
      expect(row?.competencies_covered).toBe(6);
      expect(row?.max_share).toBeLessThanOrEqual(0.4);
      expect(row?.unreviewed_skills).toBe(0);
      expect(row?.late_new_skills).toBe(0);
    }
  });

  it("BR-CMP-04 & BR-CMP-07: sổ cầu đạt 0 nợ trên cả 24 lộ trình và 6 khoá standard mới không chứa bất kỳ item premium nào", () => {
    const ledger = loadContentDemandLedger();
    expect(ledger.summary).toHaveLength(ALL_ROADMAPS.length);

    for (const summaryRow of ledger.summary) {
      expect(summaryRow.debt_cells).toBe(0);
      expect(summaryRow.filled_cells).toBe(summaryRow.cells);
    }

    const levelByCode = new Map(
      SHIPPABLE_SEED_LEVELS.map((lvl) => [lvl.header.code, lvl])
    );
    const newStdCodes = new Set(
      COMPREHENSIVE_ROADMAPS.filter((r) => r.access_tier === "standard").map(
        (r) => r.code
      )
    );

    for (const cell of ledger.cells) {
      if (!newStdCodes.has(cell.roadmap_code)) {
        continue;
      }
      for (const contentCode of cell.filled_by) {
        const lvl = levelByCode.get(contentCode);
        expect(lvl, `Thiếu level ${contentCode}`).toBeDefined();
        expect(
          lvl?.header.access_tier,
          `Khoá standard ${cell.roadmap_code} bị lọt item premium ${contentCode}`
        ).not.toBe("premium");
      }
    }
  });

  it("BR-CMP-05 & BR-CMP-08: nhóm cảm quan/hội thoại đi qua introduce + offscreen, ngôn ngữ mô tả không hứa hẹn thành tựu", () => {
    const specialStrands = new Set(["C4.TAC", "C5.DES", "C5.PRA"]);
    const seenOffscreenSpecial = new Set<string>();

    for (const rm of COMPREHENSIVE_ROADMAPS) {
      const fullText = [
        rm.title,
        rm.description,
        ...rm.weeks.map((w) => w.goal),
      ]
        .join(" ")
        .toLowerCase();

      for (const claim of FORBIDDEN_CLAIMS) {
        expect(fullText).not.toContain(claim);
      }

      for (const w of rm.weeks) {
        for (const s of w.sessions) {
          const st = s.skill_code.split(".").slice(0, 2).join(".");
          if (specialStrands.has(st) && s.role === "offscreen") {
            seenOffscreenSpecial.add(st);
          }
        }
      }
    }

    expect([...seenOffscreenSpecial].sort()).toEqual([
      "C4.TAC",
      "C5.DES",
      "C5.PRA",
    ]);
  });
});
