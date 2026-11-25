import { describe, expect, it } from "vitest";
import { GT024_MIN_DOT_GAP, GT024_STROKES } from "#src/builders/gt-024";
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

/**
 * Đa giác đều của bộ chiếu cũ: mọi chấm cách tâm (480, 270) đúng 160 px, bất kể
 * đề gọi tên hình gì.
 */
function isLegacyPolygon(pack: PackObject): boolean {
  return asArray(pack.waypoints).every((w) => {
    const o = asObject(w);
    return (
      Math.abs(Math.hypot(Number(o.x) - 480, Number(o.y) - 270) - 160) <= 2
    );
  });
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
    if (isLegacyPolygon(pack)) {
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

/** Cặp chấm khác toạ độ gần hơn `GT024_MIN_DOT_GAP` cạnh lớn của hộp bao chấm. */
function crowdedPairs(pack: PackObject): string[] {
  const pts = asArray(pack.waypoints).map((w) => {
    const o = asObject(w);
    return { x: Number(o.x), y: Number(o.y) };
  });
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys)
  );
  const out: string[] = [];
  pts.forEach((a, i) => {
    pts.slice(i + 1).forEach((b, k) => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 0 && d < GT024_MIN_DOT_GAP * span - 1) {
        out.push(`chấm ${i} và ${i + 1 + k} cách ${Math.round(d)}`);
      }
    });
  });
  return out;
}

describe("GT-024 — chấm đủ thưa để vùng chạm không chồng (BR-LAY-05)", () => {
  it("corpus thật: mọi cặp chấm khác toạ độ cách ≥ GT024_MIN_DOT_GAP cạnh hộp", () => {
    const bad = realPacks("GT-024").flatMap(({ levelCode, roundIndex, pack }) =>
      crowdedPairs(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: chấm dày theo nét chữ bị bắt", () => {
    const crowded = toPack({
      waypoints: [
        { x: 400, y: 100 },
        { x: 420, y: 120 },
        { x: 400, y: 420 },
      ],
    });
    expect(crowdedPairs(crowded).length).toBeGreaterThan(0);
  });
});
