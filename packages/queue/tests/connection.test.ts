import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { attachErrorLogger, QUEUE_DEFAULT_JOB_OPTIONS } from "#src/connection";

describe("Queue connection — xử lý sự kiện 'error' (job-queue.md §1)", () => {
  it("ca âm: EventEmitter không có listener 'error' thì emit NÉM — đây chính là lỗi giết tiến trình", () => {
    const bare = new EventEmitter();

    expect(() => bare.emit("error", new Error("Valkey restart"))).toThrow();
  });

  it("attachErrorLogger làm emit('error') không còn ném và ghi lại nguyên nhân", () => {
    const emitter = new EventEmitter();
    const lines: string[] = [];

    attachErrorLogger(emitter, "Redis", (line) => lines.push(line));

    expect(() =>
      emitter.emit("error", new Error("Valkey restart"))
    ).not.toThrow();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Redis");
    expect(lines[0]).toContain("Valkey restart");
  });

  it("ghi được cả giá trị ném ra không phải Error", () => {
    const emitter = new EventEmitter();
    const lines: string[] = [];

    attachErrorLogger(emitter, "BullMQ", (line) => lines.push(line));
    emitter.emit("error", "ECONNRESET");

    expect(lines[0]).toContain("ECONNRESET");
  });

  it("mỗi lần lỗi lặp lại đều được ghi, không dừng ở lần đầu", () => {
    const emitter = new EventEmitter();
    const lines: string[] = [];

    attachErrorLogger(emitter, "Redis", (line) => lines.push(line));
    emitter.emit("error", new Error("một"));
    emitter.emit("error", new Error("hai"));

    expect(lines).toHaveLength(2);
  });
});

describe("Queue defaultJobOptions — giữ Valkey không phình vô hạn", () => {
  it("job hoàn tất được dọn theo tuổi và theo số lượng", () => {
    expect(QUEUE_DEFAULT_JOB_OPTIONS.removeOnComplete).toEqual({
      age: 24 * 60 * 60,
      count: 1000,
    });
  });

  it("job thất bại giữ lâu hơn job thành công — còn để điều tra", () => {
    expect(QUEUE_DEFAULT_JOB_OPTIONS.removeOnFail).toEqual({
      age: 7 * 24 * 60 * 60,
    });
  });
});
