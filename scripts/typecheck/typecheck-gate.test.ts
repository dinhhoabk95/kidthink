import { describe, expect, it } from "vitest";
import { compareToBaseline, hasRegression, refuseIncrease } from "./ratchet.ts";
import { interpretCompilerRun } from "./typecheck-gate.ts";

/** Hình dạng tối thiểu của `spawnSync` mà cổng thực sự đọc. */
function run(overrides: {
  status?: number | null;
  signal?: NodeJS.Signals | null;
  error?: Error;
  stdout?: string;
  stderr?: string;
}) {
  return {
    status: overrides.status ?? 0,
    signal: overrides.signal ?? null,
    error: overrides.error,
    stdout: overrides.stdout ?? "",
    stderr: overrides.stderr ?? "",
  };
}

const ONE_ERROR = "src/a.ts(1,1): error TS2322: Type 'x'.\n";
const SIGKILL_RE = /SIGKILL/;
const ENOENT_RE = /ENOENT/;
const UNPARSED_RE = /không phân tích được/;

describe("interpretCompilerRun — trình biên dịch chết Cấm — NEVER được đọc thành nợ giảm", () => {
  it("chạy sạch: 0 lỗi, 0 lỗi toàn cục", () => {
    const out = interpretCompilerRun(run({ status: 0 }), "packages/x");
    expect(out.global).toEqual([]);
    expect(Object.keys(out.files)).toHaveLength(0);
  });

  it("có diagnostic thì đếm bình thường", () => {
    const out = interpretCompilerRun(
      run({ status: 2, stdout: ONE_ERROR }),
      "packages/x"
    );
    expect(out.global).toEqual([]);
    expect(out.files["packages/x/src/a.ts"]).toBe(1);
  });

  it("ca âm: bị OOM kill (signal SIGKILL) → lỗi toàn cục, Cấm — NEVER báo giảm", () => {
    // Đây là kịch bản thật: `vue-tsc` trên web:app (685 lỗi) bị kill sau khi in
    // 200 diagnostic. Bản cũ vứt `signal`, đếm 200, thấy mọi file đều GIẢM, in
    // "⬇ -485" rồi exit 0 — và bảo người chạy `typecheck:update` để chốt mức
    // mới, tức xoá vĩnh viễn 485 lỗi đã biết khỏi bậc thang.
    const out = interpretCompilerRun(
      run({ status: null, signal: "SIGKILL", stdout: ONE_ERROR }),
      "packages/x"
    );
    expect(out.global.join(" ")).toMatch(SIGKILL_RE);
  });

  it("ca âm: không spawn được (ENOENT) → lỗi toàn cục", () => {
    const out = interpretCompilerRun(
      run({ error: new Error("spawn ENOENT") }),
      "packages/x"
    );
    expect(out.global.join(" ")).toMatch(ENOENT_RE);
  });

  it("ca âm: exit khác 0 nhưng không phân tích được diagnostic nào → lỗi toàn cục", () => {
    // Trình biên dịch nổ với stack trace JS: không khớp regex nào, nên bản cũ
    // đọc ra 0 lỗi và xanh.
    const out = interpretCompilerRun(
      run({ status: 1, stderr: "Error: Debug Failure. False expression.\n" }),
      "packages/x"
    );
    expect(out.global.join(" ")).toMatch(UNPARSED_RE);
  });

  it("exit 0 và không có diagnostic là hợp lệ, không phải lỗi", () => {
    expect(
      interpretCompilerRun(run({ status: 0 }), "packages/x").global
    ).toEqual([]);
  });
});

describe("refuseIncrease — `--update` chỉ được hạ bậc thang", () => {
  it("hạ nợ thì cho ghi", () => {
    const worse = refuseIncrease({ "a.ts": 1 }, { "a.ts": 5 });
    expect(worse).toEqual([]);
  });

  it("giữ nguyên thì cho ghi", () => {
    expect(refuseIncrease({ "a.ts": 5 }, { "a.ts": 5 })).toEqual([]);
  });

  it("ca âm: file tăng nợ thì từ chối và nêu tên", () => {
    // Đây là điều đã xảy ra thật: Task #124 ghi thêm 187 lỗi và Task #125 thêm
    // 7 lỗi vào baseline, toàn bộ là mã mới viết trong cùng dải task.
    const worse = refuseIncrease({ "a.ts": 9 }, { "a.ts": 5 });
    expect(worse).toEqual([{ file: "a.ts", from: 5, to: 9 }]);
  });

  it("ca âm: file mới mang nợ cũng bị từ chối", () => {
    expect(refuseIncrease({ "b.ts": 3 }, {})).toEqual([
      { file: "b.ts", from: 0, to: 3 },
    ]);
  });
});

describe("hasRegression giữ nguyên hợp đồng cũ", () => {
  it("file mới có nợ là đỏ", () => {
    expect(hasRegression(compareToBaseline({ "b.ts": 1 }, {}))).toBe(true);
  });

  it("nợ giảm là xanh", () => {
    expect(hasRegression(compareToBaseline({ "a.ts": 1 }, { "a.ts": 4 }))).toBe(
      false
    );
  });
});
