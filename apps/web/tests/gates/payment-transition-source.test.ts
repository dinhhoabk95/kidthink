import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectProductionSources,
  SERVICE_CALL_ALLOWED,
  SOURCE_LITERAL_ALLOWED,
  scanTransitionSource,
} from "./payment-transition-source.ts";

const VIOLATION_FIXTURE = resolve(
  import.meta.dirname,
  "fixtures/payment-transition-source/manual-approve-with-webhook-source.txt"
);

describe("BR-APM-08 — nguồn verified_gateway_webhook chỉ đi từ webhook đã xác minh", () => {
  it("nguồn thật dưới apps/ và packages/ không vi phạm", () => {
    const files = collectProductionSources();
    expect(scanTransitionSource(files)).toEqual([]);
  });

  it("các file được phép vẫn tồn tại và thật sự chứa thứ cổng canh", () => {
    // Đổi tên file mà quên cập nhật danh sách cho phép thì cổng xanh giả.
    const files = collectProductionSources();
    const byPath = new Map(files.map((f) => [f.path, f.text]));
    for (const allowed of SOURCE_LITERAL_ALLOWED) {
      expect(byPath.get(allowed)).toContain("verified_gateway_webhook");
    }
    for (const allowed of SERVICE_CALL_ALLOWED) {
      expect(byPath.get(allowed)).toContain("processAutomatedPaymentWebhook(");
    }
  });

  it("ca âm: route duyệt tay truyền nguồn webhook và gọi thẳng service thì đỏ", () => {
    const violations = scanTransitionSource([
      {
        path: "apps/web/server/api/managers/orders/[uuid]/approve.post.ts",
        text: readFileSync(VIOLATION_FIXTURE, "utf8"),
      },
    ]);
    expect(violations.map((v) => v.reason.slice(0, 9))).toEqual([
      "BR-APM-08",
      "BR-APM-01",
    ]);
  });

  it("cùng mẫu đó trong file được phép thì không bị bắt", () => {
    const text = readFileSync(VIOLATION_FIXTURE, "utf8");
    expect(
      scanTransitionSource([
        { path: "apps/web/server/services/automated-payment.ts", text },
      ]).map((v) => v.reason.slice(0, 9))
    ).toEqual(["BR-APM-01"]);
  });
});
