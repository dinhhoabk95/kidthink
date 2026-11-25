import { describe, expect, it, vi } from "vitest";
import {
  type CompletionOutcome,
  CompletionUnsavedError,
  createOnceGuard,
  finishWithSessionRefresh,
  presentCompletion,
} from "~/composables/play/completion-outcome";

/** Task #313 B4 — modal thắng hiện ngay; tier/sao cập nhật nền, mạng lỗi không tụt tier. */
function deferred<T>() {
  let resolve: (v: T) => void = () => undefined;
  let reject: (e: Error) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Task #313 B4 — presentCompletion", () => {
  it("hiện modal ngay với tier tạm 'good', trước khi server trả lời", async () => {
    const shown: CompletionOutcome[] = [];
    const gate = deferred<CompletionOutcome | null>();
    const done = presentCompletion({
      fetchOutcome: () => gate.promise,
      show: (o) => shown.push(o),
      update: () => undefined,
    });
    expect(shown).toEqual([
      { celebration: "good", stars: null, sticker: null },
    ]);
    gate.resolve({ celebration: "great", stars: 3 });
    await done;
  });

  it("cập nhật tier/sao khi server trả về", async () => {
    const updates: CompletionOutcome[] = [];
    await presentCompletion({
      fetchOutcome: () =>
        Promise.resolve({ celebration: "great", stars: 3 } as const),
      show: () => undefined,
      update: (o) => updates.push(o),
    });
    expect(updates).toEqual([{ celebration: "great", stars: 3 }]);
  });

  it("mạng lỗi hoặc không có kết quả thì giữ tier tạm, không tụt nice_try", async () => {
    const updates: CompletionOutcome[] = [];
    await presentCompletion({
      fetchOutcome: () => Promise.reject(new Error("offline")),
      show: () => undefined,
      update: (o) => updates.push(o),
    });
    await presentCompletion({
      fetchOutcome: () => Promise.resolve(null),
      show: () => undefined,
      update: (o) => updates.push(o),
    });
    expect(updates).toEqual([]);
  });
});

describe("BR-FBK-19 — /complete một lần, 401 không mất tiến độ im lặng", () => {
  const ok = { ok: true, data: {} } as const;
  const unauth = { ok: false, statusCode: 401 } as const;

  it("createOnceGuard chỉ cho lần đầu cùng một session uuid", () => {
    const claim = createOnceGuard();
    expect(claim("s1")).toBe(true);
    expect(claim("s1")).toBe(false);
    expect(claim("s2")).toBe(true);
  });

  it("401 rồi refresh thành công thì thử lại đúng một lần và thành công", async () => {
    const finish = vi
      .fn<() => Promise<typeof ok | typeof unauth>>()
      .mockResolvedValueOnce(unauth)
      .mockResolvedValueOnce(ok);
    const refresh = vi.fn(() => Promise.resolve(true));
    const result = await finishWithSessionRefresh(finish, refresh);
    expect(result).toBe(ok);
    expect(finish).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("401 mà refresh thất bại thì ném CompletionUnsavedError, không gọi lại", async () => {
    const finish = vi.fn(() => Promise.resolve(unauth));
    await expect(
      finishWithSessionRefresh(finish, () => Promise.resolve(false))
    ).rejects.toBeInstanceOf(CompletionUnsavedError);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("lỗi khác 401 (vd 409) trả nguyên kết quả, không refresh", async () => {
    const conflict = { ok: false, statusCode: 409 } as const;
    const refresh = vi.fn(() => Promise.resolve(true));
    const result = await finishWithSessionRefresh(
      () => Promise.resolve(conflict),
      refresh
    );
    expect(result).toBe(conflict);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("presentCompletion gọi unsaved và giữ tier tạm khi phiên hết hạn", async () => {
    const shown: CompletionOutcome[] = [];
    const updates: CompletionOutcome[] = [];
    const unsaved = vi.fn();
    await presentCompletion({
      fetchOutcome: () => Promise.reject(new CompletionUnsavedError()),
      show: (o) => shown.push(o),
      update: (o) => updates.push(o),
      unsaved,
    });
    expect(unsaved).toHaveBeenCalledTimes(1);
    expect(shown[0]?.celebration).toBe("good");
    expect(updates).toEqual([]);
  });
});
