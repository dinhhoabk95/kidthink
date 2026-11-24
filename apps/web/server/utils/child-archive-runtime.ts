import { CHILD_STATUS_CODEC } from "@mindkid/db";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface ArchiveChildProfileInput {
  readonly childId: number;
  readonly userId: number;
  readonly reason?: string;
  readonly purgeAt?: Date | null;
}

/**
 * D-IG: Canonical single code path for archiving child profiles.
 * Used by child profile archive endpoint (P1.9) and consent withdrawal (P1.14).
 */
export async function executeArchiveChildProfile(
  input: ArchiveChildProfileInput
): Promise<{ uuid: string; status: string; purgeAt: Date | null }> {
  const { childProfiles } = useOwnerRepositories();
  const updated = await childProfiles.archive(
    input.childId,
    input.userId,
    new Date(),
    input.purgeAt ?? null
  );

  if (!updated) {
    throw new Error("ARCHIVE_FAILED");
  }

  return {
    uuid: updated.uuid,
    status: CHILD_STATUS_CODEC.toLabel(updated.status),
    purgeAt: updated.purgeAt,
  };
}
