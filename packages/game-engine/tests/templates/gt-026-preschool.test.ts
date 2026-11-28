import { describe, expect, it } from "vitest";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures";
import { GT026Session } from "#src/templates/GT-026/session";

/**
 * Task #313 Phase 3 — GT-026: lượt `go` bỏ sót là trung tính (`BR-E026-08`),
 * lối không tính giờ có nút "dừng" riêng, chạm ra ngoài không phải nhịn
 * (`BR-E026-09`), bỏ sót liên tiếp thì hạ dần tới không tính giờ (`BR-E026-10`).
 */
const found = GT026_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(
  trials: readonly ("go" | "nogo")[],
  untimed = false
): GT026Session {
  const session = new GT026Session(
    {
      ...f.content,
      trials: trials.map((kind, i) => ({ id: `t${i}`, kind })),
    },
    { ...f.difficulty, untimed }
  );
  session.prepareRound("4-5");
  // Phiên mặc định chờ nút bắt đầu (N1): bấm nút trước khi chơi.
  session.commit({ type: "start_trials", data: {} });
  return session;
}

describe("GT-026 — bỏ sót lượt go là trung tính (BR-E026-08)", () => {
  it("hết giờ không chạm ở lượt go: không báo sai, lượt vẫn đi tiếp", () => {
    const session = build(["go", "go", "go", "go"]);
    const verdict = session.update(f.difficulty.stimulus_window_ms + 10);
    expect(verdict).toEqual({ valid: false, feedback: "none" });
    expect(session.getState()).toBe("isi");
  });

  it("nogo kìm được vẫn là đáp án đúng có phản hồi", () => {
    const session = build(["nogo", "go", "go", "go"]);
    const verdict = session.update(f.difficulty.stimulus_window_ms + 10);
    expect(verdict?.valid).toBe(true);
    expect(verdict?.feedback).not.toBe("none");
  });
});

describe("GT-026 — lối không tính giờ có nút dừng riêng (BR-E026-09)", () => {
  it("chạm ra ngoài không phải nhịn; chạm nút dừng ở lượt nogo là đúng", () => {
    const session = build(["nogo", "go", "go", "go"], true);
    const outside = session.dispatch({
      type: "tap",
      x: 3,
      y: 3,
      timeMs: 10,
    });
    expect(outside).toEqual({ valid: false, feedback: "none" });
    expect(session.getState()).toBe("stimulus");

    const pad = session.getView().entities.find((e) => e.id === "stop-pad");
    if (!pad) {
      throw new Error("Thiếu nút dừng");
    }
    const verdict = session.dispatch({
      type: "tap",
      x: pad.x,
      y: pad.y,
      timeMs: 20,
    });
    expect(verdict?.valid).toBe(true);
    expect(session.getState()).toBe("isi");
  });

  it("lối tính giờ không có nút dừng", () => {
    const session = build(["nogo", "go", "go", "go"]);
    expect(
      session.getView().entities.find((e) => e.id === "stop-pad")
    ).toBeUndefined();
  });

  it("nút dừng không chồng lên kích thích", () => {
    const session = build(["go", "go", "go", "go"], true);
    const [stim, pad] = session.slots;
    if (!(stim && pad)) {
      throw new Error("Thiếu slot");
    }
    const apart =
      Math.abs(stim.x - pad.x) >= (stim.hitW + pad.hitW) / 2 ||
      Math.abs(stim.y - pad.y) >= (stim.hitH + pad.hitH) / 2;
    expect(apart).toBe(true);
  });
});

describe("GT-026 — hạ dần tới không tính giờ theo đồng hồ trợ giúp (BR-E026-10)", () => {
  it("bỏ sót lượt go không tự hạ độ khó", () => {
    const session = build(["go", "go", "go", "go", "go", "go"]);
    const win = f.difficulty.stimulus_window_ms;
    session.update(win + 10);
    session.update(f.difficulty.isi_ms + 10);
    session.update(win + 10);
    session.update(f.difficulty.isi_ms + 10);
    expect(session.getWindowMs()).toBe(win);
    expect(session.getIsiMs()).toBe(f.difficulty.isi_ms);
    expect(session.isUntimed()).toBe(false);
  });

  it("L1 nới cửa sổ, L2 giãn nhịp nghỉ, L3 không tính giờ", () => {
    const session = build(["go", "go", "go", "go", "go", "go"]);
    const win = f.difficulty.stimulus_window_ms;
    const isi = f.difficulty.isi_ms;
    session.onScaffoldEscalated(1, "timer");
    expect(session.getWindowMs()).toBe(Math.round(win * 1.5));
    expect(session.getIsiMs()).toBe(isi);
    session.onScaffoldEscalated(2, "timer");
    expect(session.getIsiMs()).toBe(Math.round(isi * 1.5));
    expect(session.isUntimed()).toBe(false);
    session.onScaffoldEscalated(3, "timer");
    expect(session.isUntimed()).toBe(true);
    // Lối không tính giờ: kích thích đứng yên tới khi trẻ quyết định.
    session.update(f.difficulty.stimulus_window_ms * 5);
    expect(session.getState()).toBe("stimulus");
    expect(session.update(60_000)).toBeNull();
  });

  it("nhảy thẳng L2 áp đủ L1 và L2, không áp hai lần", () => {
    const session = build(["go", "go", "go", "go", "go", "go"]);
    const win = f.difficulty.stimulus_window_ms;
    session.onScaffoldEscalated(2, "timer");
    session.onScaffoldEscalated(2, "timer");
    expect(session.getWindowMs()).toBe(Math.round(win * 1.5));
    expect(session.getIsiMs()).toBe(Math.round(f.difficulty.isi_ms * 1.5));
  });

  it("leo vì chuỗi chạm sai (miss_streak) không nới gì", () => {
    const session = build(["go", "go", "go", "go", "go", "go"]);
    session.onScaffoldEscalated(3, "miss_streak");
    expect(session.getWindowMs()).toBe(f.difficulty.stimulus_window_ms);
    expect(session.isUntimed()).toBe(false);
  });

  it("một lần chạm đúng đặt lại chuỗi: lần leo L1 kế tiếp lại nới cửa sổ", () => {
    const session = build(["go", "go", "go", "go", "go", "go"]);
    const win = f.difficulty.stimulus_window_ms;
    session.onScaffoldEscalated(1, "timer");
    session.onTapStimulus();
    session.update(session.getIsiMs() + 10);
    session.onScaffoldEscalated(1, "timer");
    expect(session.getWindowMs()).toBe(Math.round(win * 1.5 * 1.5));
  });
});
