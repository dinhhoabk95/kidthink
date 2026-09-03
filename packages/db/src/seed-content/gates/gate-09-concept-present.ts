/**
 * Gate 9: Khái niệm hiện ra (BR-SDS-03).
 *
 * Dataset có items[].glyph thì mọi level của kỹ năng đó phải hiển thị
 * ít nhất một vật mang glyph (text asset chứa glyph hoặc glyph xuất hiện trên giao diện).
 */

import type { SkillDataset } from "@mindkid/shared";
import type {
  ContentSeed,
  GateIssue,
  GateResult,
} from "#src/seed-content/types";

function nodeContainsGlyph(
  obj: Record<string, unknown>,
  glyphs: Set<string>
): boolean {
  if (obj.kind === "text" && typeof obj.text === "string") {
    for (const glyph of glyphs) {
      if (obj.text.includes(glyph)) {
        return true;
      }
    }
  }
  return (
    (typeof obj.value === "number" || typeof obj.value === "string") &&
    glyphs.has(String(obj.value))
  );
}

function processStackItem(
  current: unknown,
  stack: unknown[],
  glyphs: Set<string>
): boolean {
  if (Array.isArray(current)) {
    stack.push(...current);
    return false;
  }

  const obj = current as Record<string, unknown>;
  if (nodeContainsGlyph(obj, glyphs)) {
    return true;
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      stack.push(val);
    }
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
      current &&
      typeof current === "object" &&
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

  const hasGlyph = packContainsAnyGlyph(seed.content_pack, glyphs);

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
