import { describe, expect, it } from "vitest";
import { scanReportingQueries } from "../lint-analytics-queries.ts";

describe("BR-TLM-01: Analytics Query Gate", () => {
  it("passes when reporting route reads from level_daily_stats rollup table", () => {
    const code = `
      import { levelDailyStats } from "@mindkid/db";
      export default defineEventHandler(async () => {
        return await db.select().from(levelDailyStats);
      });
    `;
    const res = scanReportingQueries(
      code,
      "/api/managers/analytics/levels.get.ts"
    );
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("negative test: flags reporting route that queries telemetry_events directly (BR-TLM-01)", () => {
    const badCode = `
      import { telemetryEvents } from "@mindkid/db";
      export default defineEventHandler(async () => {
        return await db.select().from(telemetryEvents);
      });
    `;
    const res = scanReportingQueries(
      badCode,
      "/api/managers/analytics/levels.get.ts"
    );
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0]).toContain("telemetry_events");
  });
});
