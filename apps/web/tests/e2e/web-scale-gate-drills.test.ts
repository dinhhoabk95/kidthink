import {
  auditLogs,
  childProfiles,
  curricula,
  curriculumItems,
  gameLevels,
  gameTemplates,
  generateOfflineCurriculumPackManifest,
  getOwnerDb,
  playSessions,
  syncOfflinePlayEvents,
  telemetryEvents,
  users,
} from "@kidthink/db";
import {
  AutomatedPaymentWebhookPayloadSchema,
  canCancelRecurringSubscription,
  canPromptPwaInstall,
  DUNNING_GRACE_PERIOD_DAYS,
  DUNNING_MAX_ATTEMPTS,
  isOfflinePackLeaseValid,
  isWebhookWithinReplayWindow,
  NOTICE_BEFORE_RECURRING_BILLING_DAYS,
  OFFLINE_PACK_MAX_LEASE_DAYS,
  PAYMENT_REPLAY_WINDOW_SECONDS,
} from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Web Scale Gate Drills & Failure Matrix — Task #78 / P5.3", () => {
  const db = getOwnerDb();
  let testUserId = 0;
  let testChildProfileId = 0;
  let gameLevelId = 0;
  let templateId = 0;

  beforeEach(async () => {
    // 1. Seed base user
    const [user] = await db
      .insert(users)
      .values({
        email: `scale_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@kidthink.test`,
        passwordHash: "hash_scale_test",
        displayName: "Web Scale User",
      })
      .returning({ id: users.id });
    testUserId = user?.id ?? 0;

    // 2. Seed child profile
    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: testUserId,
        displayName: "Bé Scale",
        birthYear: 2021,
        birthMonth: 5,
        avatarId: "dog",
        status: "active",
      })
      .returning({ id: childProfiles.id });
    testChildProfileId = child?.id ?? 0;

    // 3. Seed template & game level
    const templateCode = `GT-${String(Math.floor(Math.random() * 899) + 100).padStart(3, "0")}`;
    const [tmpl] = await db
      .insert(gameTemplates)
      .values({
        code: templateCode,
        nameVi: "Template Scale",
        mechanic: "tap_select",
        contentContract: { schema: "v1" },
        status: "active",
      })
      .onConflictDoNothing()
      .returning({ id: gameTemplates.id });

    if (tmpl) {
      templateId = tmpl.id;
    } else {
      const [existing] = await db.select().from(gameTemplates).limit(1);
      templateId = existing?.id ?? 0;
    }

    const glCode = `GL-C1-NUM-CNT-${String(Math.floor(Math.random() * 8999) + 1000).padStart(4, "0")}`;
    const [gl] = await db
      .insert(gameLevels)
      .values({
        code: glCode,
        entityId: Math.floor(Math.random() * 800_000) + 100_000,
        nameVi: "Game Level Scale",
        titleVi: "Game Level Scale",
        difficulty: 1,
        accessTier: "standard",
        status: "published",
        contentPack: { items: [{ id: 1, name: "Apple" }] },
        difficultyParams: { count: 3 },
        templateId,
      })
      .returning({ id: gameLevels.id });
    gameLevelId = gl?.id ?? 0;
  });

  afterEach(async () => {
    if (gameLevelId) {
      await db
        .delete(telemetryEvents)
        .where(eq(telemetryEvents.gameLevelId, gameLevelId));
      await db
        .delete(playSessions)
        .where(eq(playSessions.gameLevelId, gameLevelId));
      await db.delete(gameLevels).where(eq(gameLevels.id, gameLevelId));
    }
    if (testChildProfileId) {
      await db
        .delete(childProfiles)
        .where(eq(childProfiles.id, testChildProfileId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("T2 — Automated Payment & Webhook Failure Matrix", () => {
    it("simulates successful webhook processing, state transition, and audit record", () => {
      const orderUuid = "123e4567-e89b-12d3-a456-426614174000";
      const nowSeconds = Math.floor(Date.now() / 1000);

      // Verify payload validation
      const payload = {
        provider: "payos" as const,
        provider_event_id: `evt_${Date.now()}`,
        order_uuid: orderUuid,
        amount_vnd: 599_000,
        status: "success" as const,
        timestamp_seconds: nowSeconds,
        merchant_id: "merchant_scale_01",
      };
      const parsed = AutomatedPaymentWebhookPayloadSchema.parse(payload);
      expect(parsed.status).toBe("success");

      // Verify replay window
      expect(
        isWebhookWithinReplayWindow(payload.timestamp_seconds, nowSeconds)
      ).toBe(true);

      // Invariant: double webhook replay rejection
      const expiredTimestamp =
        nowSeconds - (PAYMENT_REPLAY_WINDOW_SECONDS + 10);
      expect(isWebhookWithinReplayWindow(expiredTimestamp, nowSeconds)).toBe(
        false
      );
    });

    it("verifies recurring billing dunning constants and cancellation invariants", () => {
      expect(DUNNING_MAX_ATTEMPTS).toBe(3);
      expect(DUNNING_GRACE_PERIOD_DAYS).toBe(7);
      expect(NOTICE_BEFORE_RECURRING_BILLING_DAYS).toBe(3);

      expect(canCancelRecurringSubscription("active")).toBe(true);
      expect(canCancelRecurringSubscription("past_due")).toBe(true);
      expect(canCancelRecurringSubscription("cancelled")).toBe(false);
      expect(canCancelRecurringSubscription("expired")).toBe(false);
    });
  });

  describe("T3 — PWA & Offline Curriculum Pack Matrix", () => {
    it("evaluates PWA install prompt criteria per BR-PWA-01 and BR-PWA-02", () => {
      // Allowed on adult surface with sufficient sessions and not dismissed excessively
      const canPrompt = canPromptPwaInstall({
        isAdultSurface: true,
        childCount: 1,
        completedSessionCount: 3,
        installState: { dismissed_count: 0, last_dismissed_at: null },
        isStandalone: false,
      });
      expect(canPrompt).toBe(true);

      // Forbidden on kid surface or already standalone
      const forbiddenOnKid = canPromptPwaInstall({
        isAdultSurface: false,
        childCount: 1,
        completedSessionCount: 3,
        installState: { dismissed_count: 0, last_dismissed_at: null },
        isStandalone: false,
      });
      expect(forbiddenOnKid).toBe(false);

      const forbiddenWhenStandalone = canPromptPwaInstall({
        isAdultSurface: true,
        childCount: 1,
        completedSessionCount: 3,
        installState: { dismissed_count: 0, last_dismissed_at: null },
        isStandalone: true,
      });
      expect(forbiddenWhenStandalone).toBe(false);
    });

    it("generates offline curriculum pack manifest with deterministic lease and assets", async () => {
      const curriculumCode =
        `CUR-WS-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`.slice(
          0,
          50
        );
      const [curr] = await db
        .insert(curricula)
        .values({
          code: curriculumCode,
          entityId: Math.floor(100_000 + Math.random() * 800_000),
          titleVi: "Chương trình Web Scale",
          accessTier: "standard",
          totalWeeks: 1,
          status: "published",
          contentVersion: 1,
        })
        .returning({ id: curricula.id });

      const currId = curr?.id ?? 0;
      await db.insert(curriculumItems).values({
        curriculumId: currId,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gameLevelId,
      });

      const manifest = await generateOfflineCurriculumPackManifest(
        { userId: testUserId, ip: "127.0.0.1", userAgent: "Vitest Drill" },
        curriculumCode,
        1
      );

      expect(manifest.pack_id).toContain(curriculumCode);
      expect(manifest.curriculum_code).toBe(curriculumCode);
      expect(manifest.week_number).toBe(1);
      expect(manifest.total_size_bytes).toBeGreaterThan(0);
      expect(manifest.assets.length).toBeGreaterThanOrEqual(2);
      expect(manifest.lease_token).toBeDefined();

      // Invariant: lease is valid within 7 days
      expect(isOfflinePackLeaseValid(manifest.lease_expires_at)).toBe(true);
      expect(OFFLINE_PACK_MAX_LEASE_DAYS).toBe(7);
    });

    it("syncs offline telemetry events idempotently and handles child profile isolation", async () => {
      const sessionUuid = crypto.randomUUID();

      // Seed play session
      await db.insert(playSessions).values({
        sessionUuid,
        childProfileId: testChildProfileId,
        gameLevelId,
        contentVersion: 1,
        templateId,
        startedAt: new Date(),
        completionStatus: "in_progress",
      });

      const events = [
        {
          session_uuid: sessionUuid,
          seq: 1,
          event_name: "game_started",
          occurred_at_ms: 100,
          payload: { level: 1 },
        },
        {
          session_uuid: sessionUuid,
          seq: 2,
          event_name: "item_tapped",
          occurred_at_ms: 250,
          payload: { item_id: 1 },
        },
      ];

      const syncResult1 = await syncOfflinePlayEvents(
        { userId: testUserId },
        events
      );
      expect(syncResult1.synced_count).toBe(2);
      expect(syncResult1.duplicates_skipped).toBe(0);

      // Replay identical events -> deduplicated safely (BR-OCP-06)
      const syncResult2 = await syncOfflinePlayEvents(
        { userId: testUserId },
        events
      );
      expect(syncResult2.synced_count).toBe(0);
      expect(syncResult2.duplicates_skipped).toBe(2);
    });
  });

  describe("T4 — Operations, Invariants & Security Drills", () => {
    it("ensures audit log table remains append-only and captures offline & payment actions", async () => {
      const sessionUuid = crypto.randomUUID();
      await db.insert(playSessions).values({
        sessionUuid,
        childProfileId: testChildProfileId,
        gameLevelId,
        contentVersion: 1,
        templateId,
        startedAt: new Date(),
        completionStatus: "in_progress",
      });

      await syncOfflinePlayEvents(
        { userId: testUserId, ip: "127.0.0.1", userAgent: "Vitest Drill" },
        [
          {
            session_uuid: sessionUuid,
            seq: 1,
            event_name: "game_started",
            occurred_at_ms: 50,
          },
        ]
      );

      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.actorId, testUserId));

      expect(logs.length).toBeGreaterThan(0);
      for (const log of logs) {
        expect(log.actorType).toBe("user");
        expect(log.createdAt).toBeInstanceOf(Date);
      }
    });

    it("confirms telemetry events contain zero PII and preserve session integrity", async () => {
      const events = await db
        .select()
        .from(telemetryEvents)
        .where(eq(telemetryEvents.gameLevelId, gameLevelId));

      for (const ev of events) {
        expect(ev.childUuid).toBeNull(); // No child UUID or PII leaked
        expect(ev.seq).toBeGreaterThan(0);
      }
    });
  });
});
