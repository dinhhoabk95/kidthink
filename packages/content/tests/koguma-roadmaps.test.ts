import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { CONTENT_THEMES } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  ALL_ROADMAPS,
  getKogumaUnit,
  getKogumaUnitBySkillCode,
  getKogumaUnitSchedule,
  getKogumaUnitsForBand,
  getKogumaUnitsForMoetTheme,
  getKogumaUnitsForPillar,
  KOGUMA_100_UNITS,
  KOGUMA_DOMAINS,
  KOGUMA_ROADMAPS,
  MOET_PRESCHOOL_THEMES,
  RM_3_4_KOGUMA_01,
  RM_3_4_KOGUMA_02,
  RM_3_4_KOGUMA_YEAR_01,
  RM_3_4_KOGUMA_YEAR_02,
  RM_4_5_KOGUMA_01,
  RM_4_5_KOGUMA_02,
  RM_4_5_KOGUMA_YEAR_01,
  RM_4_5_KOGUMA_YEAR_02,
  RM_5_6_KOGUMA_01,
  RM_5_6_KOGUMA_02,
  RM_5_6_KOGUMA_YEAR_01,
  RM_5_6_KOGUMA_YEAR_02,
  type RoadmapBand,
} from "#src/roadmaps/index";
import { SKILL_IDENTITIES } from "#src/skills/index";

const DIFFICULTY_MAX_BY_BAND: Record<RoadmapBand, number> = {
  "3-4": 2,
  "4-5": 3,
  "5-6": 5,
};

const BAND_BOUNDS: Record<RoadmapBand, readonly [number, number]> = {
  "3-4": [3, 4],
  "4-5": [4, 5],
  "5-6": [5, 6],
};

const THEME_TITLE_RE = /«([^»]+)»/;

describe("Koguma-kai / Kuno Method 100 học phần & 12 lộ trình Việt Nam (BR-KGM-01..11)", () => {
  const skillByCode = new Map(Object.entries(SKILL_IDENTITIES));
  const templateCodes = new Set(Object.keys(ALL_TEMPLATES));
  const themeByCode = new Map(
    CONTENT_THEMES.map((theme) => [theme.code, theme])
  );

  it("BR-KGM-01 & BR-KGM-02: KOGUMA_100_UNITS có đúng 100 mã duy nhất KGM-001..KGM-100 và phân bổ 28/34/38", () => {
    expect(KOGUMA_100_UNITS).toHaveLength(100);

    const expectedCodes = Array.from(
      { length: 100 },
      (_, idx) => `KGM-${String(idx + 1).padStart(3, "0")}`
    );
    expect(KOGUMA_100_UNITS.map((unit) => unit.unit_code)).toEqual(
      expectedCodes
    );

    expect(getKogumaUnitsForBand("3-4")).toHaveLength(28);
    expect(getKogumaUnitsForBand("4-5")).toHaveLength(34);
    expect(getKogumaUnitsForBand("5-6")).toHaveLength(38);

    expect(KOGUMA_DOMAINS.map((domain) => domain.code)).toEqual([
      "K1",
      "K2",
      "K3",
      "K4",
      "K5",
    ]);
    for (const domain of KOGUMA_DOMAINS) {
      const units = getKogumaUnitsForPillar(domain.code);
      expect(units).toHaveLength(domain.unit_counts.total);
      expect(units.filter((u) => u.age_band === "3-4")).toHaveLength(
        domain.unit_counts["3-4"]
      );
      expect(units.filter((u) => u.age_band === "4-5")).toHaveLength(
        domain.unit_counts["4-5"]
      );
      expect(units.filter((u) => u.age_band === "5-6")).toHaveLength(
        domain.unit_counts["5-6"]
      );
    }
  });

  it("BR-KGM-01 & BR-KGM-03: 100% mã kỹ năng hợp lệ, phủ trọn 443/443 skill, đạt giới hạn tuổi – độ khó – khuôn – theme", () => {
    const primarySet = new Set<string>();
    const allLinkedSkills = new Set<string>();

    for (const unit of KOGUMA_100_UNITS) {
      expect(getKogumaUnit(unit.unit_code)).toEqual(unit);
      expect(primarySet.has(unit.primary_skill_code)).toBe(false);
      primarySet.add(unit.primary_skill_code);

      const primary = skillByCode.get(unit.primary_skill_code);
      expect(
        primary,
        `${unit.unit_code}: thiếu ${unit.primary_skill_code}`
      ).toBeDefined();
      if (!primary) {
        continue;
      }

      const [bandLow, bandHigh] = BAND_BOUNDS[unit.age_band];
      const diffMax = DIFFICULTY_MAX_BY_BAND[unit.age_band];
      expect(primary.age_min).toBeLessThanOrEqual(bandHigh);
      expect(primary.age_max).toBeGreaterThanOrEqual(bandLow);
      expect(primary.difficulty).toBeLessThanOrEqual(diffMax);
      allLinkedSkills.add(unit.primary_skill_code);

      for (const supportCode of unit.support_skill_codes) {
        expect(
          skillByCode.has(supportCode),
          `${unit.unit_code}: kỹ năng bổ trợ không tồn tại ${supportCode}`
        ).toBe(true);
        allLinkedSkills.add(supportCode);
      }

      expect(unit.recommended_templates.length).toBeGreaterThan(0);
      for (const tpl of unit.recommended_templates) {
        expect(templateCodes.has(tpl)).toBe(true);
      }

      const theme = themeByCode.get(unit.content_theme);
      expect(theme).toBeDefined();
      expect(theme?.age_floor ?? 99).toBeLessThanOrEqual(bandLow);
      expect(unit.concrete_manipulative_vi.trim().length).toBeGreaterThan(5);
    }

    expect(primarySet.size).toBe(100);
    expect(allLinkedSkills.size).toBe(Object.keys(SKILL_IDENTITIES).length);
    expect(getKogumaUnitBySkillCode("C1.CMP.01")?.unit_code).toBe("KGM-001");
  });

  it("BR-KGM-04: 10 chủ đề Giáo dục Mầm non Việt Nam phủ liền mạch tuần 1..36 và theme hợp lệ theo band", () => {
    expect(MOET_PRESCHOOL_THEMES).toHaveLength(10);
    expect(MOET_PRESCHOOL_THEMES[0]?.week_start).toBe(1);
    expect(MOET_PRESCHOOL_THEMES.at(-1)?.week_end).toBe(36);

    let totalPartitioned = 0;
    for (let i = 0; i < MOET_PRESCHOOL_THEMES.length; i++) {
      const current = MOET_PRESCHOOL_THEMES[i];
      if (!current) {
        continue;
      }
      if (i > 0) {
        const prev = MOET_PRESCHOOL_THEMES[i - 1];
        expect(current.week_start).toBe((prev?.week_end ?? 0) + 1);
      }
      for (const band of ["3-4", "4-5", "5-6"] as const) {
        const [bandLow] = BAND_BOUNDS[band];
        for (const themeCode of current.content_themes_by_band[band]) {
          expect(
            themeByCode.get(themeCode)?.age_floor ?? 99
          ).toBeLessThanOrEqual(bandLow);
        }
      }
      totalPartitioned += getKogumaUnitsForMoetTheme(current.id).length;
    }
    expect(totalPartitioned).toBe(100);
  });

  it("BR-KGM-06..10: 12 lộ trình Koguma-VN đạt chuẩn cấu trúc, cân bằng 6 năng lực, Jibutsu/offscreen và bảo toàn 9 lộ trình nền", () => {
    expect(KOGUMA_ROADMAPS).toEqual([
      RM_3_4_KOGUMA_01,
      RM_4_5_KOGUMA_01,
      RM_5_6_KOGUMA_01,
      RM_3_4_KOGUMA_02,
      RM_4_5_KOGUMA_02,
      RM_5_6_KOGUMA_02,
      RM_3_4_KOGUMA_YEAR_01,
      RM_4_5_KOGUMA_YEAR_01,
      RM_5_6_KOGUMA_YEAR_01,
      RM_3_4_KOGUMA_YEAR_02,
      RM_4_5_KOGUMA_YEAR_02,
      RM_5_6_KOGUMA_YEAR_02,
    ]);

    expect(ALL_ROADMAPS.slice(0, 9).map((rm) => rm.code)).toEqual([
      "RM-3-4-mam-01",
      "RM-3-4-mam-02",
      "RM-4-5-chi-01",
      "RM-4-5-chi-02",
      "RM-5-6-la-01",
      "RM-5-6-la-02",
      "RM-3-4-mam-year-01",
      "RM-4-5-chi-year-01",
      "RM-5-6-la-year-01",
    ]);
    expect(ALL_ROADMAPS.length).toBeGreaterThanOrEqual(21);

    const validThemeLabels = new Set(
      MOET_PRESCHOOL_THEMES.map((item) => item.roadmap_label_vi)
    );

    for (const roadmap of KOGUMA_ROADMAPS) {
      const expectedWeeks = roadmap.code.includes("-year-") ? 36 : 12;
      expect(roadmap.duration_weeks).toBe(expectedWeeks);
      expect(roadmap.sessions_per_week).toBe(3);
      expect(roadmap.weeks).toHaveLength(expectedWeeks);

      const totalSessions = expectedWeeks * 3;
      const competencyCounts = new Map<string, number>();
      const firstSeenBySkill = new Map<string, number>();
      let concreteSessions = 0;

      for (const wk of roadmap.weeks) {
        const offscreenInWeek = wk.sessions.filter(
          (s) => s.role === "offscreen"
        ).length;
        expect(offscreenInWeek).toBeGreaterThanOrEqual(1);
        expect(offscreenInWeek).toBeLessThanOrEqual(2);

        const weekCompetencies = new Set(
          wk.sessions.map((s) => s.skill_code.slice(0, 2))
        );
        expect(weekCompetencies.size).toBeGreaterThanOrEqual(2);
        expect(weekCompetencies.size).toBeLessThanOrEqual(4);

        const extractedTheme = wk.goal.match(THEME_TITLE_RE)?.[1];
        expect(extractedTheme).toBeDefined();
        if (extractedTheme) {
          expect(validThemeLabels.has(extractedTheme)).toBe(true);
        }

        for (const sess of wk.sessions) {
          expect(skillByCode.has(sess.skill_code)).toBe(true);
          if (sess.role === "offscreen" || sess.role === "introduce") {
            concreteSessions += 1;
          }
          const comp = sess.skill_code.slice(0, 2);
          competencyCounts.set(comp, (competencyCounts.get(comp) ?? 0) + 1);
          if (!firstSeenBySkill.has(sess.skill_code)) {
            firstSeenBySkill.set(sess.skill_code, wk.week_no);
          }
        }
      }

      expect(competencyCounts.size).toBe(6);
      for (const count of competencyCounts.values()) {
        expect(count / totalSessions).toBeLessThanOrEqual(0.4);
      }
      expect(concreteSessions / totalSessions).toBeGreaterThanOrEqual(0.15);

      for (const [, firstWeek] of firstSeenBySkill) {
        expect(firstWeek).toBeLessThanOrEqual(roadmap.duration_weeks - 3);
      }
    }
  });

  it("BR-KGM-11: 100/100 học phần KGM-001..KGM-100 được xếp lịch dạy trực tiếp trong KOGUMA_ROADMAPS và khớp scheduled_roadmap_code + scheduled_week_no", () => {
    const roadmapByCode = new Map(KOGUMA_ROADMAPS.map((rm) => [rm.code, rm]));
    let mamScheduled = 0;
    let choiScheduled = 0;
    let laScheduled = 0;

    for (const unit of KOGUMA_100_UNITS) {
      const schedule = getKogumaUnitSchedule(unit.unit_code);
      expect(schedule).toBeDefined();
      expect(schedule?.scheduled_roadmap_code).toBe(
        unit.scheduled_roadmap_code
      );
      expect(schedule?.scheduled_week_no).toBe(unit.scheduled_week_no);

      const yearRoadmap = roadmapByCode.get(unit.scheduled_roadmap_code);
      expect(
        yearRoadmap,
        `${unit.unit_code}: không tìm thấy lộ trình ${unit.scheduled_roadmap_code}`
      ).toBeDefined();
      expect(yearRoadmap?.band).toBe(unit.age_band);

      const targetWeek = yearRoadmap?.weeks.find(
        (wk) => wk.week_no === unit.scheduled_week_no
      );
      expect(
        targetWeek,
        `${unit.unit_code}: không tìm thấy tuần ${unit.scheduled_week_no} trong ${unit.scheduled_roadmap_code}`
      ).toBeDefined();

      const taughtInWeek = targetWeek?.sessions.some(
        (s) =>
          s.skill_code === unit.primary_skill_code &&
          (s.role === "introduce" || s.role === "practice")
      );
      expect(
        taughtInWeek,
        `${unit.unit_code} (${unit.primary_skill_code}) không có tiết introduce/practice ở ${unit.scheduled_roadmap_code} tuần ${unit.scheduled_week_no}`
      ).toBe(true);

      if (unit.scheduled_core_roadmap_code !== null) {
        const coreRoadmap = roadmapByCode.get(unit.scheduled_core_roadmap_code);
        expect(coreRoadmap?.band).toBe(unit.age_band);
        const coreWeek = coreRoadmap?.weeks.find(
          (wk) => wk.week_no === unit.scheduled_core_week_no
        );
        expect(
          coreWeek?.sessions.some(
            (s) =>
              s.skill_code === unit.primary_skill_code &&
              (s.role === "introduce" || s.role === "practice")
          )
        ).toBe(true);
      }

      if (unit.age_band === "3-4") {
        mamScheduled += 1;
      } else if (unit.age_band === "4-5") {
        choiScheduled += 1;
      } else {
        laScheduled += 1;
      }
    }

    expect(mamScheduled).toBe(28);
    expect(choiScheduled).toBe(34);
    expect(laScheduled).toBe(38);
    expect(mamScheduled + choiScheduled + laScheduled).toBe(100);
  });
});
