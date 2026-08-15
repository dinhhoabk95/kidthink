import { SEED_CONTENT_TAGS } from "../seed-master/content-tags.js";

export const PEDAGOGICAL_AXIS_REQUIREMENT = {
  what: true,
  thinking: true,
};

const SLUG_REGEX = /^[a-z0-9_]{2,50}$/;

const TAG_SET_BY_AXIS: Record<string, Set<string>> = {
  what: new Set(
    SEED_CONTENT_TAGS.filter((t) => t.axis === "what").map((t) => t.code)
  ),
  thinking: new Set(
    SEED_CONTENT_TAGS.filter((t) => t.axis === "thinking").map((t) => t.code)
  ),
  mechanic: new Set(
    SEED_CONTENT_TAGS.filter((t) => t.axis === "mechanic").map((t) => t.code)
  ),
  theme: new Set(
    SEED_CONTENT_TAGS.filter((t) => t.axis === "theme").map((t) => t.code)
  ),
};

export function isValidTagForAxis(
  axis: "what" | "thinking" | "mechanic" | "theme",
  tag: string
): boolean {
  if (!tag || tag.trim().length === 0) {
    return false;
  }
  const set = TAG_SET_BY_AXIS[axis];
  if (set?.has(tag)) {
    return true;
  }
  return SLUG_REGEX.test(tag);
}
