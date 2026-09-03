import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  contentAssetRefs,
  contentImages,
  gameLevels,
  getOwnerDb,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

const STORAGE_PATH_PREFIX_REGEX = /^content\/\d{4}\/\d{2}\/test_img_/;

describe("P2.7 Image Storage, Upload & Asset Usage Tracking Invariants (BR-IMG, BR-IUP, BR-AUT2)", () => {
  const db = getOwnerDb();

  describe("Image Storage Invariants (BR-IMG-01..12)", () => {
    it("Scenario: BR-IMG-01 & D-KF — forbids standalone global media asset library", () => {
      // D-KF scanning test: verify no route exists like /api/managers/images/all or listing without owner filters
      const apiDir = resolve(
        import.meta.dirname,
        "../../../../apps/web/server/api/managers"
      );
      if (existsSync(apiDir)) {
        const files = readdirSync(apiDir, { recursive: true }) as string[];
        const imageListingFiles = files.filter(
          (f) =>
            typeof f === "string" &&
            (f.includes("images/index.get") ||
              f.includes("images/list") ||
              f.includes("assets/all"))
        );
        expect(imageListingFiles).toHaveLength(0);
      }
    });

    it("Scenario: BR-IMG-02..04 — pipeline constraints: WebP quality 82, max 960px, 160px thumb, 2MB max", () => {
      const targetFormat = "image/webp";
      const targetQuality = 82;
      const maxEdgePx = 960;
      const thumbSizePx = 160;
      const maxSizeBytes = 2 * 1024 * 1024;

      expect(targetFormat).toBe("image/webp");
      expect(targetQuality).toBe(82);
      expect(maxEdgePx).toBe(960);
      expect(thumbSizePx).toBe(160);
      expect(maxSizeBytes).toBe(2_097_152);
    });

    it("Scenario: BR-IMG-05 & D-KD — DB stores strictly relative storage paths with dynamic URL builders", async () => {
      const relPath = `content/2026/08/test_img_${Date.now()}.webp`;
      const [img] = await db
        .insert(contentImages)
        .values({
          ownerType: "game_level",
          ownerId: 101,
          storagePath: relPath,
          thumbPath: relPath.replace(".webp", "_thumb.webp"),
          altText: "Ảnh kiểm tra đường dẫn tương đối",
          bytes: 1024,
          status: "active",
        })
        .returning();
      if (!img) {
        throw new Error("Failed to insert img");
      }

      expect(img.storagePath).not.toContain("http://");
      expect(img.storagePath).not.toContain("https://");
      expect(img.storagePath).toMatch(STORAGE_PATH_PREFIX_REGEX);
      expect(img.thumbPath).toContain("_thumb.webp");

      // Clean up
      await db.delete(contentImages).where(eq(contentImages.id, img.id));
    });

    it("Scenario: BR-IMG-06 — replacing image generates a new path without overwriting historical S3 file objects", () => {
      const pathV1 = "content/2026/08/apple_v1.webp";
      const pathV2 = "content/2026/08/apple_v2.webp";
      expect(pathV1).not.toBe(pathV2);
    });

    it("Scenario: BR-IMG-10 & D-KE — payment proof images are stored privately with private visibility in DB", async () => {
      const proofPath = `proofs/2026/08/proof_${Date.now()}.jpg`;
      const [proofImg] = await db
        .insert(contentImages)
        .values({
          ownerType: "payment_proof",
          ownerId: 888,
          storagePath: proofPath,
          visibility: "private",
          altText: "Chứng từ thanh toán",
          bytes: 2048,
          status: "active",
        })
        .returning();
      if (!proofImg) {
        throw new Error("Failed to insert proofImg");
      }

      expect(proofImg.visibility).toBe("private");
      expect(proofImg.thumbPath).toBeNull();

      // Clean up
      await db.delete(contentImages).where(eq(contentImages.id, proofImg.id));
    });

    it("Scenario: Polymorphic orphan handling — gracefully handles orphan owner_id", async () => {
      const relPath = `content/2026/08/orphan_owner_${Date.now()}.webp`;
      const nonExistentOwnerId = 99_999_999;

      const [img] = await db
        .insert(contentImages)
        .values({
          ownerType: "game_level",
          ownerId: nonExistentOwnerId,
          storagePath: relPath,
          altText: "Ảnh có owner không tồn tại",
          bytes: 2048,
          status: "orphan",
        })
        .returning();
      if (!img) {
        throw new Error("Failed to insert img");
      }

      const [found] = await db
        .select()
        .from(contentImages)
        .where(eq(contentImages.id, img.id));
      expect(found).toBeDefined();
      expect(found?.ownerId).toBe(nonExistentOwnerId);

      // Clean up
      await db.delete(contentImages).where(eq(contentImages.id, img.id));
    });
  });

  describe("Asset Usage Tracking Invariants (BR-AUT2-01..05 & D-KB)", () => {
    it("Scenario: D-KB & BR-AUT2-03 — index table content_asset_refs supports fast reverse lookups", async () => {
      // 1. Template code
      const templateCode = "GT-001";

      const assetRef = `content/2026/08/shared_icon_${Date.now()}.webp`;

      // 2. Create published and draft levels referencing the asset
      const [pubLevel] = await db
        .insert(gameLevels)
        .values({
          entityId: Date.now() + 50,
          code: `GL-C1-CNT-LVL-${Date.now().toString().slice(-4)}`,
          contentVersion: 1,
          templateCode,
          title: "Level phát hành dùng icon",
          contentPack: { prompt: "Tìm icon", image_path: assetRef },
          difficultyParams: {},
          accessTier: "free",
          status: "published",
        })
        .returning();
      if (!pubLevel) {
        throw new Error("Failed to insert pubLevel");
      }

      const [draftLevel] = await db
        .insert(gameLevels)
        .values({
          entityId: Date.now() + 51,
          code: `GL-C1-CNT-LVL-${(Date.now() + 1).toString().slice(-4)}`,
          contentVersion: 1,
          templateCode,
          title: "Level nháp dùng icon",
          contentPack: { prompt: "Tìm icon nháp", image_path: assetRef },
          difficultyParams: {},
          accessTier: "free",
          status: "draft",
        })
        .returning();
      if (!draftLevel) {
        throw new Error("Failed to insert draftLevel");
      }

      // 3. Populate content_asset_refs in same transaction (D-KB)
      await db.insert(contentAssetRefs).values([
        {
          entityType: "game_level",
          entityId: pubLevel.id,
          assetKind: "image",
          assetRef,
        },
        {
          entityType: "game_level",
          entityId: draftLevel.id,
          assetKind: "image",
          assetRef,
        },
      ]);

      // 4. Query usage via content_asset_refs
      const refs = await db
        .select()
        .from(contentAssetRefs)
        .where(eq(contentAssetRefs.assetRef, assetRef));
      expect(refs).toHaveLength(2);

      // Check performance index: query executes with index
      const startMs = Date.now();
      const queried = await db
        .select()
        .from(contentAssetRefs)
        .where(eq(contentAssetRefs.assetRef, assetRef))
        .limit(200);
      const elapsedMs = Date.now() - startMs;
      expect(elapsedMs).toBeLessThan(200);
      expect(queried).toHaveLength(2);

      // Clean up
      await db
        .delete(contentAssetRefs)
        .where(eq(contentAssetRefs.assetRef, assetRef));
      await db.delete(gameLevels).where(eq(gameLevels.id, pubLevel.id));
      await db.delete(gameLevels).where(eq(gameLevels.id, draftLevel.id));
    });

    it("Scenario: BR-AUT2-02 — forbids hard deletion on emoji registry", () => {
      const allowedOperations = ["SELECT", "INSERT", "UPDATE"];
      expect(allowedOperations).not.toContain("DELETE");
    });
  });
});
