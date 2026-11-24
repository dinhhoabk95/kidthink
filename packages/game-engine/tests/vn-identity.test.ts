import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  DONG_DAO_CELEBRATION_CHANTS,
  PRESCHOOL_ENCOURAGEMENT_BY_BAND,
  pickEncouragementPhrase,
} from "#src/labels/encouragement-phrases";
import { spokenKeywordForAsset } from "#src/labels/spoken-keyword";
import { deriveLogicSpace } from "#src/layout/constants";
import { drawEncouragementBanner } from "#src/render/montessori-feedback";
import { drawSceneBackground } from "#src/render/scene-background";
import { MIN_LEGIBLE_CSS_PX } from "#src/render/type-scale";
import {
  drawBambooGrove,
  drawBambooJointAccent,
  drawDoPaperFiberMarks,
  drawFolkLantern,
  drawLotusBlossom,
  drawPaperKite,
  drawRattleDrumMotif,
  drawWovenSedgeStrip,
} from "#src/render/vn-folk-motifs";
import { AudioController } from "#src/systems/audio-controller";
import { DegradationManager } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import {
  COMPLIMENTS,
  FORBIDDEN_WORDS,
  RETRY_ENCOURAGEMENTS,
} from "#src/systems/feedback-system";
import { RenderSystem } from "#src/systems/render-system";
import {
  MAX_NOTE_VOLUME,
  MIN_RAMP_OUT_SEC,
  MINUS_ONE_DBTP_LINEAR,
  RAMP_IN_SEC,
  SFX_RECIPES,
  SFXEngine,
  TRUE_PEAK_CEILING_LINEAR,
  VN_PENTATONIC_DEGREES,
  VN_PENTATONIC_HZ,
} from "#src/systems/sfx-engine";
import { createFakeCanvas, type FakeContext } from "#tests/gates/fake-canvas";

const HEX_LITERAL_REGEX = /#[0-9a-fA-F]{3,8}\b/;
const VALID_HEX6_REGEX = /^#[0-9a-f]{6}$/i;
const FONT_PX_REGEX = /(\d+(?:\.\d+)?)px/;

function isCanvas2DContext(
  ctx: FakeContext | null
): ctx is FakeContext & CanvasRenderingContext2D {
  return ctx !== null && typeof ctx.save === "function";
}

function getStrictFakeContext(
  w = 960,
  h = 540
): FakeContext & CanvasRenderingContext2D {
  const canvas = createFakeCanvas(w, h);
  const raw = canvas.getContext("2d");
  if (!isCanvas2DContext(raw)) {
    throw new Error("Expected 2D context from fake canvas");
  }
  return raw;
}

function relativeLuminance(hex: string): number {
  const clean = hex.slice(1);
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number): number =>
    c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function collectTsFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      result.push(full);
    }
  }
  return result;
}

describe("Tuổi thơ Việt × Giấy Gỗ Mộc — Design Tokens & WCAG Gate", () => {
  it("cung cấp đầy đủ chất liệu Việt sáng ấm và đạt tương phản WCAG AAA cho mực giấy dó", () => {
    const vn = designTokens.colors.vnMaterials;
    const allMaterialHexes = [
      ...Object.values(vn.bamboo),
      ...Object.values(vn.sedgeMat),
      ...Object.values(vn.terracotta),
      ...Object.values(vn.lotus),
      ...Object.values(vn.doPaper),
      ...Object.values(vn.woodGrain),
    ];
    for (const hex of allMaterialHexes) {
      expect(hex).toMatch(VALID_HEX6_REGEX);
    }

    // Nền mầm non luôn sáng ấm (light-only, luminance > 0.78)
    expect(relativeLuminance(vn.doPaper.sheet)).toBeGreaterThan(0.85);
    expect(relativeLuminance(vn.bamboo.light)).toBeGreaterThan(0.8);
    expect(relativeLuminance(vn.sedgeMat.base)).toBeGreaterThan(0.8);

    // Mực trên giấy dó đạt tương phản WCAG AAA (> 7:1)
    expect(contrastRatio(vn.doPaper.ink, vn.doPaper.sheet)).toBeGreaterThan(7);

    // `montessori` giữ cấu trúc phẳng `Record<string, string>`
    for (const value of Object.values(designTokens.colors.montessori)) {
      expect(typeof value).toBe("string");
      expect(value).toMatch(VALID_HEX6_REGEX);
    }
  });

  it("0 hex literal ngoài systems/designTokens.ts trong toàn bộ packages/game-engine/src", () => {
    const srcDir = join(import.meta.dirname, "..", "src");
    const files = collectTsFiles(srcDir);
    const violations: string[] = [];

    for (const file of files) {
      const rel = relative(srcDir, file).replace(/\\/g, "/");
      if (rel === "systems/designTokens.ts") {
        continue;
      }
      const lines = readFileSync(file, "utf8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() ?? "";
        if (
          line.startsWith("//") ||
          line.startsWith("*") ||
          line.startsWith("/*")
        ) {
          continue;
        }
        if (HEX_LITERAL_REGEX.test(line)) {
          violations.push(`${rel}:${i + 1}: ${line}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe("Tuổi thơ Việt × Giấy Gỗ Mộc — Họa tiết & Tự động hạ cấp FPS < 42", () => {
  it("vẽ trọn bộ họa tiết Việt cân bằng save/restore và đứng tĩnh khi FPS < 42 tắt ambient motion", () => {
    const ctx = getStrictFakeContext(960, 540);
    let saveDepth = 0;
    const origSave = ctx.save.bind(ctx);
    const origRestore = ctx.restore.bind(ctx);
    ctx.save = () => {
      saveDepth++;
      origSave();
    };
    ctx.restore = () => {
      saveDepth--;
      origRestore();
    };

    drawBambooGrove(ctx, 48, 500, 110, 0.85, 1400);
    drawBambooJointAccent(ctx, 120, 480, 360, 480, 3);
    drawWovenSedgeStrip(ctx, 0, 490, 960, 50);
    drawPaperKite(ctx, 820, 72, 0.8, 1400);
    drawFolkLantern(ctx, 96, 16, 0.9, "amber", 1400);
    drawFolkLantern(ctx, 864, 16, 0.9, "lotus", 1400);
    drawLotusBlossom(ctx, 220, 495, 0.9, 1400);
    drawRattleDrumMotif(ctx, 740, 488, 0.85, 1400);
    drawDoPaperFiberMarks(ctx, 200, 120, 240, 160);
    expect(saveDepth).toBe(0);

    // Mô phỏng sụt FPS < 42 qua DegradationManager -> tắt ambient_motion_enabled
    const degradation = new DegradationManager();
    const fullTier = degradation.updateFps(60);
    expect(fullTier.ambient_motion_enabled).toBe(true);
    const lowTier = degradation.updateFps(41);
    expect(lowTier.ambient_motion_enabled).toBe(false);

    const rs = new RenderSystem();
    rs.ambientMotionEnabled = lowTier.ambient_motion_enabled;

    const rotationsAtT1: number[] = [];
    const rotationsAtT2: number[] = [];

    const ctx1 = getStrictFakeContext(960, 540);
    ctx1.rotate = (angle: number) => {
      rotationsAtT1.push(angle);
    };
    drawSceneBackground(ctx1, rs, "village", 1200);
    drawSceneBackground(ctx1, rs, "tet", 1200);

    const ctx2 = getStrictFakeContext(960, 540);
    ctx2.rotate = (angle: number) => {
      rotationsAtT2.push(angle);
    };
    drawSceneBackground(ctx2, rs, "village", 4900);
    drawSceneBackground(ctx2, rs, "tet", 4900);

    // Khi ambientMotionEnabled = false, tư thế ở hai thời điểm bất kỳ khớp hệt nhau
    expect(rotationsAtT1).toEqual(rotationsAtT2);
  });
});

describe("Tuổi thơ Việt × Giấy Gỗ Mộc — Ngũ cung Hò-Xự-Xang-Xê-Cống & An toàn Âm học", () => {
  it("khớp tần số ngũ cung Hò-Xự-Xang-Xê-Cống và giữ sườn >=20ms/40ms, trần <= -1 dBTP cho mọi cue", () => {
    expect(VN_PENTATONIC_DEGREES).toEqual(["Hò", "Xự", "Xang", "Xê", "Cống"]);
    expect(VN_PENTATONIC_HZ).toEqual([523.25, 587.33, 698.46, 783.99, 880]);
    expect(RAMP_IN_SEC).toBeGreaterThanOrEqual(0.02);
    expect(MIN_RAMP_OUT_SEC).toBeGreaterThanOrEqual(0.04);
    expect(TRUE_PEAK_CEILING_LINEAR).toBeLessThanOrEqual(MINUS_ONE_DBTP_LINEAR);

    const marimbaFundamentals = [
      SFX_RECIPES.marimba_1[0]?.freq,
      SFX_RECIPES.marimba_2[0]?.freq,
      SFX_RECIPES.marimba_3[0]?.freq,
      SFX_RECIPES.marimba_4[0]?.freq,
      SFX_RECIPES.marimba_5[0]?.freq,
    ];
    expect(marimbaFundamentals).toEqual([...VN_PENTATONIC_HZ]);

    for (const [cueName, notes] of Object.entries(SFX_RECIPES)) {
      expect(notes.length, cueName).toBeGreaterThan(0);
      for (const note of notes) {
        expect(note.rampOutSec, `${cueName} rampOut`).toBeGreaterThanOrEqual(
          0.04
        );
        expect(note.volume, `${cueName} volume`).toBeLessThanOrEqual(
          MAX_NOTE_VOLUME
        );
        expect(note.durationSec, `${cueName} duration`).toBeGreaterThanOrEqual(
          0.05
        );
      }
    }
  });

  it("SFXEngine & AudioController định tuyến qua bus trần <= -1 dBTP và sườn lên >= 20ms", () => {
    const linearRamps: [number, number][] = [];
    const expRamps: [number, number][] = [];
    const setValues: [number, number][] = [];

    const makeParam = () => ({
      value: 0,
      setValueAtTime: (v: number, t: number) => {
        setValues.push([v, t]);
      },
      linearRampToValueAtTime: (v: number, t: number) => {
        linearRamps.push([v, t]);
      },
      exponentialRampToValueAtTime: (v: number, t: number) => {
        expRamps.push([v, t]);
      },
    });

    class MockLimiterAudioContext {
      state = "running";
      currentTime = 1.0;
      destination = {};
      close = vi.fn(() => Promise.resolve());
      resume = vi.fn(() => Promise.resolve());
      createOscillator() {
        return {
          type: "triangle",
          frequency: makeParam(),
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: makeParam(),
          connect: vi.fn(),
        };
      }
      createDynamicsCompressor() {
        return {
          threshold: makeParam(),
          knee: makeParam(),
          ratio: makeParam(),
          attack: makeParam(),
          release: makeParam(),
          connect: vi.fn(),
        };
      }
    }

    vi.stubGlobal("window", {});
    vi.stubGlobal("AudioContext", MockLimiterAudioContext);

    const controller = new AudioController(true);
    controller.playFolkChime();
    controller.playPluckedZither();
    controller.playRattleDrum();
    controller.playBambooClack();

    // Master gain được ghim ở TRUE_PEAK_CEILING_LINEAR (<= -1 dBTP)
    expect(setValues.some(([v]) => v === TRUE_PEAK_CEILING_LINEAR)).toBe(true);
    // Mọi ramp-in bắt đầu từ currentTime + delaySec + >=0.02s
    expect(linearRamps.length).toBeGreaterThan(0);
    for (const [vol, rampEnd] of linearRamps) {
      expect(vol).toBeLessThanOrEqual(MAX_NOTE_VOLUME);
      expect(rampEnd).toBeGreaterThanOrEqual(1.0 + RAMP_IN_SEC - 1e-6);
    }
    expect(expRamps.length).toBeGreaterThan(0);

    const sfx = new SFXEngine();
    sfx.play("amber_soft");
    sfx.dispose();
    controller.dispose();
    vi.unstubAllGlobals();
  });
});

describe("Tuổi thơ Việt × Giấy Gỗ Mộc — Nhãn Đồng Dao & Từ khóa Mầm non", () => {
  it("kho câu đồng dao & khích lệ theo band tuổi không chứa từ cấm và xoay vòng ổn định", () => {
    const allPhrases: string[] = [
      ...DONG_DAO_CELEBRATION_CHANTS,
      ...COMPLIMENTS,
      ...RETRY_ENCOURAGEMENTS,
    ];
    for (const band of ["3-4", "4-5", "5-6"] as const) {
      const table = PRESCHOOL_ENCOURAGEMENT_BY_BAND[band];
      allPhrases.push(
        ...table.praise,
        ...table.retry,
        ...table.scaffold_nudge,
        ...table.level_complete
      );
    }

    for (const phrase of allPhrases) {
      const lower = phrase.toLowerCase();
      for (const forbidden of FORBIDDEN_WORDS) {
        expect(lower).not.toContain(forbidden.toLowerCase());
      }
      expect(lower).not.toContain("kém");
      expect(lower).not.toContain("hơn");
    }

    expect(pickEncouragementPhrase("praise", "3-4", 0)).not.toBe(
      pickEncouragementPhrase("praise", "3-4", 1)
    );
  });

  it("nhận diện từ khóa tiếng Việt cho đồ vật tuổi thơ Việt và vẽ HUD banner >= 16px CSS", () => {
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🪁" })).toBeDefined();
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🏮" })).toBeDefined();
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🪷" })).toBeDefined();
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🎋" })).toBeDefined();
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "👒" })).toBeDefined();
    expect(spokenKeywordForAsset({ kind: "emoji", ref: "🧺" })).toBeDefined();

    // Kiểm tra sàn chữ >= 16px CSS trên khung máy dọc 390×844 và không dùng danger
    const space = deriveLogicSpace(390, 844);
    const scale = Math.min(390 / space.w, 844 / space.h);
    const rs = new RenderSystem();
    rs.logicSpace = space;
    rs.viewport = {
      cssWidth: 390,
      cssHeight: 844,
      dpr: 1,
      offsetX: 0,
      offsetY: 0,
      scale,
      logicSpace: space,
    };

    const ctx = getStrictFakeContext(390, 844);
    const drawnFonts: string[] = [];
    const strokesUsed: string[] = [];
    ctx.fillText = () => {
      drawnFonts.push(ctx.font);
    };
    const origStroke = ctx.stroke.bind(ctx);
    ctx.stroke = () => {
      if (typeof ctx.strokeStyle === "string") {
        strokesUsed.push(ctx.strokeStyle);
      }
      origStroke();
    };

    drawEncouragementBanner(ctx, rs, "Chậm rãi thử lại nha!", "retry");
    const match = drawnFonts[0]?.match(FONT_PX_REGEX);
    const logicPx = match?.[1] ? Number.parseFloat(match[1]) : 0;
    expect(logicPx * scale).toBeGreaterThanOrEqual(MIN_LEGIBLE_CSS_PX);

    for (const dangerHex of Object.values(
      designTokens.colors.semantic.danger
    )) {
      expect(strokesUsed).not.toContain(dangerHex);
    }
  });
});
