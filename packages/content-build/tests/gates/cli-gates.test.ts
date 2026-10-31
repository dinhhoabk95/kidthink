import { describe, expect, it } from "vitest";
import { runEngineDepthGate } from "#src/cli/check-engine-depth";
import { runGoLiveGate } from "#src/cli/check-go-live";

describe("Các cổng CLI thực sự chạy trong pnpm test", () => {
  it("check:engine-depth chạy và trả mã thoát", () => {
    const code = runEngineDepthGate({ quiet: true });
    expect(typeof code).toBe("number");
  });

  it("check:go-live chạy và trả mã thoát", () => {
    const code = runGoLiveGate({ quiet: true });
    expect(typeof code).toBe("number");
  });

  it("check:go-live chạy và xác nhận trạng thái sẵn sàng (exit 0)", () => {
    const code = runGoLiveGate({ quiet: true });
    expect(code).toBe(0);
  });
});
