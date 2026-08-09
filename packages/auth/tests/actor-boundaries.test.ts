import { describe, expect, it } from "vitest";
import {
  assertActiveChild,
  checkUserEntitlement,
  verifyChildOwnership,
} from "../src/actor-boundaries";
import type { UserTokenPayload } from "../src/contracts";
import { createAuthContext } from "../src/contracts";
import type { ChildOwnershipPort, EntitlementPort } from "../src/ports";

const userWithChild: UserTokenPayload = {
  user_id: 101,
  display_name: "Phụ huynh An",
  session_id: "sess-user-1",
  refresh_token_version: 1,
  active_child_id: 301,
};

const userWithoutChild: UserTokenPayload = {
  user_id: 102,
  display_name: "Phụ huynh Bình",
  session_id: "sess-user-2",
  refresh_token_version: 1,
};

const fakeOwnershipPort: ChildOwnershipPort = {
  async isOwnedByUser(userId: number, childId: number): Promise<boolean> {
    await Promise.resolve();
    // User 101 owns child 301. Does NOT own child 999.
    return userId === 101 && childId === 301;
  },
};

const fakeEntitlementPort: EntitlementPort = {
  async hasEntitlement(userId: number, key: string): Promise<boolean> {
    await Promise.resolve();
    return userId === 101 && key === "math_preschool_v1";
  },
};

describe("Actor-boundary ports and active-child helpers", () => {
  it("assertActiveChild returns active_child_id when present", () => {
    const event = { context: createAuthContext({ user: userWithChild }) };
    const childId = assertActiveChild(event);

    expect(childId).toBe(301);
  });

  it("assertActiveChild throws NO_ACTIVE_CHILD (428) when active_child_id is missing", () => {
    const event = { context: createAuthContext({ user: userWithoutChild }) };

    expect(() => assertActiveChild(event)).toThrowError(
      expect.objectContaining({ code: "NO_ACTIVE_CHILD", status: 428 })
    );
  });

  it("verifyChildOwnership throws NOT_FOUND (404) when candidate child is not owned by user", async () => {
    // User 101 trying to access child 999 (not owned)
    await expect(
      verifyChildOwnership(101, 999, fakeOwnershipPort)
    ).rejects.toThrowError(
      expect.objectContaining({ code: "NOT_FOUND", status: 404 })
    );
  });

  it("verifyChildOwnership succeeds when candidate child is owned by user", async () => {
    await expect(
      verifyChildOwnership(101, 301, fakeOwnershipPort)
    ).resolves.toBeUndefined();
  });

  it("checkUserEntitlement queries EntitlementPort asynchronously at request time", async () => {
    const hasMath = await checkUserEntitlement(
      101,
      "math_preschool_v1",
      fakeEntitlementPort
    );
    expect(hasMath).toBe(true);

    const hasScience = await checkUserEntitlement(
      101,
      "science_v1",
      fakeEntitlementPort
    );
    expect(hasScience).toBe(false);
  });

  it("prohibits serializing entitlement into UserTokenPayload", () => {
    expect(userWithChild).not.toHaveProperty("entitlement");
    expect(userWithoutChild).not.toHaveProperty("entitlement");
  });
});
