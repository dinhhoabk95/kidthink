import { AppError } from "@kidthink/auth";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  assertContentAccess,
  CALLER_STATUSES,
  type CallerStatus,
  type ContentTarget,
  getCallerStatus,
  getExpectedGatingStatus,
  getUpgradePackageCodes,
} from "../src/access-gating.js";
import { allowedTiers, type CallerIdentity } from "../src/access-ladder.js";
import type { EntitlementKey } from "../src/entitlement-catalog.js";
import type { AccessTier } from "../src/taxonomy-types.js";

describe("P1.3 Access Gating (BR-GAT-01 .. BR-GAT-08)", () => {
  const publishedFree: ContentTarget = {
    code: "LVL-FREE-001",
    access_tier: "free",
    status: "published",
    age_min: 3,
    age_max: 5,
    title: "Đếm hoa quả",
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
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("NOT_FOUND");
        expect(err.status).toBe(404);
      }

      try {
        await assertContentAccess(archivedPremium, {
          caller: { kind: "guest" },
        });
        expect.unreachable("Should have thrown");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("NOT_FOUND");
        expect(err.status).toBe(404);
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
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("TIER_LOCKED");
        expect(err.status).toBe(403);
      }
    });

    it("Step 4 before Step 5: user_no_child accessing standard tier throws 428 NO_ACTIVE_CHILD (before tier 403)", async () => {
      try {
        await assertContentAccess(publishedStandard, {
          caller: { kind: "user", user_id: "u1", active_child_id: null },
          activeKeys: [],
        });
        expect.unreachable("Should have thrown 428");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("NO_ACTIVE_CHILD");
        expect(err.status).toBe(428);
      }
    });

    it("Step 5: allowedTiers check failure throws TIER_LOCKED 403", async () => {
      try {
        await assertContentAccess(publishedPremium, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: ["play_standard_games"],
        });
        expect.unreachable("Should have thrown 403");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("TIER_LOCKED");
        expect(err.status).toBe(403);
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
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("DAILY_PLAY_CAP_REACHED");
        expect(err.status).toBe(402);
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
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("NOT_FOUND");
        expect(err.status).toBe(404);
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
        } catch (err: any) {
          expect(err).toBeInstanceOf(AppError);
          expect(err.code).toBe("TIER_LOCKED");
          expect(err.status).toBe(403);
        }
      }
    });

    it("User with expired entitlement throws 403 on new request (BR-LAD-08)", async () => {
      try {
        await assertContentAccess(publishedPremium, {
          caller: { kind: "user", user_id: "u1", active_child_id: "c1" },
          activeKeys: [], // expired, no keys
        });
        expect.unreachable("Should throw 403");
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("TIER_LOCKED");
        expect(err.status).toBe(403);
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
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("TIER_LOCKED");
        expect(err.status).toBe(403);

        const details = err.details as any;
        expect(details).toBeDefined();
        expect(details.code).toBe("TIER_LOCKED");
        expect(details.access_tier).toBe("premium");
        expect(details.required_entitlement).toBe("play_premium_games");
        expect(details.upgrade_package_codes).toEqual(["PKG-premium"]);
        expect(details.preview).toEqual({
          title: "Cộng trừ mầm non",
          competency: undefined,
          age_min: 5,
          age_max: 6,
          thumbnail_emoji: undefined,
        });

        // Ensure sensitive content fields are NOT present
        expect(details.content_pack).toBeUndefined();
        expect(details.difficulty_params).toBeUndefined();
        expect(details.answers).toBeUndefined();
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
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.code).toBe("INSUFFICIENT_ROLE");
        expect(err.status).toBe(403);
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
            } catch (err: any) {
              expect(err).toBeInstanceOf(AppError);
              expect(err.status).toBe(expectedStatus);
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
            const tiers: AccessTier[] = [
              "free",
              "login",
              "standard",
              "premium",
            ];

            for (let n = 0; n < tiers.length; n++) {
              const tierN = tiers[n];
              const canAccessN = allowed.includes(tierN);

              if (canAccessN) {
                for (let m = 0; m < n; m++) {
                  const tierM = tiers[m];
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
});
