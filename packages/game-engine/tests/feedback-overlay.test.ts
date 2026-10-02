import { describe, expect, it } from "vitest";
import { MASCOT_POSES } from "#src/render/mascot";
import { designTokens } from "#src/systems/designTokens";
import {
  FeedbackOverlay,
  MASCOT_FEEDBACK_HOLD_MS,
} from "#src/systems/feedback-overlay";

const DANGER_COLORS = new Set<string>(
  Object.values(designTokens.colors.semantic.danger)
);
const FRAME_MS = 16;

describe("FeedbackOverlay (BR-FBK-05, BR-FBK-07, BR-FBK-11)", () => {
  it("BR-FBK-11: đúng → khung kế tiếp có pop tại điểm chạm và mascot happy", () => {
    const overlay = new FeedbackOverlay();
    overlay.trigger("success", { x: 120, y: 80 }, 1000);

    const frame = overlay.frame(1000 + FRAME_MS);

    expect(frame.mascotPose).toBe("happy");
    expect(frame.pulses).toHaveLength(1);
    expect(frame.pulses[0]).toMatchObject({
      x: 120,
      y: 80,
      color: designTokens.colors.semantic.success[500],
    });
  });

  it("BR-FBK-11: chưa đúng → nhịp hổ phách, mascot encourage, không token danger", () => {
    const overlay = new FeedbackOverlay();
    overlay.trigger("retry", { x: 300, y: 200 }, 0);

    const frame = overlay.frame(FRAME_MS);

    expect(frame.mascotPose).toBe("encourage");
    expect(frame.pulses[0]?.color).toBe(designTokens.colors.retry[500]);
    for (const pulse of frame.pulses) {
      expect(DANGER_COLORS.has(pulse.color)).toBe(false);
    }
  });

  it("BR-FBK-07: sai lần thứ 5 giống hệt lần thứ nhất", () => {
    const overlay = new FeedbackOverlay();
    const step = 2000;
    overlay.trigger("retry", { x: 50, y: 50 }, 0);
    const first = overlay.frame(FRAME_MS * 4);

    for (let i = 1; i <= 4; i += 1) {
      overlay.trigger("retry", { x: 50, y: 50 }, i * step);
    }
    const fifth = overlay.frame(4 * step + FRAME_MS * 4);

    expect(fifth).toEqual(first);
  });

  it("dáng phản hồi hết hạn thì về dáng nền", () => {
    const overlay = new FeedbackOverlay();
    overlay.trigger("success", { x: 0, y: 0 }, 0);

    const later = overlay.frame(MASCOT_FEEDBACK_HOLD_MS + 1, "listen");

    expect(later.mascotPose).toBe("listen");
    expect(later.pulses).toHaveLength(0);
  });

  it("BR-FBK-09: reduced-motion giữ pop nhưng không phóng to", () => {
    const overlay = new FeedbackOverlay();
    overlay.trigger("success", { x: 10, y: 10 }, 0);

    const early = overlay.frame(FRAME_MS, "idle", true);
    const late = overlay.frame(200, "idle", true);

    expect(early.pulses).toHaveLength(1);
    expect(late.pulses[0]?.radius).toBe(early.pulses[0]?.radius);
    expect(early.mascotPose).toBe("happy");
  });

  it("celebrate giữ tới khi reset", () => {
    const overlay = new FeedbackOverlay();
    overlay.celebrate();

    expect(overlay.frame(60_000).mascotPose).toBe("celebrate");
    overlay.reset();
    expect(overlay.frame(60_001).mascotPose).toBe("idle");
  });

  it("mọi dáng trả về thuộc hợp đồng sáu dáng", () => {
    const overlay = new FeedbackOverlay();
    overlay.trigger("success", { x: 0, y: 0 }, 0);

    expect(MASCOT_POSES).toContain(overlay.frame(1).mascotPose);
    expect(MASCOT_POSES).toHaveLength(6);
  });
});
