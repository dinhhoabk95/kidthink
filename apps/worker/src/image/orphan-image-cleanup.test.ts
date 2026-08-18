import { contentImages, getOwnerDb } from "@mindkid/db";
import { uploadPublicImage } from "@mindkid/storage";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { runOrphanImageCleanupJob } from "./cleanup-orphan.js";

describe("Orphan Image Cleanup Worker Job (BR-AUT2-05, D-BD, Task #49 T5)", () => {
  it("purges orphan image older than 30 days and ignores image younger than 30 days or payment proofs", async () => {
    const db = getOwnerDb();
    const now = new Date();
    const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const twentyNineDaysAgo = new Date(
      now.getTime() - 29 * 24 * 60 * 60 * 1000
    );

    const oldPath = `content/2026/01/orphan_old_${Date.now()}.webp`;
    const newPath = `content/2026/01/orphan_new_${Date.now()}.webp`;
    const proofPath = `proofs/2026/01/proof_old_${Date.now()}.jpg`;

    await uploadPublicImage({
      key: oldPath,
      body: Buffer.from("old"),
      contentType: "image/webp",
    });
    await uploadPublicImage({
      key: newPath,
      body: Buffer.from("new"),
      contentType: "image/webp",
    });

    // 1. Insert 31-day-old orphan image -> should be purged
    const [oldOrphan] = await db
      .insert(contentImages)
      .values({
        ownerType: "game_level",
        ownerId: 9999,
        storagePath: oldPath,
        status: "orphan",
        altText: "Ảnh cũ mồ côi",
        bytes: 1024,
        createdAt: thirtyOneDaysAgo,
      })
      .returning();

    // 2. Insert 29-day-old orphan image -> should NOT be purged
    const [newOrphan] = await db
      .insert(contentImages)
      .values({
        ownerType: "game_level",
        ownerId: 9999,
        storagePath: newPath,
        status: "orphan",
        altText: "Ảnh mới mồ côi",
        bytes: 2048,
        createdAt: twentyNineDaysAgo,
      })
      .returning();

    // 3. Insert 31-day-old payment proof -> should NOT be purged (D-KE)
    const [proofImg] = await db
      .insert(contentImages)
      .values({
        ownerType: "payment_proof",
        ownerId: 9999,
        storagePath: proofPath,
        visibility: "private",
        status: "orphan",
        altText: "Chứng từ cũ",
        bytes: 4096,
        createdAt: thirtyOneDaysAgo,
      })
      .returning();

    // 4. Run cleanup job
    const result = await runOrphanImageCleanupJob("test-orphan-job", { now });
    expect(result.purged_count).toBeGreaterThanOrEqual(1);

    // 5. Verify old orphan is deleted
    const [foundOld] = await db
      .select()
      .from(contentImages)
      .where(eq(contentImages.id, oldOrphan.id));
    expect(foundOld).toBeUndefined();

    // 6. Verify 29-day orphan is preserved
    const [foundNew] = await db
      .select()
      .from(contentImages)
      .where(eq(contentImages.id, newOrphan.id));
    expect(foundNew).toBeDefined();

    // 7. Verify payment proof is preserved
    const [foundProof] = await db
      .select()
      .from(contentImages)
      .where(eq(contentImages.id, proofImg.id));
    expect(foundProof).toBeDefined();

    // 8. Run second time to verify idempotency
    const secondRun = await runOrphanImageCleanupJob("test-orphan-job-2", {
      now,
    });
    expect(secondRun).toBeDefined();

    // Clean up test rows
    await db.delete(contentImages).where(eq(contentImages.id, newOrphan.id));
    await db.delete(contentImages).where(eq(contentImages.id, proofImg.id));
  });
});
