import {
  auditLogs,
  childProfiles,
  curricula,
  curriculumItems,
  entitlementKeys,
  entitlements,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  lessons,
  playSessions,
  telemetryEvents,
  users,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import getOfflinePackHandler from "../../../server/api/users/curricula/[uuid]/offline-pack.get.js";
import syncOfflineEventsHandler from "../../../server/api/users/offline/sync.post.js";
import { invalidateUserEntitlementsCache } from "../../../server/utils/entitlements-runtime.js";

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;

function makeUserEvent(
  userId: number | null,
  routerParams: Record<string, string> = {},
  query: Record<string, string> = {},
  body?: Record<string, unknown>,
  method?: string
) {
  const resolvedMethod = method || (body ? "POST" : "GET");
  const csrfToken = "a".repeat(64);
  const responseHeaders: Record<string, string> = {};
  const queryStr =
    Object.keys(query).length > 0
      ? `/?${new URLSearchParams(query).toString()}`
      : "/";

  return {
    method: resolvedMethod,
    node: {
      req: {
        method: resolvedMethod,
        socket: { remoteAddress: "127.0.0.1" },
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        url: queryStr,
        originalUrl: queryStr,
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      ...(userId
        ? {
            user: {
              user_id: String(userId),
              display_name: "Test Parent User",
            },
          }
        : {}),
      params: routerParams,
      query,
      body,
    },
    _query: query,
    _body: body,
  } as any;
}

describe("Offline Curriculum Pack & Sync APIs (BR-PWA, BR-OCP, BR-OFF)", () => {
  let userEntitledId: number;
  let userFreeId: number;
  let childProfileId: number;
  let curriculumCode: string;
  let gameLevelCode: string;
  let templateId: number;
  let gameLevelId: number;

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    // 1. Seed users
    const [uEntitled] = await db
      .insert(users)
      .values({
        email: `pwa_offline_entitled_${ts}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Entitled Parent User",
      })
      .returning();
    userEntitledId = uEntitled.id;

    const [uFree] = await db
      .insert(users)
      .values({
        email: `pwa_offline_free_${ts}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Free Parent User",
      })
      .returning();
    userFreeId = uFree.id;

    // Grant standard entitlement to userEntitled
    await db
      .insert(entitlementKeys)
      .values([
        {
          key: "play_standard_games",
          group: "content",
          labelVi: "Chơi game chuẩn",
        },
      ])
      .onConflictDoNothing();

    await db.insert(entitlements).values([
      {
        userId: userEntitledId,
        entitlementKey: "play_standard_games",
        source: "manual_grant",
        status: "active",
      },
    ]);

    await invalidateUserEntitlementsCache(userEntitledId);
    await invalidateUserEntitlementsCache(userFreeId);

    // 2. Seed child profile
    const [cp] = await db
      .insert(childProfiles)
      .values({
        userId: userEntitledId,
        displayName: "Bé Cún",
        birthYear: 2021,
        avatarId: "dog",
      })
      .returning();
    childProfileId = cp.id;

    // 3. Seed template & game level
    const templateCode = "GT-001";
    await db
      .insert(gameTemplates)
      .values({
        code: templateCode,
        nameVi: "Game template test offline",
        mechanic: "drag_drop",
        contentContract: {},
      })
      .onConflictDoNothing();
    const [foundGt] = await db
      .select({ id: gameTemplates.id })
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode));
    templateId = foundGt?.id ?? 1;

    const randNum = String(Math.floor(Math.random() * 9000) + 1000);
    gameLevelCode = `GL-C1-NUM-CNT-${randNum}`;
    const randEntityId = Math.floor(Math.random() * 100_000) + 1000;
    const [gl] = await db
      .insert(gameLevels)
      .values({
        code: gameLevelCode,
        entityId: randEntityId,
        templateId,
        difficulty: 1,
        titleVi: "Trò chơi học đếm ngoại tuyến",
        accessTier: "standard",
        status: "published",
        contentPack: { items: ["apple", "banana"] },
        difficultyParams: { count: 3 },
      })
      .returning();
    gameLevelId = gl.id;

    // 4. Seed lesson
    const [les] = await db
      .insert(lessons)
      .values({
        code: `LES-${randNum}`,
        entityId: randEntityId + 1,
        titleVi: "Bài học toán tuần 1",
        accessTier: "standard",
        status: "published",
        estimatedMinutes: 15,
        version: 1,
      })
      .returning();

    // 5. Seed system curriculum
    curriculumCode =
      `CUR-OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`.slice(0, 50);
    const [sysCurr] = await db
      .insert(curricula)
      .values({
        code: curriculumCode,
        entityId: randEntityId + 2,
        titleVi: "Chương trình mẫu Offline Tuần 1-4",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();

    await db.insert(curriculumItems).values([
      {
        curriculumId: sysCurr.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl.id,
        isRequired: true,
      },
      {
        curriculumId: sysCurr.id,
        weekNo: 1,
        sessionNo: 2,
        position: 1,
        entityType: "lesson",
        entityId: les.id,
        isRequired: true,
      },
    ]);
  });

  describe("GET /api/users/curricula/:uuid/offline-pack (BR-OCP-01..04)", () => {
    it("rejects unauthenticated caller with 401", async () => {
      const event = makeUserEvent(
        null,
        { uuid: curriculumCode },
        { week: "1" }
      );
      await expect(getOfflinePackHandler(event)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("BR-OCP-02 & BR-OCP-03: rejects user without required entitlement with 403 ENTITLEMENT_REQUIRED", async () => {
      const event = makeUserEvent(
        userFreeId,
        { uuid: curriculumCode },
        { week: "1" }
      );
      await expect(getOfflinePackHandler(event)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("rejects invalid week number with 422 VALIDATION_FAILED", async () => {
      const event = makeUserEvent(
        userEntitledId,
        { uuid: curriculumCode },
        { week: "99" }
      );
      await expect(getOfflinePackHandler(event)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it("rejects unknown curriculum with 404 NOT_FOUND", async () => {
      const event = makeUserEvent(
        userEntitledId,
        { uuid: "CUR-NONEXISTENT" },
        { week: "1" }
      );
      await expect(getOfflinePackHandler(event)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("BR-OCP-01 & BR-OCP-04: returns signed manifest with 7-day lease and sha256 checksums", async () => {
      const event = makeUserEvent(
        userEntitledId,
        { uuid: curriculumCode },
        { week: "1" }
      );
      const manifest = await getOfflinePackHandler(event);

      expect(manifest.pack_id).toContain(curriculumCode);
      expect(manifest.curriculum_code).toBe(curriculumCode);
      expect(manifest.week_number).toBe(1);
      expect(manifest.lease_token).toBeDefined();
      expect(manifest.lease_expires_at).toBeDefined();
      expect(manifest.total_size_bytes).toBeGreaterThan(0);
      expect(manifest.assets.length).toBeGreaterThanOrEqual(2);
      expect(manifest.manifest_checksum_sha256).toMatch(SHA256_HEX_REGEX);

      for (const asset of manifest.assets) {
        expect(asset.path).toBeDefined();
        expect(asset.size_bytes).toBeGreaterThan(0);
        expect(asset.sha256).toMatch(SHA256_HEX_REGEX);
      }

      // Verify audit log entry
      const db = getOwnerDb();
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "pwa.offline_pack.manifest_generated"));
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /api/users/offline/sync (BR-PWA-08, BR-OCP-06, BR-OFF-04)", () => {
    it("rejects unauthenticated caller with 401", async () => {
      const event = makeUserEvent(
        null,
        {},
        {},
        {
          events: [
            {
              session_uuid: "7b4df498-8422-487a-8f5b-51ba28bbcb37",
              seq: 1,
              event_name: "game_started",
            },
          ],
        }
      );
      await expect(syncOfflineEventsHandler(event)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("rejects invalid payload format with 422 VALIDATION_FAILED", async () => {
      const event = makeUserEvent(
        userEntitledId,
        {},
        {},
        { events: "invalid" }
      );
      await expect(syncOfflineEventsHandler(event)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it("BR-OCP-06: safely syncs offline telemetry events, deduplicates replayed events, and records audit log", async () => {
      const db = getOwnerDb();
      const sessionUuid = crypto.randomUUID();

      // Seed play session
      await db
        .insert(playSessions)
        .values({
          sessionUuid,
          childProfileId,
          gameLevelId,
          contentVersion: 1,
          templateId,
          startedAt: new Date(),
          completionStatus: "in_progress",
        })
        .onConflictDoNothing()
        .returning();

      const syncPayload = {
        events: [
          {
            session_uuid: sessionUuid,
            seq: 1,
            event_name: "game_started",
            occurred_at_ms: 100,
            payload: { template_code: "D1_COUNT" },
          },
          {
            session_uuid: sessionUuid,
            seq: 2,
            event_name: "answer_correct",
            occurred_at_ms: 2500,
            payload: { round_index: 0 },
          },
        ],
      };

      // 1. First sync -> 2 synced
      const event1 = makeUserEvent(userEntitledId, {}, {}, syncPayload);
      const res1 = await syncOfflineEventsHandler(event1);
      expect(res1.synced_count).toBe(2);
      expect(res1.duplicates_skipped).toBe(0);

      // Verify events in db
      const ingested = await db
        .select()
        .from(telemetryEvents)
        .where(eq(telemetryEvents.sessionUuid, sessionUuid));
      expect(ingested.length).toBe(2);

      // 2. Replay duplicate sync -> 0 synced, 2 skipped
      const event2 = makeUserEvent(userEntitledId, {}, {}, syncPayload);
      const res2 = await syncOfflineEventsHandler(event2);
      expect(res2.synced_count).toBe(0);
      expect(res2.duplicates_skipped).toBe(2);

      // Verify audit log entry pwa.offline_pack.synced (BR-PWA-08, BR-OCP-06)
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "pwa.offline_pack.synced"));
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
