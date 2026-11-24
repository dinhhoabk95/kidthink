import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  CHILD_STATUS,
  CONSENT_ACTION,
  CONSENT_TYPE,
  consentLogs,
  DB,
  ENTITLEMENT_GROUP,
  entitlementKeys,
  MFA_RECOVERY_STATUS,
  USER_STATUS,
  userSessions,
} from "#src/index";
import { truncateAllTestTables } from "#tests/global-setup";
import {
  runOpsAndNotificationsScenario,
  runOrdersEntitlementsSubscriptionsScenario,
} from "#tests/repositories/parity-core-scenarios";
import {
  CHILD_1_UUID,
  expectInsertOnlyViolation,
  FIXED_EXPIRES_FUTURE,
  FIXED_EXPIRES_PAST,
  FIXED_T0,
  FIXED_T1,
  FIXED_T2,
  FIXED_T3,
  MFA_REQ_1_UUID,
  MFA_REQ_2_UUID,
  ORDER_1_UUID,
  runBoth,
  seedAdminManager,
  seedChildPair,
  seedUserPair,
  UUID_V4_REGEX,
} from "#tests/repositories/parity-helpers";

describe("Cross-Driver Repository Parity — Core Platform (SQLite Local vs Cloudflare D1)", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(FIXED_T2);
    await truncateAllTestTables();
    DB.configureSqlite({ dataDir: ":memory:" });
  });

  afterEach(async () => {
    vi.useRealTimers();
    DB.resetDefaultConnection();
    DB.clearD1Bindings();
    await DB.getSqliteDriver().disconnect();
  });

  afterAll(async () => {
    await truncateAllTestTables();
  });

  it("SystemRepository.ping succeeds identically on both sqlite and d1", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ repos }) => {
      await repos.system.ping();
      return { ok: true };
    });
    expect(fromSqlite).toStrictEqual(fromD1);
  });

  it("UsersRepository & ManagersRepository return identical Entities, pagination, and session activity maps", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ name, repos }) => {
      const { u1, u2 } = await seedUserPair(repos);
      const byUpperEmail = await repos.users.findByEmail(
        "PARENT.ALPHA@MINDKID.VN"
      );
      const updatedU1 = await repos.users.updateProfile(u1.id, {
        displayName: "Mẹ Minh Anh",
        image: "avatars/u1.webp",
        twoFactorEnabled: true,
        updatedAt: FIXED_T2,
      });
      const bumpedU1 = await repos.users.incrementSessionVersion(u1.id);

      await DB.connection(name).insert(userSessions).values({
        userId: u1.id,
        token: "sess-shared-1",
        expiresAt: FIXED_EXPIRES_FUTURE,
        updatedAt: FIXED_T1,
        createdAt: FIXED_T0,
      });

      const [searchPage, fullPage1, cursorPage1, lastActiveMap] =
        await Promise.all([
          repos.users.listPaginated({
            q: "MINH ANH",
            status: USER_STATUS.ACTIVE,
            page: 1,
            limit: 10,
          }),
          repos.users.listPaginated({ page: 1, limit: 1 }),
          repos.users.listCursorForManager({
            limit: 1,
            sort: "created_desc",
          }),
          repos.users.mapLastActiveByUsers([u1.id, u2.id]),
        ]);
      const cursorPage2 = await repos.users.listCursorForManager({
        cursor: cursorPage1.nextCursor ?? undefined,
        limit: 5,
        sort: "created_asc",
      });

      const manager = await seedAdminManager(repos, "Super.Admin@MindKid.VN");
      const mgrByEmail = await repos.managers.findByEmail(
        "super.admin@mindkid.vn"
      );
      const bumpedMgr = await repos.managers.incrementSessionVersion(
        manager.id
      );
      const allManagers = await repos.managers.listAll();

      return {
        u2,
        byUpperEmail,
        updatedU1,
        bumpedU1,
        searchPage,
        fullPage1,
        cursorPage1,
        cursorPage2,
        lastActiveEntries: Array.from(lastActiveMap.entries()),
        mgrByEmail,
        bumpedMgr,
        allManagers,
      };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.bumpedU1?.sessionVersion).toBe(1);
    expect(fromSqlite.bumpedU1?.twoFactorEnabled).toBe(true);
    expect(fromSqlite.bumpedU1?.updatedAt).toBeInstanceOf(Date);
    expect(fromSqlite.searchPage.total).toBe(1);
    expect(fromSqlite.fullPage1.hasMore).toBe(true);
    expect(fromSqlite.cursorPage1.hasMore).toBe(true);
    expect(fromSqlite.cursorPage1.nextCursor).toBe(2);
    expect(fromSqlite.cursorPage2.items).toHaveLength(1);
    expect(fromSqlite.lastActiveEntries).toStrictEqual([[1, FIXED_T1]]);
    expect(fromSqlite.bumpedMgr?.sessionVersion).toBe(1);
  });

  it("AuthAccountsRepository & MfaRecoveryRepository execute credential upsert, hidden secrets, and recovery states identically", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ repos }) => {
      const { u1 } = await seedUserPair(repos);
      const manager = await seedAdminManager(repos, "sec@mindkid.vn");

      const cred1 = await repos.authAccounts.upsertUserCredentialAccount(
        u1.id,
        "$argon2id$hash-v1",
        FIXED_T0
      );
      const cred2 = await repos.authAccounts.upsertUserCredentialAccount(
        u1.id,
        "$argon2id$hash-v2",
        FIXED_T1
      );
      const [accounts, socialAccounts, foundCred, foundCredAuth, loginCount] =
        await Promise.all([
          repos.authAccounts.listUserAccounts(u1.id),
          repos.authAccounts.listSocialAccountsForUser(u1.id),
          repos.authAccounts.findUserCredentialAccount(u1.id),
          repos.authAccounts.findUserCredentialAccountForAuth(u1.id),
          repos.authAccounts.countUserLoginMethods(u1.id),
        ]);

      const verifActive = await repos.authAccounts.createUserVerification({
        identifier: "email-verify:u1",
        value: "tok-active",
        expiresAt: FIXED_EXPIRES_FUTURE,
        createdAt: FIXED_T0,
      });
      await repos.authAccounts.createUserVerification({
        identifier: "email-verify:u1-old",
        value: "tok-expired",
        expiresAt: FIXED_EXPIRES_PAST,
        createdAt: FIXED_T0,
      });
      const [activeVerif, prefixVerifs, deletedVerif] = await Promise.all([
        repos.authAccounts.findActiveUserVerification(
          "email-verify:u1",
          FIXED_T2
        ),
        repos.authAccounts.listActiveUserVerificationsByPrefix(
          "email-verify:",
          FIXED_T2
        ),
        repos.authAccounts.deleteUserVerificationById(verifActive.id),
      ]);

      const req1 = await repos.mfaRecovery.createRequest({
        uuid: MFA_REQ_1_UUID,
        userId: u1.id,
        requestedByManagerId: manager.id,
        reason: "Mất điện thoại",
        verificationTokenHash: "sha256-mfa-1",
        verificationTokenExpiresAt: FIXED_EXPIRES_FUTURE,
        eligibleAt: FIXED_T3,
        createdAt: FIXED_T0,
      });
      const req2 = await repos.mfaRecovery.createRequest({
        uuid: MFA_REQ_2_UUID,
        userId: u1.id,
        requestedByManagerId: manager.id,
        reason: "Tạo nhầm",
        eligibleAt: FIXED_T3,
        createdAt: FIXED_T1,
      });
      const [byUserUuid, byHash, verified1, cancelled2] = await Promise.all([
        repos.mfaRecovery.findByUuidForUser(MFA_REQ_1_UUID, u1.id),
        repos.mfaRecovery.findByTokenHash("sha256-mfa-1"),
        repos.mfaRecovery.markEmailVerified(req1.id, FIXED_T1),
        repos.mfaRecovery.markCancelled(req2.id, FIXED_T2),
      ]);
      const completed1 = await repos.mfaRecovery.markCompleted(
        req1.id,
        manager.id,
        FIXED_T3
      );
      const byUserList = await repos.mfaRecovery.listByUser(u1.id);

      return {
        cred1,
        cred2,
        accounts,
        socialAccounts,
        foundCred,
        foundCredAuth,
        loginCount,
        activeVerif,
        prefixVerifs,
        deletedVerif,
        byUserUuid,
        byHash,
        verified1,
        cancelled2,
        completed1,
        byUserList,
      };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect("password" in fromSqlite.cred2).toBe(false);
    expect(
      fromSqlite.foundCred ? "password" in fromSqlite.foundCred : true
    ).toBe(false);
    expect(fromSqlite.foundCredAuth?.password).toBe("$argon2id$hash-v2");
    expect(fromSqlite.loginCount).toBe(1);
    expect(fromSqlite.prefixVerifs).toHaveLength(1);
    expect(fromSqlite.deletedVerif).toBe(true);
    expect(fromSqlite.completed1?.status).toBe(MFA_RECOVERY_STATUS.COMPLETED);
    expect(fromSqlite.cancelled2?.status).toBe(MFA_RECOVERY_STATUS.CANCELLED);
  });

  it("ConsentsRepository records history, resolves latest per type, and enforces BR-DM-05 INSERT-only on both drivers", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ repos }) => {
      const { u1 } = await seedUserPair(repos);
      const cTerms = await repos.consents.recordConsent({
        userId: u1.id,
        consentType: CONSENT_TYPE.TERMS,
        action: CONSENT_ACTION.ACCEPTED,
        ipAddress: "203.0.113.10",
        userAgent: "Safari/18.1",
        createdAt: FIXED_T0,
      });
      await repos.consents.recordConsent({
        userId: u1.id,
        consentType: CONSENT_TYPE.CHILD_DATA,
        action: CONSENT_ACTION.ACCEPTED,
        ipAddress: "203.0.113.10",
        userAgent: "Safari/18.1",
        createdAt: FIXED_T0,
      });
      const cWithdrawn = await repos.consents.recordConsent({
        userId: u1.id,
        consentType: CONSENT_TYPE.CHILD_DATA,
        action: CONSENT_ACTION.WITHDRAWN,
        ipAddress: "203.0.113.10",
        userAgent: "Safari/18.1",
        createdAt: FIXED_T1,
      });

      const [allByUser, latest] = await Promise.all([
        repos.consents.listByUser(u1.id),
        repos.consents.getLatestByUser(u1.id),
      ]);
      return { cTerms, cWithdrawn, allByUser, latest };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.latest[CONSENT_TYPE.CHILD_DATA]?.action).toBe(
      CONSENT_ACTION.WITHDRAWN
    );
    expect(fromSqlite.latest[CONSENT_TYPE.PRIVACY]).toBeNull();
    expect(fromSqlite.cTerms.createdAt).toBeInstanceOf(Date);

    const sqliteDb = DB.connection("sqlite");
    await expectInsertOnlyViolation(async () => {
      await sqliteDb
        .update(consentLogs)
        .set({ ipAddress: "1.1.1.1" })
        .where(eq(consentLogs.id, 1));
    });
    await expectInsertOnlyViolation(async () => {
      await sqliteDb.delete(consentLogs).where(eq(consentLogs.id, 1));
    });
  });

  it("ChildProfilesRepository, ChildStickersRepository, & KidWorldRepository match identically with 404 ownership isolation", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ repos }) => {
      const { u1, u2 } = await seedUserPair(repos);
      const { c1, c2 } = await seedChildPair(repos, u1.id);

      const [
        ownerLookup,
        strangerLookup,
        strangerArchive,
        countsBefore,
        archivedC2,
      ] = await Promise.all([
        repos.childProfiles.findByUuidForUser(CHILD_1_UUID, u1.id),
        repos.childProfiles.findByUuidForUser(CHILD_1_UUID, u2.id),
        repos.childProfiles.archive(c1.id, u2.id, FIXED_T2),
        repos.childProfiles.countByUsers([u1.id, u2.id]),
        repos.childProfiles.archive(c2.id, u1.id, FIXED_T2),
      ]);
      const [activeAfterArchive, allAfterArchive, allCountsMap] =
        await Promise.all([
          repos.childProfiles.listActiveByUser(u1.id),
          repos.childProfiles.listAllByUser(u1.id),
          repos.childProfiles.countAllByUsers([u1.id, u2.id]),
        ]);

      const sticker1 = await repos.childStickers.awardIfAbsent({
        childProfileId: c1.id,
        playSessionId: null,
        themeCode: "farm",
        emoji: "🐮",
        label: "Bò sữa",
        awardedAt: FIXED_T1,
      });
      const [stickersByChild, ownedEmojis] = await Promise.all([
        repos.childStickers.listByChild(c1.id, "farm"),
        repos.childStickers.listOwnedEmojis(c1.id, "farm"),
      ]);

      await repos.kidWorld.replaceThemePlacements(
        c1.id,
        "farm",
        [
          {
            emoji: "🐮",
            instanceIndex: 0,
            normX: 0.25,
            normY: 0.75,
            scale: 1.2,
          },
        ],
        FIXED_T2
      );
      const [placements, gearUpserted] = await Promise.all([
        repos.kidWorld.listPlacements(c1.id, "farm"),
        repos.kidWorld.upsertEquippedGear(c1.id, "hat-straw", FIXED_T2),
      ]);
      const gearFetched = await repos.kidWorld.getEquippedGear(c1.id);

      return {
        ownerLookup,
        strangerLookup,
        strangerArchive,
        countsBefore,
        archivedC2,
        activeAfterArchive,
        allAfterArchive,
        allCountsEntries: Array.from(allCountsMap.entries()),
        sticker1,
        stickersByChild,
        ownedEmojis,
        placements,
        gearUpserted,
        gearFetched,
      };
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.strangerLookup).toBeNull();
    expect(fromSqlite.strangerArchive).toBeNull();
    expect(fromSqlite.countsBefore).toStrictEqual({ 1: 2, 2: 0 });
    expect(fromSqlite.archivedC2?.status).toBe(CHILD_STATUS.ARCHIVED);
    expect(fromSqlite.activeAfterArchive).toHaveLength(1);
    expect(fromSqlite.allAfterArchive).toHaveLength(2);
    expect(fromSqlite.allCountsEntries).toStrictEqual([[1, 2]]);
    expect(fromSqlite.ownedEmojis).toStrictEqual(["🐮"]);
    expect(fromSqlite.placements[0]?.normX).toBe(0.25);
    expect(fromSqlite.gearFetched?.equippedGearCode).toBe("hat-straw");
  });

  it("OrdersRepository, EntitlementsRepository, & RecurringSubscriptionsRepository match identically", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ name, repos }) => {
      await DB.connection(name).insert(entitlementKeys).values({
        key: "content.standard",
        group: ENTITLEMENT_GROUP.CONTENT,
        label: "Truy cập gói Tiêu chuẩn",
        isMvp: true,
        createdAt: FIXED_T0,
        updatedAt: FIXED_T0,
      });
      const { u1, u2 } = await seedUserPair(repos);
      const manager = await seedAdminManager(repos, "billing-admin@mindkid.vn");
      return await runOrdersEntitlementsSubscriptionsScenario(
        repos,
        u1.id,
        u2.id,
        manager.id
      );
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.activePending?.uuid).toBe(ORDER_1_UUID);
    expect(fromSqlite.strangerView).toBeNull();
    expect(fromSqlite.queuePage.items).toHaveLength(2);
    expect(fromSqlite.queuePage.items[0]?.user.email).toBeDefined();
    expect(fromSqlite.queueStats.pendingCount).toBe(2);
    expect(fromSqlite.dupRefs).toStrictEqual(["VCB-DUP-001"]);
    expect(fromSqlite.priorRejectedIds).toStrictEqual([2]);
    expect(fromSqlite.approved1?.amountVnd).toBe(990_000);
    expect(fromSqlite.hasActiveNow).toBe(true);
    expect(fromSqlite.hasAfterExpiry).toBe(false);
    expect(fromSqlite.reminderList).toHaveLength(1);
    expect(fromSqlite.dueRenewal).toHaveLength(1);
    expect(fromSqlite.dueDunning).toHaveLength(1);
    expect(fromSqlite.foundTxn?.rawPayload).toStrictEqual({ bank: "VCB" });
  });

  it("AuditLogs & Notifications Repositories match identically across SQLite and D1", async () => {
    const { fromSqlite, fromD1 } = await runBoth(async ({ repos }) => {
      const { u1 } = await seedUserPair(repos);
      const manager = await seedAdminManager(repos, "ops-admin@mindkid.vn");
      const res = await runOpsAndNotificationsScenario(
        repos,
        u1.id,
        manager.id
      );
      expect(res.deliveryUuid).toMatch(UUID_V4_REGEX);
      const { deliveryUuid: _omitUuid, ...rest } = res;
      return rest;
    });

    expect(fromSqlite).toStrictEqual(fromD1);
    expect(fromSqlite.audit1.afterData).toStrictEqual({
      status: "submitted",
      proof: "proofs/order-std.webp",
    });
    expect(fromSqlite.auditsExport).toHaveLength(2);
    expect(fromSqlite.isDispatched).toBe(true);
    expect(fromSqlite.managerNotifCount).toBe(1);
  });
});
