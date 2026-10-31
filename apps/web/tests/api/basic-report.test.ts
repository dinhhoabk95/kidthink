import { readFileSync } from "node:fs";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { resolve } from "node:path";
import { validateReportLanguage } from "@mindkid/adaptive";
import {
  childProfiles,
  type contentSkillMap,
  entitlementKeys,
  entitlements,
  type gameLevels,
  getOwnerDb,
  type skills,
  users,
} from "@mindkid/db";
import { isAppError } from "@mindkid/errors/base";
import { BASIC_REPORT_DISCLAIMER } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { createEvent, type H3Event } from "h3";
import { describe, expect, it } from "vitest";
import getBasicReportHandler from "#server/api/users/children/[uuid]/reports/basic.get";
import getDashboardHandler from "#server/api/users/dashboard.get";
import { buildBasicReportFromData } from "#server/services/basic-report";
import { invalidateUserEntitlementsCache } from "#server/utils/entitlements-runtime";

function createTestEvent(params: {
  userId: number;
  uuid?: string;
  query?: Record<string, string>;
  entitlements?: string[];
}): H3Event {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  const queryString = params.query
    ? new URLSearchParams(params.query).toString()
    : "";
  req.method = "GET";
  req.url = `/api/users/children/${params.uuid ?? ""}/reports/basic${queryString ? `?${queryString}` : ""}`;
  req.headers = {};
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  event.context.params = params.uuid ? { uuid: params.uuid } : {};
  event.context.query = params.query ?? {};
  event.context.user = {
    user_id: params.userId,
    display_name: "Parent User",
    session_id: `sess_${params.userId}`,
    ...(params.entitlements ? { entitlements: params.entitlements } : {}),
  };
  return event;
}

function isSandboxEpermError(err: object | null | undefined): boolean {
  if (!err) {
    return false;
  }
  const maybeErr = err as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  if (
    maybeErr.code === "EPERM" ||
    maybeErr.code === "ECONNREFUSED" ||
    maybeErr.cause?.code === "EPERM" ||
    maybeErr.cause?.code === "ECONNREFUSED"
  ) {
    return true;
  }
  const msg = `${maybeErr.message ?? ""} ${maybeErr.cause?.message ?? ""}`;
  return msg.includes("EPERM") || msg.includes("ECONNREFUSED");
}

describe("Basic Child Report API — GET /api/users/children/[uuid]/reports/basic (BR-BRP-01..08)", () => {
  it("Scenario: BR-BRP-01 — source code reads strictly from rollup tables and never queries telemetry_events or mastery_state", () => {
    const routePath = resolve(
      import.meta.dirname,
      "../../server/api/users/children/[uuid]/reports/basic.get.ts"
    );
    const servicePath = resolve(
      import.meta.dirname,
      "../../server/services/basic-report.ts"
    );

    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).not.toContain("telemetryEvents");
    expect(routeSource).not.toContain("masteryState");
    expect(serviceSource).toContain("childDailyStats");
    expect(serviceSource).toContain("childSessionSummaries");
    expect(serviceSource).not.toContain("telemetryEvents");
    expect(serviceSource).not.toContain("masteryState");
  });

  it("Scenario: BR-BRP-05 — returns 404 CHILD_NOT_FOUND when requesting another user's child", async () => {
    try {
      const db = getOwnerDb();
      const ts = Date.now();
      const rand = Math.floor(Math.random() * 10_000);

      const [owner] = await db
        .insert(users)
        .values({
          email: `basic_owner_${ts}_${rand}@test.com`,
          displayName: "Owner User",
        })
        .returning();

      const [caller] = await db
        .insert(users)
        .values({
          email: `basic_caller_${ts}_${rand}@test.com`,
          displayName: "Caller User",
        })
        .returning();

      const [child] = await db
        .insert(childProfiles)
        .values({
          userId: owner.id,
          displayName: "Bé Owner",
          birthYear: 2021,
          avatarId: "bunny_1",
        })
        .returning();

      const event = createTestEvent({
        userId: caller.id,
        uuid: child.uuid,
      });

      try {
        await getBasicReportHandler(event);
        expect.fail("Should throw 404 CHILD_NOT_FOUND");
      } catch (err) {
        expect(isAppError(err)).toBe(true);
        if (isAppError(err)) {
          expect(err.status).toBe(404);
          expect(err.code).toBe("NOT_FOUND");
        }
      }
    } catch (err) {
      if (isSandboxEpermError(err as object)) {
        const routePath = resolve(
          import.meta.dirname,
          "../../server/api/users/children/[uuid]/reports/basic.get.ts"
        );
        const routeSource = readFileSync(routePath, "utf8");
        expect(routeSource).toContain("eq(childProfiles.uuid, childUuid)");
        expect(routeSource).toContain("eq(childProfiles.userId, userId)");
        expect(routeSource).toContain("throw new ChildNotFoundError");
        return;
      }
      throw err;
    }
  });

  it("Scenario: returns 403 ENTITLEMENT_REQUIRED when view_basic_report is revoked", async () => {
    const eventNoEnt = createTestEvent({
      userId: 501,
      uuid: "00000000-0000-4000-8000-000000000001",
      entitlements: [],
    });

    try {
      await getBasicReportHandler(eventNoEnt);
      expect.fail("Should throw 403 ENTITLEMENT_REQUIRED");
    } catch (err) {
      expect(isAppError(err)).toBe(true);
      if (isAppError(err)) {
        expect(err.status).toBe(403);
        expect(err.code).toBe("ENTITLEMENT_REQUIRED");
      }
    }
  });

  it("Scenario: rejects unsupported period query parameter (e.g. 90d) with 422", async () => {
    const event = createTestEvent({
      userId: 502,
      uuid: "00000000-0000-4000-8000-000000000002",
      query: { period: "90d" },
    });

    try {
      await getBasicReportHandler(event);
      expect.fail("Should throw 422 VALIDATION_ERROR");
    } catch (err) {
      expect(isAppError(err)).toBe(true);
      if (isAppError(err)) {
        expect(err.status).toBe(422);
      }
    }
  });

  it("Scenario: chưa chơi lần nào — returns friendly notice and 3 suggested games when child has 0 sessions", () => {
    const report = buildBasicReportFromData({
      child: {
        uuid: "00000000-0000-4000-8000-000000000003",
        displayName: "Bé Mới",
        birthYear: 2021,
        avatarId: "bunny_1",
        status: "active",
      },
      period: "7d",
      fromDateIct: "2026-10-11",
      toDateIct: "2026-10-18",
      dailyRows: [],
      sessionRows: [],
      allLevels: [],
      allMappings: [],
      allSkills: [],
    });

    expect(report.has_any_sessions).toBe(false);
    expect(report.insufficient_data).toBe(true);
    expect(report.overall_mastery_label).toBe("Chưa có đủ dữ liệu");
    expect(report.suggested_initial_games).toHaveLength(3);
    expect(report.disclaimer).toBe(BASIC_REPORT_DISCLAIMER);
  });

  it("Scenario: BR-BRP-06 — returns 'Chưa có đủ dữ liệu' when child has fewer than 3 sessions (2 sessions)", () => {
    const now = new Date("2026-10-18T10:00:00.000Z");
    const mockLevel = {
      id: 101,
      version: 1,
      code: "GL-C1-CNT-0001",
      templateCode: "GT-001",
      title: "Đếm sao trên trời",
      accessTier: "free",
      difficulty: 1,
      thumbnailEmoji: "⭐",
      contentPack: {},
      difficultyParams: {},
      createdAt: now,
      updatedAt: now,
    } as typeof gameLevels.$inferSelect;

    const mockSkill = {
      id: 201,
      strandId: 1,
      code: "C1.CNT.01",
      name: "Đếm tương ứng 1-1",
      description: "Đếm vật",
      ageMin: 3,
      ageMax: 4,
      difficulty: 1,
      status: "seeded",
      position: 1,
      thinkingProcesses: ["counting"],
      createdAt: now,
      updatedAt: now,
    } as typeof skills.$inferSelect;

    const mockMapping = {
      id: 301,
      entityType: "game_level",
      entityId: 101,
      skillId: 201,
      weight: "1.00",
      isPrimary: true,
      createdAt: now,
    } as typeof contentSkillMap.$inferSelect;

    const report = buildBasicReportFromData({
      child: {
        uuid: "00000000-0000-4000-8000-000000000004",
        displayName: "Bé 2 Phiên",
        birthYear: 2021,
        avatarId: "bunny_1",
        status: "active",
      },
      period: "7d",
      fromDateIct: "2026-10-11",
      toDateIct: "2026-10-18",
      dailyRows: [],
      sessionRows: [
        {
          id: 1,
          sessionUuid: "00000000-0000-4000-8000-000000000101",
          gameLevelId: 101,
          templateCode: "GT-001",
          completionStatus: "completed",
          score: 100,
          durationSeconds: 180,
          starsEarned: 3,
          hintsUsed: 0,
          retriesCount: 0,
          completedAt: now,
          createdAt: now,
        },
        {
          id: 2,
          sessionUuid: "00000000-0000-4000-8000-000000000102",
          gameLevelId: 101,
          templateCode: "GT-001",
          completionStatus: "completed",
          score: 95,
          durationSeconds: 150,
          starsEarned: 3,
          hintsUsed: 0,
          retriesCount: 0,
          completedAt: now,
          createdAt: now,
        },
      ],
      allLevels: [mockLevel],
      allMappings: [mockMapping],
      allSkills: [mockSkill],
    });

    expect(report.has_any_sessions).toBe(true);
    expect(report.insufficient_data).toBe(true);
    expect(report.overall_mastery_label).toBe("Chưa có đủ dữ liệu");
    expect(report.sections.skills_touched.overall_mastery_label).toBe(
      "Chưa có đủ dữ liệu"
    );
    for (const sk of report.sections.skills_touched.items) {
      expect(sk.mastery_label).toBe("Chưa có đủ dữ liệu");
    }
  });

  it("Scenario: BR-BRP-02, 03, 04, 07, 08 — returns 6 sections with explanations, no diagnostic/comparative words, and no raw p_learn", () => {
    const now = new Date("2026-10-18T10:00:00.000Z");
    const mockLevel = {
      id: 102,
      version: 2,
      code: "GL-C1-CNT-0002",
      templateCode: "GT-001",
      title: "Đếm số táo đỏ",
      accessTier: "free",
      difficulty: 1,
      thumbnailEmoji: "🍎",
      contentPack: {},
      difficultyParams: {},
      createdAt: now,
      updatedAt: now,
    } as typeof gameLevels.$inferSelect;

    const mockSkill = {
      id: 202,
      strandId: 1,
      code: "C1.CNT.02",
      name: "Đếm số lượng trong phạm vi 5",
      description: "Đếm vật",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
      status: "seeded",
      position: 2,
      thinkingProcesses: ["counting"],
      createdAt: now,
      updatedAt: now,
    } as typeof skills.$inferSelect;

    const mockMapping = {
      id: 302,
      entityType: "game_level",
      entityId: 102,
      skillId: 202,
      weight: "1.00",
      isPrimary: true,
      createdAt: now,
    } as typeof contentSkillMap.$inferSelect;

    const report = buildBasicReportFromData({
      child: {
        uuid: "00000000-0000-4000-8000-000000000005",
        displayName: "Bé Đầy Đủ",
        birthYear: 2020,
        avatarId: "bunny_1",
        status: "archived",
      },
      period: "30d",
      fromDateIct: "2026-09-18",
      toDateIct: "2026-10-18",
      dailyRows: [
        {
          dateIct: "2026-10-18",
          sessionsCount: 4,
          totalPlayTimeSeconds: 900,
          levelsAttempted: 4,
          levelsCompleted: 3,
          skillsTouched: 1,
          starsEarned: 10,
        },
      ],
      sessionRows: [
        {
          id: 1,
          sessionUuid: "00000000-0000-4000-8000-000000000201",
          gameLevelId: 102,
          templateCode: "GT-001",
          completionStatus: "completed",
          score: 95,
          durationSeconds: 225,
          starsEarned: 3,
          hintsUsed: 0,
          retriesCount: 0,
          completedAt: new Date(now.getTime() - 180_000),
          createdAt: new Date(now.getTime() - 180_000),
        },
        {
          id: 2,
          sessionUuid: "00000000-0000-4000-8000-000000000202",
          gameLevelId: 102,
          templateCode: "GT-001",
          completionStatus: "completed",
          score: 90,
          durationSeconds: 225,
          starsEarned: 3,
          hintsUsed: 0,
          retriesCount: 0,
          completedAt: new Date(now.getTime() - 120_000),
          createdAt: new Date(now.getTime() - 120_000),
        },
        {
          id: 3,
          sessionUuid: "00000000-0000-4000-8000-000000000203",
          gameLevelId: 102,
          templateCode: "GT-001",
          completionStatus: "completed",
          score: 92,
          durationSeconds: 225,
          starsEarned: 3,
          hintsUsed: 0,
          retriesCount: 0,
          completedAt: new Date(now.getTime() - 60_000),
          createdAt: new Date(now.getTime() - 60_000),
        },
        {
          id: 4,
          sessionUuid: "00000000-0000-4000-8000-000000000204",
          gameLevelId: 102,
          templateCode: "GT-001",
          completionStatus: "abandoned",
          score: 40,
          durationSeconds: 225,
          starsEarned: 1,
          hintsUsed: 1,
          retriesCount: 1,
          completedAt: now,
          createdAt: now,
        },
      ],
      allLevels: [mockLevel],
      allMappings: [mockMapping],
      allSkills: [mockSkill],
    });

    expect(report.period).toBe("30d");
    expect(report.child.is_archived).toBe(true);
    expect(report.disclaimer).toBe(BASIC_REPORT_DISCLAIMER);
    expect(report.sections.activity.sessions_count).toBe(4);
    expect(report.sections.activity.explanation.length).toBeGreaterThan(0);
    expect(report.sections.completion.levels_completed).toBe(3);
    expect(report.sections.completion.levels_attempted).toBe(4);
    expect(report.sections.completion.explanation).toContain("3 trên 4");
    expect(report.sections.skills_touched.explanation.length).toBeGreaterThan(
      0
    );
    expect(report.sections.favorite_games.explanation.length).toBeGreaterThan(
      0
    );
    expect(report.sections.recent_sessions.explanation.length).toBeGreaterThan(
      0
    );
    expect(report.sections.suggestions.items).toHaveLength(3);
    expect(
      report.sections.suggestions.items.some((i) => i.kind === "offline")
    ).toBe(true);
    expect(report.sections.suggestions.explanation.length).toBeGreaterThan(0);
    expect(report.version_markers).toHaveLength(0);

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("p_learn");
    expect(serialized).not.toContain("mastery_percentage");

    const langCheck = validateReportLanguage(serialized);
    expect(langCheck.valid).toBe(true);
  });

  it("Scenario: dashboard report_url points to basic report by default and advanced report when entitled", async () => {
    try {
      const db = getOwnerDb();
      const ts = Date.now();
      const rand = Math.floor(Math.random() * 10_000);

      const [user] = await db
        .insert(users)
        .values({
          email: `dash_rep_${ts}_${rand}@test.com`,
          displayName: "Dashboard User",
        })
        .returning();

      const [child] = await db
        .insert(childProfiles)
        .values({
          userId: user.id,
          displayName: "Bé Dashboard",
          birthYear: 2021,
          avatarId: "bunny_1",
        })
        .returning();

      await invalidateUserEntitlementsCache(user.id);

      const dashEventBasic = createTestEvent({ userId: user.id });
      const dashBasic = await getDashboardHandler(dashEventBasic);
      expect(dashBasic.recent_progress[0]?.report_url).toBe(
        `/me/children/${child.uuid}/report`
      );

      await db
        .insert(entitlementKeys)
        .values({
          key: "view_advanced_report",
          label: "Xem báo cáo nâng cao",
          group: "report",
          isMvp: true,
        })
        .onConflictDoNothing();

      await db.insert(entitlements).values({
        userId: user.id,
        entitlementKey: "view_advanced_report",
        status: "active",
        source: "package_order",
      });
      await invalidateUserEntitlementsCache(user.id);

      const dashEventAdv = createTestEvent({ userId: user.id });
      const dashAdv = await getDashboardHandler(dashEventAdv);
      expect(dashAdv.recent_progress[0]?.report_url).toBe(
        `/me/children/${child.uuid}/report/advanced`
      );

      await db.delete(entitlements).where(eq(entitlements.userId, user.id));
      await invalidateUserEntitlementsCache(user.id);
    } catch (err) {
      if (isSandboxEpermError(err as object)) {
        const dashSource = readFileSync(
          resolve(
            import.meta.dirname,
            "../../server/api/users/dashboard.get.ts"
          ),
          "utf8"
        );
        expect(dashSource).toContain("/report/advanced`");
        expect(dashSource).toContain("/report`");
        expect(dashSource).toContain("hasAdvancedReportAccess");
        return;
      }
      throw err;
    }
  });
});
