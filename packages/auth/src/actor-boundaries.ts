import { ChildNotFoundError, NoActiveChildError } from "@mindkid/errors/child";
import type { AuthEvent } from "./contracts";
import { requireUserAuth } from "./contracts";
import type { ChildOwnershipPort, EntitlementPort } from "./ports";

export function assertActiveChild(event: AuthEvent): number {
  const user = requireUserAuth(event);
  if (user.active_child_db_id === undefined || user.active_child_db_id <= 0) {
    throw new NoActiveChildError();
  }
  return user.active_child_db_id;
}

export async function verifyChildOwnership(
  event: AuthEvent,
  childId: number,
  ownershipPort: ChildOwnershipPort
): Promise<void> {
  const user = requireUserAuth(event);
  const isOwned = await ownershipPort.isOwnedByUser(user.user_id, childId);
  if (!isOwned) {
    throw new ChildNotFoundError(childId);
  }
}

export async function checkUserEntitlement(
  userId: number,
  entitlementKey: string,
  entitlementPort: EntitlementPort
): Promise<boolean> {
  return await entitlementPort.hasEntitlement(userId, entitlementKey);
}
