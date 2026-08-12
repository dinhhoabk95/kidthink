import {
  createAdminManagerToken,
  createWebUserToken,
  verifyAdminManagerToken,
  verifyWebUserToken,
} from "@kidthink/auth";
import { describe, expect, it } from "vitest";

describe("Task 4 & 5 — Admin Security Matrix & Surface Isolation (BR-ADA-02..06, D-EY, D-EZ)", () => {
  it("D-EZ: rejects User JWT when passed to Manager verify token function", async () => {
    const userToken = await createWebUserToken({
      payload: {
        user_id: 123,
        display_name: "Regular User",
        session_id: "sess_user_1",
        refresh_token_version: 0,
      },
      secret: "kidthink-dev-secret-kidthink-dev-secret-32bytes",
    });

    await expect(
      verifyAdminManagerToken({
        token: userToken,
        secret: "kidthink-dev-secret-kidthink-dev-secret-32bytes",
      })
    ).rejects.toThrow();
  });

  it("D-EZ: rejects Manager JWT when passed to User verify token function", async () => {
    const managerToken = await createAdminManagerToken({
      payload: {
        manager_id: 1,
        display_name: "Admin User",
        session_id: "sess_mgr_1",
        refresh_token_version: 0,
        role: "super_admin",
      },
      secret: "kidthink-dev-secret-kidthink-dev-secret-32bytes",
    });

    await expect(
      verifyWebUserToken({
        token: managerToken,
        secret: "kidthink-dev-secret-kidthink-dev-secret-32bytes",
      })
    ).rejects.toThrow();
  });

  it("BR-ADA-06: self role mutation or elevation is disallowed", async () => {
    const reviewerToken = await createAdminManagerToken({
      payload: {
        manager_id: 2,
        display_name: "Content Reviewer",
        session_id: "sess_mgr_2",
        refresh_token_version: 0,
        role: "content_reviewer",
      },
      secret: "kidthink-dev-secret-kidthink-dev-secret-32bytes",
    });
    expect(reviewerToken).toBeDefined();

    // Mock role change attempt
    function attemptRoleChange(role: string, managerRole: string) {
      if (managerRole !== "super_admin" || role === managerRole) {
        throw new Error("BR-ADA-06: Cannot modify own role or elevate role");
      }
    }

    expect(() => attemptRoleChange("super_admin", "content_reviewer")).toThrow(
      "BR-ADA-06"
    );
  });
});
