import { describe, expect, it } from "vitest";
import { ACTION_IGNORED } from "#src/game-session";
import { GT033Generator } from "#src/generators/gt033";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32.js";
import { RenderSystem } from "#src/systems/render-system";
import { GT033_FIXTURES } from "#src/templates/GT-033/fixtures";
import { getGT033Clock, peekGT033Clock } from "#src/templates/GT-033/layout";
import { GT033Session } from "#src/templates/GT-033/session";
import {
  GT033ContentSchema,
  GT033DifficultySchema,
  solveWeaveGrid,
} from "#src/templates/GT-033/template";
import { evaluateWeavePlacement } from "#src/templates/GT-033/weave-rules";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function createCanvasCtx(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 640).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Cannot get 2d context");
  }
  return ctx;
}

function makeRenderSystem(reducedMotion = false): RenderSystem {
  const rs = new RenderSystem();
  rs.reducedMotion = reducedMotion;
  return rs;
}

function createInitializedSession(
  fixtureIndex = 0,
  allowRetry = true
): GT033Session {
  const fixture = GT033_FIXTURES[fixtureIndex];
  if (!fixture) {
    throw new Error(`Missing fixture ${fixtureIndex}`);
  }
  const difficulty = GT033DifficultySchema.parse({
    ...fixture.difficulty,
    allow_retry: allowRetry,
  });
  const session = new GT033Session(fixture.content, difficulty, 0);
  const space = deriveLogicSpace(960, 640);
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: session.needsTray,
    trayItems: session.trayItemCount,
    trayLabels: session.trayHasLabels,
    stageRows: session.stageRowCount,
    needsCommit: session.needsCommit,
  });
  session.prepareRound("5-6", space, zones.stage, zones.tray ?? undefined, 1);
  return session;
}

describe("GT-033 upgrade", () => {
  it("BR-ERC-02: render() is pure and never mutates session fields", () => {
    const session = createInitializedSession(1);
    const ctx = createCanvasCtx();
    const rs = makeRenderSystem(false);
    const rsReduced = makeRenderSystem(true);

    const before = JSON.stringify({
      placedCells: session.placedCells,
      selectedColorId: session.selectedColorId,
      selectedCellIndex: session.selectedCellIndex,
      brokenRowIndex: session.brokenRowIndex,
      brokenColIndex: session.brokenColIndex,
      isWin: session.isWin,
    });

    session.render(ctx, rs, 120);
    session.render(ctx, rsReduced, 480);

    const after = JSON.stringify({
      placedCells: session.placedCells,
      selectedColorId: session.selectedColorId,
      selectedCellIndex: session.selectedCellIndex,
      brokenRowIndex: session.brokenRowIndex,
      brokenColIndex: session.brokenColIndex,
      isWin: session.isWin,
    });
    expect(after).toBe(before);
    session.destroy();
  });

  it("closes round on wrong placement when allow_retry is false", () => {
    const session = createInitializedSession(1, false);
    const blankIdx = session.placedCells.indexOf(null);
    expect(blankIdx).toBeGreaterThanOrEqual(0);
    const expected = session.getExpectedColorAt(blankIdx);
    const wrongColor = session.content.palette.find(
      (p) => p.color_id !== expected
    )?.color_id;
    expect(wrongColor).toBeDefined();

    if (wrongColor) {
      session.commit({
        type: "place_yarn",
        data: { cell_index: blankIdx, color_id: wrongColor },
      });
    }

    expect(
      session.validateAction({
        type: "place_yarn",
        data: { cell_index: blankIdx, color_id: expected ?? "red" },
      })
    ).toBe(ACTION_IGNORED);
    expect(
      session.toAction({ type: "tap", x: 100, y: 100, timeMs: 100 })
    ).toBeNull();
    session.destroy();
  });

  it("locks input after win", () => {
    const session = createInitializedSession(0);
    for (let i = 0; i < session.placedCells.length; i++) {
      if (session.placedCells[i] === null) {
        const exp = session.getExpectedColorAt(i);
        if (exp) {
          session.commit({
            type: "place_yarn",
            data: { cell_index: i, color_id: exp },
          });
        }
      }
    }
    expect(session.isWin).toBe(true);
    expect(
      session.validateAction({
        type: "select_color",
        data: { color_id: session.content.palette[0]?.color_id ?? "red" },
      })
    ).toBe(ACTION_IGNORED);
    expect(
      session.toAction({ type: "tap", x: 50, y: 50, timeMs: 200 })
    ).toBeNull();
    session.destroy();
  });

  it("supports L1-L3 hint ladder and L3 demo sequence", () => {
    const session = createInitializedSession(1);
    session.onScaffoldEscalated(1, "timer");
    const l1 = session.getHintTargetForLevel(1);
    expect(l1?.kind).toBe("region");

    session.onScaffoldEscalated(2, "timer");
    const l2 = session.getHintTargetForLevel(2);
    expect(l2?.kind).toBe("region");
    if (l2?.kind === "region") {
      expect(l2.ids.some((id) => id.startsWith("palette-"))).toBe(false);
    }

    session.onScaffoldEscalated(3, "timer");
    const l3 = session.getHintTargetForLevel(3);
    expect(l3?.kind).toBe("slot");

    const demo = session.getHintDemoSequence(3);
    expect(demo?.length).toBe(1);
    expect(demo?.[0]?.to).toBeGreaterThanOrEqual(0);

    const blankIdx = session.placedCells.indexOf(null);
    const expected = session.getExpectedColorAt(blankIdx);
    expect(expected).toBeTruthy();
    if (expected) {
      session.commit({ type: "select_color", data: { color_id: expected } });
      expect(session.getHintDestinationIndex()).toBeNull();
      const heldL3 = session.getHintTargetForLevel(3);
      expect(heldL3).toEqual({ kind: "slot", index: blankIdx });
      expect(session.getHintDemoSequence(3)).toEqual([{ from: blankIdx }]);

      session.commit({
        type: "place_yarn",
        data: { cell_index: blankIdx, color_id: expected },
      });
      expect(getGT033Clock(session).activeHintLevel).toBe(0);
    }

    session.onHintCleared();
    expect(getGT033Clock(session).activeHintLevel).toBe(0);
    session.destroy();
  });

  it("renders N6 win sweep cleanly in normal and reducedMotion modes", () => {
    const session = createInitializedSession(0);
    const ctx = createCanvasCtx();
    for (let i = 0; i < session.placedCells.length; i++) {
      if (session.placedCells[i] === null) {
        const exp = session.getExpectedColorAt(i);
        if (exp) {
          session.commit({
            type: "place_yarn",
            data: { cell_index: i, color_id: exp },
          });
        }
      }
    }
    expect(session.isWin).toBe(true);
    session.update(16);
    session.render(ctx, makeRenderSystem(false), 250);
    session.render(ctx, makeRenderSystem(true), 400);
    session.destroy();
  });

  it("tracks hover via setPointerOver / clearPointerOver and resets on destroy", () => {
    const session = createInitializedSession(1);
    const totalCells = session.content.grid.rows * session.content.grid.cols;
    const paletteSlot = session
      .getView()
      .entities.find((e) => e.slotIndex === totalCells);
    expect(paletteSlot).toBeDefined();
    expect(paletteSlot?.hitW).toBeGreaterThan(0);
    expect(paletteSlot?.hitH).toBeGreaterThan(0);
    if (paletteSlot) {
      session.setPointerOver(paletteSlot.x, paletteSlot.y);
      expect(getGT033Clock(session).hoveredEntityId).toBe(paletteSlot.id);
    }
    session.clearPointerOver();
    expect(getGT033Clock(session).hoveredEntityId).toBeNull();

    const blankIdx = session.placedCells.indexOf(null);
    const expected = session.getExpectedColorAt(blankIdx);
    const wrong = session.content.palette.find(
      (p) => p.color_id !== expected
    )?.color_id;
    if (expected && wrong) {
      session.commit({ type: "select_color", data: { color_id: wrong } });
      expect(
        session.getView().entities.find((e) => e.id === wrong)?.state
      ).toBe("selected");
      session.commit({
        type: "place_yarn",
        data: { cell_index: blankIdx, color_id: wrong },
      });
      expect(
        session.getView().entities.find((e) => e.slotIndex === blankIdx)?.state
      ).toBe("incorrect");
      for (let i = 0; i < session.placedCells.length; i++) {
        if (session.placedCells[i] === null || i === blankIdx) {
          const exp = session.getExpectedColorAt(i);
          if (exp) {
            session.commit({
              type: "place_yarn",
              data: { cell_index: i, color_id: exp },
            });
          }
        }
      }
      expect(
        session.getView().entities.find((e) => e.slotIndex === blankIdx)?.state
      ).toBe("correct");
    }

    session.destroy();
    session.clearPointerOver();
    expect(peekGT033Clock(session)).toBeUndefined();
  });

  it("evaluates indirect conflicts on both axes and advances win sweep via DualStamp", () => {
    // 2x2 grid with 2 colors: row 0 = [red, blue], row 1 = [null, null]
    // Placing blue at (1, 1) has no immediate row-1 or col-1 clash if row1=[null, null],
    // wait: col 1 already has blue at (0, 1). Instead construct 3x3 where (2, 2) leaves no valid grid:
    // Row 0: [red, blue, gold], Row 1: [blue, null, red], Row 2: [null, red, null]
    // Placing gold at (2, 2) has no direct duplicate in row 2 or col 2,
    // wait: col 2 has gold at (0, 2). Use a valid indirect conflict:
    // 3x3 [r,b,g]: row 0=[r,b,g], row 1=[g,null,null], row 2=[b,null,null];
    // (1,1)=b makes (1,2)=r (ok) -> (2,1)=r, (2,2)=g (conflict with (0,2)=g!)
    const res = evaluateWeavePlacement(
      ["red", "blue", "gold", "gold", null, null, "blue", null, null],
      3,
      3,
      3,
      4,
      "red",
      "gold"
    );
    expect(res.isCorrect).toBe(false);
    expect(res.brokenRowIndex).toBe(1);
    expect(res.brokenColIndex).toBe(1);

    const session = createInitializedSession(0);
    const ctx = createCanvasCtx();
    for (let i = 0; i < session.placedCells.length; i++) {
      if (session.placedCells[i] === null) {
        const exp = session.getExpectedColorAt(i);
        if (exp) {
          session.commit({
            type: "place_yarn",
            data: { cell_index: i, color_id: exp },
          });
        }
      }
    }
    session.update(200);
    session.render(ctx, makeRenderSystem(false), 0);
    session.update(450);
    session.render(ctx, makeRenderSystem(false), 0);
    session.destroy();
  });

  it("N7 permutes blank mask deterministically on replay while keeping unique solution", () => {
    const session = createInitializedSession(1);
    const firstMask = session.placedCells.map((c) => c === null);
    session.setupEntities();
    const secondMask = session.placedCells.map((c) => c === null);

    expect(secondMask.some((b, idx) => b !== firstMask[idx])).toBe(true);
    const paletteIds = session.content.palette.map((p) => p.color_id);
    const solutions = solveWeaveGrid(
      session.content.grid.rows,
      session.content.grid.cols,
      paletteIds,
      session.placedCells,
      2
    );
    expect(solutions.length).toBe(1);
    session.destroy();
  });

  it("GT033Generator produces valid unique-solution levels across 30 seeds & escalation steps", () => {
    for (let step = 0; step <= 4; step++) {
      for (let seed = 1; seed <= 6; seed++) {
        const rng = createRng(step * 100 + seed);
        const { content_pack, difficulty_params } = GT033Generator.generate({
          rng,
          age_band: "5-6",
          what: "pattern",
          theme: "art",
          vocabulary: { theme: "art", nouns: [] },
          escalation_step: step,
        });
        const parsedContent = GT033ContentSchema.parse(content_pack);
        const parsedDiff = GT033DifficultySchema.parse(difficulty_params);

        const blankIndices = parsedContent.cells
          .map((c, idx) => (c === null ? idx : -1))
          .filter((idx) => idx >= 0);
        expect(blankIndices.length).toBeGreaterThanOrEqual(2);
        const rows = new Set(
          blankIndices.map((idx) => Math.floor(idx / parsedContent.grid.cols))
        );
        const cols = new Set(
          blankIndices.map((idx) => idx % parsedContent.grid.cols)
        );
        expect(rows.size).toBeGreaterThanOrEqual(2);
        expect(cols.size).toBeGreaterThanOrEqual(2);

        const paletteIds = parsedContent.palette.map((p) => p.color_id);
        expect(
          solveWeaveGrid(
            parsedContent.grid.rows,
            parsedContent.grid.cols,
            paletteIds,
            parsedContent.cells,
            2
          ).length
        ).toBe(1);
        expect(parsedDiff.blank_count).toBe(blankIndices.length);
        expect(parsedDiff.grid_size).toBe(parsedContent.grid.rows);
        expect(parsedDiff.color_count).toBe(parsedContent.palette.length);
      }
    }
  });
});
