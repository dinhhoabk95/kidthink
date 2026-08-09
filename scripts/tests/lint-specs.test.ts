import { beforeEach, describe, expect, it } from "vitest";
import {
  checkC6,
  checkC7,
  checkC8,
  checkC9,
  checkC10,
  checkC12,
  checkC13,
  checkC14,
  checkC15,
  checkC16,
  checkC17,
  collectSpecFiles,
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

  // checkC7 reports via fail(), not warn() — promoted at the end of Task #6
  // (2026-08-08) once the corpus reached 0 live cycles. Before that, a cycle
  // meant every spec in it could never reach `approved` (C8 blocks
  // approved-depends-on-draft both ways) and it sat there silently.
  //
  // Assert the exact COUNT, not `.some(...)`, so both over- and under-reporting
  // fail. Measured on 2026-08-08 by mutating checkC7:
  //   - narrowing the GRAY back-edge test to `dep !== node` (drops self-edges)
  //     -> only the self-dependency case below turns red
  //   - making `cycleKey` collision-prone (`String(cycle.length)`)
  //     -> only the disjoint-cycles case below turns red, and the real corpus
  //        silently drops from 8 reported cycles to 2
  // Removing the `reportedCycles` guard entirely changed nothing on any input
  // tried, including the real corpus — the 3-colour DFS already visits each
  // node once. That guard is defensive, not load-bearing today.
  it("flags a real cycle (A -> B -> A) exactly once", () => {
    const specs = [spec("A", ["B"]), spec("B", ["A"])];
    checkC7(specs);
    expect(getViolations().filter((w) => w.check === "C7")).toHaveLength(1);
  });

  it("does not flag a valid DAG (A -> B -> C, no cycle)", () => {
    const specs = [spec("A", ["B"]), spec("B", ["C"]), spec("C", [])];
    checkC7(specs);
    expect(getViolations()).toHaveLength(0);
  });

  it("ignores deps pointing outside the known spec graph (e.g. CONVENTIONS)", () => {
    const specs = [spec("A", ["CONVENTIONS"])];
    checkC7(specs);
    expect(getViolations()).toHaveLength(0);
  });

  it("flags a longer cycle (A -> B -> C -> A) exactly once", () => {
    const specs = [spec("A", ["B"]), spec("B", ["C"]), spec("C", ["A"])];
    checkC7(specs);
    expect(getViolations().filter((w) => w.check === "C7")).toHaveLength(1);
  });

  // Two independent cycles must both be reported. De-duplication keys on the
  // sorted node set; a key that collides across distinct cycles drops one of
  // them silently — see the measurement note above.
  it("flags two disjoint cycles separately", () => {
    const specs = [
      spec("A", ["B"]),
      spec("B", ["A"]),
      spec("C", ["D"]),
      spec("D", ["C"]),
    ];
    checkC7(specs);
    expect(getViolations().filter((w) => w.check === "C7")).toHaveLength(2);
  });

  // A self-edge (A depends_on A) is the degenerate cycle. It is the easiest
  // one to write by accident when copy-pasting frontmatter between specs.
  it("flags a self-dependency (A -> A)", () => {
    const specs = [spec("A", ["A"])];
    checkC7(specs);
    expect(getViolations().filter((w) => w.check === "C7")).toHaveLength(1);
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

describe("checkC6 (BR-ID duplicate definitions + missing vì sao)", () => {
  function specWithBrRow(id: string, rel: string, row: string) {
    const content = [
      "---",
      `spec: ${id}`,
      "---",
      "",
      "## 6. Business rules",
      "",
      "| ID | Rule | Vì sao |",
      "|---|---|---|",
      row,
    ].join("\n");
    return makeSpecFile(`/fake/${rel}`, rel, content);
  }

  // Ca âm — chiều "có" (dương): hai spec khác nhau cùng định nghĩa BR-DM-01 ở
  // §6 ⇒ phải fail cả hai vị trí, kèm file:line, không phải warn im lặng.
  it("flags BR-DM-01 defined a second time in a different spec (fixture present)", () => {
    const specs = [
      specWithBrRow("A", "fake/a.md", "| `BR-DM-01` | Rule A | vì lý do A |"),
      specWithBrRow("B", "fake/b.md", "| `BR-DM-01` | Rule B | vì lý do B |"),
    ];
    checkC6(specs);
    const dupes = getViolations().filter((v) => v.check === "C6");
    expect(dupes).toHaveLength(2);
    expect(dupes[0]?.file).toBe("fake/a.md");
    expect(dupes[1]?.file).toBe("fake/b.md");
    expect(dupes.every((v) => v.message.includes("BR-DM-01"))).toBe(true);
  });

  // Ca âm — chiều "không" (âm): xoá fixture trùng đi (chỉ còn một định nghĩa)
  // ⇒ exit sạch, không còn violation C6 nào.
  it("does not flag BR-DM-01 once the duplicate fixture is removed", () => {
    const specs = [
      specWithBrRow("A", "fake/a.md", "| `BR-DM-01` | Rule A | vì lý do A |"),
    ];
    checkC6(specs);
    expect(getViolations().filter((v) => v.check === "C6")).toHaveLength(0);
  });

  // Column 1 is not always the bare code. Requiring it to be exactly
  // `` `BR-XXX-NN` `` skipped 68 rows corpus-wide, in already-approved specs —
  // both the missing-"vì sao" warning and the duplicate-ID error went with
  // them. Measured 2026-08-08.
  it("sees a row whose first cell carries a label after the code", () => {
    const specs = [
      specWithBrRow("A", "fake/a.md", "| `BR-ENG-01` (thuần TS) | Rule A |  |"),
    ];
    checkC6(specs);
    const c6 = getWarnings().filter((w) => w.check === "C6");
    expect(c6).toHaveLength(1);
    expect(c6[0]?.message).toContain("BR-ENG-01");
  });

  it("sees a row whose first cell carries a second related code", () => {
    const specs = [
      specWithBrRow(
        "A",
        "fake/a.md",
        "| `BR-CDC-02` `BR-CDC-03` | Rule A |  |"
      ),
      specWithBrRow("B", "fake/b.md", "| `BR-CDC-02` | Rule B | vì lý do B |"),
    ];
    checkC6(specs);
    expect(
      getViolations().filter((v) => v.check === "C6").length
    ).toBeGreaterThan(0);
  });

  // A `| a | b |` row splits to 4 cells, the last being the text after the
  // closing pipe — not a third column. Reading it as an empty "vì sao"
  // produced 23 bogus warnings against the 2-column registry table in
  // business-rules.md §7.3, 13% of the whole corpus total.
  it("does not demand a vì sao column from a 2-column table", () => {
    const content = [
      "---",
      "spec: REGISTRY",
      "---",
      "",
      "## 7. Data",
      "",
      "| Rule | Nội dung |",
      "|---|---|",
      "| `BR-CDC-01` | Danh sách đóng |",
    ].join("\n");
    checkC6([makeSpecFile("/fake/reg.md", "fake/reg.md", content)]);
    expect(getWarnings().filter((w) => w.check === "C6")).toHaveLength(0);
  });

  it("still demands a vì sao column from a real 3-column table", () => {
    const specs = [
      specWithBrRow("A", "fake/a.md", "| `BR-DM-01` | Rule A |  |"),
    ];
    checkC6(specs);
    expect(getWarnings().filter((w) => w.check === "C6")).toHaveLength(1);
  });
});

describe("checkC10 (banned CI wording, code-fence aware)", () => {
  function specWithBody(rel: string, body: string) {
    const content = ["---", "spec: FOO", "---", body].join("\n");
    return makeSpecFile(`/fake/${rel}`, rel, content);
  }

  // Ca âm — chiều "ngoài fence": phải bắt.
  it("flags 'GitHub Actions' mentioned outside a fenced code block", () => {
    const specs = [
      specWithBody(
        "fake/outside.md",
        "## 6. Business rules\n\nDeploy chạy qua GitHub Actions.\n"
      ),
    ];
    checkC10(specs);
    const hits = getViolations().filter((v) => v.check === "C10");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.file).toBe("fake/outside.md");
  });

  // Ca âm — chiều "trong fence": phải im lặng.
  it("does NOT flag 'GitHub Actions' inside a fenced code block", () => {
    const specs = [
      specWithBody(
        "fake/inside.md",
        "## 6. Business rules\n\n```\n# GitHub Actions example\n```\n"
      ),
    ];
    checkC10(specs);
    expect(
      getViolations().filter(
        (v) => v.check === "C10" && v.file === "fake/inside.md"
      )
    ).toHaveLength(0);
  });
});

describe("checkC12", () => {
  it("passes on fixed corpus — DMO §7 and schema-* §7.x match", () => {
    const specs = collectSpecFiles();
    checkC12(specs);
    const c12Errors = getViolations().filter((v) => v.check === "C12");
    // Post-T5: all mismatches resolved
    expect(c12Errors).toHaveLength(0);
  });
});

describe("checkC13", () => {
  it("passes on fixed corpus — no invalid code literals", () => {
    const specs = collectSpecFiles();
    checkC13(specs);
    const c13Errors = getViolations().filter((v) => v.check === "C13");
    // Post-T5: all code literal issues resolved
    expect(c13Errors).toHaveLength(0);
  });

  it("catches code literal with wrong prefix format in synthetic spec", () => {
    const specs = [
      makeSpecFile(
        "fake/test-c13.md",
        "fake/test-c13.md",
        [
          "---",
          "spec: TEST-C13",
          "title: Test C13",
          "area: 04-play",
          "feature: F-999",
          "status: draft",
          "reviewed: 2026-08-06",
          "priority: p0",
          "depends_on: []",
          "owns: []",
          "---",
          "## 7. Data",
          "",
          "Level code `GL-BAD-FORMAT` should fail C13.",
        ].join("\n")
      ),
    ];
    checkC13(specs);
    const c13Errors = getViolations().filter(
      (v) => v.check === "C13" && v.file === "fake/test-c13.md"
    );
    expect(c13Errors.length).toBe(1);
    expect(c13Errors[0]?.message).toContain("GL-BAD-FORMAT");
  });

  it("does not flag valid code literals", () => {
    const specs = [
      makeSpecFile(
        "fake/test-c13-valid.md",
        "fake/test-c13-valid.md",
        [
          "---",
          "spec: TEST-C13V",
          "title: Test C13 valid",
          "area: 04-play",
          "feature: F-999",
          "status: draft",
          "reviewed: 2026-08-06",
          "priority: p0",
          "depends_on: []",
          "owns: []",
          "---",
          "## 7. Data",
          "",
          "Valid codes: `GL-C1-CNT-MATCH-0007` · `GT-003` · `LO-C1.CNT.03-01` · `EMJ-apple-red`",
        ].join("\n")
      ),
    ];
    checkC13(specs);
    const c13Errors = getViolations().filter(
      (v) => v.check === "C13" && v.file === "fake/test-c13-valid.md"
    );
    expect(c13Errors).toHaveLength(0);
  });
});

// ─── C14/C15 — Task #4, docs/tasks/04-readability-spec.md mục 5.2 ───────────
// Sáu ca âm bắt buộc trong danh sách tám ca của mục 5.2. Hai ca còn lại
// ("cổng thật sự được nối" và ca âm C14 số 3 "văn bản chỉ có chữ, im lặng" —
// ca thứ hai đã phủ gián tiếp bởi test "không báo gì trên văn bản sạch" ở
// dưới) kiểm bằng tay, ghi ở todo.md Bước 2, không phải unit test vì đòi
// sửa package.json.

function fakeSpec(rel: string, lines: string[]) {
  return makeSpecFile(`fake/${rel}`, `fake/${rel}`, lines.join("\n"));
}

describe("checkC14 — cấm ký hiệu emoji trong văn xuôi", () => {
  it("bắt được ký hiệu trong văn xuôi, đúng số dòng", () => {
    const specs = [
      fakeSpec("test-c14-prose.md", [
        "---",
        "spec: TEST-C14",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "Kiểm ở server, ❌ không ở client.",
      ]),
    ];
    checkC14(specs);
    const errors = getViolations().filter(
      (v) => v.check === "C14" && v.file === "specs/fake/test-c14-prose.md"
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.line).toBe(14);
  });

  it("không bắt nhầm ký hiệu nằm trong khối mã", () => {
    const specs = [
      fakeSpec("test-c14-codeblock.md", [
        "---",
        "spec: TEST-C14B",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "```",
        "❌ ví dụ ký hiệu trước khi sửa",
        "```",
      ]),
    ];
    checkC14(specs);
    const errors = getViolations().filter(
      (v) => v.check === "C14" && v.file === "specs/fake/test-c14-codeblock.md"
    );
    expect(errors).toHaveLength(0);
  });

  it("không báo gì trên văn bản chỉ có chữ", () => {
    const specs = [
      fakeSpec("test-c14-clean.md", [
        "---",
        "spec: TEST-C14C",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "Kiểm ở server, không kiểm ở client.",
      ]),
    ];
    checkC14(specs);
    const errors = getViolations().filter(
      (v) => v.check === "C14" && v.file === "specs/fake/test-c14-clean.md"
    );
    expect(errors).toHaveLength(0);
  });

  it("không bắt nhầm bảng thay thế khi đặt trong khối mã", () => {
    const specs = [
      fakeSpec("test-c14-replacement-table.md", [
        "---",
        "spec: TEST-C14D",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "```",
        "| Ký hiệu | Viết thành |",
        "|---|---|",
        "| ❌ | Không ... |",
        "```",
      ]),
    ];
    checkC14(specs);
    const errors = getViolations().filter(
      (v) =>
        v.check === "C14" &&
        v.file === "specs/fake/test-c14-replacement-table.md"
    );
    expect(errors).toHaveLength(0);
  });
});

describe("checkC15 — tham chiếu trần phải là liên kết", () => {
  it("bắt được tên spec trần, gợi ý đường dẫn", () => {
    const specs = [
      fakeSpec("test-c15-bare.md", [
        "---",
        "spec: TEST-C15",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "Xem `access-ladder` để biết chi tiết.",
      ]),
    ];
    checkC15(specs);
    const errors = getViolations().filter(
      (v) => v.check === "C15" && v.file === "specs/fake/test-c15-bare.md"
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("access-ladder.md");
  });

  it("chấp nhận liên kết markdown đúng, im lặng", () => {
    const specs = [
      fakeSpec("test-c15-linked.md", [
        "---",
        "spec: TEST-C15B",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "Xem [`access-ladder.md`](../00-foundation/access-ladder.md) để biết chi tiết.",
      ]),
    ];
    checkC15(specs);
    const errors = getViolations().filter(
      (v) => v.check === "C15" && v.file === "specs/fake/test-c15-linked.md"
    );
    expect(errors).toHaveLength(0);
  });

  it("bỏ qua tên không phải file trong docs/ (package.json)", () => {
    const specs = [
      fakeSpec("test-c15-nonspec.md", [
        "---",
        "spec: TEST-C15C",
        "title: Test",
        "area: play",
        "status: draft",
        "mvp: true",
        "phase: P1",
        "reviewed: 2026-08-07",
        "owns: []",
        "depends_on: []",
        "---",
        "## 6. Business rules",
        "",
        "Xem `package.json` để biết script.",
      ]),
    ];
    checkC15(specs);
    const errors = getViolations().filter(
      (v) => v.check === "C15" && v.file === "specs/fake/test-c15-nonspec.md"
    );
    expect(errors).toHaveLength(0);
  });
});

describe("checkC8 (approved spec depends_on must also be approved)", () => {
  function spec(id: string, status: string, dependsOn: string[]) {
    const content = [
      "---",
      `spec: ${id}`,
      `status: ${status}`,
      "depends_on:",
      ...dependsOn.map((d) => `  - ${d}`),
      "---",
    ].join("\n");
    return makeSpecFile(`/fake/${id}.md`, `fake/${id}.md`, content);
  }

  it("flags approved spec depending on draft spec", () => {
    const specs = [
      spec("ALPHA", "approved", ["BETA"]),
      spec("BETA", "draft", []),
    ];
    checkC8(specs);
    const violations = getViolations().filter((v) => v.check === "C8");
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('"BETA"');
    expect(violations[0].message).toContain('"draft"');
  });

  it("does not flag when dependency is also approved", () => {
    const specs = [
      spec("ALPHA", "approved", ["BETA"]),
      spec("BETA", "approved", []),
    ];
    checkC8(specs);
    const violations = getViolations().filter((v) => v.check === "C8");
    expect(violations).toHaveLength(0);
  });

  it("does not flag draft specs (only checks approved ones)", () => {
    const specs = [spec("ALPHA", "draft", ["BETA"]), spec("BETA", "draft", [])];
    checkC8(specs);
    const violations = getViolations().filter((v) => v.check === "C8");
    expect(violations).toHaveLength(0);
  });

  it("ignores deps pointing outside the known spec graph", () => {
    const specs = [spec("ALPHA", "approved", ["CONVENTIONS"])];
    checkC8(specs);
    const violations = getViolations().filter((v) => v.check === "C8");
    expect(violations).toHaveLength(0);
  });
});

describe("checkC16 (open questions phase and owner check)", () => {
  function specWithQuestions(status: string, rows: string[]) {
    const content = [
      "---",
      "spec: TEST_C16",
      `status: ${status}`,
      "---",
      "",
      "## 11. Open questions",
      "",
      "| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |",
      "|---|---|---|---|---|",
      ...rows,
    ].join("\n");
    return makeSpecFile("/fake/test_c16.md", "fake/test_c16.md", content);
  }

  it("flags approved spec with open question missing owner", () => {
    const specs = [
      specWithQuestions("approved", [
        "| 1 | Test question | Blocked feature | P1 | |",
      ]),
    ];
    checkC16(specs);
    const violations = getViolations().filter((v) => v.check === "C16");
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('thiếu "Chặn phase" hoặc "Chủ"');
  });

  it("passes approved spec with open question having phase and owner", () => {
    const specs = [
      specWithQuestions("approved", [
        "| 1 | Test question | Blocked feature | P1 | product_owner |",
      ]),
    ];
    checkC16(specs);
    const violations = getViolations().filter((v) => v.check === "C16");
    expect(violations).toHaveLength(0);
  });

  it("warns draft spec with open question missing owner", () => {
    const specs = [
      specWithQuestions("draft", [
        "| 1 | Test question | Blocked feature | P1 | - |",
      ]),
    ];
    checkC16(specs);
    const violations = getViolations().filter((v) => v.check === "C16");
    const warnings = getWarnings().filter((w) => w.check === "C16");
    expect(violations).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });

  it("warns draft spec with 3-column table (< 5 columns)", () => {
    const content = [
      "---",
      "spec: TEST_3COL",
      "status: draft",
      "---",
      "",
      "## 11. Open questions",
      "",
      "| # | Câu hỏi | Ghi chú |",
      "|---|---|---|",
      "| 1 | Test | Note |",
    ].join("\n");
    const specs = [
      makeSpecFile("/fake/test_3col.md", "fake/test_3col.md", content),
    ];
    checkC16(specs);
    const warnings = getWarnings().filter((w) => w.check === "C16");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("< 5 cột");
  });

  it("fails approved spec with §11 open questions table having < 5 columns", () => {
    const content = [
      "---",
      "spec: TEST_3COL_APPROVED",
      "status: approved",
      "---",
      "",
      "## 11. Open questions",
      "",
      "| # | Câu hỏi | Ghi chú |",
      "|---|---|---|",
      "| 1 | Test | Note |",
    ].join("\n");
    const specs = [
      makeSpecFile(
        "/fake/test_3col_approved.md",
        "fake/test_3col_approved.md",
        content
      ),
    ];
    checkC16(specs);
    const violations = getViolations().filter((v) => v.check === "C16");
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain("< 5 cột");
  });

  it("warns approved spec with §11 having no table and body not 'Không có.'", () => {
    const content = [
      "---",
      "spec: TEST_NOT_KHONGCO",
      "status: approved",
      "---",
      "",
      "## 11. Open questions",
      "",
      "Cần làm rõ sau.",
    ].join("\n");
    const specs = [
      makeSpecFile(
        "/fake/test_not_khongco.md",
        "fake/test_not_khongco.md",
        content
      ),
    ];
    checkC16(specs);
    const warnings = getWarnings().filter((w) => w.check === "C16");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain(
      'không có bảng câu hỏi mở và không phải "Không có."'
    );
  });

  it("warns approved spec missing §11", () => {
    const content = [
      "---",
      "spec: TEST_NO_SEC11",
      "status: approved",
      "---",
      "",
      "## 1. Objective",
      "Some objective.",
    ].join("\n");
    const specs = [
      makeSpecFile("/fake/test_no_sec11.md", "fake/test_no_sec11.md", content),
    ];
    checkC16(specs);
    const warnings = getWarnings().filter((w) => w.check === "C16");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain(
      'thiếu section "## 11. Open questions"'
    );
  });

  it("passes approved spec with §11 body 'Không có.' (e.g. glossary.md)", () => {
    const content = [
      "---",
      "spec: GLOSSARY",
      "status: approved",
      "---",
      "",
      "## 11. Open questions",
      "",
      "Không có.",
    ].join("\n");
    const specs = [
      makeSpecFile("/fake/test_glossary.md", "fake/test_glossary.md", content),
    ];
    checkC16(specs);
    const warnings = getWarnings().filter((w) => w.check === "C16");
    const violations = getViolations().filter((v) => v.check === "C16");
    expect(warnings).toHaveLength(0);
    expect(violations).toHaveLength(0);
  });

  it("exempts doc: frontmatter files (e.g. READING-GUIDE.md)", () => {
    const content = [
      "---",
      "doc: READING-GUIDE",
      "status: approved",
      "---",
      "",
      "## 1. Objective",
      "Guide content.",
    ].join("\n");
    const specs = [
      makeSpecFile("/fake/reading_guide.md", "fake/reading_guide.md", content),
    ];
    checkC16(specs);
    const warnings = getWarnings().filter((w) => w.check === "C16");
    const violations = getViolations().filter((v) => v.check === "C16");
    expect(warnings).toHaveLength(0);
    expect(violations).toHaveLength(0);
  });
});

describe("checkC17 (bộ giá trị đóng cho cột Chủ) — chặng 1, warn", () => {
  function specWithOwnerRow(status: string, ownerRow: string) {
    const content = [
      "---",
      "spec: TEST_C17",
      `status: ${status}`,
      "---",
      "",
      "## 11. Open questions",
      "",
      "| # | Câu hỏi | Chặn gì | Chặn phase | Chủ |",
      "|---|---|---|---|---|",
      ownerRow,
    ].join("\n");
    return makeSpecFile("/fake/test_c17.md", "fake/test_c17.md", content);
  }

  it("warns approved spec when Chủ is an ad-hoc team name outside the closed set", () => {
    const specs = [
      specWithOwnerRow(
        "approved",
        "| 1 | Test question | Blocked feature | P1 | Product / QA |"
      ),
    ];
    checkC17(specs);
    const violations = getViolations().filter((v) => v.check === "C17");
    const warnings = getWarnings().filter((w) => w.check === "C17");
    expect(violations).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });

  it("stays silent when Chủ is 'người quyết'", () => {
    const specs = [
      specWithOwnerRow(
        "approved",
        "| 1 | Test question | Blocked feature | P1 | người quyết |"
      ),
    ];
    checkC17(specs);
    const warnings = getWarnings().filter((w) => w.check === "C17");
    expect(warnings).toHaveLength(0);
  });

  it("warns on 'người quyết — chặn P2' — loose substring match would be a fake gate", () => {
    const specs = [
      specWithOwnerRow(
        "approved",
        "| 1 | Test question | Blocked feature | P1 | người quyết — chặn P2 |"
      ),
    ];
    checkC17(specs);
    const warnings = getWarnings().filter((w) => w.check === "C17");
    expect(warnings).toHaveLength(1);
  });

  it("stays silent on a struck row with a decision code (D-AE (T11))", () => {
    const specs = [
      specWithOwnerRow(
        "approved",
        "| ~~2~~ | ~~Test question~~ | — | Đã đóng | D-AE (T11) |"
      ),
    ];
    checkC17(specs);
    const warnings = getWarnings().filter((w) => w.check === "C17");
    expect(warnings).toHaveLength(0);
  });

  it("warns on a struck row when Chủ is a team name instead of a D-* code", () => {
    const specs = [
      specWithOwnerRow(
        "approved",
        "| ~~2~~ | ~~Test question~~ | — | Đã đóng | Infra |"
      ),
    ];
    checkC17(specs);
    const warnings = getWarnings().filter((w) => w.check === "C17");
    expect(warnings).toHaveLength(1);
  });

  it("warns on a draft spec too — chặng 1 is warn for every status", () => {
    const specs = [
      specWithOwnerRow(
        "draft",
        "| 1 | Test question | Blocked feature | P1 | DevOps / Infra |"
      ),
    ];
    checkC17(specs);
    const violations = getViolations().filter((v) => v.check === "C17");
    const warnings = getWarnings().filter((w) => w.check === "C17");
    expect(violations).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });
});
