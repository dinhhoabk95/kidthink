import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it, vi } from "vitest";
import { GT025Generator } from "#src/generators/gt025";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures";
import { GT025Session } from "#src/templates/GT-025/session";
import {
  type GT025Content,
  GT025ContentSchema,
  type GT025Difficulty,
} from "#src/templates/GT-025/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText } from "#tests/helpers/rendered-text";

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

describe("GT-025 — tìm điểm khác nhau trên bề mặt web (BR-E025, BR-PNR-02)", () => {
  const fixture = GT025_FIXTURES[0];
  const fixture2 = GT025_FIXTURES[1];
  if (!(fixture && fixture2)) {
    throw new Error("Fixture GT-025 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(
    customContent: GT025Content = content,
    customDiff: GT025Difficulty = difficulty,
    seed = 1
  ): GT025Session {
    const session = new GT025Session(customContent, customDiff, seed);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return session;
  }

  it("getView().entities xuất role 'source' cho cả hai khung, khớp slot.hitW/hitH và hit-box rìa", () => {
    const session = buildStageSession();
    const view = session.getView();
    expect(view.entities.length).toBe(
      content.left_objects.length + content.right_objects.length
    );

    const ids = new Set<string>();
    for (let i = 0; i < view.entities.length; i++) {
      const entity = view.entities[i];
      const resolved = session.resolvedObjects[i];
      if (!(entity && resolved)) {
        throw new Error(`Missing entity/resolved at ${i}`);
      }
      expect(entity.role).toBe("source");
      expect(entity.hitShape).toBe("circle");
      expect(entity.w).toBe(resolved.slot.hitW);
      expect(entity.h).toBe(resolved.slot.hitH);
      expect(entity.spokenLabel).toBeDefined();
      expect(ids.has(entity.id)).toBe(false);
      ids.add(entity.id);

      const hitRadius = Math.min(resolved.slot.hitW, resolved.slot.hitH) / 2;
      const edgeX = entity.x + hitRadius + TAP_TOLERANCE_PX - 1;
      const hit = findHitEntity([entity], edgeX, entity.y);
      expect(hit?.id).toBe(entity.id);
      const act = session.toAction({
        type: "tap",
        x: edgeX,
        y: entity.y,
        timeMs: 0,
      });
      expect(act).not.toBeNull();
    }
  });

  it("chạm đúng tất cả điểm khác nhau trên cả hai bên hoàn thành vòng chơi", () => {
    const session = buildStageSession();
    const entities = session.getView().entities;

    for (const diff of content.differences) {
      const target = entities.find((e) => e.id === diff.right_id);
      if (!target) {
        throw new Error(`Missing target ${diff.right_id}`);
      }
      const verdict = session.dispatch({
        type: "tap",
        x: target.x,
        y: target.y,
        timeMs: 100,
      });
      expect(verdict?.valid).toBe(true);
    }

    expect(session.checkWinCondition()).toBe(true);
  });

  it("chạm ra ngoài đối tượng bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const session = buildStageSession();
    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual({ valid: false, feedback: "none" });
  });

  it("trùng id cùng phía & chéo phía + đồng hồ DualStamp không kẹt incorrect và giữ sweep frame đầu", () => {
    const crossContent: GT025Content = {
      prompt: "Tìm 1 điểm khác biệt",
      target_count: 1,
      left_objects: [
        { id: "cat", asset: { kind: "emoji", ref: "🐱" } },
        { id: "sun", asset: { kind: "emoji", ref: "☀️" } },
      ],
      right_objects: [
        { id: "dog", asset: { kind: "emoji", ref: "🐶" } },
        { id: "cat", asset: { kind: "emoji", ref: "☀️" } },
      ],
      differences: [{ id: "d1", left_id: "cat", right_id: "dog" }],
    };
    const session = buildStageSession(crossContent);
    const ctx = get2DContext();
    const rs = new RenderSystem();
    session.render(ctx, rs, 5000);

    const entities0 = session.getView().entities;
    const leftCat = entities0.find((e) => e.id === "left:cat");
    const rightCat = entities0.find((e) => e.id === "right:cat");
    if (!(leftCat && rightCat)) {
      throw new Error("Missing left:cat or right:cat");
    }

    const resWrongRightCat = session.dispatch({
      type: "tap",
      x: rightCat.x,
      y: rightCat.y,
      timeMs: 5050,
    });
    expect(resWrongRightCat?.valid).toBe(false);
    expect(
      session.getView().entities.find((e) => e.id === "left:cat")?.state
    ).toBe("idle");
    expect(
      session.getView().entities.find((e) => e.id === "right:cat")?.state
    ).toBe("incorrect");

    session.update(WRONG_FLASH_MS + 10);
    expect(
      session.getView().entities.find((e) => e.id === "right:cat")?.state
    ).toBe("idle");

    const sessionPreTap = buildStageSession(crossContent);
    const resCorrectLeftCat = sessionPreTap.onTapObject("cat", "left");
    expect(resCorrectLeftCat.valid).toBe(true);

    const sweeps: number[] = [];
    vi.spyOn(ctx, "arc").mockImplementation(
      (_x: number, _y: number, _r: number, start: number, end: number) => {
        if (start === -Math.PI / 2) {
          sweeps.push(end - start);
        }
      }
    );
    sessionPreTap.render(ctx, rs, 30_000);
    expect(sweeps.length).toBeGreaterThan(0);
    expect(sweeps[0]).toBeLessThan(Math.PI * 2);
  });

  it("allow_retry: false đóng lượt ngay khi chạm sai và không vẽ vòng drawFindRing cho điểm chưa tìm", () => {
    const session = buildStageSession(content, {
      ...difficulty,
      allow_retry: false,
    });
    expect(session.isAcceptingInput()).toBe(true);

    const resWrong = session.onTapObject("left-sun");
    expect(resWrong.valid).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    const resAfterClose = session.onTapObject("left-cat");
    expect(resAfterClose.valid).toBe(false);
    expect(session.getFoundCount()).toBe(0);

    const ctx = get2DContext();
    const findRingStarts: number[] = [];
    vi.spyOn(ctx, "arc").mockImplementation(
      (_x: number, _y: number, _r: number, start: number) => {
        if (start === -Math.PI / 2) {
          findRingStarts.push(start);
        }
      }
    );
    session.render(ctx, new RenderSystem(), 200);
    expect(findRingStarts).toEqual([]);
  });

  it("N7 chơi lại (prepareRound lần 2): hoán vị không điểm bất động và giữ đồng bộ cặp trái-phải", () => {
    const session = buildStageSession(
      fixture2.content,
      fixture2.difficulty,
      42
    );
    const round1Order = session.resolvedObjects
      .filter((o) => o.side === "left")
      .map((o) => `${o.id}@${Math.round(o.x)},${Math.round(o.y)}`);

    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);

    const left2 = session.resolvedObjects.filter((o) => o.side === "left");
    const right2 = session.resolvedObjects.filter((o) => o.side === "right");
    const round2Order = left2.map(
      (o) => `${o.id}@${Math.round(o.x)},${Math.round(o.y)}`
    );
    expect(round2Order).not.toEqual(round1Order);

    for (let i = 0; i < left2.length; i++) {
      expect(left2[i]?.layoutOrderIndex).toBe(right2[i]?.layoutOrderIndex);
      expect(left2[i]?.y).toBeCloseTo(right2[i]?.y ?? 0, 1);
    }

    for (const diff of fixture2.content.differences) {
      const movedObj = left2.find((o) => o.id === diff.left_id);
      if (!movedObj) {
        throw new Error(`Missing moved object ${diff.left_id}`);
      }
      const verdict = session.dispatch({
        type: "tap",
        x: movedObj.x,
        y: movedObj.y,
        timeMs: 120,
      });
      expect(verdict?.valid).toBe(true);
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("asset hỏng (Spec §5 nhánh 5): dùng placeholder đồng bộ ở cả 2 khung và loại khỏi target_count hiệu lực", () => {
    const brokenContent: GT025Content = {
      prompt: "Tìm điểm khác biệt",
      target_count: 2,
      left_objects: [
        { id: "l-ok", asset: { kind: "emoji", ref: "🐱" } },
        { id: "l-broken", asset: { kind: "emoji", ref: "EMJ-broken-code" } },
        { id: "l-same", asset: { kind: "emoji", ref: "🌳" } },
      ],
      right_objects: [
        { id: "r-ok", asset: { kind: "emoji", ref: "🐶" } },
        { id: "r-broken", asset: { kind: "emoji", ref: "🌻" } },
        { id: "r-same", asset: { kind: "emoji", ref: "🌳" } },
      ],
      differences: [
        { id: "d-ok", left_id: "l-ok", right_id: "r-ok" },
        { id: "d-broken", left_id: "l-broken", right_id: "r-broken" },
      ],
    };

    const session = buildStageSession(brokenContent, {
      ...difficulty,
      item_count: 3,
    });
    const renderedTexts = collectRenderedText(session, { prepare: false });
    expect(renderedTexts.some((t) => t.includes("EMJ-"))).toBe(false);

    const entities = session.getView().entities;
    expect(entities.find((e) => e.id === "l-broken")?.spokenLabel).toBe(
      "Ô hình"
    );
    expect(entities.find((e) => e.id === "r-broken")?.spokenLabel).toBe(
      "Ô hình"
    );

    const resBroken = session.onTapObject("l-broken");
    expect(resBroken.valid).toBe(false);

    const resValid = session.onTapObject("l-ok");
    expect(resValid.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("thang gợi ý L1 -> L2 -> L3 thu hẹp vùng dần và trả chuỗi getHintDemoSequence(3)", () => {
    const session = buildStageSession(fixture2.content, fixture2.difficulty);

    const h1 = session.getHintTargetForLevel(1);
    expect(h1?.kind).toBe("region");
    if (h1?.kind === "region") {
      expect(h1.ids.length).toBeGreaterThanOrEqual(4);
      expect(h1.ids).toContain("l-flower-2");
      expect(h1.ids).toContain("r-flower-2");
    }

    const h2 = session.getHintTargetForLevel(2);
    expect(h2).toEqual({
      kind: "region",
      ids: ["l-flower-2", "r-flower-2"],
    });

    const h3 = session.getHintTargetForLevel(3);
    expect(h3?.kind).toBe("slot");
    const demo = session.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect(demo?.length).toBe(2);
    if (h3?.kind === "slot" && demo?.[0]) {
      expect(demo[0].from).toBe(h3.index);
      expect(demo[0].to).toBe(h3.index);
    }

    const ctx = get2DContext();
    const rs = new RenderSystem();
    for (const lvl of [1, 2, 3] as const) {
      session.onScaffoldEscalated(lvl, "timer");
      session.render(ctx, rs, 300);
    }
    session.onHintCleared();
    session.render(ctx, rs, 400);
  });

  it("pointer hover và render() thuần 100% (BR-ERC-02), tôn trọng reducedMotion và degradation", () => {
    const session = buildStageSession(fixture2.content, fixture2.difficulty);
    const firstObj = session.resolvedObjects[0];
    if (!firstObj) {
      throw new Error("Missing resolved object");
    }
    session.setPointerOver({ x: firstObj.x, y: firstObj.y });
    expect(session.getView().entities[0]?.state).toBe("active");

    const ctx = get2DContext();
    const rs = new RenderSystem();
    const snapBefore = JSON.stringify({
      found: session.getFoundCount(),
      won: session.checkWinCondition(),
      view: session.getView(),
    });
    session.render(ctx, rs, 250);
    const snapAfter = JSON.stringify({
      found: session.getFoundCount(),
      won: session.checkWinCondition(),
      view: session.getView(),
    });
    expect(snapAfter).toBe(snapBefore);

    session.clearPointerOver();
    expect(session.getView().entities[0]?.state).toBe("idle");
    rs.reducedMotion = true;
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    session.onTapObject("l-flower-2");
    session.render(ctx, rs, 350);
    expect(session.getFoundCount()).toBe(1);
  });

  it("GT025Generator sinh đề hợp lệ theo age_band và escalation_step", () => {
    const schoolTheme = CONTENT_THEMES.find((t) => t.code === "school");
    if (!schoolTheme) {
      throw new Error("Missing school theme");
    }
    const vocab: ThemeVocabulary = {
      theme: schoolTheme.code,
      label_vi: schoolTheme.label_vi,
      icon_emoji_ref: schoolTheme.icon_emoji_ref,
      nouns: schoolTheme.nouns.map((n) => ({
        emoji_ref: n.emoji_ref,
        label_vi: n.text_vi,
      })),
    };

    for (const band of ["4-5", "5-6"] as const) {
      for (const step of [0, 1, 2, 3]) {
        const generated = GT025Generator.generate({
          rng: createRng(100 + step * 17),
          age_band: band,
          theme: "school",
          vocabulary: vocab,
          escalation_step: step,
        });
        const parsed = GT025ContentSchema.safeParse(generated.content_pack);
        expect(parsed.success).toBe(true);
        expect(generated.content_pack.target_count).toBeLessThan(
          generated.content_pack.left_objects.length
        );
        expect(generated.content_pack.differences.length).toBe(
          generated.content_pack.target_count
        );
      }
    }
  });
});
