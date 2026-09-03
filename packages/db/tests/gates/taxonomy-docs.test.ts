import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMPETENCY_DOC_FILES,
  generateTaxonomyDoc,
  syncTaxonomyDocs,
  verifyIdentitiesVsMarkdown,
} from "../../../../scripts/taxonomy/sync-taxonomy-docs.ts";

const AGE_MISMATCH_REGEX = /Age mismatch for C1\.NREC\.01/;

describe("taxonomy-docs gate (Q2 / Task #208)", () => {
  const docsDir = path.resolve(
    import.meta.dirname,
    "../../../../docs/taxonomy"
  );

  it("so từng trường của từng kỹ năng: trùng khít 408/408 giữa TypeScript và Markdown", () => {
    const result = verifyIdentitiesVsMarkdown(docsDir);
    expect(result.total).toBe(408);
    expect(result.matches).toBe(408);
  });

  it("sinh ngược Markdown cho ra byte giống hệt file trong repo", () => {
    for (const filename of COMPETENCY_DOC_FILES) {
      const filePath = path.join(docsDir, filename);
      const orig = fs.readFileSync(filePath, "utf8");
      const generated = generateTaxonomyDoc(filename, docsDir);
      expect(generated).toBe(orig);
    }
  });

  it("test chứng minh bắt lỗi: sửa tay một ô trong bảng Markdown ⟹ phép kiểm tra đỏ", () => {
    const testFile = path.join(docsDir, "c1-mathematical-thinking.md");
    const orig = fs.readFileSync(testFile, "utf8");

    try {
      // Sửa thử tuổi của kỹ năng C1.NREC.01 từ 3 thành 4
      const tampered = orig.replace(
        "| C1.NREC.01 | Nhận biết số 0–3 | 3 | 1 |",
        "| C1.NREC.01 | Nhận biết số 0–3 | 4 | 1 |"
      );
      expect(tampered).not.toBe(orig);
      fs.writeFileSync(testFile, tampered, "utf8");

      expect(() => {
        syncTaxonomyDocs({ check: true, docsDir });
      }).toThrow(AGE_MISMATCH_REGEX);
    } finally {
      fs.writeFileSync(testFile, orig, "utf8");
    }
  });
});
