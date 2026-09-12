/**
 * Gate 9: Khái niệm hiện ra (BR-SDS-03).
 *
 * Dataset có items[].glyph thì mọi level của kỹ năng đó phải hiển thị
 * ít nhất một vật mang glyph (text asset chứa glyph hoặc glyph xuất hiện trên giao diện).
 */

import type { SkillDataset } from "@mindkid/shared";
import type { ContentSeed, GateIssue, GateResult } from "../types.js";

const NUMERIC_GLYPH_KEYS = [
  "value",
  "hour",
  "fill_units",
  "count",
  "quantity",
] as const;

function hasMatchingProperty(
  obj: Record<string, unknown>,
  glyphs: Set<string>
): boolean {
  for (const key of NUMERIC_GLYPH_KEYS) {
    const v = obj[key];
    if (typeof v === "number" || typeof v === "string") {
      const sv = String(v);
      if (glyphs.has(sv)) {
        return true;
      }
    }
  }
  return false;
}

function nodeContainsGlyph(
  obj: Record<string, unknown>,
  glyphs: Set<string>
): boolean {
  if (typeof obj.glyph === "string" && glyphs.has(obj.glyph)) {
    return true;
  }
  if (obj.kind === "text" && typeof obj.text === "string") {
    for (const glyph of glyphs) {
      if (obj.text.includes(glyph)) {
        return true;
      }
    }
  }
  return hasMatchingProperty(obj, glyphs);
}

const IGNORED_KEYS = new Set([
  "prompt",
  "instruction",
  "audio_path",
  "title",
  "item_id",
  "id",
]);

function processArrayItem(
  arr: unknown[],
  stack: unknown[],
  glyphs: Set<string>
): boolean {
  for (const item of arr) {
    if (typeof item === "string" && glyphs.has(item)) {
      return true;
    }
    if (item && typeof item === "object") {
      stack.push(item);
    }
  }
  return false;
}

function processObjectItem(
  obj: Record<string, unknown>,
  stack: unknown[],
  glyphs: Set<string>
): boolean {
  if (nodeContainsGlyph(obj, glyphs)) {
    return true;
  }

  for (const [key, val] of Object.entries(obj)) {
    if (IGNORED_KEYS.has(key)) {
      continue;
    }
    if (val && typeof val === "object") {
      stack.push(val);
    }
  }
  return false;
}

function processStackItem(
  current: unknown,
  stack: unknown[],
  glyphs: Set<string>
): boolean {
  if (Array.isArray(current)) {
    return processArrayItem(current, stack, glyphs);
  }

  if (current && typeof current === "object") {
    return processObjectItem(current as Record<string, unknown>, stack, glyphs);
  }

  return false;
}

function packContainsAnyGlyph(pack: unknown, glyphs: Set<string>): boolean {
  if (!pack || typeof pack !== "object") {
    return false;
  }

  const stack: unknown[] = [pack];

  while (stack.length > 0) {
    const current = stack.pop();
    if (
      current !== undefined &&
      current !== null &&
      processStackItem(current, stack, glyphs)
    ) {
      return true;
    }
  }

  return false;
}

export function checkGateConceptPresent(
  seed: ContentSeed,
  dataset?: SkillDataset
): GateResult {
  const issues: GateIssue[] = [];

  if (!dataset) {
    return {
      gate: 9,
      name: "Khái niệm hiện ra",
      kind: "xác định",
      passed: true,
      issues,
    };
  }

  const glyphs = new Set(
    dataset.items
      .map((i) => i.glyph)
      .filter((g): g is string => typeof g === "string" && g.length > 0)
  );

  // Nếu dataset không có glyph nào thì bỏ qua
  if (glyphs.size === 0) {
    return {
      gate: 9,
      name: "Khái niệm hiện ra",
      kind: "xác định",
      passed: true,
      issues,
    };
  }

  let hasGlyph = packContainsAnyGlyph(seed.content_pack, glyphs);
  if (!hasGlyph && seed.header.template_code === "GT-013") {
    const prompt = (seed.content_pack as Record<string, unknown> | null)
      ?.prompt;
    if (typeof prompt === "string") {
      for (const glyph of glyphs) {
        if (prompt.includes(glyph)) {
          hasGlyph = true;
          break;
        }
      }
    }
  }

  if (!hasGlyph) {
    issues.push({
      code: "CONCEPT_GLYPH_MISSING",
      message: `[BR-SDS-03] Dataset kỹ năng ${dataset.skill_code} có glyph (${[...glyphs].join(", ")}) nhưng level ${seed.header.code} không hiển thị bất kỳ vật nào mang glyph.`,
    });
  }

  return {
    gate: 9,
    name: "Khái niệm hiện ra",
    kind: "xác định",
    passed: issues.length === 0,
    issues,
  };
}
