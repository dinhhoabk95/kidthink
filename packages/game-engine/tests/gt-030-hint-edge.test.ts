import { describe, expect, it, vi } from "vitest";
import { GameEngine } from "#src/index";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";

/** Hint tay ma kéo dọc dải đo tới mép đơn vị kế tiếp (`BR-E030-10`). */
function load(index: number): { engine: GameEngine; session: GT030Session } {
  const f = GT030_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT030Session(f.content, f.difficulty, 0);
  const engine = new GameEngine();
  engine.load(
    {
      level_code: "LVL-030",
      content_version: 1,
      template_code: "GT-030",
      content_pack: f.content,
      difficulty_params: f.difficulty,
      theme_id: "default",
      age_band: "5-6",
      reduced_motion: false,
      audio_enabled: false,
    },
    () => session
  );
  return { engine, session };
}

describe("GT-030: bàn tay ma kéo tới mép dải đo (BR-E030-10)", () => {
  for (const [index] of GT030_FIXTURES.entries()) {
    it(`fixture ${index}: bàn tay kết thúc ở tâm ô kế tiếp, không ở giữa dải`, () => {
      const { engine, session } = load(index);
      for (let i = 0; i < 40; i++) {
        engine.advanceFrame(1000);
      }
      const next = session.getNextCellCenter();
      expect(next).not.toBeNull();
      expect(engine.demoGhostHand?.to).toEqual(next);
      session.placedUnitsCount = 1;
      expect(session.getHintDestinationPoint()).toEqual(
        session.getNextCellCenter()
      );
      engine.destroy();
    });

    it(`fixture ${index}: đủ đơn vị thì không còn điểm đích`, () => {
      const { engine, session } = load(index);
      session.placedUnitsCount = session.content.object.length_in_units;
      expect(session.getHintDestinationPoint()).toBeNull();
      engine.destroy();
    });
  }

  it("không cài điểm đích thì bàn tay dừng ở tâm slot đích như cũ (BR-SCF-10)", () => {
    const { engine, session } = load(0);
    vi.spyOn(session, "getHintDestinationPoint").mockReturnValue(null);
    for (let i = 0; i < 40; i++) {
      engine.advanceFrame(1000);
    }
    const toIndex = session.getHintDestinationIndex();
    expect(toIndex).not.toBeNull();
    const slot = toIndex === null ? undefined : session.slots[toIndex];
    expect(engine.demoGhostHand?.to).toEqual(
      slot ? { x: slot.x, y: slot.y } : null
    );
    engine.destroy();
  });
});
