import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LOGIC_SPACE,
  type LogicSpace,
  resolveTouchFloor,
} from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import { GT009Session } from "#src/templates/GT-009/session";
import { GT009ContentSchema } from "#src/templates/GT-009/template";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";
import {
  findDrawsOutsideStage,
  findSlotsOutsideStage,
} from "#tests/layout/stage-checks";

vi.mock("#src/render/index.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/render/index.js")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

function getFixture(index = 0) {
  const fixture = GT009_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Missing GT-009 fixture at ${index}`);
  }
  return fixture;
}

describe("GT-009 — loại trừ theo manh mối (clue-deduction): hit-test, spokenLabel, unique id", () => {
  const fixture = getFixture(0);

  function buildSession(seed = 1): GT009Session {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "4-5",
      cssPerLogic: 1,
      needsTray: false,
      needsCommit: true,
    });
    const session = new GT009Session(fixture.content, fixture.difficulty, seed);
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, zones.stage);
    return session;
  }

  it("chạm lệch tâm trong dung sai TAP_TOLERANCE_PX (24px) lật được manh mối và úp được ứng viên", () => {
    const session = buildSession(1);
    const clueSlot = session.slots[0];
    const ansEntity = session
      .getView()
      .entities.find((e) => e.id === fixture.content.answer_candidate_id);
    const candSlot =
      ansEntity === undefined ? undefined : session.slots[ansEntity.slotIndex];
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
      needsCommit: true,
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

  it("xáo trộn thứ tự ứng viên tất định theo layoutSeed nhưng giữ nguyên thứ tự manh mối", () => {
    const f2 = getFixture(1);
    const s0 = new GT009Session(f2.content, f2.difficulty, 0);
    s0.prepareRound("4-5");
    const s1a = new GT009Session(f2.content, f2.difficulty, 1);
    s1a.prepareRound("4-5");
    const s1b = new GT009Session(f2.content, f2.difficulty, 1);
    s1b.prepareRound("4-5");

    const origCands = f2.content.candidates.map((c) => c.candidate_id);
    const view0Cands = s0
      .getView()
      .entities.filter((e) => e.role === "source")
      .map((e) => e.id);
    const view1aCands = s1a
      .getView()
      .entities.filter((e) => e.role === "source")
      .map((e) => e.id);
    const view1bCands = s1b
      .getView()
      .entities.filter((e) => e.role === "source")
      .map((e) => e.id);
    const view1aClues = s1a
      .getView()
      .entities.filter((e) => e.role === "target")
      .map((e) => e.id);

    expect(view0Cands).toEqual(origCands);
    expect(view1aCands).toEqual(view1bCands);
    expect(view1aCands).not.toEqual(origCands);
    expect(view1aClues).toEqual(f2.content.clues.map((c) => c.clue_id));
  });

  it("allow_retry = false: chốt sai một lần đóng vòng, khoá input và tự mở mọi manh mối không phát clue_ping", () => {
    const f2 = getFixture(1);
    const strictDiff = { ...f2.difficulty, allow_retry: false };
    const session = new GT009Session(f2.content, strictDiff, 0);
    session.prepareRound("4-5");

    for (const id of ["c1", "c2", "c4", "c5"]) {
      session.toggleEliminate(id);
    }
    expect(session.canCommit()).toBe(true);
    session.dispatch({ type: "commit", timeMs: 100 });

    expect(session.checkWinCondition()).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.getRevealedClueIds()).toEqual(
      f2.content.clues.map((c) => c.clue_id)
    );
    expect(session.takeSfxCues()).toEqual([]);
    expect(
      session.validateAction({
        type: "select_item",
        data: { item_id: f2.content.answer_candidate_id },
      }).valid
    ).toBe(false);
  });

  it("bậc thang gợi ý L1 / L2 / L3 và getHintDemoSequence(3) hoạt động đúng theo tiến trình", () => {
    const f2 = getFixture(1);
    const session = new GT009Session(f2.content, f2.difficulty, 0);
    session.prepareRound("4-5");

    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["k1"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["c5"],
    });
    for (const clue of f2.content.clues) {
      session.onClueRevealed(clue.clue_id);
    }
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["k3"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["c1"],
    });
    const l3Target = session.getHintTargetForLevel(3);
    expect(l3Target).toEqual({
      kind: "slot",
      index: f2.content.clues.length,
    });
    const demo = session.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect(demo?.[0]?.from).toBe(session.getHintTargetIndex());

    for (const id of ["c1", "c2", "c5", "c6"]) {
      session.toggleEliminate(id);
    }
    expect(session.getHintTargetForLevel(1)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(2)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(3)).toEqual({ kind: "action" });
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("không tràn khung và 0 nét vẽ ngoài stageRect trên màn dọc 360x640 với cả 3 và 4 manh mối", () => {
    const portraitSpace: LogicSpace = { w: 540, h: 960 };
    const fourCluesContent = GT009ContentSchema.parse({
      prompt: "Tìm con số bí ẩn qua 4 manh mối nhé!",
      candidates: [
        { candidate_id: "c1", value: 1 },
        { candidate_id: "c2", value: 2 },
        { candidate_id: "c3", value: 3 },
        { candidate_id: "c4", value: 4 },
        { candidate_id: "c5", value: 5 },
        { candidate_id: "c6", value: 6 },
      ],
      clues: [
        {
          clue_id: "k1",
          text: "Lớn hơn 2",
          predicate: { kind: "greater_than", value: 2 },
        },
        {
          clue_id: "k2",
          text: "Bé hơn 6",
          predicate: { kind: "less_than", value: 6 },
        },
        {
          clue_id: "k3",
          text: "Khác 3",
          predicate: { kind: "not_equal", value: 3 },
        },
        {
          clue_id: "k4",
          text: "Khác 4",
          predicate: { kind: "not_equal", value: 4 },
        },
      ],
      answer_candidate_id: "c5",
    });

    for (const ageBand of ["4-5", "5-6"] as const) {
      const cssPerLogic = 360 / portraitSpace.w;
      const zones = computeStageZones({
        logicW: portraitSpace.w,
        logicH: portraitSpace.h,
        ageBand,
        cssPerLogic,
        needsTray: false,
        needsCommit: true,
      });
      const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
      const session = new GT009Session(fourCluesContent, fixture.difficulty, 2);
      session.prepareRound(
        ageBand,
        portraitSpace,
        zones.stage,
        undefined,
        cssPerLogic
      );

      for (const s of session.slots) {
        expect(s.hitW).toBeGreaterThanOrEqual(touchFloor);
        expect(s.hitH).toBeGreaterThanOrEqual(touchFloor);
      }
      expect(findSlotsOutsideStage(session.slots, zones.stage)).toEqual([]);

      session.onClueRevealed("k1");
      session.onClueRevealed("k3");
      session.toggleEliminate("c1");
      const rs = new RenderSystem();
      expect(
        findDrawsOutsideStage(zones.stage, (ctx) =>
          session.render(ctx, rs, 250)
        )
      ).toEqual([]);
    }
  });

  it("manh mối thuộc tính (has_attribute / not_attribute) đã mở vẽ 100% vector không chữ cái trên canvas", () => {
    const attrContent = GT009ContentSchema.parse({
      prompt: "Tìm bạn thú bí ẩn nhé!",
      candidates: [
        {
          candidate_id: "cat",
          value: 1,
          asset: { kind: "emoji", ref: "🐱" },
          attributes: { habitat: "land", color: "red" },
        },
        {
          candidate_id: "frog",
          value: 2,
          asset: { kind: "emoji", ref: "🐸" },
          attributes: { habitat: "water", color: "green" },
        },
        {
          candidate_id: "duck",
          value: 3,
          asset: { kind: "emoji", ref: "🦆" },
          attributes: { habitat: "water", color: "yellow" },
        },
        {
          candidate_id: "dog",
          value: 4,
          asset: { kind: "emoji", ref: "🐶" },
          attributes: { habitat: "land", color: "brown" },
        },
      ],
      clues: [
        {
          clue_id: "a1",
          text: "Sống dưới nước",
          predicate: {
            kind: "has_attribute",
            key: "habitat",
            attr_value: "water",
          },
        },
        {
          clue_id: "a2",
          text: "Không phải màu vàng",
          predicate: {
            kind: "not_attribute",
            key: "color",
            attr_value: "yellow",
          },
        },
      ],
      answer_candidate_id: "frog",
    });

    const session = new GT009Session(attrContent, fixture.difficulty, 0);
    session.prepareRound("4-5");
    session.onClueRevealed("a1");
    session.onClueRevealed("a2");
    session.update(300);

    const drawn = collectRenderedText(session, { prepare: false });
    expect(lettersOnly(drawn)).toEqual([]);
  });
});
