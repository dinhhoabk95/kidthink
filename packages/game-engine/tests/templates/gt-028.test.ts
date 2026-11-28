import { describe, expect, it, vi } from "vitest";
import { GT028Generator } from "#src/generators/gt028";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { dockRectAroundSlots, splitCaption } from "#src/layout/slot-fit";
import { computeStageZones, type StageZones } from "#src/layout/stage-zones";
import { computeGT028TotalBadgeBox } from "#src/render/gt-028-shapes";
import {
  FROG_HOP_MS,
  frogHopPose,
  frogLineLayout,
} from "#src/render/number-line";
import { canvasFontPx } from "#src/render/type-scale";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028_WRONG_SUBMIT_MS } from "#src/templates/GT-028/layout";
import { GT028Session } from "#src/templates/GT-028/session";
import {
  type GT028Content,
  GT028ContentSchema,
  type GT028Difficulty,
} from "#src/templates/GT-028/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function get2DContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Cannot get 2D context from fake canvas");
  }
  return ctx;
}

describe("GT-028 — chạm đếm tích luỹ trên bề mặt web (BR-E028, BR-PNR-02, BR-PSZ-01)", () => {
  const fixture = GT028_FIXTURES[0];
  const fixtureStep5 = GT028_FIXTURES[1];
  if (!(fixture && fixtureStep5)) {
    throw new Error("Fixture GT-028 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(
    customContent: GT028Content = content,
    customDiff: GT028Difficulty = difficulty,
    seed = 1
  ): {
    session: GT028Session;
    zones: StageZones;
  } {
    const session = new GT028Session(customContent, customDiff, seed);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: true,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return { session, zones };
  }

  it("cập nhật spokenLabel là số đếm tích luỹ tiếng Việt và khớp hitW/hitH + role 'target' (BR-PNR-02, BR-E028-11)", () => {
    const { session } = buildStageSession();

    const view0 = session.getView();
    expect(view0.entities[0]?.spokenLabel).toBe("Số hai");
    for (let i = 0; i < view0.entities.length; i++) {
      const entity = view0.entities[i];
      const slot = session.slots[i];
      if (!(entity && slot)) {
        throw new Error(`Missing entity/slot at ${i}`);
      }
      expect(entity.role).toBe("target");
      expect(entity.hitShape).toBe("circle");
      expect(entity.w).toBe(slot.hitW);
      expect(entity.h).toBe(slot.hitH);
      const hitRadius = Math.min(slot.hitW, slot.hitH) / 2;
      const edgeX = entity.x + hitRadius + TAP_TOLERANCE_PX - 1;
      expect(findHitEntity([entity], edgeX, entity.y)?.id).toBe(entity.id);
    }

    session.dispatch({
      type: "tap",
      x: view0.entities[0]?.x ?? 0,
      y: view0.entities[0]?.y ?? 0,
      timeMs: 10,
    });

    const view1 = session.getView();
    expect(view1.entities[0]?.spokenLabel).toBe("Số hai");
    expect(view1.entities[1]?.spokenLabel).toBe("Số bốn");

    session.dispatch({
      type: "tap",
      x: view1.entities[1]?.x ?? 0,
      y: view1.entities[1]?.y ?? 0,
      timeMs: 20,
    });

    const view2 = session.getView();
    expect(view2.entities[2]?.spokenLabel).toBe("Số sáu");
  });

  it("mọi lệnh vẽ nằm trọn trong zones.stage ở cả trạng thái mở màn, nộp sai, gợi ý và khi thắng (BR-PSZ-01)", () => {
    const { session, zones } = buildStageSession();
    const rs = new RenderSystem();
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 0))
    ).toEqual([]);

    const firstId = content.items[0]?.item_id ?? "apple_1";
    session.onTapItem(firstId);
    session.onScaffoldEscalated(1, "timer");
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 120))
    ).toEqual([]);

    session.onScaffoldEscalated(2, "timer");
    const l2Texts: string[] = [];
    const l2TextCoords: Array<{ text: string; x: number; y: number }> = [];
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => {
        vi.spyOn(ctx, "fillText").mockImplementation(
          (t: string, x: number, y: number) => {
            l2Texts.push(t);
            l2TextCoords.push({ text: t, x, y });
          }
        );
        session.render(ctx, rs, 180);
      })
    ).toEqual([]);
    const seqCall = l2TextCoords.find((c) => c.text.includes("?"));
    expect(seqCall).toBeDefined();
    if (seqCall) {
      const body = splitCaption(zones.stage).body;
      const dock = dockRectAroundSlots(session.slots, body) ?? undefined;
      const fPx = canvasFontPx(rs.logicSpace, "badge", rs.viewport?.scale);
      const bb = computeGT028TotalBadgeBox(
        zones.stage,
        dock,
        Math.max(52, Math.round(fPx * 2.2)),
        Math.max(36, Math.round(fPx * 1.45))
      );
      const outsideBb =
        seqCall.x < bb.x ||
        seqCall.x > bb.x + bb.w ||
        seqCall.y < bb.y ||
        seqCall.y > bb.y + bb.h;
      expect(outsideBb).toBe(true);
    }
    expect(l2Texts).not.toContain(String(content.target_total));
    expect(lettersOnly(l2Texts)).toEqual([]);

    session.onSubmitCount();
    session.onScaffoldEscalated(3, "timer");
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 240))
    ).toEqual([]);

    const stepsNeeded = content.target_total / content.step;
    for (let i = 1; i < stepsNeeded; i++) {
      const id = content.items[i]?.item_id;
      if (id) {
        session.onTapItem(id);
      }
    }
    session.onSubmitCount();
    expect(session.checkWinCondition()).toBe(true);
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs, 400))
    ).toEqual([]);
  });

  it("render() thuần 100% không đổi trạng thái own-property trên session (BR-ERC-02)", () => {
    const { session } = buildStageSession();
    session.onTapItem(content.items[0]?.item_id ?? "apple_1");
    session.onSubmitCount();

    const snap = (): string =>
      JSON.stringify({
        isWon: session.checkWinCondition(),
        selected: [...session.selectedItemIds],
        count: session.getCurrentCount(),
        events: session.getTelemetry().events.length,
        mood: session.mascotMood(),
      });
    const before = snap();
    const ctx = get2DContext();
    const rs = new RenderSystem();
    session.render(ctx, rs, 100);
    session.render(ctx, rs, 350);
    expect(snap()).toBe(before);
  });

  it("ô số tích luỹ có hoạt ảnh đếm số trung gian và rút ngắn 120ms khi reducedMotion (N1, N4, §5 nhánh 6)", () => {
    const { session } = buildStageSession(
      fixtureStep5.content,
      fixtureStep5.difficulty
    );
    const textsAt = (timeMs: number, reduced = false): string[] => {
      const ctx = get2DContext();
      const rs = new RenderSystem();
      rs.reducedMotion = reduced;
      const out: string[] = [];
      vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
        out.push(t);
      });
      session.render(ctx, rs, timeMs);
      return out;
    };

    const openTexts = textsAt(0);
    expect(openTexts).toContain("0");
    expect(lettersOnly(openTexts)).toEqual([]);
    expect(openTexts).not.toContain(String(fixtureStep5.content.target_total));

    session.onTapItem(fixtureStep5.content.items[0]?.item_id ?? "star_1");
    const midTexts = textsAt(60, false);
    const hasMidValue = ["1", "2", "3", "4"].some((d) => midTexts.includes(d));
    expect(hasMidValue).toBe(true);

    const reducedDoneTexts = textsAt(120, true);
    expect(reducedDoneTexts).toContain("5");

    const normalDoneTexts = textsAt(250, false);
    expect(normalDoneTexts).toContain("5");
  });

  it("đồng hồ kép tiến triển qua update(deltaMs) ngay cả khi render(..., 0) và nộp sai ở timeMs=50_000", () => {
    const { session, zones } = buildStageSession();
    const firstId = content.items[0]?.item_id ?? "apple_1";
    session.onTapItem(firstId);
    session.update(FROG_HOP_MS);

    const ctx = get2DContext();
    const ellipses: number[][] = [];
    vi.spyOn(ctx, "ellipse").mockImplementation((x: number, y: number) => {
      ellipses.push([x, y]);
    });
    session.render(ctx, new RenderSystem(), 0);
    const cap = splitCaption(zones.stage).caption;
    const layout = frogLineLayout(cap, content.items.length);
    const endPose = frogHopPose(layout, 0, 1, FROG_HOP_MS, false);
    expect(ellipses.some(([x, y]) => x === endPose.x && y === endPose.y)).toBe(
      true
    );

    const { session: lateSession, zones: lateZones } = buildStageSession();
    lateSession.render(ctx, new RenderSystem(), 50_000);
    lateSession.onTapItem(firstId);
    expect(lateSession.onSubmitCount().valid).toBe(false);
    expect(
      findDrawsOutsideStage(lateZones.stage, (c) =>
        lateSession.render(c, new RenderSystem(), 50_100)
      )
    ).toEqual([]);
    lateSession.update(GT028_WRONG_SUBMIT_MS + 10);
    expect(
      findDrawsOutsideStage(lateZones.stage, (c) =>
        lateSession.render(c, new RenderSystem(), 50_100)
      )
    ).toEqual([]);
  });

  it("khoá input sau khi thắng: chạm tiếp hoặc nộp lại trả ACTION_IGNORED và không bắn thêm sự kiện", () => {
    const { session } = buildStageSession();
    const stepsNeeded = content.target_total / content.step;
    for (let i = 0; i < stepsNeeded; i++) {
      const id = content.items[i]?.item_id;
      if (id) {
        session.onTapItem(id);
      }
    }
    expect(session.onSubmitCount().valid).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);

    const countBefore = session.getCurrentCount();
    const eventsBefore = session.getTelemetry().events.length;
    const extraId = content.items[stepsNeeded]?.item_id ?? "apple_5";
    expect(session.onTapItem(extraId).valid).toBe(false);
    expect(session.onSubmitCount().valid).toBe(false);
    expect(
      session.toAction({ type: "tap", x: 200, y: 200, timeMs: 500 })
    ).toBeNull();
    expect(session.getCurrentCount()).toBe(countBefore);
    expect(session.getTelemetry().events.length).toBe(eventsBefore);
  });

  it("thang gợi ý L1 -> L2 -> L3 + getHintDemoSequence(3) cho cả 3 trạng thái: thiếu, vừa đủ, và đếm lố (#301)", () => {
    const { session } = buildStageSession();
    const l1Short = session.getHintTargetForLevel(1);
    const l2Short = session.getHintTargetForLevel(2);
    const l3Short = session.getHintTargetForLevel(3);
    expect(l1Short?.kind).toBe("region");
    expect(l2Short?.kind).toBe("region");
    if (l1Short?.kind === "region" && l2Short?.kind === "region") {
      expect(l1Short.ids.length).toBe(content.items.length);
      expect(l2Short.ids.length).toBe(content.target_total / content.step);
    }
    expect(l3Short?.kind).toBe("slot");
    const demoShort = session.getHintDemoSequence(3);
    expect(demoShort?.length).toBe(content.target_total / content.step);

    const stepsNeeded = content.target_total / content.step;
    const viewOrder = session.getView().entities.map((e) => e.id);
    for (let i = 0; i < stepsNeeded; i++) {
      const id = viewOrder[i];
      if (id) {
        session.onTapItem(id);
      }
    }
    expect(session.getHintTargetForLevel(1)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(2)).toEqual({ kind: "action" });
    expect(session.getHintTargetForLevel(3)).toEqual({ kind: "action" });
    expect(session.getHintDemoSequence(3)).toBeNull();

    const extraId = viewOrder[stepsNeeded];
    if (extraId) {
      session.onTapItem(extraId);
    }
    const l1Over = session.getHintTargetForLevel(1);
    const l2Over = session.getHintTargetForLevel(2);
    const l3Over = session.getHintTargetForLevel(3);
    expect(l1Over?.kind).toBe("region");
    expect(l2Over).toEqual({ kind: "region", ids: [extraId] });
    expect(l3Over?.kind).toBe("slot");
    const demoOver = session.getHintDemoSequence(3);
    expect(demoOver).toHaveLength(1);
    if (l3Over?.kind === "slot") {
      expect(demoOver?.[0]?.from).toBe(l3Over.index);
    }
  });

  it("vòng chơi lại N7 đổi thứ tự bày vật và fallback asset hỏng không lộ mã EMJ-*", () => {
    const { session, zones } = buildStageSession();
    const order0 = session.getView().entities.map((e) => e.id);
    session.prepareRound(
      "4-5",
      deriveLogicSpace(964, 628),
      zones.stage,
      undefined,
      1
    );
    const order1 = session.getView().entities.map((e) => e.id);
    expect(order1).not.toEqual(order0);

    const brokenContent: GT028Content = {
      ...content,
      items: content.items.map((it, i) =>
        i === 0 ? { ...it, asset: { kind: "emoji", ref: "EMJ-BROKEN-99" } } : it
      ),
    };
    const { session: brokenSession } = buildStageSession(brokenContent);
    const drawn = collectRenderedText(brokenSession, { prepare: false });
    expect(drawn.some((t) => t.includes("EMJ"))).toBe(false);
  });

  it("GT028Generator sinh level hợp lệ theo escalation_step ở cả hai band 4-5 và 5-6", () => {
    const nouns = Array.from({ length: 8 }, (_, i) => ({
      emoji_ref: "🐸",
      label_vi: `con ếch ${i}`,
    }));
    const vocab: ThemeVocabulary = { theme: "animals", nouns };
    for (const band of ["4-5", "5-6"] as const) {
      for (let esc = 0; esc <= 4; esc++) {
        const res = GT028Generator.generate({
          rng: createRng(100 + esc),
          age_band: band,
          what: "number",
          theme: vocab.theme,
          vocabulary: vocab,
          escalation_step: esc,
        });
        const parsed = GT028ContentSchema.parse(res.content_pack);
        expect(parsed.items.length).toBeGreaterThan(
          parsed.target_total / parsed.step
        );
        expect(parsed.target_total).toBeLessThanOrEqual(
          band === "4-5" ? 30 : 60
        );
      }
    }
  });

  it("portrait 390×844: computeGT028TotalBadgeBox không đè tâm slot nào và nằm trọn trong zones.stage (BR-PSZ-01, BR-A11-08)", () => {
    const pSession = new GT028Session(content, difficulty, 1);
    const space = deriveLogicSpace(390, 844);
    const cssPerLogic = 390 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: true,
    });
    pSession.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    const body = splitCaption(zones.stage).body;
    const dock = dockRectAroundSlots(pSession.slots, body) ?? undefined;
    const fontPx = canvasFontPx(space, "badge", cssPerLogic);
    const bw = Math.max(52, Math.round(fontPx * 2.2));
    const bh = Math.max(36, Math.round(fontPx * 1.45));
    const badge = computeGT028TotalBadgeBox(zones.stage, dock, bw, bh);
    for (const s of pSession.slots) {
      const inside =
        s.x >= badge.x &&
        s.x <= badge.x + badge.w &&
        s.y >= badge.y &&
        s.y <= badge.y + badge.h;
      expect(inside).toBe(false);
    }
    const rs = new RenderSystem();
    expect(
      findDrawsOutsideStage(zones.stage, (ctx) => pSession.render(ctx, rs, 0))
    ).toEqual([]);
  });
});

describe("GT-028 — bước trung gian là thao tác nháp (BR-E028-14, BR-EIC-10)", () => {
  const f = GT028_FIXTURES[0];
  if (!f) {
    throw new Error("Fixture GT-028 not found");
  }
  const { content: fx, difficulty: fd } = f;

  function build(): GT028Session {
    const session = new GT028Session(fx, fd, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: true,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return session;
  }

  it("thêm, vượt đích rồi bớt đều trả feedback none, valid true", () => {
    const session = build();
    const ids = session.content.items.map((i) => i.item_id);
    for (const id of ids) {
      expect(session.onTapItem(id)).toEqual({ valid: true, feedback: "none" });
    }
    expect(session.onTapItem(ids[0] ?? "")).toEqual({
      valid: true,
      feedback: "none",
    });
  });

  it("ca âm: nộp sai vẫn RETRY", () => {
    const session = build();
    const first = session.content.items[0]?.item_id ?? "";
    session.onTapItem(first);
    const r = session.onSubmitCount();
    expect(r.valid).toBe(false);
    expect(r.feedback).toBe("amber_soft");
  });
});
