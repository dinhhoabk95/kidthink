import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { CARD_FLIP_MS, cardFlipPose } from "#src/render/flashcard";
import { drawSubPromptText } from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures.js";
import { GT027Session } from "#src/templates/GT-027/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/flashcard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/render/flashcard")>();
  return { ...actual, cardFlipPose: vi.fn(actual.cardFlipPose) };
});
vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSubPromptText: vi.fn(actual.drawSubPromptText) };
});

/** Thẻ luật lật mặt khi đổi luật (`BR-E027-06`). */
type Fixture = (typeof GT027_FIXTURES)[number];

function openSession(fixture: Fixture): GT027Session {
  const session = new GT027Session(fixture.content, fixture.difficulty, 0);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

function frame(
  session: GT027Session,
  timeMs: number,
  reduced = false
): { text: string | undefined; flips: number } {
  vi.mocked(drawSubPromptText).mockClear();
  vi.mocked(cardFlipPose).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return {
    text: vi.mocked(drawSubPromptText).mock.calls[0]?.[2],
    flips: vi.mocked(cardFlipPose).mock.calls.length,
  };
}

/** Đưa session tới lúc luật đổi (đủ lượt đúng của luật đầu). */
function switchRule(session: GT027Session, fixture: Fixture): void {
  const first = fixture.content.rules[0];
  const target = fixture.content.items.filter((it) =>
    first?.dimension === "color"
      ? it.color === first.target_value
      : it.shape === first?.target_value
  );
  for (const item of target.slice(0, fixture.content.switch_after_trials)) {
    session.onSelectItem(item.id);
  }
}

describe("GT-027: thẻ luật lật mặt (BR-E027-06)", () => {
  for (const [index, fixture] of GT027_FIXTURES.entries()) {
    it(`fixture ${index}: luật đứng yên thì thẻ không lật`, () => {
      const session = openSession(fixture);
      const a = frame(session, 0);
      const b = frame(session, 5000);
      expect(a.flips).toBe(0);
      expect(b.flips).toBe(0);
      expect(a.text).toBe(b.text);
    });

    it(`fixture ${index}: đổi luật thì thẻ lật, mặt cũ nửa đầu rồi mặt mới, xong thì tĩnh`, () => {
      const session = openSession(fixture);
      const before = frame(session, 0).text;
      switchRule(session, fixture);
      if (!session.isSignaling()) {
        return;
      }
      const start = frame(session, 1000);
      expect(start.flips).toBe(1);
      expect(start.text).toBe(before);
      const late = frame(session, 1000 + CARD_FLIP_MS * 0.75);
      expect(late.flips).toBe(1);
      expect(late.text).toBe(session.getSignalInfo()?.text);
      const done = frame(session, 1000 + CARD_FLIP_MS + 1);
      expect(done.flips).toBe(0);
      expect(done.text).toBe(session.getSignalInfo()?.text);
    });

    it(`fixture ${index}: reduced_motion hiện thẳng mặt mới`, () => {
      const session = openSession(fixture);
      frame(session, 0, true);
      switchRule(session, fixture);
      if (!session.isSignaling()) {
        return;
      }
      expect(frame(session, 1000, true).text).toBe(
        session.getSignalInfo()?.text
      );
    });
  }

  it("vùng chạm không đổi khi vẽ", () => {
    for (const fixture of GT027_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
