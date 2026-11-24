import { CHILD_STATUS, type PlaySessionEntity } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { NotFoundError } from "@mindkid/errors/common";

import type { DbOrTx } from "#src/types";

export interface IngestOptions {
  readonly callerChildProfileId?: number | null;
  /** Authenticated user id; ownership is always resolved in the DB. */
  readonly callerAccountId?: number;
  readonly guestDeviceId?: string;
  readonly isUserCall?: boolean;
}

export async function checkUserSessionOwnership(
  db: DbOrTx,
  session: PlaySessionEntity,
  options: IngestOptions
): Promise<void> {
  const callerAccountId = options.callerAccountId;
  if (
    typeof callerAccountId !== "number" ||
    !Number.isInteger(callerAccountId) ||
    callerAccountId <= 0
  ) {
    throw new NotFoundError();
  }

  if (!session.childProfileId) {
    if (
      options.guestDeviceId &&
      session.guestDeviceId &&
      session.guestDeviceId === options.guestDeviceId
    ) {
      return;
    }
    if (session.guestDeviceId === `user:${callerAccountId}`) {
      return;
    }
    throw new NotFoundError();
  }

  const repos = createRepositories(db);
  const ownedChild = await repos.childProfiles.findById(
    Number(session.childProfileId)
  );

  if (
    !ownedChild ||
    ownedChild.userId !== callerAccountId ||
    ownedChild.status !== CHILD_STATUS.ACTIVE
  ) {
    throw new NotFoundError();
  }
}

export async function checkSessionOwnership(
  db: DbOrTx,
  session: PlaySessionEntity,
  options: IngestOptions
): Promise<void> {
  if (options.isUserCall) {
    await checkUserSessionOwnership(db, session, options);
  } else if (
    session.childProfileId !== null &&
    session.childProfileId !== undefined
  ) {
    throw new NotFoundError();
  } else if (
    !(options.guestDeviceId && session.guestDeviceId) ||
    session.guestDeviceId !== options.guestDeviceId
  ) {
    // A guest session is bearer-bound to its device cookie. Omitting the
    // device id must never degrade into "any guest session" access.
    throw new NotFoundError();
  }
}
