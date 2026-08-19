import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findUnvalidatedRoutes,
  readDebtList,
} from "../lint-route-validation.ts";

/**
 * TYPE-SAFETY `BR-TYP-07`: cổng phải có ca âm — một route mẫu vi phạm bắt buộc
 * làm cổng báo lỗi. Fixture nằm ở `scripts/tests/fixtures/route-validation/`.
 */
const FIXTURES = path.join(import.meta.dirname, "fixtures", "route-validation");

function scan(folder: string) {
  return findUnvalidatedRoutes([path.join(FIXTURES, folder)]);
}

describe("lint:route-validation", () => {
  it("ca âm: route đọc body mà không parse thì bị bắt", () => {
    const findings = scan("bad");

    expect(findings).toHaveLength(1);
    expect(findings[0].file).toContain("bad/create.post.ts");
  });

  it("route có safeParse thì không bị bắt", () => {
    expect(scan("good")).toEqual([]);
  });

  it("route khai exempt kèm lý do thì được bỏ qua", () => {
    expect(scan("exempt")).toEqual([]);
  });

  it("sổ nợ là 0 (toàn bộ route đã được validate)", () => {
    const debt = readDebtList();

    expect(debt).toHaveLength(0);
  });
});
