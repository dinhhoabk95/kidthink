import { describe, expect, it } from "vitest";
import {
  type CompletionOutcome,
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
