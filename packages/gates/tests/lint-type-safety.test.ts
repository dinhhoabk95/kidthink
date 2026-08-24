import { describe, expect, it } from "vitest";
import {
  compareToBaseline,
  countCasts,
  countExplicitAny,
  readBaseline,
  scanRepo,
  total,
} from "#src/lint-type-safety";

/**
 * TYPE-SAFETY `BR-TYP-07`: cổng mới BẮT BUỘC có ca âm. Không có ca âm thì
 * không ai biết cổng có thật sự chặn — `ultracite check` từng exit 0 với lỗi
 * lint thật vì lý do đó.
 */
describe("countCasts", () => {
  it("đếm ép kiểu `as T`", () => {
    expect(countCasts("const x = raw as string;")).toBe(1);
    expect(countCasts("const x = raw as { code?: string };")).toBe(1);
    expect(countCasts("const x = raw as unknown as Target;")).toBe(2);
  });

  it("ca âm BR-TYP-05: `as const` KHÔNG bị tính", () => {
    expect(countCasts('const s = { status: "draft" as const };')).toBe(0);
  });

  it("ca âm: chữ `as` trong comment và chuỗi KHÔNG bị tính", () => {
    expect(countCasts("// dùng x as string thì sai\nconst a = 1;")).toBe(0);
    expect(countCasts('const msg = "treat it as string";')).toBe(0);
    expect(countCasts("const t = `render as html`;")).toBe(0);
  });

  it("ca âm: định danh chứa `as` KHÔNG bị tính", () => {
    expect(countCasts("const hasAsset = true; const phase = 1;")).toBe(0);
  });
});

describe("countExplicitAny", () => {
  it("đếm any tường minh ở mọi vị trí khai báo", () => {
    expect(countExplicitAny("function f(x: any) { return x; }")).toBe(1);
    expect(countExplicitAny("const y = raw as any;")).toBe(1);
    expect(countExplicitAny("const z: Array<any> = [];")).toBe(1);
  });

  it("ca âm: chữ `any` trong văn xuôi và tên biến KHÔNG bị tính", () => {
    expect(countExplicitAny('const msg = "any value works";')).toBe(0);
    expect(countExplicitAny("// nhận any thì mất kiểm tra\nconst a = 1;")).toBe(
      0
    );
    expect(countExplicitAny("const company = 1; const manyItems = [];")).toBe(
      0
    );
  });
});

describe("compareToBaseline — bậc thang chỉ giảm", () => {
  it("ca âm: file tăng số thì báo increased", () => {
    const result = compareToBaseline({ "a.ts": 4 }, { "a.ts": 3 });

    expect(result.increased).toEqual([{ file: "a.ts", from: 3, to: 4 }]);
  });

  it("ca âm: file mới có ép kiểu thì báo added", () => {
    const result = compareToBaseline({ "b.ts": 1 }, { "a.ts": 3 });

    expect(result.added).toEqual([{ file: "b.ts", to: 1 }]);
  });

  it("giảm số thì không phải lỗi", () => {
    const result = compareToBaseline({ "a.ts": 1 }, { "a.ts": 3 });

    expect(result.increased).toEqual([]);
    expect(result.added).toEqual([]);
    expect(result.decreased).toEqual([{ file: "a.ts", from: 3, to: 1 }]);
  });

  it("hết ép kiểu thì file vào danh sách removed", () => {
    const result = compareToBaseline({}, { "a.ts": 3 });

    expect(result.removed).toEqual(["a.ts"]);
    expect(result.increased).toEqual([]);
  });

  it("số không đổi thì cổng không có gì để báo", () => {
    const result = compareToBaseline({ "a.ts": 3 }, { "a.ts": 3 });

    expect(result.increased).toEqual([]);
    expect(result.added).toEqual([]);
    expect(result.decreased).toEqual([]);
    expect(result.removed).toEqual([]);
  });
});

describe("Cổng lint:type-safety trên repo thật (BR-TYP-02, BR-TYP-08)", () => {
  it("nợ ép kiểu và `any` trong test ❌ NEVER tăng so với baseline", () => {
    const current = scanRepo();
    const baseline = readBaseline();

    const casts = compareToBaseline(current.casts, baseline.casts);
    const testAny = compareToBaseline(current.testAny, baseline.testAny);

    expect({ added: casts.added, increased: casts.increased }).toEqual({
      added: [],
      increased: [],
    });
    expect({ added: testAny.added, increased: testAny.increased }).toEqual({
      added: [],
      increased: [],
    });
  });

  it("thật sự quét được cây nguồn — không xanh vì đếm 0", () => {
    const current = scanRepo();

    expect(total(current.casts)).toBeGreaterThan(0);
    expect(total(current.testAny)).toBeGreaterThan(0);
  });
});
