import { describe, expect, it } from "vitest";
import {
  computeKogumaPillarDistribution,
  getKogumaDomainByCode,
  getKogumaSiblingTracksForBand,
  getKogumaUnit,
  getKogumaUnitByCode,
  getKogumaUnitByLevelOrSkillCode,
  getKogumaUnitBySkillCode,
  getKogumaUnitSchedule,
  getKogumaUnitsForBand,
  getKogumaUnitsForMoetTheme,
  getKogumaUnitsForPillar,
  getMoetThemeById,
  getMoetThemeForWeek,
  inferKogumaMetaFromTitleOrCode,
  isKogumaProgramCode,
  KOGUMA_100_UNITS,
  KOGUMA_DOMAINS,
  KOGUMA_PILLARS,
  KOGUMA_UNIT_SCHEDULES,
  MOET_PRESCHOOL_THEMES,
  parseKogumaProgramMeta,
  resolveKogumaUnitSummaryForItem,
  toKogumaUnitSummary,
} from "#src/index";

const SCHEDULED_YEAR_RM_RE = /^RM-(3-4|4-5|5-6)-koguma-year-0[12]$/;
const SCHEDULED_CORE_RM_RE = /^RM-(3-4|4-5|5-6)-koguma-0[12]$/;

describe("Koguma 100-unit & MOET 10-theme catalog (@mindkid/taxonomy)", () => {
  it("exports exactly 100 ordered units KGM-001..KGM-100 across 3 bands (28/34/38) with exact roadmap + week schedules", () => {
    expect(KOGUMA_100_UNITS).toHaveLength(100);
    expect(Object.keys(KOGUMA_UNIT_SCHEDULES)).toHaveLength(100);
    expect(KOGUMA_100_UNITS[0]?.code).toBe("KGM-001");
    expect(KOGUMA_100_UNITS[99]?.code).toBe("KGM-100");

    for (let i = 0; i < 100; i++) {
      const expectedCode = `KGM-${String(i + 1).padStart(3, "0")}`;
      const u = KOGUMA_100_UNITS[i];
      expect(u?.unit_code).toBe(expectedCode);
      expect(u?.code).toBe(expectedCode);
      expect(u?.jibutsu_manipulative_vi.length).toBeGreaterThan(5);
      expect(u?.taiwa_parent_prompt_vi.length).toBeGreaterThan(15);
      expect(u?.offscreen_parent_activity["3-4"].length).toBeGreaterThan(15);
      expect(u?.offscreen_parent_activity["4-5"].length).toBeGreaterThan(15);
      expect(u?.offscreen_parent_activity["5-6"].length).toBeGreaterThan(15);

      expect(u?.scheduled_roadmap_code).toMatch(SCHEDULED_YEAR_RM_RE);
      expect(u?.scheduled_roadmap_code).toContain(
        `RM-${u?.age_band}-koguma-year-`
      );
      expect(u?.scheduled_curriculum_code).toBe(
        `CUR-${u?.scheduled_roadmap_code}`
      );
      expect(u?.roadmap_code).toBe(u?.scheduled_roadmap_code);
      expect(u?.scheduled_week_no).toBeGreaterThanOrEqual(1);
      expect(u?.scheduled_week_no).toBeLessThanOrEqual(36);

      if (u?.scheduled_core_roadmap_code === null) {
        expect(u?.scheduled_core_week_no).toBeNull();
      } else {
        expect(u?.scheduled_core_roadmap_code).toMatch(SCHEDULED_CORE_RM_RE);
        expect(u?.scheduled_core_week_no).toBeGreaterThanOrEqual(1);
        expect(u?.scheduled_core_week_no).toBeLessThanOrEqual(12);
      }

      const schedByUnit = getKogumaUnitSchedule(expectedCode);
      expect(schedByUnit?.scheduled_roadmap_code).toBe(
        u?.scheduled_roadmap_code
      );
      expect(schedByUnit?.scheduled_week_no).toBe(u?.scheduled_week_no);

      if (u) {
        const schedBySkill = getKogumaUnitSchedule(
          u.primary_skill_code,
          u.age_band
        );
        expect(schedBySkill?.unit_code).toBe(expectedCode);
      }
    }

    expect(getKogumaUnitsForBand("3-4")).toHaveLength(28);
    expect(getKogumaUnitsForBand("4-5")).toHaveLength(34);
    expect(getKogumaUnitsForBand("5-6")).toHaveLength(38);
  });

  it("matches K1..K5 pillar distribution (20 + 22 + 16 + 18 + 24 = 100)", () => {
    expect(KOGUMA_DOMAINS).toHaveLength(5);
    expect(KOGUMA_PILLARS).toBe(KOGUMA_DOMAINS);

    for (const domain of KOGUMA_DOMAINS) {
      const pillarUnits = getKogumaUnitsForPillar(domain.code);
      expect(pillarUnits).toHaveLength(domain.unit_counts.total);
      expect(getKogumaDomainByCode(domain.code)?.code).toBe(domain.code);
    }
  });

  it("covers all 10 MOET 36-week preschool themes cleanly", () => {
    expect(MOET_PRESCHOOL_THEMES).toHaveLength(10);
    expect(MOET_PRESCHOOL_THEMES[0]?.week_start).toBe(1);
    expect(MOET_PRESCHOOL_THEMES[9]?.week_end).toBe(36);

    for (const theme of MOET_PRESCHOOL_THEMES) {
      expect(getMoetThemeById(theme.id)?.title_vi).toBe(theme.title_vi);
      expect(getKogumaUnitsForMoetTheme(theme.id).length).toBeGreaterThan(0);
    }

    expect(getMoetThemeForWeek(1, 36).id).toBe("mam_non");
    expect(getMoetThemeForWeek(36, 36).id).toBe("tieu_hoc");
    expect(getMoetThemeForWeek(1, 12).id).toBe("mam_non");
  });

  it("resolves units by code, skill code, and GL level code with schedule summary", () => {
    const u1 = getKogumaUnitByCode("kgm-001");
    expect(u1?.title_vi).toContain("To hơn");
    expect(getKogumaUnit("KGM-073")?.primary_skill_code).toBe("C1.NCOMP.09");
    expect(getKogumaUnit("KGM-073")?.scheduled_roadmap_code).toBe(
      "RM-5-6-koguma-year-02"
    );

    const byPrimary = getKogumaUnitBySkillCode("C1.CNT.01", "3-4");
    expect(byPrimary?.code).toBe("KGM-010");

    const bySupport = getKogumaUnitBySkillCode("C1.NREC.01");
    expect(bySupport?.code).toBe("KGM-010");

    const byLevel = getKogumaUnitByLevelOrSkillCode("GL-C1-CNT-01-001", "3-4");
    expect(byLevel?.code).toBe("KGM-010");

    if (u1) {
      const summary = toKogumaUnitSummary(u1, "3-4");
      expect(summary.code).toBe("KGM-001");
      expect(summary.pillar_code).toBe("K1");
      expect(summary.moet_theme_title).toBe("Trường mầm non");
      expect(summary.scheduled_roadmap_code).toBe("RM-3-4-koguma-year-01");
      expect(summary.scheduled_week_no).toBe(1);
    }
  });

  it("parses Koguma program metadata for Stage 1 & Stage 2 RM-* and CUR-RM-* codes", () => {
    expect(isKogumaProgramCode("CUR-RM-3-4-koguma-year-01")).toBe(true);
    expect(isKogumaProgramCode("CUR-RM-3-4-koguma-year-02")).toBe(true);
    expect(isKogumaProgramCode("RM-4-5-koguma-01")).toBe(true);
    expect(isKogumaProgramCode("RM-4-5-koguma-02")).toBe(true);
    expect(isKogumaProgramCode("CUR-RM-3-4-balanced-01")).toBe(false);

    const yearMeta = parseKogumaProgramMeta("CUR-RM-3-4-koguma-year-01");
    expect(yearMeta.is_koguma).toBe(true);
    expect(yearMeta.koguma_track).toBe("year_36w");
    expect(yearMeta.koguma_stage).toBe(1);
    expect(yearMeta.koguma_variant).toBe("year-01");
    expect(yearMeta.age_band).toBe("3-4");
    expect(yearMeta.roadmap_code).toBe("RM-3-4-koguma-year-01");
    expect(yearMeta.curriculum_code).toBe("CUR-RM-3-4-koguma-year-01");
    expect(yearMeta.moet_themes).toHaveLength(10);

    const yearStage2 = parseKogumaProgramMeta("CUR-RM-5-6-koguma-year-02");
    expect(yearStage2.is_koguma).toBe(true);
    expect(yearStage2.koguma_track).toBe("year_36w");
    expect(yearStage2.koguma_stage).toBe(2);
    expect(yearStage2.koguma_variant).toBe("year-02");
    expect(yearStage2.moet_themes).toHaveLength(10);

    const coreMeta = parseKogumaProgramMeta("RM-5-6-koguma-01", 12);
    expect(coreMeta.is_koguma).toBe(true);
    expect(coreMeta.koguma_track).toBe("core_12w");
    expect(coreMeta.koguma_stage).toBe(1);
    expect(coreMeta.koguma_variant).toBe("01");
    expect(coreMeta.age_band).toBe("5-6");
    expect(coreMeta.moet_themes).toHaveLength(6);

    const coreSem2 = parseKogumaProgramMeta("RM-4-5-koguma-02", 12);
    expect(coreSem2.is_koguma).toBe(true);
    expect(coreSem2.koguma_track).toBe("core_12w");
    expect(coreSem2.koguma_stage).toBe(2);
    expect(coreSem2.koguma_variant).toBe("02");
    expect(coreSem2.moet_themes).toHaveLength(6);
    expect(coreSem2.moet_themes[0]?.id).toBe("thuc_vat");

    const siblings = getKogumaSiblingTracksForBand("3-4");
    expect(siblings.map((s) => s.roadmap_code)).toEqual([
      "RM-3-4-koguma-01",
      "RM-3-4-koguma-02",
      "RM-3-4-koguma-year-01",
      "RM-3-4-koguma-year-02",
    ]);

    const stdMeta = parseKogumaProgramMeta("CUR-RM-4-5-balanced-01", 12);
    expect(stdMeta.is_koguma).toBe(false);
    expect(stdMeta.koguma_track).toBeNull();
    expect(stdMeta.koguma_stage).toBeNull();
    expect(stdMeta.koguma_variant).toBeNull();
    expect(stdMeta.moet_themes).toHaveLength(0);
  });

  it("computes item summaries, K1..K5 pillar shares, and title-based inference", () => {
    const summary = resolveKogumaUnitSummaryForItem({
      skillCodes: ["C1.NCOMP.09"],
      levelCode: "GL-C1-NCOMP-09-001",
      preferredBand: "5-6",
    });
    expect(summary?.code).toBe("KGM-073");
    expect(summary?.pillar_code).toBe("K2");
    expect(summary?.scheduled_roadmap_code).toBe("RM-5-6-koguma-year-02");

    const dist = computeKogumaPillarDistribution([summary]);
    expect(dist).toHaveLength(5);
    expect(dist.find((d) => d.code === "K2")?.share).toBe(1);

    const inferred = inferKogumaMetaFromTitleOrCode({
      title: "Bản sao - Tư duy Koguma Mầm 3–4 tuổi",
      durationWeeks: 36,
      ageMin: 3,
    });
    expect(inferred.is_koguma).toBe(true);
    expect(inferred.koguma_track).toBe("year_36w");
  });
});
