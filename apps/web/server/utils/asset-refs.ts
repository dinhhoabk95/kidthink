import { contentAssetRefs, type OwnerDb } from "@mindkid/db";
import { and, eq } from "drizzle-orm";

export interface ExtractedAssetRef {
  kind: "image" | "emoji";
  ref: string;
}

const IMAGE_PATH_REGEX = /^content\/\d{4}\/\d{2}\/[a-f0-9]+.*\.webp$/;

function collectAssetObj(
  obj: Record<string, unknown>,
  collected: Map<string, ExtractedAssetRef>
) {
  if (obj.asset && typeof obj.asset === "object") {
    const assetObj = obj.asset as { kind?: string; ref?: string };
    if (assetObj.kind && typeof assetObj.ref === "string") {
      const kind = assetObj.kind === "image" ? "image" : "emoji";
      const key = `${kind}:${assetObj.ref}`;
      if (!collected.has(key)) {
        collected.set(key, { kind, ref: assetObj.ref });
      }
    }
  }
}

function collectEmojiField(
  obj: Record<string, unknown>,
  collected: Map<string, ExtractedAssetRef>
) {
  const emojiCandidate =
    (typeof obj.emoji === "string" && obj.emoji) ||
    (typeof obj.item_emoji === "string" && obj.item_emoji);
  if (emojiCandidate && emojiCandidate.trim().length > 0) {
    const key = `emoji:${emojiCandidate}`;
    if (!collected.has(key)) {
      collected.set(key, { kind: "emoji", ref: emojiCandidate });
    }
  }
}

function collectImagePathField(
  obj: Record<string, unknown>,
  collected: Map<string, ExtractedAssetRef>
) {
  if (typeof obj.image_path === "string" && obj.image_path.trim().length > 0) {
    const key = `image:${obj.image_path}`;
    if (!collected.has(key)) {
      collected.set(key, { kind: "image", ref: obj.image_path });
    }
  }
}

function collectAssetField(
  obj: Record<string, unknown>,
  collected: Map<string, ExtractedAssetRef>
) {
  collectAssetObj(obj, collected);
  collectEmojiField(obj, collected);
  collectImagePathField(obj, collected);
}

function walkForRefs(
  node: unknown,
  collected: Map<string, ExtractedAssetRef>
): void {
  if (!node) {
    return;
  }

  if (typeof node === "string") {
    if (IMAGE_PATH_REGEX.test(node) || node.startsWith("content/")) {
      const key = `image:${node}`;
      if (!collected.has(key)) {
        collected.set(key, { kind: "image", ref: node });
      }
    }
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      walkForRefs(item, collected);
    }
    return;
  }

  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    collectAssetField(obj, collected);

    for (const val of Object.values(obj)) {
      walkForRefs(val, collected);
    }
  }
}

export function extractAssetRefs(contentPack: unknown): ExtractedAssetRef[] {
  const collected = new Map<string, ExtractedAssetRef>();
  walkForRefs(contentPack, collected);
  return Array.from(collected.values());
}

/**
 * Maintain reverse index in content_asset_refs in same transaction (D-KB)
 */
export async function syncContentAssetRefs(
  tx: OwnerDb,
  entityType: string,
  entityId: number,
  contentPack: unknown
): Promise<void> {
  const refs = extractAssetRefs(contentPack);

  // 1. Delete existing references for this entity version
  await tx
    .delete(contentAssetRefs)
    .where(
      and(
        eq(contentAssetRefs.entityType, entityType),
        eq(contentAssetRefs.entityId, entityId)
      )
    );

  // 2. Insert new references
  if (refs.length > 0) {
    await tx
      .insert(contentAssetRefs)
      .values(
        refs.map((r) => ({
          entityType,
          entityId,
          assetKind: r.kind,
          assetRef: r.ref,
        }))
      )
      .onConflictDoNothing();
  }
}
