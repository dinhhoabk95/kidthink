import { describe, expect, it, vi } from "vitest";
import {
  type OrientationEnv,
  PORTRAIT_GATE_PARENT_HINT,
  PORTRAIT_GATE_PARENT_HINT_DELAY_MS,
  releaseOrientationLock,
  tryLockPortrait,
} from "~/composables/play/play-portrait-gate";

/** BR-PSZ-14 — khoá hướng dọc là phần tăng cường, lớp xoay máy vẫn là nền. */
function makeEnv(overrides: Partial<OrientationEnv> = {}): OrientationEnv {
  return {
    isFullscreen: true,
    isStandalone: false,
    orientation: {
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
    },
    ...overrides,
  };
}

describe("tryLockPortrait", () => {
  it("khoá dọc khi trang đang toàn màn hình", async () => {
    const env = makeEnv();

    const locked = await tryLockPortrait(env);

    expect(locked).toBe(true);
    expect(env.orientation?.lock).toHaveBeenCalledWith("portrait");
  });

  it("khoá dọc khi chạy standalone dù không toàn màn hình", async () => {
    const env = makeEnv({ isFullscreen: false, isStandalone: true });

    expect(await tryLockPortrait(env)).toBe(true);
  });

  it("không gọi lock khi trang không toàn màn hình và không standalone", async () => {
    const env = makeEnv({ isFullscreen: false, isStandalone: false });

    expect(await tryLockPortrait(env)).toBe(false);
    expect(env.orientation?.lock).not.toHaveBeenCalled();
  });

  it("trả false khi trình duyệt không có screen.orientation.lock (iOS Safari)", async () => {
    expect(await tryLockPortrait(makeEnv({ orientation: undefined }))).toBe(
      false
    );
    expect(
      await tryLockPortrait(
        makeEnv({ orientation: { unlock: vi.fn() } as never })
      )
    ).toBe(false);
  });

  it("nuốt lỗi khi lock bị từ chối và trả false", async () => {
    const env = makeEnv({
      orientation: {
        lock: vi.fn().mockRejectedValue(new Error("NotSupportedError")),
        unlock: vi.fn(),
      },
    });

    expect(await tryLockPortrait(env)).toBe(false);
  });

  it("nuốt lỗi khi lock ném đồng bộ", async () => {
    const env = makeEnv({
      orientation: {
        lock: vi.fn(() => {
          throw new Error("SecurityError");
        }),
        unlock: vi.fn(),
      },
    });

    expect(await tryLockPortrait(env)).toBe(false);
  });
});

describe("releaseOrientationLock", () => {
  it("gọi unlock khi có", () => {
    const env = makeEnv();

    releaseOrientationLock(env);

    expect(env.orientation?.unlock).toHaveBeenCalledOnce();
  });

  it("không ném khi thiếu orientation hoặc unlock lỗi", () => {
    expect(() =>
      releaseOrientationLock(makeEnv({ orientation: undefined }))
    ).not.toThrow();
    expect(() =>
      releaseOrientationLock(
        makeEnv({
          orientation: {
            lock: vi.fn(),
            unlock: vi.fn(() => {
              throw new Error("x");
            }),
          },
        })
      )
    ).not.toThrow();
  });
});

describe("dòng nhắc phụ huynh", () => {
  it("hiện sau 5 giây và là tiếng Việt", () => {
    expect(PORTRAIT_GATE_PARENT_HINT_DELAY_MS).toBe(5000);
    expect(PORTRAIT_GATE_PARENT_HINT).toContain("khoá xoay");
  });
});
