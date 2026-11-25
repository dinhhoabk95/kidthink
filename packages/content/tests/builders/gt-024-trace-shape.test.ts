import { describe, expect, it } from "vitest";
import { GT024_STROKES } from "#src/builders/gt-024";
import {
  asArray,
  asObject,
  asString,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const SHAPE_REFS: Readonly<Record<string, string>> = {
  "🔺": "hình tam giác",
  "🟦": "hình vuông",
  "🏠": "ngôi nhà",
  "⭕": "hình tròn",
  "⭐": "ngôi sao",
};

/** Các chấm đều cách một tâm — dấu hiệu của đa giác đều dùng sai chỗ. */
function isRegularPolygon(pack: PackObject): boolean {
  const pts = asArray(pack.waypoints).map((w) => {
    const o = asObject(w);
    return { x: Number(o.x), y: Number(o.y) };
  });
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const d = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
  return Math.max(...d) - Math.min(...d) <= 3;
}

/** Vi phạm `BR-E024-09`: đề/hình mẫu nói một đằng, các chấm vẽ một nẻo. */
function traceViolations(pack: PackObject): string[] {
  const guide = asObject(pack.guide_asset);
  const prompt = asString(pack.prompt);
  if (guide.kind === "text") {
    const glyph = asString(guide.text);
    const out: string[] = [];
    if (!Object.hasOwn(GT024_STROKES, glyph)) {
      out.push(`ký hiệu "${glyph}" không có nét nối chấm`);
    }
    if (isRegularPolygon(pack)) {
      out.push(`"${prompt}" nhưng chấm là đa giác đều`);
    }
    return out;
  }
  const name = SHAPE_REFS[asString(guide.ref)];
  if (!name) {
    return [`hình mẫu ${String(guide.ref)} không thuộc bảng hình nối chấm`];
  }
  return prompt.includes(name) && pack.shape_name === name
    ? []
    : [`đề "${prompt}" không gọi đúng ${name}`];
}

describe("GT-024 — chấm nối ra đúng hình mà đề gọi tên (BR-E024-09)", () => {
  it("corpus thật: chữ số/chữ cái theo nét viết, hình khác thì đề gọi đúng tên hình", () => {
    const packs = realPacks("GT-024");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      traceViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: 'tạo số chín' trên đa giác đều như bản cũ bị bắt", () => {
    const legacy = toPack({
      prompt: "Bé lướt tay nối chấm tạo số chín nhé!",
      shape_name: "số chín",
      guide_asset: { kind: "text", text: "9" },
      waypoints: [
        { id: "wp1", x: 480, y: 110, order: 0 },
        { id: "wp2", x: 619, y: 350, order: 1 },
        { id: "wp3", x: 341, y: 350, order: 2 },
      ],
    });
    expect(traceViolations(legacy).length).toBeGreaterThan(0);
  });

  it("ca âm: 'tạo biển dừng lại' trên hình vuông bị bắt", () => {
    const legacy = toPack({
      prompt: "Bé lướt tay nối chấm tạo biển dừng lại nhé!",
      shape_name: "biển dừng lại",
      guide_asset: { kind: "emoji", ref: "🛑" },
      waypoints: [],
    });
    expect(traceViolations(legacy).length).toBeGreaterThan(0);
  });
});

describe("GT-024 — đề gọi tên ký hiệu đang nối (BR-E024-09)", () => {
  it("corpus thật: đề của nét chữ số/chữ cái nhắc 'số'/'chữ', không nhắc vật minh hoạ", () => {
    const bad = realPacks("GT-024")
      .filter(({ pack }) => asObject(pack.guide_asset).kind === "text")
      .filter(({ pack }) => {
        const prompt = asString(pack.prompt);
        return !(prompt.includes("tạo số ") || prompt.includes("tạo chữ "));
      })
      .map(({ levelCode, pack }) => `${levelCode}: ${asString(pack.prompt)}`);
    expect(bad).toEqual([]);
  });
});
