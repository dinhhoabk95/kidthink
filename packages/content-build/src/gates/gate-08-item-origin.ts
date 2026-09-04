/**
 * Gate 8: Nguồn vật (BR-SDS-02).
 *
 * Mọi item_id trong content_pack của một level phải truy được về
 * dataset.items[].id của kỹ năng sở hữu level đó.
 */

import type { SkillDataset } from "@mindkid/shared";
import type { ContentSeed, GateIssue, GateResult } from "../types.js";

const REGEX_STEP = /^step-/;
const REGEX_PAIR = /^pair-/;
const REGEX_SUFFIX_NUM = /[-_]\d+$/;

function getItemId(obj: unknown): string | null {
  if (obj && typeof obj === "object") {
    const rec = obj as Record<string, unknown>;
    if (typeof rec.item_id === "string") {
      return rec.item_id;
    }
    if (typeof rec.step_id === "string") {
      return rec.step_id;
    }
  }
  return null;
}

function pushFromItemsList(arr: unknown, ids: string[]): void {
  if (!Array.isArray(arr)) {
    return;
  }
  for (const el of arr) {
    const id = getItemId(el);
    if (id) {
      ids.push(id);
    }
  }
}

function pushFromPairsList(arr: unknown, ids: string[]): void {
  if (!Array.isArray(arr)) {
    return;
  }
  for (const pair of arr) {
    if (pair && typeof pair === "object") {
      const pr = pair as Record<string, unknown>;
      const leftId = getItemId(pr.left);
      if (leftId) {
        ids.push(leftId);
      }
      const rightId = getItemId(pr.right);
      if (rightId) {
        ids.push(rightId);
      }
    }
  }
}

function extractItemIdsFromContentPack(pack: unknown): string[] {
  if (!pack || typeof pack !== "object") {
    return [];
  }

  const ids: string[] = [];
  const p = pack as Record<string, unknown>;

  const targetId = getItemId(p.target_item);
  if (targetId) {
    ids.push(targetId);
  }

  pushFromItemsList(p.options, ids);
  pushFromItemsList(p.flash_items, ids);
  pushFromItemsList(p.sequence, ids);
  pushFromItemsList(p.items, ids);
  pushFromPairsList(p.pairs, ids);

  return ids;
}

function normalizeId(id: string): string {
  return id
    .replace(REGEX_STEP, "")
    .replace(REGEX_PAIR, "")
    .replace(REGEX_SUFFIX_NUM, "");
}

export function checkGateItemOrigin(
  seed: ContentSeed,
  dataset?: SkillDataset
): GateResult {
  const issues: GateIssue[] = [];

  if (!dataset) {
    return {
      gate: 8,
      name: "Nguồn vật",
      kind: "xác định",
      passed: true,
      issues,
    };
  }

  const validItemIds = new Set(dataset.items.map((i) => i.id));
  const rawIds = extractItemIdsFromContentPack(seed.content_pack);

  for (const rawId of rawIds) {
    const normId = normalizeId(rawId);
    if (!(validItemIds.has(normId) || validItemIds.has(rawId))) {
      issues.push({
        code: "ITEM_ORIGIN_INVALID",
        message: `[BR-SDS-02] Vật '${rawId}' (chuẩn hoá: '${normId}') không có trong dataset của kỹ năng ${dataset.skill_code}.`,
      });
    }
  }

  return {
    gate: 8,
    name: "Nguồn vật",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}
