import { describe, expect, it } from "vitest";
import {
  checkRuleIntegrity,
  extractDefinedRules,
  extractInvariantRuleIds,
  extractRegisteredPrefixes,
} from "../lint-rule-ids.ts";

describe("lint:rule-ids (BR-REG2-01..04)", () => {
  it("toàn bộ corpus hiện tại đạt chuẩn bất biến và không có vi phạm", () => {
    const violations = checkRuleIntegrity();
    expect(violations).toEqual([]);
  });

  it("trích xuất đúng danh sách prefix đã đăng ký từ business-rules.md §7.1", () => {
    const mockContent = `
## 7. Data
### 7.1 Bản đồ prefix → spec
| Prefix | Spec |
|---|---|
| \`BR-AUT\` | [\`auth-tokens-sessions.md\`](../01-platform/auth-tokens-sessions.md) |
| \`BR-SEC\` | [\`security-checklist.md\`](../08-quality/security-checklist.md) |
### 7.2 Danh sách khác
`;
    const prefixes = extractRegisteredPrefixes(mockContent);
    expect(prefixes.has("BR-AUT")).toBe(true);
    expect(prefixes.has("BR-SEC")).toBe(true);
    expect(prefixes.has("BR-NONEXISTENT")).toBe(false);
  });

  it("trích xuất đúng danh sách invariant rule từ business-rules.md §7.3", () => {
    const mockContent = `
### 7.3 Danh sách rule không bao giờ được vi phạm
| Rule | Tên | Nội dung |
|---|---|---|
| \`BR-CDC-01\` | Thu tối thiểu | Không thu họ tên |
| \`BR-PAY-03\` | Server tính giá | Không nhận giá từ client |
## 8. Errors
`;
    const invariantIds = extractInvariantRuleIds(mockContent);
    expect(invariantIds).toContain("BR-CDC-01");
    expect(invariantIds).toContain("BR-PAY-03");
  });

  it("ca âm BR-REG2-01: phát hiện rule có prefix chưa đăng ký", () => {
    const mockBrContent = `
## 7. Data
### 7.1 Bản đồ prefix → spec
| Prefix | Spec |
|---|---|
| \`BR-KNOWN\` | [\`known.md\`](known.md) |
`;
    const violations = checkRuleIntegrity({
      businessRulesContent: mockBrContent,
      headRules: new Map(),
    });

    const reg1Violations = violations.filter((v) => v.rule === "BR-REG2-01");
    expect(reg1Violations.length).toBeGreaterThan(0);
    expect(
      reg1Violations.some((v) => v.message.includes("chưa được đăng ký"))
    ).toBe(true);
  });

  it("ca âm BR-REG2-02: phát hiện rule bị xoá so với HEAD", () => {
    const mockHeadRules = new Map([
      [
        "BR-DELETED-99",
        { file: "01-platform/some-spec.md", ruleText: "Rule cũ đã bị xoá" },
      ],
    ]);

    const violations = checkRuleIntegrity({
      headRules: mockHeadRules,
    });

    const reg2Violations = violations.filter((v) => v.rule === "BR-REG2-02");
    expect(reg2Violations.length).toBe(1);
    expect(reg2Violations[0].id).toBe("BR-DELETED-99");
    expect(reg2Violations[0].message).toContain(
      "từng tồn tại ở HEAD nhưng đã bị xoá"
    );
  });

  it("ca âm BR-REG2-04: phát hiện invariant rule trong §7.3 không tồn tại trong corpus", () => {
    const mockBrContent = `
## 7. Data
### 7.1 Bản đồ prefix → spec
| Prefix | Spec |
|---|---|
| \`BR-AUT\` | [\`auth-tokens-sessions.md\`](../01-platform/auth-tokens-sessions.md) |
### 7.3 Danh sách rule không bao giờ được vi phạm
| Rule | Tên | Nội dung |
|---|---|---|
| \`BR-PHANTOM-99\` | Rule ma | Không tồn tại |
`;
    const violations = checkRuleIntegrity({
      businessRulesContent: mockBrContent,
      headRules: new Map(),
    });

    const reg4Violations = violations.filter((v) => v.rule === "BR-REG2-04");
    expect(reg4Violations.length).toBe(1);
    expect(reg4Violations[0].id).toBe("BR-PHANTOM-99");
    expect(reg4Violations[0].message).toContain("không tồn tại trong corpus");
  });

  it("BR-REG2-03: mọi rule trong bảng quy tắc kinh doanh bắt buộc có lý do (cột 'vì sao')", () => {
    const rules = extractDefinedRules();
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) {
      expect(
        r.reason,
        `Rule '${r.id}' trong '${r.file}' thiếu cột lý do/vì sao (BR-REG2-03)`
      ).toBeTruthy();
    }
  });
});
