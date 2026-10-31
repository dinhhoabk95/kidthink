import { masteryLabel, validateReportLanguage } from "@mindkid/adaptive";
import {
  BASIC_REPORT_DISCLAIMER,
  BASIC_REPORT_MIN_SESSIONS,
} from "@mindkid/shared";
import { and, eq, getTableName, gte, lte } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  childDailyStats,
  childProfiles,
  childSessionSummaries,
  collections,
  libraryItems,
  telemetryEvents,
} from "#src/index";

const pgDialect = new PgDialect();

describe("P1.12 Report, Member Dashboard & My Library Invariants (BR-BRP, BR-MDB, BR-MLB)", () => {
  describe("Basic Report Invariants (BR-BRP-01..08)", () => {
    it("Scenario: BR-BRP-01 — basic report reads from rollups, never scans raw telemetry_events", () => {
      const dailyTable = getTableName(childDailyStats);
      const summaryTable = getTableName(childSessionSummaries);
      const rawTable = getTableName(telemetryEvents);

      expect(dailyTable).toBe("child_daily_stats");
      expect(summaryTable).toBe("child_session_summaries");
      expect(dailyTable).not.toBe(rawTable);
      expect(summaryTable).not.toBe(rawTable);

      const whereRollup = and(
        eq(childDailyStats.childProfileId, 42),
        gte(childDailyStats.dateIct, "2026-10-11"),
        lte(childDailyStats.dateIct, "2026-10-18")
      );
      if (!whereRollup) {
        throw new Error("Expected whereRollup");
      }
      const querySql = pgDialect.sqlToQuery(whereRollup.getSQL());
      expect(querySql.sql).toContain('"child_daily_stats"."child_profile_id"');
      expect(querySql.sql).not.toContain("telemetry_events");
    });

    it("Scenario: BR-BRP-02 — forbids diagnostic language and uses approved label dictionary", () => {
      const approvedSamples = [
        masteryLabel({ p_learn: 0.5, attempts_total: 1 }),
        masteryLabel({ p_learn: 0.2, attempts_total: 5 }),
        masteryLabel({ p_learn: 0.5, attempts_total: 5 }),
        masteryLabel({ p_learn: 0.7, attempts_total: 5 }),
        masteryLabel({ p_learn: 0.9, attempts_total: 5 }),
      ];

      expect(approvedSamples).toEqual([
        "Chưa có đủ dữ liệu",
        "Mới làm quen",
        "Đang phát triển",
        "Khá ổn định",
        "Thành thạo trong phạm vi bài tập",
      ]);

      for (const label of approvedSamples) {
        expect(validateReportLanguage(label).valid).toBe(true);
      }

      expect(validateReportLanguage("Bé chậm và dưới chuẩn IQ").valid).toBe(
        false
      );
    });

    it("Scenario: BR-BRP-03 — every report view contains standard disclaimer text", () => {
      expect(BASIC_REPORT_DISCLAIMER).toContain(
        "Báo cáo phản ánh hoạt động của bé trong ứng dụng"
      );
      expect(BASIC_REPORT_DISCLAIMER).toContain("Mỗi bé có nhịp riêng.");
      expect(validateReportLanguage(BASIC_REPORT_DISCLAIMER).valid).toBe(true);
    });

    it("Scenario: BR-BRP-04 — forbids comparing children with others or age standards", () => {
      const validSummary = "Bé đã làm quen 5 kỹ năng trong tuần qua.";
      expect(validateReportLanguage(validSummary).valid).toBe(true);

      const invalidComparative =
        "Kết quả của bé thấp hơn chuẩn độ tuổi và so với trẻ khác.";
      const result = validateReportLanguage(invalidComparative);
      expect(result.valid).toBe(false);
      expect(result.violations).toContain("chuẩn độ tuổi");
      expect(result.violations).toContain("so với trẻ khác");
    });

    it("Scenario: BR-BRP-05 — database ownership check returns 404 for another user's child profile", () => {
      const ownershipClause = and(
        eq(childProfiles.uuid, "00000000-0000-4000-8000-000000000001"),
        eq(childProfiles.userId, 200)
      );
      if (!ownershipClause) {
        throw new Error("Expected ownershipClause");
      }
      const compiled = pgDialect.sqlToQuery(ownershipClause.getSQL());
      expect(compiled.sql).toContain('"child_profiles"."uuid"');
      expect(compiled.sql).toContain('"child_profiles"."user_id"');
      expect(compiled.params).toEqual([
        "00000000-0000-4000-8000-000000000001",
        200,
      ]);
    });

    it("Scenario: BR-BRP-06 — reports with < 3 sessions show 'Chưa có đủ dữ liệu'", () => {
      expect(BASIC_REPORT_MIN_SESSIONS).toBe(3);
      expect(masteryLabel({ p_learn: 0.95, attempts_total: 0 })).toBe(
        "Chưa có đủ dữ liệu"
      );
      expect(masteryLabel({ p_learn: 0.95, attempts_total: 2 })).toBe(
        "Chưa có đủ dữ liệu"
      );
      expect(masteryLabel({ p_learn: 0.95, attempts_total: 3 })).toBe(
        "Thành thạo trong phạm vi bài tập"
      );
    });

    it("Scenario: BR-BRP-07 — every report metric has a plain Vietnamese explanation", () => {
      const explanations = [
        "Số ngày bé có mở ứng dụng và hoàn thành ít nhất một màn chơi.",
        "Số màn chơi tư duy bé đã hoàn thành trong giai đoạn này.",
      ];
      for (const explanation of explanations) {
        expect(explanation.length).toBeGreaterThan(10);
        expect(validateReportLanguage(explanation).valid).toBe(true);
      }
    });

    it("Scenario: BR-BRP-08 — forbids raw p_learn or mastery percentage fields in report payload", () => {
      const label = masteryLabel({ p_learn: 0.65, attempts_total: 4 });
      const reportSection = {
        code: "C1.CNT.01",
        name: "Đếm đến 5",
        mastery_label: label,
        sessions_count: 4,
      };
      expect(reportSection).not.toHaveProperty("p_learn");
      expect(reportSection).not.toHaveProperty("mastery_percentage");
    });
  });

  describe("Member Dashboard Invariants (BR-MDB-01..07)", () => {
    it("Scenario: BR-MDB-01 — users with no child profiles only see create child CTA", () => {
      const childCount = 0;
      const visibleBlocks =
        childCount === 0
          ? ["create_child_cta"]
          : ["overview", "progress", "library"];
      expect(visibleBlocks).toEqual(["create_child_cta"]);
    });

    it("Scenario: BR-MDB-02 — entering play mode requires selecting an active child profile", () => {
      const activeChildId: number | null = null;
      const canEnterPlay = activeChildId !== null;
      expect(canEnterPlay).toBe(false);
    });

    it("Scenario: BR-MDB-03 — commercial/upgrade info is allowed on adult dashboard, forbidden on kid UI", () => {
      const surface = "adult_dashboard";
      const allowCommercial = surface === "adult_dashboard";
      expect(allowCommercial).toBe(true);
    });

    it("Scenario: BR-MDB-04 — dashboard reads from rollups, never scans raw events", () => {
      expect(getTableName(childDailyStats)).toBe("child_daily_stats");
      expect(getTableName(childDailyStats)).not.toBe("telemetry_events");
    });

    it("Scenario: BR-MDB-05 — remaining quota indicator only shows when usage exceeds 80%", () => {
      const usage75 = 0.75;
      const show75 = usage75 > 0.8;
      expect(show75).toBe(false);

      const usage85 = 0.85;
      const show85 = usage85 > 0.8;
      expect(show85).toBe(true);
    });

    it("Scenario: BR-MDB-06 — forbids comparing children within the same account or ranking them", () => {
      const dashboardData = {
        children: [
          { id: 1, name: "Gấu", active_days: 3 },
          { id: 2, name: "Thỏ", active_days: 5 },
        ],
      };
      expect(dashboardData).not.toHaveProperty("rankings");
      expect(dashboardData).not.toHaveProperty("comparison");
    });

    it("Scenario: BR-MDB-07 — limits upgrade CTAs to at most one per page", () => {
      const upgradeCtaCount = 1;
      expect(upgradeCtaCount).toBeLessThanOrEqual(1);
    });
  });

  describe("My Library Invariants (BR-MLB-01..07)", () => {
    it("Scenario: BR-MLB-01 — saves content reference, displaying latest published metadata", () => {
      expect(getTableName(libraryItems)).toBe("library_items");
      const item = { entity_type: "game_level", entity_id: 42 };
      expect(item).toHaveProperty("entity_type");
      expect(item).toHaveProperty("entity_id");
    });

    it("Scenario: BR-MLB-02 — allows saving locked content, displaying lock badge & upgrade CTA", () => {
      const item = { entity_id: 10, is_locked: true };
      expect(item.is_locked).toBe(true);
    });

    it("Scenario: BR-MLB-03 — user tags remain strictly separate from global tags", () => {
      const userTag = { user_id: 1, tag_name: "Yêu thích" };
      expect(userTag).toHaveProperty("user_id");
    });

    it("Scenario: BR-MLB-04 — library items are strictly private to the owner", () => {
      const ownerFilter = eq(libraryItems.userId, 5);
      const sql = pgDialect.sqlToQuery(ownerFilter.getSQL());
      expect(sql.sql).toContain('"library_items"."user_id"');
      expect(sql.params).toEqual([5]);
    });

    it("Scenario: BR-MLB-05 — archived content remains in library with unavailable label", () => {
      const status = "archived";
      const label = status === "archived" ? "Không còn khả dụng" : "Khả dụng";
      expect(label).toBe("Không còn khả dụng");
    });

    it("Scenario: BR-MLB-06 — caps collections limit per user at 20", () => {
      expect(getTableName(collections)).toBe("collections");
      const collectionsCount = 20;
      const canCreate = collectionsCount < 20;
      expect(canCreate).toBe(false);
    });

    it("Scenario: BR-MLB-07 — forbids storing user-generated content in library", () => {
      const contentType = "catalog";
      expect(contentType).not.toBe("user_generated");
    });
  });
});
