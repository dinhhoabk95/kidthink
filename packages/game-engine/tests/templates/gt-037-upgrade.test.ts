import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { ACTION_IGNORED } from "#src/game-session";
import { GT037Generator } from "#src/generators/gt037";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import {
  computeGT037BoardBox,
  computeGT037HintRegion,
} from "#src/templates/GT-037/board-builder";
import { peekGT037Clock } from "#src/templates/GT-037/layout";
import { GT037Session } from "#src/templates/GT-037/session";
import GT037Template, {
  DIGIT_OR_LETTER_REGEX,
  type GT037Content,
  type GT037Difficulty,
} from "#src/templates/GT-037/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/index.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/render/index.js")>();
  return {
    ...actual,
    drawSceneBackground: vi.fn(),
    drawCollectJar: vi.fn(),
  };
});

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function createCanvasCtx(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(1024, 640).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Cannot get 2d context");
  }
  return ctx;
}

const BASE_CONTENT: GT037Content = {
  prompt: "Con tìm hết số 3 nhé",
  symbols: [
    { id: "sym-target", label: "số 3", asset: { kind: "text", text: "3" } },
    { id: "sym-d1", label: "số 5", asset: { kind: "text", text: "5" } },
    { id: "sym-d2", label: "số 7", asset: { kind: "text", text: "7" } },
    { id: "sym-d3", label: "số 8", asset: { kind: "text", text: "8" } },
  ],
  target_ids: ["sym-target"],
  target_copies: 3,
  item_count: 14,
  confusable_ids: ["sym-d3"],
};

function createSession(
  content: GT037Content = BASE_CONTENT,
  difficulty: GT037Difficulty = {},
  band: AgeBand = "5-6"
): { session: GT037Session; rs: RenderSystem } {
  const space = deriveLogicSpace(1024, 640);
  const cssPerLogic = 1024 / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: band,
    cssPerLogic,
    needsTray: false,
    needsCommit: difficulty.finish_mode === "declare",
  });
  const session = new GT037Session(content, difficulty, 17);
  session.prepareRound(band, space, zones.stage, undefined, cssPerLogic);
  const rs = new RenderSystem();
  rs.logicSpace = space;
  return { session, rs };
}

function findTargetIndices(session: GT037Session): number[] {
  const out: number[] = [];
  session.boardSymbols.forEach((sym, i) => {
    if (session.targetSet.has(sym.id)) {
      out.push(i);
    }
  });
  return out;
}

describe("GT-037 upgrade", () => {
  it("hint ladder: L1 quadrant -> L2 3x3 -> L3 slot & resets on target hit", () => {
    const { session } = createSession();
    session.onScaffoldEscalated(1);
    const l1 = session.getHintTargetForLevel(1);
    session.onScaffoldEscalated(2);
    const l2 = session.getHintTargetForLevel(2);
    session.onScaffoldEscalated(3);
    const l3 = session.getHintTargetForLevel(3);

    expect(l1?.kind).toBe("region");
    expect(l2?.kind).toBe("region");
    const entityIds = new Set(session.getView().entities.map((e) => e.id));
    if (l1?.kind === "region" && l2?.kind === "region") {
      expect(l1.ids).toHaveLength(1);
      expect(l2.ids).toHaveLength(1);
      expect(l1.ids[0]?.startsWith("quadrant:")).toBe(true);
      expect(l2.ids[0]?.startsWith("neighborhood3x3:")).toBe(true);
      expect(entityIds.has(l1.ids[0] ?? "")).toBe(false);
      expect(entityIds.has(l2.ids[0] ?? "")).toBe(false);
      const targetIdx = session.getHintTargetIndex();
      if (targetIdx !== null) {
        const boardBox = computeGT037BoardBox(
          session.slots,
          session.stageRect,
          session.logicSpace
        );
        const r1 = computeGT037HintRegion(
          1,
          targetIdx,
          session.slots,
          session.slotGridMeta,
          session.boardSymbols,
          boardBox
        );
        const r2 = computeGT037HintRegion(
          2,
          targetIdx,
          session.slots,
          session.slotGridMeta,
          session.boardSymbols,
          boardBox
        );
        expect(r1).not.toBeNull();
        expect(r2).not.toBeNull();
        if (r1 && r2) {
          expect(r2.regionBox.x).toBeGreaterThanOrEqual(r1.regionBox.x);
          expect(r2.regionBox.y).toBeGreaterThanOrEqual(r1.regionBox.y);
          expect(r2.regionBox.x + r2.regionBox.w).toBeLessThanOrEqual(
            r1.regionBox.x + r1.regionBox.w
          );
          expect(r2.regionBox.y + r2.regionBox.h).toBeLessThanOrEqual(
            r1.regionBox.y + r1.regionBox.h
          );
        }
      }
    }
    expect(l3?.kind).toBe("slot");
    expect(session.getHintDemoSequence(1)).toBeNull();
    expect(session.getHintDemoSequence(2)).toBeNull();
    const targets = findTargetIndices(session);
    expect(session.getHintDemoSequence(3)).toEqual(
      targets.slice(0, 3).map((from) => ({ from }))
    );

    const firstIdx = targets[0];
    if (firstIdx !== undefined) {
      session.commit({
        type: "tap_symbol",
        data: { slotIndex: firstIdx, symbolId: "sym-target" },
      });
    }
    expect(peekGT037Clock(session)?.activeHintLevel).toBe(0);
    const nextHint = session.getHintTargetForLevel(3);
    expect(nextHint?.kind).toBe("slot");
    if (nextHint?.kind === "slot") {
      expect(nextHint.index).not.toBe(firstIdx);
    }
    session.destroy();
  });

  it("declare mode hints commit action after all targets found, null after win", () => {
    const { session } = createSession(BASE_CONTENT, {
      finish_mode: "declare",
      allow_retry: true,
    });
    for (const idx of findTargetIndices(session)) {
      session.commit({
        type: "tap_symbol",
        data: { slotIndex: idx, symbolId: "sym-target" },
      });
    }
    expect(session.getHintTargetForLevel(1)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(2)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(3)).toEqual({ kind: "action" });
    expect(session.getHintDemoSequence(3)).toBeNull();

    session.commit({ type: "commit_declare", data: {} });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintTargetForLevel(3)).toBeNull();
    session.destroy();
  });

  it("Spec §5 branch 2: allow_retry false closes round on wrong tap or premature declare", () => {
    const { session, rs } = createSession(BASE_CONTENT, {
      allow_retry: false,
    });
    const wrongIdx = session.boardSymbols.findIndex(
      (sym) => !session.targetSet.has(sym.id)
    );
    expect(wrongIdx).toBeGreaterThanOrEqual(0);
    session.commit({
      type: "tap_symbol",
      data: {
        slotIndex: wrongIdx,
        symbolId: session.boardSymbols[wrongIdx]?.id ?? "",
      },
    });
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    const targetIdx = findTargetIndices(session)[0] ?? 0;
    expect(
      session.validateAction({
        type: "tap_symbol",
        data: { slotIndex: targetIdx, symbolId: "sym-target" },
      })
    ).toBe(ACTION_IGNORED);
    const ctx = createCanvasCtx();
    session.render(ctx, rs, 0);
    session.render(ctx, rs, 400);
    session.destroy();

    const declareRun = createSession(BASE_CONTENT, {
      finish_mode: "declare",
      allow_retry: false,
    });
    declareRun.session.commit({ type: "commit_declare", data: {} });
    expect(declareRun.session.isAcceptingInput()).toBe(false);
    expect(declareRun.session.checkWinCondition()).toBe(false);
    declareRun.session.destroy();
  });

  it("N6 order sweep, N7 replay position change, and resolveSlots progress preservation", () => {
    const { session, rs } = createSession(BASE_CONTENT, {}, "4-5");
    const initialSlots = session.slots.map((s) => `${s.x},${s.y}`);
    const targets = findTargetIndices(session);
    const reversed = [...targets].reverse();
    const first = reversed[0];
    if (first !== undefined) {
      session.commit({
        type: "tap_symbol",
        data: { slotIndex: first, symbolId: "sym-target" },
      });
    }
    session.resolveSlots("4-5");
    expect(session.foundTargets.size).toBe(1);
    expect(session.order.length).toBe(1);

    for (const idx of findTargetIndices(session)) {
      if (!session.foundTargets.has(idx)) {
        session.commit({
          type: "tap_symbol",
          data: { slotIndex: idx, symbolId: "sym-target" },
        });
      }
    }
    expect(session.checkWinCondition()).toBe(true);
    const ctx = createCanvasCtx();
    session.update(120);
    session.render(ctx, rs, 120);

    const space = deriveLogicSpace(1024, 640);
    session.prepareRound(
      "4-5",
      space,
      session.stageRect ?? undefined,
      undefined,
      1
    );
    const replaySlots = session.slots.map((s) => `${s.x},${s.y}`);
    expect(replaySlots).not.toEqual(initialSlots);
    expect(session.targetCopies).toBe(BASE_CONTENT.target_copies);
    session.destroy();
  });

  it("Spec §5 branch 5: excludes broken target assets and never draws EMJ- raw codes", () => {
    const brokenContent: GT037Content = {
      prompt: "Con tìm hết ngôi sao nhé",
      symbols: [
        { id: "t-ok", label: "sao", asset: { kind: "emoji", ref: "⭐" } },
        {
          id: "t-broken",
          label: "vỡ",
          asset: { kind: "emoji", ref: "EMJ-broken-xyz" },
        },
        { id: "d-1", label: "táo", asset: { kind: "emoji", ref: "🍎" } },
        { id: "d-2", label: "cam", asset: { kind: "emoji", ref: "🍊" } },
      ],
      target_ids: ["t-ok", "t-broken"],
      target_copies: 4,
      item_count: 14,
      confusable_ids: [],
    };
    const { session, rs } = createSession(brokenContent);
    expect(session.effectiveTargetCopies).toBeLessThan(session.targetCopies);

    const ctx = createCanvasCtx();
    const texts: string[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
      texts.push(t);
    });
    session.render(ctx, rs, 0);
    expect(texts.some((t) => t.includes("EMJ-"))).toBe(false);

    const validTargets = session.boardSymbols
      .map((s, idx) => (s.id === "t-ok" ? idx : -1))
      .filter((idx) => idx >= 0);
    for (const idx of validTargets) {
      session.commit({
        type: "tap_symbol",
        data: { slotIndex: idx, symbolId: "t-ok" },
      });
    }
    expect(session.checkWinCondition()).toBe(true);
    session.destroy();
  });

  it("BR-ERC-02 render purity, zero fillRect outside jar, hover, and destroy()", () => {
    const { session, rs } = createSession();
    const ctx = createCanvasCtx();
    const fillRectCalls: number[] = [];
    vi.spyOn(ctx, "fillRect").mockImplementation((_x, _y, w) => {
      if (w < rs.LOGIC_WIDTH / 2) {
        fillRectCalls.push(w);
      }
    });

    const before = JSON.stringify({
      boardSymbols: session.boardSymbols.map((s) => s.id),
      found: [...session.foundTargets],
      wrongSlotIndex: session.wrongSlotIndex,
      isWon: session.checkWinCondition(),
      clock: peekGT037Clock(session),
    });
    session.render(ctx, rs, 50_000);
    const after = JSON.stringify({
      boardSymbols: session.boardSymbols.map((s) => s.id),
      found: [...session.foundTargets],
      wrongSlotIndex: session.wrongSlotIndex,
      isWon: session.checkWinCondition(),
      clock: peekGT037Clock(session),
    });
    expect(after).toBe(before);
    expect(fillRectCalls).toEqual([]);

    const firstSlot = session.slots[0];
    expect(firstSlot).toBeDefined();
    if (firstSlot) {
      session.setPointerOver(firstSlot.x, firstSlot.y);
      expect(session.getView().entities[0]?.state).toBe("active");
      expect(session.getView().entities[0]?.hitW).toBeGreaterThan(0);
    }
    session.clearPointerOver();
    expect(session.getView().entities[0]?.state).toBe("idle");

    session.destroy();
    expect(peekGT037Clock(session)).toBeUndefined();
    expect(() => session.render(ctx, rs, 100)).not.toThrow();
  });

  it("GT037Generator satisfies schema, target ratio [0.15, 0.35], and orientation rules", () => {
    const bands: readonly AgeBand[] = ["4-5", "5-6"];
    const whats = ["number", "geometry", "colour", "letter", "object"] as const;
    for (const band of bands) {
      for (const what of whats) {
        for (let step = 0; step <= 2; step++) {
          const generated = GT037Generator.generate({
            rng: createRng(step * 37 + what.length),
            age_band: band,
            what,
            theme: "nature",
            vocabulary: { theme: "nature", nouns: [] },
            escalation_step: step,
          });
          const content = GT037Template.content_contract.parse(
            generated.content_pack
          );
          GT037Template.difficulty_contract.parse(generated.difficulty_params);
          const ratio = content.target_copies / content.item_count;
          expect(ratio).toBeGreaterThanOrEqual(0.15);
          expect(ratio).toBeLessThanOrEqual(0.35);
          expect(generated.difficulty_params.hint_after_ms).toBe(
            band === "4-5" ? 8000 : 10_000
          );
          for (const sym of content.symbols) {
            if (
              sym.asset.kind === "text" &&
              DIGIT_OR_LETTER_REGEX.test(sym.asset.text.normalize("NFC").trim())
            ) {
              expect(sym.orientation_free).toBe(false);
            }
          }
        }
      }
    }
  });

  it("stays strictly inside stageRect across 6 render states on portrait and landscape", () => {
    const viewports = [
      { w: 330, h: 697 },
      { w: 1024, h: 640 },
    ] as const;
    for (const vp of viewports) {
      const space = deriveLogicSpace(vp.w, vp.h);
      const cssPerLogic = vp.w / space.w;
      const zones = computeStageZones({
        logicW: space.w,
        logicH: space.h,
        ageBand: "4-5",
        cssPerLogic,
        needsTray: false,
        needsCommit: false,
      });
      const session = new GT037Session(BASE_CONTENT, {}, 42);
      session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
      const rs = new RenderSystem();
      rs.logicSpace = space;

      expect(
        findDrawsOutsideStage(zones.stage, (c) => session.render(c, rs, 100))
      ).toEqual([]);

      const firstSlot = session.slots[0];
      if (firstSlot) {
        session.setPointerOver(firstSlot.x, firstSlot.y);
      }
      expect(
        findDrawsOutsideStage(zones.stage, (c) => session.render(c, rs, 150))
      ).toEqual([]);
      session.clearPointerOver();

      for (const level of [1, 2, 3] as const) {
        session.onScaffoldEscalated(level);
        expect(
          findDrawsOutsideStage(zones.stage, (c) => session.render(c, rs, 200))
        ).toEqual([]);
      }

      const wrongIdx = session.boardSymbols.findIndex(
        (s) => s?.id !== "sym-target"
      );
      if (wrongIdx >= 0) {
        const sym = session.boardSymbols[wrongIdx];
        if (sym) {
          session.commit({
            type: "tap_symbol",
            data: { slotIndex: wrongIdx, symbolId: sym.id },
          });
          session.update(50);
          expect(
            findDrawsOutsideStage(zones.stage, (c) =>
              session.render(c, rs, 250)
            )
          ).toEqual([]);
        }
      }

      for (const idx of findTargetIndices(session)) {
        session.commit({
          type: "tap_symbol",
          data: { slotIndex: idx, symbolId: "sym-target" },
        });
      }
      expect(session.checkWinCondition()).toBe(true);
      session.update(120);
      expect(
        findDrawsOutsideStage(zones.stage, (c) => session.render(c, rs, 400))
      ).toEqual([]);
      session.update(300);
      expect(
        findDrawsOutsideStage(zones.stage, (c) => session.render(c, rs, 700))
      ).toEqual([]);
      session.destroy();
    }
  });
});
