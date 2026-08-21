import { readFileSync } from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import { checkLegalReviewStatus } from "./legal-review.ts";

/**
 * BR-LGL-07 (D-HZ) — không tài liệu pháp lý nào được ở `pending_review` khi mặt
 * công khai đã bật.
 *
 * Cổng này trước là CLI `pnpm lint:legal-review`. Assert duy nhất trên repo thật
 * nằm trong test của apps/web và nó **xanh giả**: nó truyền mảng `LEGAL_DOCUMENTS`
 * vào tham số `fileContent: string`, regex quét `String(mảng)` = "[object Object]"
 * nên không bao giờ khớp. Ca âm dưới đây là thứ chặn kiểu xanh giả đó.
 */
const SOURCE_PATH = repoPath("packages/shared/src/public-seo.ts");
const FIRST_REVIEW_STATUS = /reviewStatus:\s*["'][^"']+["']/;
const SLUG_FIELD = /slug:\s*["']/g;

describe("Cổng lint:legal-review (BR-LGL-07)", () => {
  it("mọi tài liệu pháp lý trong repo đã duyệt xong", () => {
    const result = checkLegalReviewStatus();

    expect(result.pendingDocs).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("thật sự đọc được nguồn — không xanh vì quét chuỗi rỗng", () => {
    const source = readFileSync(SOURCE_PATH, "utf-8");

    expect(source).toContain("reviewStatus");
    expect(source.match(SLUG_FIELD)?.length ?? 0).toBeGreaterThan(7);
  });

  it("ca âm: một tài liệu còn pending_review làm cổng đỏ", () => {
    const source = readFileSync(SOURCE_PATH, "utf-8");
    const withPending = source.replace(
      FIRST_REVIEW_STATUS,
      'reviewStatus: "pending_review"'
    );

    const result = checkLegalReviewStatus(withPending);

    expect(result.valid).toBe(false);
    expect(result.pendingDocs).toHaveLength(1);
  });
});
