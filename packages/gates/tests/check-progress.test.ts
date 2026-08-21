import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  findPromotedCheckboxes,
  ownedRuleIds,
  type ProgressSpec,
  parseRulePrefixRegistry,
  validateProgress,
} from "../scripts/check-progress-lib.ts";

const P0_SPEC: ProgressSpec = {
  id: "FOO",
  phase: "P0",
  rel: "00-foundation/foo.md",
  status: "implemented",
  citedRuleIds: ["BR-FOO-01"],
  ownedRuleIds: ["BR-FOO-01"],
};

const REGISTRY_FIXTURE = [
  "## 7. Data",
  "",
  "### 7.1 Bản đồ prefix → spec",
  "",
  "| Prefix | Spec | | Prefix | Spec |",
  "|---|---|---|---|---|",
  "| `BR-FOO` | [`foo.md`](foo.md) | | `BR-BAR` | [`bar.md`](../01-platform/bar.md) |",
  "| `BR-BAZ` | [`baz.md`](../08-quality/baz.md) | | | |",
  "",
  "### 7.2 Thống kê",
  "",
  "| | Số |",
].join("\n");

describe("findPromotedCheckboxes", () => {
  it("returns only checkboxes promoted from empty to checked", () => {
    const before = [
      "## P0 — Foundation",
      "- [ ] **P0.1** Foo — [`foo.md`](../specs/00-foundation/foo.md)",
      "- [x] Historical checkbox",
    ].join("\n");
    const after = before.replace("- [ ] **P0.1**", "- [x] **P0.1**");

    expect(findPromotedCheckboxes(before, after)).toEqual([
      expect.objectContaining({ label: "P0.1", phase: "P0" }),
    ]);
  });
});

describe("parseRulePrefixRegistry", () => {
  it("maps every prefix in a two-columns-per-row table to its spec", () => {
    const registry = parseRulePrefixRegistry(REGISTRY_FIXTURE);

    expect(registry.get("BR-FOO")).toBe("00-foundation/foo.md");
    expect(registry.get("BR-BAR")).toBe("01-platform/bar.md");
    expect(registry.get("BR-BAZ")).toBe("08-quality/baz.md");
    expect(registry.size).toBe(3);
  });

  it("ignores rows outside §7.1", () => {
    const withNoise = REGISTRY_FIXTURE.replace(
      "| | Số |",
      "| `BR-QUX` | [`qux.md`](qux.md) |"
    );

    expect(parseRulePrefixRegistry(withNoise).has("BR-QUX")).toBe(false);
  });

  it("keeps the real corpus registry parseable", () => {
    const content = readFileSync(
      repoPath("docs/specs/00-foundation/business-rules.md"),
      "utf8"
    );
    const registry = parseRulePrefixRegistry(content);

    expect(registry.get("BR-HLT")).toBe("01-platform/health-check.md");
    expect(registry.get("BR-TYP")).toBe("08-quality/type-safety.md");
    expect(registry.size).toBeGreaterThan(140);
  });
});

describe("ownedRuleIds", () => {
  it("keeps only rules whose prefix the registry gives to this spec", () => {
    const registry = parseRulePrefixRegistry(REGISTRY_FIXTURE);

    expect(
      ownedRuleIds(
        ["BR-FOO-01", "BR-BAR-02", "BR-NOPE-03"],
        "00-foundation/foo.md",
        registry
      )
    ).toEqual(["BR-FOO-01"]);
  });
});

describe("validateProgress", () => {
  it("rejects a fake tick when only the checklist changed", () => {
    const violations = validateProgress({
      beforeChecklist: "- [ ] **P0.1** Foo",
      afterChecklist: "- [x] **P0.1** Foo",
      changedPaths: ["docs/tasks/14-implementation-sequence-todo.md"],
      specs: [],
      testContents: [],
    });

    expect(violations).toContainEqual(
      expect.objectContaining({ code: "PROGRESS_TICK_WITHOUT_EVIDENCE" })
    );
  });

  it("rejects a checked step while a linked spec is not implemented", () => {
    const before =
      "- [ ] **P0.1** Foo — [`foo.md`](../specs/00-foundation/foo.md)";
    const after = before.replace("[ ]", "[x]");

    const violations = validateProgress({
      beforeChecklist: before,
      afterChecklist: after,
      changedPaths: ["packages/foo/src/index.ts"],
      specs: [{ ...P0_SPEC, status: "approved" }],
      testContents: ["it('BR-FOO-01', () => {})"],
    });

    expect(violations).toContainEqual(
      expect.objectContaining({ code: "STEP_SPEC_NOT_IMPLEMENTED" })
    );
  });

  it("does not treat a checked decision item as an implementation step", () => {
    const before =
      "- [ ] Quyết định dependency — [`foo.md`](../specs/00-foundation/foo.md)";
    const after = before.replace("[ ]", "[x]");

    const violations = validateProgress({
      beforeChecklist: before,
      afterChecklist: after,
      changedPaths: ["packages/gates/scripts/check-progress-lib.ts"],
      specs: [{ ...P0_SPEC, status: "approved" }],
      testContents: [],
    });

    expect(violations).not.toContainEqual(
      expect.objectContaining({ code: "STEP_SPEC_NOT_IMPLEMENTED" })
    );
  });

  it("rejects an implemented spec without a test referencing its BR", () => {
    const violations = validateProgress({
      beforeChecklist: "",
      afterChecklist: "",
      changedPaths: ["packages/foo/src/index.ts"],
      specs: [P0_SPEC],
      testContents: ["it('has an unrelated test', () => {})"],
    });

    expect(violations).toContainEqual(
      expect.objectContaining({ code: "IMPLEMENTED_SPEC_WITHOUT_BR_TEST" })
    );
  });

  it("rejects an implemented spec proven only by another spec's rule", () => {
    const violations = validateProgress({
      beforeChecklist: "",
      afterChecklist: "",
      changedPaths: ["packages/foo/src/index.ts"],
      specs: [
        {
          ...P0_SPEC,
          citedRuleIds: ["BR-FOO-01", "BR-BAR-02"],
          ownedRuleIds: ["BR-FOO-01"],
        },
      ],
      testContents: ["it('BR-BAR-02: borrowed evidence', () => {})"],
    });

    expect(violations).toContainEqual(
      expect.objectContaining({
        code: "IMPLEMENTED_SPEC_WITHOUT_BR_TEST",
        message: expect.stringContaining("đi vay"),
      })
    );
  });

  it("rejects an implemented spec whose prefix is not in the registry", () => {
    const violations = validateProgress({
      beforeChecklist: "",
      afterChecklist: "",
      changedPaths: ["packages/foo/src/index.ts"],
      specs: [{ ...P0_SPEC, citedRuleIds: ["BR-BAR-02"], ownedRuleIds: [] }],
      testContents: ["it('BR-BAR-02: works', () => {})"],
    });

    expect(violations).toContainEqual(
      expect.objectContaining({ code: "IMPLEMENTED_SPEC_WITHOUT_OWNED_RULE" })
    );
  });

  it("leaves a spec that is not implemented alone", () => {
    expect(
      validateProgress({
        beforeChecklist: "",
        afterChecklist: "",
        changedPaths: ["packages/foo/src/index.ts"],
        specs: [{ ...P0_SPEC, status: "draft", ownedRuleIds: [] }],
        testContents: [],
      })
    ).toEqual([]);
  });

  it("rejects a phase-gate tick while one spec in the phase is not implemented", () => {
    const before = ["## Cổng ra P0", "- [ ] Điều kiện ở SPEC.md §13"].join(
      "\n"
    );
    const after = before.replace("[ ]", "[x]");

    const violations = validateProgress({
      beforeChecklist: before,
      afterChecklist: after,
      changedPaths: ["packages/foo/src/index.ts"],
      specs: [{ ...P0_SPEC, status: "approved" }],
      testContents: [],
    });

    expect(violations).toContainEqual(
      expect.objectContaining({ code: "PHASE_NOT_IMPLEMENTED" })
    );
  });

  it("accepts a real step tick with implemented spec, BR test, and code evidence", () => {
    const before =
      "- [ ] **P0.1** Foo — [`foo.md`](../specs/00-foundation/foo.md)";
    const after = before.replace("[ ]", "[x]");

    expect(
      validateProgress({
        beforeChecklist: before,
        afterChecklist: after,
        changedPaths: ["packages/foo/src/index.ts"],
        specs: [P0_SPEC],
        testContents: ["it('BR-FOO-01: works', () => {})"],
      })
    ).toEqual([]);
  });
});
