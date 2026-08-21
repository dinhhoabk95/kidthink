import { describe, expect, it } from "vitest";
import {
  readComplianceRouteFiles,
  scanAdminChildProfilesBoundToUser,
  scanAdminChildProfilesNoDelete,
  scanAdminChildProfilesNoPatchExceptArchive,
  scanAdminNoPasswordWrite,
  scanAdminQueryNoChildNameParam,
  scanAdminRouteGates,
  scanAdminUsersNoDelete,
} from "./child-data-compliance.ts";

const ERR_USM_07 = /BR-USM-07 VIOLATION/;
const ERR_USM_08 = /BR-USM-08 VIOLATION/;
const ERR_CPA_01 = /BR-CPA-01 VIOLATION/;
const ERR_CPA_06 = /BR-CPA-06 VIOLATION/;
const ERR_CPA_07 = /BR-CPA-07 VIOLATION/;
const ERR_CPA_08 = /BR-CPA-08 VIOLATION/;
const ERR_PAY_08 = /BR-PAY-08 VIOLATION/;

describe("Admin Route Compliance Gates — Task 1 / D-JB (BR-USM-07, BR-USM-08, BR-CPA-01, BR-CPA-06, BR-CPA-07, BR-CPA-08)", () => {
  const cleanAdminRoutes = [
    {
      filePath: "apps/web/server/api/managers/users/index.get.ts",
      content: `
        import { defineEventHandler } from "h3";
        export default defineEventHandler(async (event) => {
          return { items: [], next_cursor: null };
        });
      `,
    },
    {
      filePath: "apps/web/server/api/managers/users/[uuid].get.ts",
      content: `
        import { defineEventHandler } from "h3";
        import { childProfiles } from "@mindkid/db";
        export default defineEventHandler(async (event) => {
          const children = await db.select().from(childProfiles).where(eq(childProfiles.userId, user.id));
          return { account: {}, child_profiles: children };
        });
      `,
    },
    {
      filePath: "apps/web/server/api/managers/children/[uuid]/archive.post.ts",
      content: `
        import { defineEventHandler } from "h3";
        export default defineEventHandler(async (event) => {
          await db.update(childProfiles).set({ status: 'archived' }).where(eq(childProfiles.uuid, childUuid));
          return { success: true };
        });
      `,
    },
  ];

  it("passes cleanly on compliant admin routes", () => {
    expect(() => scanAdminRouteGates(cleanAdminRoutes)).not.toThrow();
  });

  // 1/6: BR-USM-07 negative fixture (DELETE on users table)
  it("BR-USM-07 ca âm: red when admin route deletes users row", () => {
    const dirtyRoutes = [
      {
        filePath: "apps/web/server/api/managers/users/[uuid].delete.ts",
        content: `
          export default defineEventHandler(async (event) => {
            await db.delete(users).where(eq(users.id, 1));
          });
        `,
      },
    ];
    expect(() => scanAdminUsersNoDelete(dirtyRoutes)).toThrowError(ERR_USM_07);
    expect(() => scanAdminRouteGates(dirtyRoutes)).toThrowError(ERR_USM_07);
  });

  // 2/6: BR-USM-08 negative fixture (writes user password_hash)
  it("BR-USM-08 ca âm: red when admin handler writes password_hash", () => {
    const dirtyRoutes = [
      {
        filePath:
          "apps/web/server/api/managers/users/[uuid]/set-password.post.ts",
        content: `
          export default defineEventHandler(async (event) => {
            await db.update(users).set({ passwordHash: 'new-hash' }).where(eq(users.id, 1));
          });
        `,
      },
    ];
    expect(() => scanAdminNoPasswordWrite(dirtyRoutes)).toThrowError(
      ERR_USM_08
    );
    expect(() => scanAdminRouteGates(dirtyRoutes)).toThrowError(ERR_USM_08);
  });

  // 3/6: BR-CPA-01 negative fixture (lists all child profiles system-wide)
  it("BR-CPA-01 ca âm: red when admin route lists child_profiles globally", () => {
    const dirtyRoutes = [
      {
        filePath: "apps/web/server/api/managers/children.get.ts",
        content: `
          export default defineEventHandler(async (event) => {
            const allChildren = await db.select().from(childProfiles);
            return allChildren;
          });
        `,
      },
    ];
    expect(() => scanAdminChildProfilesBoundToUser(dirtyRoutes)).toThrowError(
      ERR_CPA_01
    );
    expect(() => scanAdminRouteGates(dirtyRoutes)).toThrowError(ERR_CPA_01);
  });

  // 4/6: BR-CPA-06 negative fixture (PATCH / modify child profile fields)
  it("BR-CPA-06 ca âm: red when admin route modifies child_profiles fields directly", () => {
    const dirtyRoutes = [
      {
        filePath: "apps/web/server/api/managers/children/[uuid].patch.ts",
        content: `
          export default defineEventHandler(async (event) => {
            await db.update(childProfiles).set({ displayName: 'New Name' });
          });
        `,
      },
    ];
    expect(() =>
      scanAdminChildProfilesNoPatchExceptArchive(dirtyRoutes)
    ).toThrowError(ERR_CPA_06);
    expect(() => scanAdminRouteGates(dirtyRoutes)).toThrowError(ERR_CPA_06);
  });

  // 5/6: BR-CPA-07 negative fixture (DELETE on child_profiles table)
  it("BR-CPA-07 ca âm: red when admin route deletes child_profiles", () => {
    const dirtyRoutes = [
      {
        filePath: "apps/web/server/api/managers/children/[uuid].delete.ts",
        content: `
          export default defineEventHandler(async (event) => {
            await db.delete(childProfiles).where(eq(childProfiles.id, 1));
          });
        `,
      },
    ];
    expect(() => scanAdminChildProfilesNoDelete(dirtyRoutes)).toThrowError(
      ERR_CPA_07
    );
    expect(() => scanAdminRouteGates(dirtyRoutes)).toThrowError(ERR_CPA_07);
  });

  // 6/6: BR-CPA-08 negative fixture (query schema receives child name parameter)
  it("BR-CPA-08 ca âm: red when admin query schema accepts child name parameter", () => {
    const dirtyRoutes = [
      {
        filePath: "apps/web/server/api/managers/users/search.get.ts",
        content: `
          const querySchema = z.object({
            child_name: z.string().optional(),
          });
        `,
      },
    ];
    expect(() => scanAdminQueryNoChildNameParam(dirtyRoutes)).toThrowError(
      ERR_CPA_08
    );
    expect(() => scanAdminRouteGates(dirtyRoutes)).toThrowError(ERR_CPA_08);
  });

  // BR-PAY-08 / BR-PAP-09: No DELETE route or query on payment_orders
  it("BR-PAY-08 ca âm: red when route or query hard-deletes payment_orders", () => {
    const dirtyRoute1 = [
      {
        filePath: "apps/web/server/api/users/orders/[uuid].delete.ts",
        content: `
          export default defineEventHandler(async (event) => {
            return { cancelled: true };
          });
        `,
      },
    ];
    expect(() => scanAdminRouteGates(dirtyRoute1)).toThrowError(ERR_PAY_08);

    const dirtyRoute2 = [
      {
        filePath: "apps/web/server/api/managers/orders/[uuid]/cancel.post.ts",
        content: `
          export default defineEventHandler(async (event) => {
            await db.delete(paymentOrders).where(eq(paymentOrders.uuid, uuid));
          });
        `,
      },
    ];
    expect(() => scanAdminRouteGates(dirtyRoute2)).toThrowError(ERR_PAY_08);
  });
});

describe("Cổng route quản trị trên repo thật", () => {
  it("mọi route dưới apps/web/server/api tuân thủ BR-USM-07/08, BR-CPA-*, BR-PAY-08", () => {
    const routes = readComplianceRouteFiles();

    expect(routes.length).toBeGreaterThan(0);
    expect(() => scanAdminRouteGates(routes)).not.toThrow();
  });
});
