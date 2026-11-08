import { describe, expect, it, vi } from "vitest";
import type { EngineConfig } from "#src/core";
import { TemplateGameSession } from "#src/game-session";
import {
  createGameSessionSync,
  preloadGameSession,
} from "#src/generated/session-loader";
import { computeMutedStripLayout } from "#src/layout/muted-strip";
import { RenderSystem } from "#src/systems/render-system";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures";
import { GT018Session } from "#src/templates/GT-018/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Dải icon thay âm thanh khi tắt tiếng (`BR-E018-06`). */
function build(mode: "select" | "sequence"): GT018Session {
  const fixture = GT018_FIXTURES.find((f) => f.content.response_mode === mode);
  if (!fixture) {
    throw new Error(`Thiếu fixture ${mode}`);
  }
  const session = new GT018Session(fixture.content, fixture.difficulty);
  session.prepareRound("4-5", undefined, {
    x: 20,
    y: 120,
    w: 320,
    h: 420,
  });
  return session;
}

function renderedGlyphs(session: GT018Session): string[] {
  const ctx = createFakeCanvas(390, 700).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const texts: string[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
    texts.push(t);
  });
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  return texts;
}

describe("computeMutedStripLayout (hàm thuần)", () => {
  const figure = { x: 20, y: 100, w: 300, h: 130 };

  it("máy hát và dải chip nằm trong khung hình, không chồng nhau", () => {
    const l = computeMutedStripLayout(figure, 4);
    expect(l.chips).toHaveLength(4);
    const gramBottom = l.gramophone.cy + l.gramophone.size / 2;
    for (const chip of l.chips) {
      expect(chip.cx - chip.size / 2).toBeGreaterThanOrEqual(figure.x - 1e-9);
      expect(chip.cx + chip.size / 2).toBeLessThanOrEqual(
        figure.x + figure.w + 1e-9
      );
      expect(chip.cy - chip.size / 2).toBeGreaterThanOrEqual(gramBottom - 1e-9);
      expect(chip.cy + chip.size / 2).toBeLessThanOrEqual(
        figure.y + figure.h + 1e-9
      );
    }
    expect(l.gramophone.cy - l.gramophone.size / 2).toBeGreaterThanOrEqual(
      figure.y - 1e-9
    );
  });

  it("nhiều chip thì chip nhỏ lại nhưng vẫn ≥ 20 px và không chồng nhau", () => {
    const l = computeMutedStripLayout(figure, 9);
    const sizes = l.chips.map((c) => c.size);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(20);
    for (let i = 1; i < l.chips.length; i++) {
      const a = l.chips[i - 1];
      const b = l.chips[i];
      if (a && b) {
        expect(b.cx - a.cx).toBeGreaterThanOrEqual(a.size / 2 + b.size / 2);
      }
    }
  });
});

describe("GT-018: trạng thái âm của engine", () => {
  it("mặc định bật âm; setAudioEnabled(false) ghi nhận", () => {
    const session = build("select");
    expect(session.isAudioEnabled()).toBe(true);
    session.setAudioEnabled(false);
    expect(session.isAudioEnabled()).toBe(false);
  });

  it("createGameSessionSync chuyển audio_enabled của config vào session", async () => {
    await preloadGameSession("GT-018");
    const fixture = GT018_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const cfg: EngineConfig = {
      level_code: "L",
      content_version: 1,
      template_code: "GT-018",
      content_pack: fixture.content,
      difficulty_params: fixture.difficulty,
      theme_id: "default",
      age_band: "4-5",
      reduced_motion: false,
      audio_enabled: false,
      layout_seed: 0,
    };
    const session = createGameSessionSync("GT-018", cfg);
    expect(session instanceof TemplateGameSession).toBe(true);
    expect(
      session instanceof TemplateGameSession && session.isAudioEnabled()
    ).toBe(false);
  });
});

describe("GT-018: dải icon khi tắt tiếng (BR-E018-06)", () => {
  it("còn tiếng: không vẽ dải, không biểu tượng tắt tiếng", () => {
    const session = build("sequence");
    expect(session.getInstructionStrip()).toEqual([]);
    expect(renderedGlyphs(session)).not.toContain("🔇");
  });

  it("tắt tiếng + chuỗi: dải theo đúng thứ tự target_sequence", () => {
    const session = build("sequence");
    session.setAudioEnabled(false);
    const fixture = GT018_FIXTURES.find(
      (f) => f.content.response_mode === "sequence"
    );
    expect(session.getInstructionStrip().map((o) => o.item_id)).toEqual(
      fixture?.content.target_sequence
    );
    expect(renderedGlyphs(session)).toContain("🔇");
  });

  it("tắt tiếng + chọn: dải chỉ gồm vật mà lời đọc gọi tên (strip_item_ids)", () => {
    const session = build("select");
    session.setAudioEnabled(false);
    expect(session.getInstructionStrip().map((o) => o.item_id)).toEqual([
      "cat",
    ]);
  });

  it("tắt tiếng + câu đố quy luật: dải là lời đọc (táo, chuối, táo), không phải riêng đáp án", () => {
    const fixture = GT018_FIXTURES.find((f) =>
      f.content.audio_prompt.text.includes("tiếp theo")
    );
    if (!fixture) {
      throw new Error("Thiếu fixture quy luật");
    }
    const session = new GT018Session(fixture.content, fixture.difficulty);
    session.prepareRound("4-5");
    session.setAudioEnabled(false);
    expect(session.getInstructionStrip().map((o) => o.item_id)).toEqual([
      "apple",
      "banana",
      "apple",
    ]);
  });

  it("tắt tiếng + chọn không khai strip_item_ids: không vẽ phương án đúng (không lộ đáp án)", () => {
    const fixture = GT018_FIXTURES.find(
      (f) => f.content.response_mode === "select"
    );
    if (!fixture) {
      throw new Error("Thiếu fixture select");
    }
    const session = new GT018Session(
      { ...fixture.content, audio_prompt: { text: "Gâu gâu" } },
      fixture.difficulty
    );
    session.prepareRound("4-5");
    session.setAudioEnabled(false);
    expect(session.getInstructionStrip()).toEqual([]);
    expect(renderedGlyphs(session)).not.toContain("🔇");
  });

  it("máy hát (nút nghe lại) vẫn nằm trong view và không chồng lên các lựa chọn", () => {
    const session = build("select");
    session.setAudioEnabled(false);
    const view = session.getView();
    const gram = view.entities.find((e) => e.id === "gramophone");
    expect(gram).toBeDefined();
    if (!gram) {
      return;
    }
    for (const e of view.entities) {
      if (e.id === "gramophone") {
        continue;
      }
      const overlapX = Math.abs(e.x - gram.x) < (e.w + gram.w) / 2;
      const overlapY = Math.abs(e.y - gram.y) < (e.h + gram.h) / 2;
      expect(overlapX && overlapY).toBe(false);
    }
  });

  it("không đổi luật: tắt tiếng vẫn chấm đúng như cũ", () => {
    const session = build("select");
    session.setAudioEnabled(false);
    session.onItemSelect("dog");
    expect(session.checkWinCondition()).toBe(false);
    session.onItemSelect("cat");
    expect(session.checkWinCondition()).toBe(true);
  });
});
