import { describe, expect, it } from "vitest";
import { scanContentForRoleLabels } from "../lint-user-vocabulary.ts";

describe("scanContentForRoleLabels (BR-GLOS-04)", () => {
  const REL = "apps/web/app/pages/index.vue";

  it("flags a display string that names a real-world role", () => {
    const found = scanContentForRoleLabels(
      REL,
      'const title = "Dành cho phụ huynh";'
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.line).toBe(1);
  });

  it("flags giáo viên the same way", () => {
    const found = scanContentForRoleLabels(REL, "<h3>Dành cho Giáo viên</h3>");
    expect(found).toHaveLength(1);
  });

  // The two words are frequently split across a wrapped line or an indent.
  it("flags the term across arbitrary whitespace", () => {
    const found = scanContentForRoleLabels(REL, "  Phụ   huynh theo dõi bé.");
    expect(found).toHaveLength(1);
  });

  it("reports every offending line, not just the first", () => {
    const found = scanContentForRoleLabels(
      REL,
      ['a: "phụ huynh"', 'b: "ok"', 'c: "giáo viên"'].join("\n")
    );
    expect(found.map((v) => v.line)).toEqual([1, 3]);
  });

  // English `parent` is load-bearing: Parent Gate identifiers are fixed names.
  it("does NOT flag parent-bearing technical identifiers", () => {
    const found = scanContentForRoleLabels(
      REL,
      'appError("PARENT_GATE_REQUIRED"); const c = "parent_gate_trusted_until";'
    );
    expect(found).toHaveLength(0);
  });

  it("does NOT flag the approved replacements", () => {
    const found = scanContentForRoleLabels(
      REL,
      "Người lớn · người giám hộ · người dạy · User"
    );
    expect(found).toHaveLength(0);
  });

  // Emoji keywords describe the picture, not a kind of account.
  it("does NOT flag the allowlisted emoji keyword data", () => {
    const found = scanContentForRoleLabels(
      "packages/emoji/src/data/profession.ts",
      'keywords: ["teacher", "giáo viên"]'
    );
    expect(found).toHaveLength(0);
  });

  // The allowlist is one exact path, not a prefix — a new file in the same
  // directory must not inherit the exemption.
  it("does not extend the emoji exemption to sibling files", () => {
    const found = scanContentForRoleLabels(
      "packages/emoji/src/data/people.ts",
      'label: "phụ huynh"'
    );
    expect(found).toHaveLength(1);
  });
});
