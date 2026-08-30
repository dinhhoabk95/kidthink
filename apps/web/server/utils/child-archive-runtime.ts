import { childProfiles, getOwnerDb } from "@mindkid/db";
import { eq } from "drizzle-orm";

export interface ArchiveChildProfileInput {
  readonly childId: number;
  readonly userId: number;
  readonly reason?: string;
  readonly purgeAt?: Date | null;
}

/**
 * D-IG: Canonical single code path for archiving child profiles.
 * Used by child profile archive endpoint (P1.9) and consent withdrawal (P1.14).
 * Ensures consistency so re-consenting or restoring operates on uniform status & timestamp state.
 */
export async function executeArchiveChildProfile(
  input: ArchiveChildProfileInput
): Promise<{ uuid: string; status: string; purgeAt: Date | null }> {
  const db = getOwnerDb();
  const now = new Date();

  const [updated] = await db
    .update(childProfiles)
    .set({
      status: "archived",
      purgeAt: input.purgeAt ?? null,
      updatedAt: now,
    })
    .where(eq(childProfiles.id, input.childId))
    .returning();

  if (!updated) {
    throw new Error("ARCHIVE_FAILED");
  }

  return {
    uuid: updated.uuid,
    status: updated.status,
    purgeAt: updated.purgeAt,
  };
}
