import { beforeEach, describe, expect, it } from "vitest";
import {
  checkC7,
  checkC9,
  getViolations,
  getWarnings,
  makeSpecFile,
  parseFrontmatter,
  resetLintState,
} from "../lint-specs-lib.ts";

beforeEach(() => {
  resetLintState();
});

describe("parseFrontmatter", () => {
  it("returns empty data for content with no frontmatter", () => {
    const { data, endLine } = parseFrontmatter(
      "# Just a heading\n\nBody text."
    );
    expect(data).toEqual({});
    expect(endLine).toBe(0);
  });

  it("returns empty data when the closing --- is missing (malformed)", () => {
    const { data, endLine } = parseFrontmatter("---\nspec: FOO\ntitle: Foo\n");
    expect(data).toEqual({});
    expect(endLine).toBe(0);
  });

  it("parses a nested array field (depends_on: with - items)", () => {
    const content = [
      "---",
      "spec: FOO",
      "depends_on:",
      "  - BAR",
      "  - BAZ",
      "---",
      "",
      "## 1. Objective",
    ].join("\n");
    const { data } = parseFrontmatter(content);
    expect(data.depends_on).toEqual(["BAR", "BAZ"]);
  });

  it("parses an inline array ([A, B]) as an array of trimmed items", () => {
    const { data } = parseFrontmatter(
      "---\nowns:\n  - x\ndepends_on: [FOO, BAR]\n---\n"
    );
    expect(data.depends_on).toEqual(["FOO", "BAR"]);
  });

  it("treats an empty inline array ([]) as an empty array, not undefined", () => {
    const { data } = parseFrontmatter("---\ndepends_on: []\n---\n");
    expect(data.depends_on).toEqual([]);
  });

  it("strips wrapping quotes from a quoted scalar containing a colon", () => {
    const { data } = parseFrontmatter('---\ntitle: "Foo: bar"\n---\n');
    expect(data.title).toBe("Foo: bar");
  });

  it("does NOT treat a scalar merely starting with [ as an array", () => {
    // Regression for H-3: `title: [Draft] Something` looks array-ish but is a
    // plain string — must not silently become ["Draft] Something"].
    const { data } = parseFrontmatter("---\ntitle: [Draft] Something\n---\n");
    expect(data.title).toBe("[Draft] Something");
  });

  it("parses boolean and empty scalars", () => {
    const { data } = parseFrontmatter(
      "---\nmvp: true\nreviewed:\nphase: false\n---\n"
    );
    expect(data.mvp).toBe(true);
    expect(data.reviewed).toBeUndefined();
    expect(data.phase).toBe(false);
  });

  it("reports the correct endLine (line number of the closing ---)", () => {
    const { endLine } = parseFrontmatter("---\nspec: FOO\n---\nbody\n");
    expect(endLine).toBe(3);
  });
});

describe("checkC7 (dependency cycle detection)", () => {
  function spec(id: string, dependsOn: string[]) {
    const content = [
      "---",
      `spec: ${id}`,
      "depends_on:",
      ...dependsOn.map((d) => `  - ${d}`),
      "---",
    ].join("\n");
    return makeSpecFile(`/fake/${id}.md`, `fake/${id}.md`, content);
  }

  // checkC7 reports via warn(), not fail() — a dependency cycle in the spec
  // corpus is a design smell to flag, not a hard build-breaking error.
  it("flags a real cycle (A -> B -> A)", () => {
    const specs = [spec("A", ["B"]), spec("B", ["A"])];
    checkC7(specs);
    expect(getWarnings().some((w) => w.check === "C7")).toBe(true);
  });

  it("does not flag a valid DAG (A -> B -> C, no cycle)", () => {
    const specs = [spec("A", ["B"]), spec("B", ["C"]), spec("C", [])];
    checkC7(specs);
    expect(getWarnings()).toHaveLength(0);
  });

  it("ignores deps pointing outside the known spec graph (e.g. CONVENTIONS)", () => {
    const specs = [spec("A", ["CONVENTIONS"])];
    checkC7(specs);
    expect(getWarnings()).toHaveLength(0);
  });

  it("flags a longer cycle (A -> B -> C -> A)", () => {
    const specs = [spec("A", ["B"]), spec("B", ["C"]), spec("C", ["A"])];
    checkC7(specs);
    expect(getWarnings().some((w) => w.check === "C7")).toBe(true);
  });
});

describe("checkC9 (banned token negation context)", () => {
  function specWithBody(body: string) {
    const content = ["---", "spec: FOO", "---", body].join("\n");
    return makeSpecFile("/fake/foo.md", "fake/foo.md", content);
  }

  it("flags a true positive: banned token used as if it were real", () => {
    const specs = [
      specWithBody(
        "## 6. Business rules\n\nDùng `tenant_id` để phân biệt khách."
      ),
    ];
    checkC9(specs);
    const violations = getViolations();
    expect(violations.some((v) => v.check === "C9")).toBe(true);
  });

  it("does NOT flag a false positive: the line itself is banning the token", () => {
    const specs = [
      specWithBody(
        "## 6. Business rules\n\n❌ NEVER dùng `tenant_id` trong schema."
      ),
    ];
    checkC9(specs);
    expect(getViolations()).toHaveLength(0);
  });

  it("does not flag banned tokens discussed inside §10 Boundaries", () => {
    const specs = [
      specWithBody(
        "## 10. Boundaries\n\nNgoài phạm vi: mọi khái niệm `classification`."
      ),
    ];
    checkC9(specs);
    expect(getViolations()).toHaveLength(0);
  });

  it("does not flag banned tokens inside a fenced code block", () => {
    const specs = [
      specWithBody("## 6. Business rules\n\n```\nconst tenant_id = 1;\n```\n"),
    ];
    checkC9(specs);
    expect(getViolations()).toHaveLength(0);
  });
});
