import { describe, expect, it } from "vitest";
import { runEngineDepthGate } from "#src/seed-content/cli/check-engine-depth";
import { runGoLiveGate } from "#src/seed-content/cli/check-go-live";
import { runLessonSupplyGate } from "#src/seed-content/cli/check-lesson-supply";

/**
 * Ba cổng này từng là script `tsx` mà **không gì gọi**: không có trong
 * `pnpm check`, không có trong `lefthook.yml`, và repo không có CI. Hai trong ba
 * exit khác 0 ngay hôm nay, và không ai biết.
 *
 * File này kéo chúng vào `pnpm test`. Nó Cấm — NEVER khẳng định "cổng xanh" —
 * chúng đang đỏ vì lý do thật (thiếu 45 tiết, 8 engine chưa có render). Nó
 * khẳng định cổng **chạy được và trả lời**, nên một thay đổi làm cổng câm sẽ đỏ.
 */
describe("Ba cổng CLI thực sự chạy trong pnpm test", () => {
  it("check:engine-depth chạy và trả mã thoát", () => {
    const code = runEngineDepthGate({ quiet: true });
    expect(typeof code).toBe("number");
  });

  it("check:lesson-supply chạy và trả mã thoát", () => {
    const code = runLessonSupplyGate({ quiet: true });
    expect(typeof code).toBe("number");
  });

  it("check:go-live chạy và trả mã thoát", () => {
    const code = runGoLiveGate({ quiet: true });
    expect(typeof code).toBe("number");
  });

  it("ca âm: cổng go-live đang ĐỎ, và đỏ vì lý do đã đo — không phải vì câm", () => {
    // Trước khi sửa, ba mục đầu của trục game là phép so `config.active_engines`
    // với chính nó, nên chúng luôn [PASS]. Giờ chúng đo registry thật.
    const code = runGoLiveGate({ quiet: true });
    expect(code).not.toBe(0);
  });
});
