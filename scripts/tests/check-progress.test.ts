import { describe, expect, it } from "vitest";
import {
  findPromotedCheckboxes,
  type ProgressSpec,
  validateProgress,
} from "../check-progress-lib.ts";

const P0_SPEC: ProgressSpec = {
  id: "FOO",
  phase: "P0",
  rel: "00-foundation/foo.md",
  status: "implemented",
  businessRuleIds: ["BR-FOO-01"],
};

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
      changedPaths: ["scripts/check-progress-lib.ts"],
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
