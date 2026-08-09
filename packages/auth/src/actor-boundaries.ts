import type { AuthEvent } from "./contracts";
import { requireUserAuth } from "./contracts";
import { appError } from "./errors";
import type { ChildOwnershipPort, EntitlementPort } from "./ports";

export function assertActiveChild(event: AuthEvent): number {
  const user = requireUserAuth(event);
  if (user.active_child_id === undefined || user.active_child_id <= 0) {
    throw appError("NO_ACTIVE_CHILD");
  }
  return user.active_child_id;
}

export async function verifyChildOwnership(
  event: AuthEvent,
  childId: number,
  ownershipPort: ChildOwnershipPort
): Promise<void> {
  const user = requireUserAuth(event);
  const isOwned = await ownershipPort.isOwnedByUser(user.user_id, childId);
  if (!isOwned) {
    throw appError("NOT_FOUND");
  }
}

export async function checkUserEntitlement(
  userId: number,
  entitlementKey: string,
  entitlementPort: EntitlementPort
): Promise<boolean> {
  return await entitlementPort.hasEntitlement(userId, entitlementKey);
}
