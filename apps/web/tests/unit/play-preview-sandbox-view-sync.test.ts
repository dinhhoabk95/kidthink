import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Task #313 Phase 23 (GT-020, `BR-E020-09`): preview-sandbox phải đồng bộ view
 * của engine sang `usePlayGesture` mỗi khi view đổi, như trang chơi thật. Thiếu
 * `engine.onViewChanged`, ảnh chụp view lúc xem trước (mọi thẻ "selected") bị
 * giữ mãi nên lớp phủ thẻ nâng lên và vòng vàng hiện sai sau pha xem trước.
 */
const SANDBOX = path.resolve(
  import.meta.dirname,
  "../../app/pages/play/preview-sandbox.vue"
);

const VIEW_SYNC_PATTERN = /engine\.onViewChanged\s*=/;

function wiresViewSync(source: string): boolean {
  return VIEW_SYNC_PATTERN.test(source);
}

describe("preview-sandbox đồng bộ view cho gesture", () => {
  it("gán engine.onViewChanged", () => {
    expect(wiresViewSync(readFileSync(SANDBOX, "utf8"))).toBe(true);
  });

  it("ca âm: bỏ dòng gán thì bị báo", () => {
    const without = readFileSync(SANDBOX, "utf8").replaceAll(
      "engine.onViewChanged =",
      "engine.legacyViewHook ="
    );
    expect(wiresViewSync(without)).toBe(false);
  });
});
