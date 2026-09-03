import { writeAudit } from "@mindkid/audit";
import { contentAssetRefs, contentImages, getOwnerDb } from "@mindkid/db";
import { AUDIT_ACTIONS } from "@mindkid/shared";
import { deletePrivateAsset, deletePublicImage } from "@mindkid/storage";
import { and, eq, lte, ne } from "drizzle-orm";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

export interface OrphanImageCleanupResult {
  purged_count: number;
  purged_bytes: number;
}

/**
 * Daily orphan image cleanup job (BR-AUT2-05, D-BD)
 * Purges orphan content images older than 30 days.
 * Excludes payment_proof (D-KE).
 */
export async function runOrphanImageCleanupJob(
  jobId?: string,
  options?: { now?: Date; cutoffDays?: number; signal?: AbortSignal }
): Promise<OrphanImageCleanupResult> {
  const db = getOwnerDb();
  const now = options?.now || new Date();
  const days = options?.cutoffDays ?? 30;
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 1. Find orphan images older than cutoff days (excluding payment_proof)
  const candidateImages = await db
    .select()
    .from(contentImages)
    .where(
      and(
        eq(contentImages.status, "orphan"),
        lte(contentImages.createdAt, cutoffDate),
        ne(contentImages.ownerType, "payment_proof")
      )
    );

  let purgedCount = 0;
  let purgedBytes = 0;

  for (const img of candidateImages) {
    // Cùng lý do như `account-purge`: hết timeout thì job đã bị đánh `failed`,
    // nhưng vòng lặp vẫn xoá file và hàng DB nếu không tự dừng. Audit log bên
    // dưới vẫn được ghi với số đã xoá thật, nên phần việc đã làm không biến mất.
    if (options?.signal?.aborted) {
      break;
    }

    // Delete from storage
    if (img.storagePath) {
      deletePublicImage(img.storagePath);
      deletePrivateAsset(img.storagePath);
    }
    if (img.thumbPath) {
      deletePublicImage(img.thumbPath);
    }

    // Delete DB record & reverse refs
    await db.delete(contentImages).where(eq(contentImages.id, img.id));
    await db
      .delete(contentAssetRefs)
      .where(eq(contentAssetRefs.assetRef, img.storagePath));

    purgedCount++;
    purgedBytes += img.bytes || 0;
  }

  // 2. Audit log summary — writeAudit đòi một transaction thật.
  await db.transaction((tx) =>
    writeAudit(tx, {
      actor_type: "system",
      // `image_orphan_purged` không có trong AUDIT_ACTIONS; thêm mã mới là đổi
      // hợp đồng audit-log.md. `image_deleted` mô tả đúng việc đã làm.
      action: AUDIT_ACTIONS.IMAGE_DELETED,
      entity_type: "job",
      entity_id: jobId || "image:cleanup-orphan",
      reason: `Dọn ảnh mồ côi quá ${days} ngày (BR-AUT2-05)`,
      after_data: {
        purged_count: purgedCount,
        purged_bytes: purgedBytes,
        cutoff_date: cutoffDate.toISOString(),
      },
    })
  );

  return {
    purged_count: purgedCount,
    purged_bytes: purgedBytes,
  };
}

export const imageCleanupOrphan: Consumer<"image:cleanup-orphan"> = async (
  _payload,
  ctx
) => {
  const result = await runOrphanImageCleanupJob(ctx.jobId, {
    signal: ctx.signal,
  });

  logJobDone("image:cleanup-orphan", ctx, {
    purged: result.purged_count,
    bytes: result.purged_bytes,
  });

  return result;
};
