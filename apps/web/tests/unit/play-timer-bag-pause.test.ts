import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimerBag } from "~/composables/play/play-round-token";

/** Task #313 B5 — pause dừng mọi hẹn giờ vòng, resume chạy tiếp phần còn lại. */
describe("Task #313 B5 — TimerBag pause/resume", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hẹn giờ không nổ khi pause, nổ đúng phần còn lại sau resume", () => {
    const bag = createTimerBag();
    const fn = vi.fn();
    bag.set(fn, 1000);
    vi.advanceTimersByTime(400);
    bag.pause();
    vi.advanceTimersByTime(10_000);
    expect(fn).not.toHaveBeenCalled();
    bag.resume();
    vi.advanceTimersByTime(599);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("hẹn giờ đặt trong lúc pause chờ tới resume", () => {
    const bag = createTimerBag();
    const fn = vi.fn();
    bag.pause();
    bag.set(fn, 500);
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
    bag.resume();
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clearAll huỷ cả hẹn giờ đang pause", () => {
    const bag = createTimerBag();
    const fn = vi.fn();
    bag.set(fn, 500);
    bag.pause();
    bag.clearAll();
    bag.resume();
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });
});
