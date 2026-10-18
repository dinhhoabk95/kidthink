import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  AccessGatingError,
  assertContentAccess,
  CALLER_STATUSES,
  type CallerStatus,
  type ContentTarget,
  getCallerStatus,
  getExpectedGatingStatus,
  getUpgradePackageCodes,
} from "#src/access-gating";
import { allowedTiers, type CallerIdentity } from "#src/access-ladder";
import type { EntitlementKey } from "#src/entitlement-catalog";
import type { AccessTier } from "#src/taxonomy-types";

describe("P1.3 Access Gating (BR-GAT-01 .. BR-GAT-08, BR-LAD-07)", () => {
  const publishedFree: ContentTarget = {
    code: "GL-C1-CNT-CARD-0001",
    access_tier: "free",
    status: "published",
    age_min: 3,
    age_max: 5,
    title: "Đếm hoa quả",
  };

  const publishedFreeOutsideAllowlist: ContentTarget = {
    code: "GL-C1-CNT-CARD-0002",
    access_tier: "free",
    status: "published",
    age_min: 3,
    age_max: 5,
    title: "Đếm hoa quả 2",
  };

  const publishedLogin: ContentTarget = {
    code: "LVL-LOG-001",
    access_tier: "login",
    status: "published",
    age_min: 3,
    age_max: 6,
    title: "Ghép hình logic",
  };

  const publishedStandard: ContentTarget = {
    code: "LVL-STD-001",
    access_tier: "standard",
    status: "published",
    age_min: 4,
    age_max: 6,
    title: "So sánh lớn bé",
  };

  const publishedPremium: ContentTarget = {
    code: "LVL-PRM-001",
    access_tier: "premium",
    status: "published",
    age_min: 5,
    age_max: 6,
    title: "Cộng trừ mầm non",
  };

  const draftStandard: ContentTarget = {
    code: "LVL-STD-DRAFT",
    access_tier: "standard",
    status: "draft",
    age_min: 4,
    age_max: 6,
  };

  const archivedPremium: ContentTarget = {
    code: "LVL-PRM-ARCH",
    access_tier: "premium",
    status: "archived",
    age_min: 5,
    age_max: 6,
  };

  describe("Task 1: Data-driven matrix & Caller status resolution", () => {
    it("CALLER_STATUSES has exact 5 statuses", () => {
      expect(CALLER_STATUSES).toEqual([
        "guest",
        "user_no_child",
        "user_child_no_pkg",
        "user_standard",
        "user_premium",
      ]);
    });

    it("getCallerStatus maps identity and entitlements correctly", () => {
      expect(getCallerStatus({ kind: "guest" })).toBe("guest");

      expect(
        getCallerStatus({ kind: "user", user_id: "u1", active_child_id: null })
      ).toBe("user_no_child");

      expect(
        getCallerStatus(
          { kind: "user", user_id: "u1", active_child_id: "c1" },
          []
        )
      ).toBe("user_child_no_pkg");

      expect(
        getCallerStatus(
          { kind: "user", user_id: "u1", active_child_id: "c1" },
          ["play_standard_games"]
        )
      ).toBe("user_standard");

      expect(
        getCallerStatus(
          { kind: "user", user_id: "u1", active_child_id: "c1" },
          ["play_standard_games", "play_premium_games"]
        )
      ).toBe("user_premium");
    });

    it("getUpgradePackageCodes returns catalog packages for tier", () => {
      expect(getUpgradePackageCodes("premium")).toEqual(["PKG-premium"]);
      expect(getUpgradePackageCodes("standard")).toEqual([
        "PKG-standard",
        "PKG-premium",
      ]);
    });
  });

  describe("Task 2: assertContentAccess 7 steps in exact order (BR-GAT-02)", () => {
    it("Step 1: draft or archived item throws NOT_FOUND 404 (no 403 leak)", async () => {
      try {
        await assertContentAccess(draftStandard, {
          caller: { kind: "guest" },
        });
        expect.unreachable("Should have thrown");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("NOT_FOUND");
        expect(gatingErr.status).toBe(404);
      }

      try {
        await assertContentAccess(archivedPremium, {
          caller: { kind: "guest" },
        });
        expect.unreachable("Should have thrown");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("NOT_FOUND");
        expect(gatingErr.status).toBe(404);
      }
    });

    it("Step 2: effective tier resolves max(level_tier, curriculum_tier)", async () => {
      const mixedItem: ContentTarget = {
        code: "LVL-MIXED",
        access_tier: "free",
        level_tier: "free",
        curriculum_tier: "premium",
        status: "published",
        age_min: 3,
        age_max: 6,
      };

      try {
        await assertContentAccess(mixedItem, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: ["play_standard_games"],
        });
        expect.unreachable(
          "Should have thrown 403 due to curriculum_tier premium"
        );
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("TIER_LOCKED");
        expect(gatingErr.status).toBe(403);
      }
    });

    it("Step 4 before Step 5: user_no_child accessing standard tier throws 428 NO_ACTIVE_CHILD (before tier 403)", async () => {
      try {
        await assertContentAccess(publishedStandard, {
          caller: { kind: "user", user_id: "u1", active_child_id: null },
          activeKeys: [],
        });
        expect.unreachable("Should have thrown 428");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("NO_ACTIVE_CHILD");
        expect(gatingErr.status).toBe(428);
      }
    });

    it("Step 5: allowedTiers check failure throws TIER_LOCKED 403", async () => {
      try {
        await assertContentAccess(publishedPremium, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: ["play_standard_games"],
        });
        expect.unreachable("Should have thrown 403");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("TIER_LOCKED");
        expect(gatingErr.status).toBe(403);
      }
    });

    it("Step 6: quota exhausted throws DAILY_PLAY_CAP_REACHED 402", async () => {
      try {
        await assertContentAccess(publishedStandard, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: ["play_standard_games"],
          checkQuotaRemaining: () => false,
        });
        expect.unreachable("Should have thrown 402");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("DAILY_PLAY_CAP_REACHED");
        expect(gatingErr.status).toBe(402);
      }
    });

    it("Step 7: age outside range returns 200 + age_mismatch: true (D-FP)", async () => {
      const res = await assertContentAccess(publishedStandard, {
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        activeKeys: ["play_standard_games"],
        callerChildAge: 3, // item is 4..6 -> age mismatch!
      });

      expect(res.is_preview).toBe(false);
      expect(res.age_mismatch).toBe(true);
      expect(res.child_id).toBe("c1");
    });
  });

  describe("Task 3: Child Ownership & Security (BR-GAT-04, BR-GAT-07)", () => {
    it("BR-GAT-04: fake active_child_id of user B used by user A throws NOT_FOUND 404", async () => {
      try {
        await assertContentAccess(publishedLogin, {
          caller: { kind: "user", user_id: "userA", active_child_id: "childB" },
          verifyChildOwnership: (_userId, _childId) => false,
        });
        expect.unreachable(
          "Should have thrown 404 for child ownership mismatch"
        );
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("NOT_FOUND");
        expect(gatingErr.status).toBe(404);
      }
    });

    it("BR-GAT-07: guest without token/cookie calling non-free tier returns 403", async () => {
      for (const item of [
        publishedLogin,
        publishedStandard,
        publishedPremium,
      ]) {
        try {
          await assertContentAccess(item, {
            caller: { kind: "guest" },
          });
          expect.unreachable(`Should throw 403 for tier ${item.access_tier}`);
        } catch (err: unknown) {
          expect(err).toBeInstanceOf(AccessGatingError);
          const gatingErr = err as AccessGatingError;
          expect(gatingErr.code).toBe("TIER_LOCKED");
          expect(gatingErr.status).toBe(403);
        }
      }
    });

    it("BR-LAD-07: guest calling free level outside 6-level allow-list throws 403 TIER_LOCKED with access_tier login", async () => {
      try {
        await assertContentAccess(publishedFreeOutsideAllowlist, {
          caller: { kind: "guest" },
        });
        expect.unreachable(
          "Should throw 403 TIER_LOCKED for free level outside guest allow-list"
        );
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("TIER_LOCKED");
        expect(gatingErr.status).toBe(403);
        expect(gatingErr.details?.access_tier).toBe("login");
        expect(gatingErr.details?.required_entitlement).toBe(
          "play_login_games"
        );
      }

      const userRes = await assertContentAccess(publishedFreeOutsideAllowlist, {
        caller: { kind: "user", user_id: "u1", active_child_id: null },
        activeKeys: [],
      });
      expect(userRes.is_preview).toBe(false);
    });

    it("User with expired entitlement throws 403 on new request (BR-LAD-08)", async () => {
      try {
        await assertContentAccess(publishedPremium, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: [], // expired, no keys
        });
        expect.unreachable("Should throw 403");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("TIER_LOCKED");
        expect(gatingErr.status).toBe(403);
      }
    });
  });

  describe("Task 4: Strip Payload on 403 (BR-GAT-03)", () => {
    it("BR-GAT-03: 403 details carries required_entitlement, upgrade_package_codes, preview, stripped content", async () => {
      try {
        await assertContentAccess(publishedPremium, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: ["play_standard_games"],
        });
        expect.unreachable("Should have thrown 403");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("TIER_LOCKED");
        expect(gatingErr.status).toBe(403);

        const details = gatingErr.details as
          | Record<string, unknown>
          | undefined;
        expect(details).toBeDefined();
        expect(details?.code).toBe("TIER_LOCKED");
        expect(details?.access_tier).toBe("premium");
        expect(details?.required_entitlement).toBe("play_premium_games");
        expect(details?.upgrade_package_codes).toEqual(["PKG-premium"]);
        expect(details?.preview).toEqual({
          title: "Cộng trừ mầm non",
          competency: undefined,
          age_min: 5,
          age_max: 6,
          thumbnail_emoji: undefined,
        });

        // Ensure sensitive content fields are NOT present
        expect(details?.content_pack).toBeUndefined();
        expect(details?.difficulty_params).toBeUndefined();
        expect(details?.answers).toBeUndefined();
      }
    });
  });

  describe("Task 5: Manager Preview (BR-GAT-08, D-FQ)", () => {
    it("BR-GAT-08: manager preview sets is_preview = true and bypasses tier/quota check", async () => {
      const res = await assertContentAccess(publishedPremium, {
        caller: { kind: "user", user_id: "mgr1", active_child_id: null },
        isManagerPreview: true,
        managerAudience: true,
        activeKeys: [], // no premium key, but preview bypasses tier!
        checkQuotaRemaining: () => false, // no quota left, but preview bypasses quota!
      });

      expect(res.is_preview).toBe(true);
    });

    it("User without manager audience attempting preview gets 403 INSUFFICIENT_ROLE", async () => {
      try {
        await assertContentAccess(publishedPremium, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          isManagerPreview: true,
          managerAudience: false, // user identity, not manager!
        });
        expect.unreachable("Should throw 403");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AccessGatingError);
        const gatingErr = err as AccessGatingError;
        expect(gatingErr.code).toBe("INSUFFICIENT_ROLE");
        expect(gatingErr.status).toBe(403);
      }
    });
  });

  describe("Task 7: Matrix Test & Property Inclusion Test (BR-GAT-05, BR-GAT-06)", () => {
    const targetsByTier: Record<AccessTier, ContentTarget> = {
      free: publishedFree,
      login: publishedLogin,
      standard: publishedStandard,
      premium: publishedPremium,
    };

    const callerConfigs: Record<
      CallerStatus,
      { caller: CallerIdentity; activeKeys: EntitlementKey[] }
    > = {
      guest: { caller: { kind: "guest" }, activeKeys: [] },
      user_no_child: {
        caller: { kind: "user", user_id: "u1", active_child_id: null },
        activeKeys: [],
      },
      user_child_no_pkg: {
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        activeKeys: [],
      },
      user_standard: {
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        activeKeys: ["play_standard_games"],
      },
      user_premium: {
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        activeKeys: ["play_standard_games", "play_premium_games"],
      },
    };

    it("BR-GAT-05: Matrix tests all 20 cells in 5x4 matrix", async () => {
      const tiers: AccessTier[] = ["free", "login", "standard", "premium"];
      let cellCount = 0;

      for (const callerStatus of CALLER_STATUSES) {
        const config = callerConfigs[callerStatus];
        for (const tier of tiers) {
          cellCount++;
          const target = targetsByTier[tier];
          const expectedStatus = getExpectedGatingStatus(callerStatus, tier);

          if (expectedStatus === 200) {
            const res = await assertContentAccess(target, config);
            expect(res.is_preview).toBe(false);
          } else {
            try {
              await assertContentAccess(target, config);
              expect.unreachable(
                `Cell [${callerStatus}, ${tier}] expected ${expectedStatus} but passed`
              );
            } catch (err: unknown) {
              expect(err).toBeInstanceOf(AccessGatingError);
              const gatingErr = err as AccessGatingError;
              expect(gatingErr.status).toBe(expectedStatus);
            }
          }
        }
      }

      expect(cellCount).toBe(20);
    });

    it("BR-GAT-06: Property test inclusion — canAccess(tier_n) implies canAccess(tier_m) for all m < n", async () => {
      const allEntitlements: EntitlementKey[] = [
        "play_free_games",
        "play_login_games",
        "play_standard_games",
        "play_premium_games",
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.subarray(allEntitlements),
          fc.boolean(),
          async (keys, hasChild) => {
            const caller: CallerIdentity = {
              kind: "user",
              user_id: "u1",
              active_child_id: hasChild ? "c1" : null,
            };

            const allowed = await allowedTiers(caller, keys);
            const tiers: readonly AccessTier[] = [
              "free",
              "login",
              "standard",
              "premium",
            ];

            for (let n = 0; n < tiers.length; n++) {
              const tierN = tiers[n];
              if (!tierN) {
                continue;
              }
              const canAccessN = allowed.includes(tierN);

              if (canAccessN) {
                for (let m = 0; m < n; m++) {
                  const tierM = tiers[m];
                  if (!tierM) {
                    continue;
                  }
                  const canAccessM = allowed.includes(tierM);
                  expect(
                    canAccessM,
                    `Accessing tier ${tierN} must imply access to lower tier ${tierM}`
                  ).toBe(true);
                }
              }
            }
          }
        )
      );
    });
  });

  describe("Task 8: Step 8 Concept Intro Gate Matrix & Exemptions (BR-CIG-01 .. BR-CIG-17)", () => {
    const queueItem1 = {
      intro_level_code: "GL-C1-NUM-INTR-0001",
      skill_code: "C1.NUM.01",
      title: "Làm quen với các con số 1–3",
      thumbnail_emoji: "🔢",
    };
    const queueItem2 = {
      intro_level_code: "GL-C1-CNT-INTR-0001",
      skill_code: "C1.CNT.01",
      title: "Tập đếm từng đồ vật",
      thumbnail_emoji: "🍎",
    };

    interface IntroMatrixRow {
      readonly label: string;
      readonly caller: CallerIdentity;
      readonly lessonRunId?: string | null;
      readonly introCheckResult: {
        readonly intro_required: boolean;
        readonly intro_queue?: readonly (typeof queueItem1)[];
        readonly intro_remaining?: number;
        readonly return_level_code?: string;
        readonly primary_skill_code?: string;
        readonly intro_level_code?: string;
      };
      readonly expectedStatus: 200 | 428;
      readonly expectedQueueLength?: number;
      readonly expectedRemaining?: number;
    }

    // §7.3 Matrix: 2 caller types (guest, child profile) x 5 columns = 10 cells (BR-CIG-12)
    const introMatrixRows: readonly IntroMatrixRow[] = [
      // Guest rows (BR-CIG-07)
      {
        label: "guest | intro_queue rỗng (skill không có bài làm quen)",
        caller: { kind: "guest" },
        introCheckResult: { intro_required: false },
        expectedStatus: 200,
      },
      {
        label: "guest | intro_queue rỗng (đã hoàn thành hết)",
        caller: { kind: "guest" },
        introCheckResult: { intro_required: false },
        expectedStatus: 200,
      },
      {
        label: "guest | intro_queue có 1 mục",
        caller: { kind: "guest" },
        introCheckResult: {
          intro_required: true,
          intro_queue: [queueItem1],
          intro_remaining: 0,
          return_level_code: publishedFree.code,
          primary_skill_code: "C1.CNT.01",
          intro_level_code: queueItem1.intro_level_code,
        },
        expectedStatus: 428,
        expectedQueueLength: 1,
        expectedRemaining: 0,
      },
      {
        label: "guest | intro_queue có 3 mục (cắt còn 2, intro_remaining = 1)",
        caller: { kind: "guest" },
        introCheckResult: {
          intro_required: true,
          intro_queue: [queueItem1, queueItem2],
          intro_remaining: 1,
          return_level_code: publishedFree.code,
          primary_skill_code: "C1.CNT.01",
          intro_level_code: queueItem1.intro_level_code,
        },
        expectedStatus: 428,
        expectedQueueLength: 2,
        expectedRemaining: 1,
      },
      {
        label: "guest | Đang trong lesson_run",
        caller: { kind: "guest" },
        lessonRunId: "lr-guest-001",
        introCheckResult: {
          intro_required: true,
          intro_queue: [queueItem1],
          intro_remaining: 0,
        },
        expectedStatus: 200,
      },
      // Child profile rows (BR-CIG-06)
      {
        label: "child | intro_queue rỗng (skill không có bài làm quen)",
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        introCheckResult: { intro_required: false },
        expectedStatus: 200,
      },
      {
        label: "child | intro_queue rỗng (đã hoàn thành hết)",
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        introCheckResult: { intro_required: false },
        expectedStatus: 200,
      },
      {
        label: "child | intro_queue có 1 mục",
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        introCheckResult: {
          intro_required: true,
          intro_queue: [queueItem1],
          intro_remaining: 0,
          return_level_code: publishedFree.code,
          primary_skill_code: "C1.CNT.01",
          intro_level_code: queueItem1.intro_level_code,
        },
        expectedStatus: 428,
        expectedQueueLength: 1,
        expectedRemaining: 0,
      },
      {
        label: "child | intro_queue có 3 mục (cắt còn 2, intro_remaining = 1)",
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        introCheckResult: {
          intro_required: true,
          intro_queue: [queueItem1, queueItem2],
          intro_remaining: 1,
          return_level_code: publishedFree.code,
          primary_skill_code: "C1.CNT.01",
          intro_level_code: queueItem1.intro_level_code,
        },
        expectedStatus: 428,
        expectedQueueLength: 2,
        expectedRemaining: 1,
      },
      {
        label: "child | Đang trong lesson_run",
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        lessonRunId: "lr-child-001",
        introCheckResult: {
          intro_required: true,
          intro_queue: [queueItem1],
          intro_remaining: 0,
        },
        expectedStatus: 200,
      },
    ];

    interface IntroErrorDetails {
      readonly intro_queue?: readonly (typeof queueItem1)[];
      readonly intro_remaining?: number;
      readonly return_level_code?: string;
      readonly primary_skill_code?: string;
      readonly intro_level_code?: string;
    }

    it("BR-CIG-12, BR-CIG-01, BR-CIG-06, BR-CIG-07, BR-CIG-09, BR-CIG-10: Data-driven test cho đủ 10 ô ma trận §7.3", async () => {
      expect(introMatrixRows).toHaveLength(10);

      for (const row of introMatrixRows) {
        if (row.expectedStatus === 200) {
          const res = await assertContentAccess(publishedFree, {
            caller: row.caller,
            lessonRunId: row.lessonRunId ?? null,
            checkIntroRequired: () => row.introCheckResult,
          });
          expect(res.is_preview, row.label).toBe(false);
        } else {
          try {
            await assertContentAccess(publishedFree, {
              caller: row.caller,
              lessonRunId: row.lessonRunId ?? null,
              checkIntroRequired: () => row.introCheckResult,
            });
            expect.unreachable(
              `Row [${row.label}] expected 428 INTRO_REQUIRED`
            );
          } catch (err) {
            expect(err, row.label).toBeInstanceOf(AccessGatingError);
            if (!(err instanceof AccessGatingError)) {
              throw err;
            }
            expect(err.code, row.label).toBe("INTRO_REQUIRED");
            expect(err.status, row.label).toBe(428);
            const details = (err.details ?? {}) as IntroErrorDetails;
            const queue = details.intro_queue ?? [];
            expect(queue, row.label).toHaveLength(row.expectedQueueLength ?? 0);
            expect(details.intro_remaining, row.label).toBe(
              row.expectedRemaining ?? 0
            );
            expect(details.return_level_code, row.label).toBe(
              publishedFree.code
            );
            expect(details.primary_skill_code, row.label).toBe("C1.CNT.01");
            expect(details.intro_level_code, row.label).toBe(
              queueItem1.intro_level_code
            );
          }
        }
      }
    });

    it("BR-CIG-02, BR-CIG-03, BR-CIG-04, BR-CIG-05: các trường hợp miễn cổng làm quen (teach, lesson_run, preview, không có bài intro)", async () => {
      let hookCalled = false;
      const throwingHook = () => {
        hookCalled = true;
        return {
          intro_required: true,
          intro_queue: [queueItem1],
          intro_remaining: 0,
        };
      };

      // BR-CIG-02: template.kind = 'teach' miễn bước 8 (chống vòng lặp vô hạn)
      const teachLevel: ContentTarget = {
        ...publishedFree,
        code: "GL-C1-CNT-INTR-0001",
        kind: "teach",
        template_kind: "teach",
      };
      await assertContentAccess(teachLevel, {
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        checkIntroRequired: throwingHook,
      });
      expect(hookCalled).toBe(false);

      // BR-CIG-03: đang trong lesson_run miễn bước 8
      await assertContentAccess(publishedFree, {
        caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
        lessonRunId: "lesson-run-123",
        checkIntroRequired: throwingHook,
      });
      expect(hookCalled).toBe(false);

      // BR-CIG-04: manager preview miễn bước 8
      const previewRes = await assertContentAccess(publishedFree, {
        caller: { kind: "manager", manager_id: "m1", role: "content_editor" },
        isManagerPreview: true,
        managerAudience: true,
        checkIntroRequired: throwingHook,
      });
      expect(previewRes.is_preview).toBe(true);
      expect(hookCalled).toBe(false);

      // BR-CIG-05: skill chưa có bài làm quen published -> không chặn
      const noIntroRes = await assertContentAccess(publishedFree, {
        caller: { kind: "guest" },
        checkIntroRequired: () => ({ intro_required: false }),
      });
      expect(noIntroRes.is_preview).toBe(false);
    });

    it("BR-CIG-08, BR-CIG-11, BR-CIG-15, BR-CIG-16: phiên abandoned/bỏ qua vẫn bị chặn 428 INTRO_REQUIRED ở lần mở tiếp theo theo thứ tự topo tiên quyết", async () => {
      // Phiên làm quen trước đó bị abandoned hoặc trẻ chọn bỏ qua -> chưa có completed -> checkIntroRequired trả queue topo [tiên quyết, đích]
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await assertContentAccess(publishedFree, {
            caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
            checkIntroRequired: () => ({
              intro_required: true,
              intro_queue: [queueItem1, queueItem2],
              intro_remaining: 0,
              return_level_code: publishedFree.code,
              primary_skill_code: "C1.CNT.01",
            }),
          });
          expect.unreachable(`Attempt ${attempt} should throw 428`);
        } catch (err) {
          if (!(err instanceof AccessGatingError)) {
            throw err;
          }
          expect(err.code).toBe("INTRO_REQUIRED");
          expect(err.status).toBe(428);
          const details = (err.details ?? {}) as IntroErrorDetails;
          const queue = details.intro_queue ?? [];
          // BR-CIG-15: tiên quyết đứng trước kỹ năng phụ thuộc
          expect(queue[0]?.skill_code).toBe("C1.NUM.01");
          expect(queue[1]?.skill_code).toBe("C1.CNT.01");
          expect(details.intro_level_code).toBe(queueItem1.intro_level_code);
        }
      }
    });
  });
});
