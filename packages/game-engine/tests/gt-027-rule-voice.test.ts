import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import {
  layoutGT027RuleBanner,
  resolveGT027RuleGlyph,
} from "#src/render/gt-027-shapes";
import { drawSubPromptText } from "#src/render/shared-render";
import { AudioController } from "#src/systems/audio-controller";
import { RenderSystem } from "#src/systems/render-system";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { splitGT027Caption } from "#src/templates/GT-027/layout.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";
import {
  canvasBoxOf,
  placeRound,
  SHELL_VIEWPORTS,
} from "./layout/helpers/shell-frame.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSubPromptText: vi.fn(actual.drawSubPromptText) };
});

/**
 * Luật phải nghe và thấy được, không chỉ đọc chữ (BR-E027-09, BR-E027-10).
 * Fixture 0: luật đầu "màu đỏ", luật hai "hình ngôi sao".
 */
const FIXTURE = GT027_FIXTURES[0] ?? failMissingFixture();
const BANDS: readonly AgeBand[] = ["4-5", "5-6"];
const ICON_MIN_CSS = 28;

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-027");
}

function openSession(): GT027Session {
  const session = new GT027Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function isFirstRuleItem(item: { readonly color: string }): boolean {
  return item.color === "red";
}

function triggerSwitch(session: GT027Session): void {
  const good = FIXTURE.content.items.find(isFirstRuleItem);
  for (let i = 0; i < FIXTURE.content.switch_after_trials; i++) {
    session.onSelectItem(good?.id ?? "");
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GT-027: giọng đọc luật (BR-E027-09)", () => {
  it("mở vòng: activePrompt nói luật đầu", () => {
    const prompt = openSession().getView().activePrompt ?? "";

    expect(prompt).toContain("màu đỏ");
  });

  it("pha báo đổi luật (trước khi đọc): activePrompt không lộ luật mới", () => {
    const session = openSession();
    triggerSwitch(session);

    expect(session.isSignaling()).toBe(true);
    const prompt = session.getView().activePrompt ?? "";
    expect(prompt).not.toContain("ngôi sao");
    expect(prompt).not.toContain("sao");
  });

  it("pha báo đổi luật: không đọc luật mới trước khi còi xong", () => {
    const speak = vi
      .spyOn(AudioController.prototype, "speakPrompt")
      .mockReturnValue(true);
    const session = openSession();
    triggerSwitch(session);
    session.update(FIXTURE.difficulty.signal_duration_ms - 100);

    expect(session.isSignaling()).toBe(true);
    expect(speak).not.toHaveBeenCalled();
  });

  it("sau còi: activePrompt là luật mới và giọng đọc luật mới đúng một lần", () => {
    const speak = vi
      .spyOn(AudioController.prototype, "speakPrompt")
      .mockReturnValue(true);
    const session = openSession();
    triggerSwitch(session);
    session.update(FIXTURE.difficulty.signal_duration_ms + 1);
    session.update(500);

    const rule = FIXTURE.content.rules[1];
    expect(session.isSignaling()).toBe(false);
    expect(session.getView().activePrompt).toBe(rule?.signal_audio_text);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0]?.[0]).toBe(rule?.signal_audio_text);
  });

  it("tắt âm thì không đọc luật mới", () => {
    const speak = vi
      .spyOn(AudioController.prototype, "speakPrompt")
      .mockReturnValue(true);
    const session = openSession();
    session.setAudioEnabled(false);
    triggerSwitch(session);
    session.update(FIXTURE.difficulty.signal_duration_ms + 1);

    expect(speak).not.toHaveBeenCalled();
  });
});

describe("GT-027: icon vẽ đúng giá trị luật (BR-E027-10)", () => {
  it("luật màu vẽ chấm đúng màu, luật hình vẽ đúng hình", () => {
    expect(resolveGT027RuleGlyph("color", "red")).toEqual({
      kind: "dot",
      color: "red",
    });
    expect(resolveGT027RuleGlyph("shape", "square")).toEqual({
      kind: "shape",
      shape: "square",
    });
    expect(resolveGT027RuleGlyph("size", "large")).toEqual({
      kind: "size",
      level: 2,
    });
  });
});

function renderPillRect(
  session: GT027Session,
  scale: number
): { x: number; y: number; w: number; h: number } | undefined {
  vi.mocked(drawSubPromptText).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.softShadowsEnabled = false;
  session.render(ctx as CanvasRenderingContext2D, rs, 0);
  expect(scale).toBeGreaterThan(0);
  return vi.mocked(drawSubPromptText).mock.calls[0]?.[3];
}

describe("GT-027: icon luật đủ lớn, pill không đè (BR-E027-10)", () => {
  for (const vp of SHELL_VIEWPORTS) {
    for (const band of BANDS) {
      it(`${vp.name} ${band}: icon >= ${ICON_MIN_CSS} px CSS, pill tách khỏi icon, cả lúc báo đổi luật`, () => {
        const session = new GT027Session(
          FIXTURE.content,
          FIXTURE.difficulty,
          0
        );
        const placed = placeRound(session, band, canvasBoxOf(vp, band, "play"));
        const caption = splitGT027Caption(placed.zones.stage, placed.scale);
        const layout = layoutGT027RuleBanner(caption.caption, placed.scale);

        expect(layout.icon.w * placed.scale).toBeGreaterThanOrEqual(
          ICON_MIN_CSS
        );
        expect(layout.icon.h * placed.scale).toBeGreaterThanOrEqual(
          ICON_MIN_CSS
        );
        expect(layout.icon.y).toBeGreaterThanOrEqual(caption.caption.y);
        expect(layout.icon.y + layout.icon.h).toBeLessThanOrEqual(
          caption.caption.y + caption.caption.h
        );

        const idle = renderPillRect(session, placed.scale);
        triggerSwitch(session);
        const signaling = renderPillRect(session, placed.scale);
        for (const pill of [idle, signaling]) {
          expect(pill).toBeDefined();
          if (!pill) {
            continue;
          }
          const apart =
            pill.x >= layout.icon.x + layout.icon.w ||
            pill.x + pill.w <= layout.icon.x ||
            pill.y >= layout.icon.y + layout.icon.h ||
            pill.y + pill.h <= layout.icon.y;
          expect(apart).toBe(true);
        }
      });
    }
  }

  it("thẻ vật không bị dải luật cao hơn đè lên", () => {
    const session = new GT027Session(FIXTURE.content, FIXTURE.difficulty, 0);
    const placed = placeRound(
      session,
      "5-6",
      canvasBoxOf(SHELL_VIEWPORTS[0] ?? failMissingFixture(), "5-6", "play")
    );
    const caption = splitGT027Caption(placed.zones.stage, placed.scale);
    for (const slot of session.slots) {
      expect(slot.y - slot.hitH / 2).toBeGreaterThanOrEqual(
        caption.body.y - 0.5
      );
    }
  });
});
