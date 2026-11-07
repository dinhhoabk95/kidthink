import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import { GT009Session } from "#src/templates/GT-009/session";

function getFixture() {
  const fixture = GT009_FIXTURES[0];
  if (!fixture) {
    throw new Error("Missing GT-009 fixture");
  }
  return fixture;
}

describe("GT-009 — loại trừ theo manh mối (clue-deduction): hit-test, spokenLabel, unique id", () => {
  const fixture = getFixture();

  function buildSession(): GT009Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    const session = new GT009Session(fixture.content, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
    return session;
  }

  it("chạm lệch tâm trong dung sai TAP_TOLERANCE_PX (24px) lật được manh mối và úp được ứng viên", () => {
    const session = buildSession();
    const clueSlot = session.slots[0];
    const clueCount = fixture.content.clues.length;
    const ansIdx = fixture.content.candidates.findIndex(
      (c) => c.candidate_id === fixture.content.answer_candidate_id
    );
    const candSlot = session.slots[clueCount + ansIdx];
    if (!(clueSlot && candSlot)) {
      throw new Error("Missing clue or candidate slot");
    }

    const clueOffset = clueSlot.hitH / 2 + TAP_TOLERANCE_PX - 4;
    const clueAction = session.toAction({
      type: "tap",
      x: clueSlot.x,
      y: clueSlot.y - clueOffset,
      timeMs: 0,
    });
    expect(clueAction).toEqual({
      type: "reveal_clue",
      data: { clue_id: fixture.content.clues[0]?.clue_id },
    });

    const candRadius = Math.min(candSlot.hitW, candSlot.hitH) / 2;
    const candAction = session.toAction({
      type: "tap",
      x: candSlot.x,
      y: candSlot.y + candRadius + TAP_TOLERANCE_PX - 4,
      timeMs: 10,
    });
    expect(candAction).toEqual({
      type: "toggle_eliminate",
      data: { item_id: fixture.content.answer_candidate_id },
    });
  });

  it("chạm ngoài mọi thẻ bị nuốt (feedback none, không tính sai)", () => {
    const session = buildSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict?.feedback).toBe("none");
    expect(verdict?.valid).toBe(false);
  });

  it("getView() gán spokenLabel cho manh mối (trước/sau khi lật) và ứng viên số, kể cả khi asset là text giả (dạng DB)", () => {
    const dbStyleContent = {
      ...fixture.content,
      candidates: fixture.content.candidates.map((c) => ({
        ...c,
        asset: { kind: "text" as const, text: "10" },
      })),
    };
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: false,
    });
    const session = new GT009Session(dbStyleContent, fixture.difficulty, 1);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);

    const viewBefore = session.getView();
    const ids = viewBefore.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const firstClue = fixture.content.clues[0];
    const clueEntityBefore = viewBefore.entities.find(
      (e) => e.id === firstClue?.clue_id
    );
    expect(clueEntityBefore?.spokenLabel).toBe("Manh mối bí ẩn");

    if (firstClue) {
      session.onClueRevealed(firstClue.clue_id);
    }
    const viewAfter = session.getView();
    const clueEntityAfter = viewAfter.entities.find(
      (e) => e.id === firstClue?.clue_id
    );
    expect(clueEntityAfter?.spokenLabel).toBe(firstClue?.text);

    for (const cand of dbStyleContent.candidates) {
      const entity = viewAfter.entities.find((e) => e.id === cand.candidate_id);
      expect(entity?.label).toBe(String(cand.value));
      expect(entity?.spokenLabel).toBe(formatSpokenLabel(String(cand.value)));
    }
  });
});
