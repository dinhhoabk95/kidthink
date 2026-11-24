import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LOGIC_SPACE,
  deriveLogicSpace,
  type LogicSpace,
} from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawGT002ActionCornerPin,
  drawGT002CriterionHeader,
  drawGT002CriterionHintRegion,
  inferFallbackCriterionAnchor,
} from "#src/render/gt-002-criterion";
import { drawGT002BoardFrame } from "#src/render/gt-002-shapes";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import {
  computeGT002StageLayout,
  resolveGT002PlateShape,
  resolveGT002TokenPose,
  toHitShape,
} from "#src/templates/GT-002/layout";
import { GT002Session } from "#src/templates/GT-002/session";
import type {
  GT002Content,
  GT002CriterionAnchor,
} from "#src/templates/GT-002/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import {
  findDrawsOutsideStage,
  findSlotsOutsideStage,
} from "#tests/layout/stage-checks";

const RATIO_TEXT_RE = /\d+\/\d+/u;
const fixture = GT002_FIXTURES[0];
if (!fixture) {
  throw new Error("Fixture GT-002 not found");
}
const { content, difficulty } = fixture;
const correctIds = content.items
  .filter((item) => item.is_correct)
  .map((item) => item.item_id);
const distractorIds = content.items
  .filter((item) => !item.is_correct)
  .map((item) => item.item_id);

function buildSession(space?: LogicSpace): GT002Session {
  const session = new GT002Session(content, difficulty, 1);
  session.prepareRound("4-5", space);
  return session;
}

function tapItem(session: GT002Session, itemId: string): void {
  const index = session.displayItems.findIndex(
    (item) => item.item_id === itemId
  );
  const slot = session.slots[index];
  if (!slot) {
    throw new Error(`Thiếu slot của ${itemId}`);
  }
  session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 0 });
}

describe("GT-002 — thắng chỉ khi commit (BR-E002-02, Task #275 S1a)", () => {
  it("chọn đủ tập đúng mà chưa commit thì chưa thắng", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }
    expect(session.checkWinCondition()).toBe(false);
  });

  it("chọn đủ tập đúng rồi chạm lại một vật thì vật đó bỏ chọn được", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Fixture không có vật đúng");
    }
    tapItem(session, firstCorrect);
    expect(session.getItemState(firstCorrect)).toBe("idle");
  });

  it("commit với tập chọn đúng thì thắng", () => {
    const session = buildSession();
    for (const id of correctIds) {
      tapItem(session, id);
    }
    const verdict = session.dispatch({ type: "commit", timeMs: 0 });
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-002 — nút Xong ở zones.action (BR-PSZ-05, Task #283 B2)", () => {
  it("khai needsCommit, mờ khi chưa chọn, sáng khi đã chọn", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Fixture không có vật đúng");
    }
    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
    tapItem(session, firstCorrect);
    expect(session.canCommit()).toBe(true);
  });

  it("getView() không còn entity nút Xong — shell dựng nút hành động", () => {
    const session = buildSession();
    const ids = session.getView().entities.map((e) => e.id);
    expect(ids.every((id) => id !== "commit:done")).toBe(true);
  });

  it("commit với tập chọn sai thì nhắc thử lại, chưa thắng", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);
    const verdict = session.dispatch({ type: "commit", timeMs: 0 });
    expect(verdict).toEqual({ valid: false, feedback: "amber_soft" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("commit khi chưa chọn vật nào thì bị nuốt, không tính lần sai", () => {
    const session = buildSession();
    const verdict = session.dispatch({ type: "commit", timeMs: 0 });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
    expect(session.checkWinCondition()).toBe(false);
  });

  it("chọn đủ vật đúng thì gợi ý trỏ vào nút hành động, chưa đủ thì trỏ vật", () => {
    const session = buildSession();
    expect(session.getHintTarget()?.kind).toBe("slot");
    for (const id of correctIds) {
      tapItem(session, id);
    }
    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });
});

describe("GT-002 — commit sai giữ tập chọn, trạng thái một nguồn (G3, G5)", () => {
  it("commit sai thì giữ nguyên tập chọn và không entity nào ở trạng thái incorrect", () => {
    const session = buildSession();
    const [firstCorrect] = correctIds;
    const [firstDistractor] = distractorIds;
    if (!(firstCorrect && firstDistractor)) {
      throw new Error("Fixture thiếu vật đúng hoặc distractor");
    }
    tapItem(session, firstCorrect);
    tapItem(session, firstDistractor);
    session.dispatch({ type: "commit", timeMs: 0 });

    expect(session.getItemState(firstDistractor)).toBe("selected");
    expect(session.getItemState(firstCorrect)).toBe("selected");
    expect(
      session.getView().entities.some((e) => e.state === "incorrect")
    ).toBe(false);
  });

  it("chạm lại distractor sau khi commit sai: trở về idle và mechanic không còn chọn", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    if (!firstDistractor) {
      throw new Error("Fixture thiếu distractor");
    }
    tapItem(session, firstDistractor);
    session.dispatch({ type: "commit", timeMs: 0 });
    tapItem(session, firstDistractor);

    expect(session.getItemState(firstDistractor)).toBe("idle");
    const entity = session
      .getView()
      .entities.find((e) => e.id === firstDistractor);
    expect(entity?.state).toBe("idle");
  });
});

describe("GT-002 — vị trí vật xáo theo seed & preserve_order (BR-E002-07)", () => {
  it("cùng seed thì cùng thứ tự, khác seed thì vị trí vật đổi; preserve_order giữ nguyên trật tự gốc", () => {
    const s1 = new GT002Session(content, difficulty, 42);
    s1.prepareRound("4-5");
    const s2 = new GT002Session(content, difficulty, 42);
    s2.prepareRound("4-5");
    const s3 = new GT002Session(content, difficulty, 9999);
    s3.prepareRound("4-5");

    expect(s1.displayItems.map((i) => i.item_id)).toEqual(
      s2.displayItems.map((i) => i.item_id)
    );
    expect(s1.displayItems.map((i) => i.item_id)).not.toEqual(
      s3.displayItems.map((i) => i.item_id)
    );

    const ordered = new GT002Session(
      { ...content, preserve_order: true },
      difficulty,
      9999
    );
    ordered.prepareRound("4-5");
    expect(ordered.displayItems.map((i) => i.item_id)).toEqual(
      content.items.map((i) => i.item_id)
    );
  });

  it("getHintTargetIndex() trỏ đúng vật đúng sau khi xáo", () => {
    const s = new GT002Session(content, difficulty, 12_345);
    s.prepareRound("4-5");
    const hintIdx = s.getHintTargetIndex();
    expect(hintIdx).not.toBeNull();
    const item = hintIdx === null ? undefined : s.displayItems[hintIdx];
    expect(item?.is_correct).toBe(true);
  });

  it("20.000 seed: tỉ lệ vật đúng ở ô 0 lệch <= 1 điểm % so với target_count / item_count", () => {
    const targetCount = content.items.filter((i) => i.is_correct).length;
    const expectedRatio = targetCount / content.items.length;
    let correctAtZero = 0;
    const totalTrials = 20_000;
    for (let seed = 1; seed <= totalTrials; seed++) {
      const s = new GT002Session(content, difficulty, seed);
      s.prepareRound("4-5");
      if (s.displayItems[0]?.is_correct) {
        correctAtZero++;
      }
    }
    expect(
      Math.abs(correctAtZero / totalTrials - expectedRatio)
    ).toBeLessThanOrEqual(0.01);
  });
});

describe("GT-002 — đế đa hình thái & đồng bộ HitShape (BR-E002-07)", () => {
  it("resolveGT002PlateShape bật wood_tile cho representation, 3D/rectangle, text và secondary_asset", () => {
    expect(
      resolveGT002PlateShape({ asset: { kind: "emoji", ref: "🍎" } })
    ).toBe("round_plate");
    expect(
      resolveGT002PlateShape({
        asset: { kind: "text", text: "bò" },
      })
    ).toBe("wood_tile");
    expect(
      resolveGT002PlateShape({
        asset: { kind: "emoji", ref: "🍎" },
        representation: { kind: "ten-frame", count: 4 },
      })
    ).toBe("wood_tile");
    expect(
      resolveGT002PlateShape({
        asset: { kind: "emoji", ref: "🧊" },
        geometric_spec: { form: "cube", color_token: "sky" },
      })
    ).toBe("wood_tile");
    expect(
      resolveGT002PlateShape({
        asset: { kind: "emoji", ref: "🟧" },
        geometric_spec: { form: "rectangle", color_token: "amber" },
      })
    ).toBe("wood_tile");
    expect(toHitShape("round_plate")).toBe("circle");
    expect(toHitShape("wood_tile")).toBe("square");
  });

  it("round_plate từ chối góc Chebyshev ngoài vòng tròn, còn wood_tile nhận góc và đồng bộ findHitEntity", () => {
    const roundSession = buildSession();
    const slot0 = roundSession.slots[0];
    if (!slot0) {
      throw new Error("Thiếu slot");
    }
    const r = Math.min(slot0.hitW, slot0.w) / 2;
    const cornerX = slot0.x + r + 16;
    const cornerY = slot0.y + r + 16;
    expect(
      roundSession.toAction({ type: "tap", x: cornerX, y: cornerY, timeMs: 0 })
    ).toBeNull();

    const geomFixture = GT002_FIXTURES[2];
    if (!geomFixture) {
      throw new Error("Thiếu fixture hình học");
    }
    const tileSession = new GT002Session(
      geomFixture.content,
      geomFixture.difficulty,
      1
    );
    tileSession.prepareRound("5-6");
    const tileSlot0 = tileSession.slots[0];
    if (!tileSlot0) {
      throw new Error("Thiếu tile slot");
    }
    const tr = tileSlot0.hitW / 2;
    expect(
      tileSession.toAction({
        type: "tap",
        x: tileSlot0.x + tr + 16,
        y: tileSlot0.y + tr + 16,
        timeMs: 0,
      })
    ).not.toBeNull();

    for (const s of [roundSession, tileSession]) {
      const entities = s.getView().entities;
      for (let x = 0; x <= 960; x += 30) {
        for (let y = 0; y <= 540; y += 30) {
          const action = s.toAction({ type: "tap", x, y, timeMs: 0 });
          const hitEntity = findHitEntity(entities, x, y);
          const actionItemId =
            action &&
            typeof action.data === "object" &&
            action.data !== null &&
            "item_id" in action.data
              ? String(Reflect.get(action.data, "item_id"))
              : null;
          expect(actionItemId).toBe(hitEntity ? hitEntity.id : null);
        }
      }
    }
  });
});

interface RecordedDrawContext {
  readonly ctx: CanvasRenderingContext2D;
  readonly calls: string[];
  readonly maxShadowBlur: () => number;
}

function createRecordingContext(w = 960, h = 540): RecordedDrawContext {
  const fake = createFakeCanvas(w, h);
  const rawCtx = fake.getContext("2d");
  if (!rawCtx) {
    throw new Error("Fake canvas missing 2d context");
  }
  const calls: string[] = [];
  let maxBlur = 0;
  const trackBlur = (): void => {
    if (rawCtx.shadowBlur > maxBlur) {
      maxBlur = rawCtx.shadowBlur;
    }
  };

  vi.spyOn(rawCtx, "arc").mockImplementation((x, y, r, s, e) => {
    trackBlur();
    calls.push(
      `arc(${x.toFixed(2)},${y.toFixed(2)},${r.toFixed(2)},${s.toFixed(2)},${e.toFixed(2)})`
    );
  });
  vi.spyOn(rawCtx, "roundRect").mockImplementation((x, y, rw, rh) => {
    trackBlur();
    calls.push(
      `roundRect(${x.toFixed(2)},${y.toFixed(2)},${rw.toFixed(2)},${rh.toFixed(2)})`
    );
  });
  vi.spyOn(rawCtx, "fill").mockImplementation(() => {
    trackBlur();
    calls.push(`fill(${String(rawCtx.fillStyle)})`);
  });
  vi.spyOn(rawCtx, "stroke").mockImplementation(() => {
    trackBlur();
    calls.push(
      `stroke(${String(rawCtx.strokeStyle)},${rawCtx.lineWidth.toFixed(1)})`
    );
  });
  vi.spyOn(rawCtx, "fillText").mockImplementation((t, x, y) => {
    trackBlur();
    calls.push(`fillText(${t},${x.toFixed(2)},${y.toFixed(2)})`);
  });

  return {
    ctx: rawCtx as CanvasRenderingContext2D,
    calls,
    maxShadowBlur: () => maxBlur,
  };
}

describe("GT-002 — Bố cục 360x640 portrait, exact_count, preselected & Thang trợ giúp L1-L3", () => {
  it("8 vật trên portrait 360x640 (canvas 300x493) vừa khít 3x3, 0 tràn, đạt sàn chạm >= 76px CSS (4-5) và >= 64px CSS (5-6)", () => {
    const eightItems: GT002Content = {
      prompt: "Chọn hết quả đỏ",
      target_criterion: "Quả đỏ",
      items: Array.from({ length: 8 }, (_, idx) => ({
        item_id: `it_${idx}`,
        asset: { kind: "emoji" as const, ref: idx < 3 ? "🍎" : "🍐" },
        is_correct: idx < 3,
      })),
    };
    const space = deriveLogicSpace(300, 493);
    const cssPerLogic = 300 / space.w;

    for (const [band, floorCss] of [
      ["4-5", 76],
      ["5-6", 64],
    ] as const) {
      const zones = computeStageZones({
        logicW: space.w,
        logicH: space.h,
        ageBand: band,
        cssPerLogic,
        needsTray: false,
        needsCommit: true,
      });
      const s = new GT002Session(eightItems, {
        ...difficulty,
        item_count: 8,
        target_count: 3,
        distractor_count: 5,
      });
      s.prepareRound(band, space, zones.stage, undefined, cssPerLogic);
      expect(s.slots.every((sl) => sl.page === 0)).toBe(true);
      for (const sl of s.slots) {
        expect(sl.hitW * cssPerLogic).toBeGreaterThanOrEqual(floorCss - 0.01);
        expect(sl.hitH * cssPerLogic).toBeGreaterThanOrEqual(floorCss - 0.01);
      }
      expect(findSlotsOutsideStage(s.slots, zones.stage)).toEqual([]);
      const stageLayout = computeGT002StageLayout({
        itemCount: 8,
        ageBand: band,
        logicSpace: space,
        stageRect: zones.stage,
        cssPerLogic,
      });
      const rs = new RenderSystem();
      const anchor = inferFallbackCriterionAnchor(eightItems);
      expect(
        findDrawsOutsideStage(zones.stage, (ctx) => {
          drawGT002BoardFrame(ctx, rs, stageLayout.boardRect, "sedge_harvest");
          drawGT002CriterionHeader(ctx, rs, stageLayout, {
            anchor,
            allowNegated: band === "5-6",
            selectionMode: "all_matching",
            requiredSelectCount: 3,
            selectedChips: [],
            isWon: false,
            isWrongFlashing: false,
            hintLevel: 1,
          });
          drawGT002ActionCornerPin(
            ctx,
            rs,
            stageLayout.actionPinRect,
            anchor,
            band === "5-6"
          );
          drawGT002CriterionHintRegion(ctx, rs, stageLayout, 250);
        })
      ).toEqual([]);
    }

    const ultraWideLayout = computeGT002StageLayout({
      itemCount: 8,
      ageBand: "4-5",
      logicSpace: { w: 960, h: 320 },
      stageRect: { x: 16, y: 16, w: 800, h: 260 },
      cssPerLogic: 0.65,
    });
    expect(ultraWideLayout.headerPlacement).toBe("side");
    expect(ultraWideLayout.slots.every((sl) => sl.page === 0)).toBe(true);
  });

  it("exact_count + preselected_item_ids: kiểm giỏ nạp sẵn lựa chọn, thắng với bất kỳ N vật đúng và 0 nhiễu", () => {
    const exactFixture = GT002_FIXTURES[5];
    if (!exactFixture) {
      throw new Error("Thiếu fixture exact_count");
    }
    const s = new GT002Session(exactFixture.content, exactFixture.difficulty);
    s.prepareRound("5-6");

    expect(s.getItemState("apple_left")).toBe("selected");
    expect(s.getItemState("lemon_mid")).toBe("selected");
    expect(s.dispatch({ type: "commit", timeMs: 0 })?.valid).toBe(false);

    tapItem(s, "lemon_mid");
    tapItem(s, "strawberry_right");
    expect(s.getHintTarget()).toEqual({ kind: "action" });
    expect(s.dispatch({ type: "commit", timeMs: 10 })?.valid).toBe(true);
    expect(s.checkWinCondition()).toBe(true);
    expect(s.getItemState("apple_left")).toBe("correct");
    expect(s.getItemState("strawberry_right")).toBe("correct");
    expect(s.getItemState("cherry_mid")).toBe("idle");
  });

  it("BR-E002-08: thang trợ giúp L1 (region + tắt thở + isSoftDimmed), L2 (slot), L3 (demo sequence -> action)", () => {
    const s = buildSession(DEFAULT_LOGIC_SPACE);
    expect(s.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["gt002-criterion-header"],
    });
    expect(
      s.getView().entities.some((e) => e.id === "gt002-criterion-header")
    ).toBe(false);

    const breatheOn = resolveGT002TokenPose("idle", 0, false, {
      timeMs: 650,
      selectElapsedMs: 9999,
      winElapsedMs: 0,
      wrongProgress: 0,
      isActiveWrong: false,
      isHintActive: false,
    });
    const breatheMuted = resolveGT002TokenPose("idle", 0, false, {
      timeMs: 650,
      selectElapsedMs: 9999,
      winElapsedMs: 0,
      wrongProgress: 0,
      isActiveWrong: false,
      isHintActive: true,
    });
    expect(breatheOn.dy).not.toBe(0);
    expect(breatheMuted.dy).toBe(0);

    s.onScaffoldEscalated(1);
    const rs = new RenderSystem();
    const regionSpy = vi.spyOn(rs, "renderScaffoldingRegion");
    const recL1 = createRecordingContext();
    s.render(recL1.ctx, rs, 500);
    expect(regionSpy).toHaveBeenCalledTimes(1);

    s.onScaffoldEscalated(2);
    expect(s.getHintTargetForLevel(2)?.kind).toBe("slot");
    const seqL3 = s.getHintDemoSequence(3);
    expect(seqL3?.length).toBe(correctIds.length);
    expect(seqL3?.[0]?.from).toBe(s.getHintTargetIndex());

    for (const id of correctIds) {
      tapItem(s, id);
    }
    expect(s.getHintTargetForLevel(1)).toEqual({ kind: "action" });
    expect(s.getHintTargetForLevel(3)).toEqual({ kind: "action" });
    expect(s.getHintDemoSequence(3)).toBeNull();
    s.onHintCleared();
  });

  it("BR-E002-06: vẽ đủ 7 kind criterion_anchor + negated ở 5-6, fallback suy diễn và mẹt mở không lộ x/N", () => {
    const anchors: readonly GT002CriterionAnchor[] = [
      { kind: "color", color_token: "coral" },
      { kind: "shape", form: "pyramid", color_token: "indigo" },
      { kind: "size_compare", relation: "larger" },
      { kind: "quantity", count: 4 },
      {
        kind: "category",
        cue_asset: { kind: "emoji", ref: "🍎" },
        secondary_cue_asset: { kind: "emoji", ref: "🍓" },
      },
      {
        kind: "phonics",
        symbol_text: "b",
        cue_asset: { kind: "emoji", ref: "🐄" },
      },
      {
        kind: "conjunction",
        operator: "and",
        clauses: [
          { kind: "color", color_token: "coral" },
          { kind: "shape", form: "circle" },
        ],
        negated: true,
      },
    ];
    const rs = new RenderSystem();
    for (const anchor of anchors) {
      const s = new GT002Session(
        { ...content, criterion_anchor: anchor },
        difficulty
      );
      s.prepareRound("5-6", DEFAULT_LOGIC_SPACE);
      const rec = createRecordingContext();
      expect(() => s.render(rec.ctx, rs, 100)).not.toThrow();
      for (const call of rec.calls.filter((c) => c.startsWith("fillText("))) {
        expect(call).not.toMatch(RATIO_TEXT_RE);
      }
    }

    const inferred = inferFallbackCriterionAnchor({
      prompt: "Chọn tất cả quả màu vàng",
      target_criterion: "Màu vàng",
      items: content.items,
    });
    expect(inferred).toEqual({ kind: "color", color_token: "amber" });
  });
});

describe("GT-002 — Regression & UI/UX Contract (Retry, Telemetry, 7 Render Gates)", () => {
  it("Hint khi chọn thừa distractor: trỏ vào distractor để bỏ chọn, KHÔNG trỏ nút action", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    if (!firstDistractor) {
      throw new Error("Thiếu distractor");
    }
    for (const id of correctIds) {
      tapItem(session, id);
    }
    tapItem(session, firstDistractor);

    const distractorIdx = session.displayItems.findIndex(
      (i) => i.item_id === firstDistractor
    );
    expect(session.getHintTargetIndex()).toBe(distractorIdx);
    expect(session.getHintTarget()).toEqual({
      kind: "slot",
      index: distractorIdx,
    });

    tapItem(session, firstDistractor);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTarget()).toEqual({ kind: "action" });
  });

  it("allow_retry: false — nộp sai đóng vòng, khoá input và sau WRONG_FLASH_MS làm sáng các vật đúng", () => {
    const session = new GT002Session(
      content,
      { ...difficulty, allow_retry: false },
      1
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);
    const [firstDistractor] = distractorIds;
    if (!firstDistractor) {
      throw new Error("Thiếu item");
    }

    tapItem(session, firstDistractor);
    const submitVerdict = session.dispatch({ type: "commit", timeMs: 0 });
    expect(submitVerdict?.valid).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTarget()).toBeNull();
    expect(session.getRenderState(firstDistractor)).toBe("wrong");

    session.update(WRONG_FLASH_MS);
    expect(session.isWrongFlashing()).toBe(false);
    for (const id of correctIds) {
      expect(session.getItemState(id)).toBe("selected");
    }
    for (const id of distractorIds) {
      expect(session.getItemState(id)).toBe("idle");
    }
  });

  it("allow_retry: true — nộp sai lại làm mới nhịp nháy, chạm sửa dọn ngay nhịp nháy, chặn ID lạ và phát item_selected khi chọn", () => {
    const session = buildSession();
    const [firstDistractor] = distractorIds;
    const [firstCorrect] = correctIds;
    if (!(firstDistractor && firstCorrect)) {
      throw new Error("Thiếu item");
    }

    session.toggleItemSelection("unknown_ghost_id");
    expect(session.canCommit()).toBe(false);

    tapItem(session, firstDistractor);
    const selectedEvents1 = session
      .getTelemetry()
      .events.filter((e) => e.event_name === "item_selected");
    expect(selectedEvents1).toHaveLength(1);

    session.dispatch({ type: "commit", timeMs: 0 });
    expect(session.isWrongFlashing()).toBe(true);
    session.update(250);
    session.dispatch({ type: "commit", timeMs: 250 });
    session.update(WRONG_FLASH_MS - 1);
    expect(session.isWrongFlashing()).toBe(true);

    tapItem(session, firstCorrect);
    expect(session.isWrongFlashing()).toBe(false);
    expect(session.getRenderState(firstCorrect)).toBe("selected");
  });

  it("BR-ERC-02: render() thuần 100% — gọi 100 lần cùng timeMs giữ nguyên Object.entries(session), 0 telemetry mới và hạt chỉ bước ở update()", () => {
    const session = buildSession(DEFAULT_LOGIC_SPACE);
    for (const id of correctIds) {
      tapItem(session, id);
    }
    session.dispatch({ type: "commit", timeMs: 0 });
    expect(session.checkWinCondition()).toBe(true);

    const rs = new RenderSystem();
    const beforeEntries = Object.entries(session).map(([k, v]) => [
      k,
      structuredClone(v),
    ]);
    const telemetryCountBefore = session.getTelemetry().events.length;

    const first = createRecordingContext();
    session.render(first.ctx, rs, 100);
    expect(Object.entries(session)).toEqual(beforeEntries);

    let lastCalls: string[] = [];
    for (let i = 0; i < 100; i++) {
      const rec = createRecordingContext();
      session.render(rec.ctx, rs, 100);
      lastCalls = rec.calls;
    }
    expect(lastCalls).toEqual(first.calls);
    expect(Object.entries(session)).toEqual(beforeEntries);
    expect(session.getTelemetry().events).toHaveLength(telemetryCountBefore);

    session.update(800);
    const afterUpdate = createRecordingContext();
    session.render(afterUpdate.ctx, rs, 900);
    expect(afterUpdate.calls).not.toEqual(first.calls);
  });

  it("Spec §12: đủ 5 trạng thái thị giác (idle, touching, selected, wrong, correct), selected dùng brand thay vì màu đúng/sai", () => {
    const session = buildSession(DEFAULT_LOGIC_SPACE);
    const [firstCorrect] = correctIds;
    if (!firstCorrect) {
      throw new Error("Thiếu vật đúng");
    }
    const rs = new RenderSystem();
    rs.reducedMotion = true;

    const idleRec = createRecordingContext();
    session.render(idleRec.ctx, rs, 0);

    session.setTouchingItem(firstCorrect);
    expect(session.getItemState(firstCorrect)).toBe("touching");
    const touchingRec = createRecordingContext();
    session.render(touchingRec.ctx, rs, 0);
    expect(touchingRec.calls).not.toEqual(idleRec.calls);

    session.setTouchingItem(null);
    const backToIdleRec = createRecordingContext();
    session.render(backToIdleRec.ctx, rs, 0);
    expect(backToIdleRec.calls).toEqual(idleRec.calls);

    tapItem(session, firstCorrect);
    const selectedRec = createRecordingContext();
    session.render(selectedRec.ctx, rs, 0);
    expect(selectedRec.calls).not.toEqual(idleRec.calls);
    expect(selectedRec.calls).toContain(
      `fill(${designTokens.colors.brand[500]})`
    );
    expect(selectedRec.calls).not.toContain(
      `fill(${designTokens.colors.montessori.emeraldBright})`
    );
  });

  it("Spec §5 Nhánh 5 & 6: tôn trọng reducedMotion, softShadowsEnabled = false, particles_enabled = false và fallback drawPlaceholderBox khi asset hỏng", () => {
    const brokenContent = {
      ...content,
      items: content.items.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              asset: { kind: "emoji" as const, ref: "EMJ-BROKEN-999" },
            }
          : item
      ),
    };
    const session = new GT002Session(brokenContent, difficulty, 1);
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE);

    const rs = new RenderSystem();
    rs.softShadowsEnabled = false;
    rs.reducedMotion = true;
    const spyParticles = vi.spyOn(rs, "drawParticles");

    const rec100 = createRecordingContext();
    const rec800 = createRecordingContext();
    expect(() => session.render(rec100.ctx, rs, 100)).not.toThrow();
    session.render(rec800.ctx, rs, 800);
    expect(rec100.maxShadowBlur()).toBe(0);
    expect(rec100.calls).toEqual(rec800.calls);
    for (const call of rec100.calls.filter((c) => c.startsWith("fillText("))) {
      expect(call).not.toContain("EMJ-BROKEN-999");
    }

    for (const id of correctIds) {
      tapItem(session, id);
    }
    session.dispatch({ type: "commit", timeMs: 0 });
    const winRec = createRecordingContext();
    session.render(winRec.ctx, rs, 900);
    expect(spyParticles).not.toHaveBeenCalled();
  });
});
