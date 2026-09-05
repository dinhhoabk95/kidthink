import { AppError } from "@mindkid/auth";
import { childProfiles, type playSessions } from "@mindkid/db";
import { and, eq } from "drizzle-orm";

import type { DbOrTx } from "../types.js";

export interface IngestOptions {
  readonly callerChildProfileId?: number | null;
  /** Authenticated user id; ownership is always resolved in the DB. */
  readonly callerAccountId?: number;
  readonly guestDeviceId?: string;
  readonly isUserCall?: boolean;
}

export async function checkUserSessionOwnership(
  db: DbOrTx,
  session: typeof playSessions.$inferSelect,
  options: IngestOptions
): Promise<void> {
  if (!session.childProfileId) {
    throw new AppError("NOT_FOUND");
  }
  const callerAccountId = options.callerAccountId;
  if (
    typeof callerAccountId !== "number" ||
    !Number.isInteger(callerAccountId) ||
    callerAccountId <= 0
  ) {
    throw new AppError("NOT_FOUND");
  }

  const [ownedChild] = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.id, Number(session.childProfileId)),
        eq(childProfiles.userId, callerAccountId),
        eq(childProfiles.status, "active")
      )
    )
    .limit(1);

  if (!ownedChild) {
    throw new AppError("NOT_FOUND");
  }
}

export async function checkSessionOwnership(
  db: DbOrTx,
  session: typeof playSessions.$inferSelect,
  options: IngestOptions
): Promise<void> {
  if (options.isUserCall) {
    await checkUserSessionOwnership(db, session, options);
  } else if (
    session.childProfileId !== null &&
    session.childProfileId !== undefined
  ) {
    throw new AppError("NOT_FOUND");
  } else if (
    !(options.guestDeviceId && session.guestDeviceId) ||
    session.guestDeviceId !== options.guestDeviceId
  ) {
    // A guest session is bearer-bound to its device cookie. Omitting the
    // device id must never degrade into "any guest session" access.
    throw new AppError("NOT_FOUND");
  }
}
