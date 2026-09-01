import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatProvisionalReport,
  parseProvisionalValuesTable,
  scanDocsForProvisionalValues,
} from "#src/seed-content/gates/provisional-values";

describe("Cổng sổ số tạm & luật chống quyết định vội (BR-PVD-01, Task #201 / #204)", () => {
  const docsDir = resolve(import.meta.dirname, "../../../../docs");
  const provisionalFilePath = resolve(docsDir, "tasks/provisional-values.md");

  it("file sổ số tạm docs/tasks/provisional-values.md phải tồn tại", () => {
    expect(existsSync(provisionalFilePath)).toBe(true);
  });

  it("sổ số tạm phải chứa đủ 8 hàng định danh H1..H8", () => {
    const content = readFileSync(provisionalFilePath, "utf-8");
    const { entries, violations } = parseProvisionalValuesTable(content);

    expect(violations).toHaveLength(0);
    expect(entries.length).toBeGreaterThanOrEqual(8);

    const ids = entries.map((e) => e.id);
    for (let i = 1; i <= 8; i++) {
      expect(ids).toContain(`H${i}`);
    }
  });

  it("quét corpus docs/ thật: mọi chuỗi CHƯA ĐO phải được đăng ký hợp lệ và 0 hàng quá hạn", () => {
    const result = scanDocsForProvisionalValues(docsDir, provisionalFilePath);
    const report = formatProvisionalReport(result);

    // Không có vi phạm nào
    expect(result.violations).toHaveLength(0);
    expect(result.totalDocsScanned).toBeGreaterThan(10);
    expect(report).toContain("[XANH]");
  });

  describe("Ca âm bắt buộc", () => {
    it("Ca âm 1: phát hiện vi phạm UNREGISTERED_PROVISIONAL_VALUE khi có chuỗi CHƯA ĐO chưa đăng ký", () => {
      // Giả lập bảng sổ số tạm chỉ chứa H1, không chứa H99
      const mockProvisionalContent = `
# Sổ số tạm
| # | Giá trị tạm | Dùng ở | Vì sao chưa đo được | Task chủ | Hạn |
|---|---|---|---|---|---|
| H1 | giá trị | specs/known.md | lý do | #999 | ✔ đóng |
`;
      const { entries } = parseProvisionalValuesTable(mockProvisionalContent);
      expect(entries).toHaveLength(1);

      // File lạ chứa CHƯA ĐO không match bất kỳ usedIn nào
      const unregisteredDocRelative = "specs/secret/unregistered-feature.md";
      const isRegistered = entries.some((e) =>
        e.usedIn.includes(unregisteredDocRelative)
      );
      expect(isRegistered).toBe(false);
    });

    it("Ca âm 2: phát hiện vi phạm OVERDUE_PROVISIONAL_VALUE khi có hàng trong sổ bị quá hạn", () => {
      const mockOverdueContent = `
# Sổ số tạm
| # | Giá trị tạm | Dùng ở | Vì sao chưa đo được | Task chủ | Hạn |
|---|---|---|---|---|---|
| H1 | giá trị A | specs/doc1.md | chưa có số | #991 | quá hạn: 2026-08-01 |
| H2 | giá trị B | specs/doc2.md | chưa đo xong | #992 | overdue |
| H3 | giá trị C | specs/doc3.md | đã đo xong | #993 | ✔ đóng |
`;
      const { entries, violations } =
        parseProvisionalValuesTable(mockOverdueContent);

      expect(entries).toHaveLength(3);
      expect(violations.length).toBe(2);
      expect(
        violations.every((v) => v.rule === "OVERDUE_PROVISIONAL_VALUE")
      ).toBe(true);
    });

    it("Ca âm 3: phát hiện vi phạm INVALID_PROVISIONAL_TABLE khi bảng sổ rỗng hoặc thiếu cột", () => {
      const mockEmptyTable = `
# Sổ số tạm nhưng không có bảng nào
Chỉ có chữ và không có định dạng bảng markdown.
`;
      const { entries, violations } =
        parseProvisionalValuesTable(mockEmptyTable);

      expect(entries).toHaveLength(0);
      expect(
        violations.some((v) => v.rule === "INVALID_PROVISIONAL_TABLE")
      ).toBe(true);
    });
  });
});
