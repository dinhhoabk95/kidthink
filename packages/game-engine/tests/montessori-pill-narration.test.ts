import { describe, expect, it } from "vitest";
import { MontessoriExploreTracker } from "#src/systems/montessori-explore-system";

/**
 * Task #313 Phase 2 — pill Montessori phải nghe được (`BR-PNR-12`): chữ trên
 * pill không phải kênh chính của trẻ 3–6 tuổi chưa đọc.
 */
describe("MontessoriExploreTracker.takePillNarration", () => {
  it("không có gì trên pill thì không có lời", () => {
    const tracker = new MontessoriExploreTracker();
    expect(tracker.takePillNarration()).toBeNull();
  });

  it("đọc lý do control-of-error đúng một lần cho mỗi nội dung", () => {
    const tracker = new MontessoriExploreTracker();
    tracker.recordWrongAttempt({ reasonVi: "Toa thứ 2 chưa đúng nhịp" });
    expect(tracker.takePillNarration()).toBe("Toa thứ 2 chưa đúng nhịp");
    expect(tracker.takePillNarration()).toBeNull();
  });

  it("lý do mới thì đọc lại; lý do trùng liên tiếp thì không đọc lại", () => {
    const tracker = new MontessoriExploreTracker();
    tracker.recordWrongAttempt({ reasonVi: "A" });
    expect(tracker.takePillNarration()).toBe("A");
    tracker.recordWrongAttempt({ reasonVi: "A" });
    expect(tracker.takePillNarration()).toBeNull();
    tracker.recordWrongAttempt({ reasonVi: "B" });
    expect(tracker.takePillNarration()).toBe("B");
  });

  it("pill tắt rồi hiện lại cùng nội dung thì đọc lại", () => {
    const tracker = new MontessoriExploreTracker({ calloutDurationMs: 400 });
    tracker.recordWrongAttempt({ reasonVi: "A" });
    expect(tracker.takePillNarration()).toBe("A");
    tracker.tick(500);
    expect(tracker.takePillNarration()).toBeNull();
    tracker.recordWrongAttempt({ reasonVi: "A" });
    expect(tracker.takePillNarration()).toBe("A");
  });

  it("pha khám phá đọc tiến độ bằng lời, không đọc ký hiệu (2/5)", () => {
    const tracker = new MontessoriExploreTracker({ milestoneTarget: 5 });
    tracker.reset(true);
    tracker.recordExploreAction();
    tracker.recordExploreAction();
    const line = tracker.takePillNarration();
    expect(line).toBe("Khám phá tự do, 2 trên 5");
    expect(line).not.toContain("/");
  });
});
