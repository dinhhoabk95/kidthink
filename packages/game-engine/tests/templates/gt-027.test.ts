import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it, vi } from "vitest";
import { GT027Generator } from "#src/generators/gt027";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import { GT027_FIXTURES } from "#src/templates/GT-027/fixtures";
import { GT027Session } from "#src/templates/GT-027/session";
import template, {
  type GT027Content,
  type GT027Difficulty,
} from "#src/templates/GT-027/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

function isCanvas2D(ctx: object | null): ctx is CanvasRenderingContext2D {
  return ctx !== null && "save" in ctx;
}

function getCanvas2DContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!isCanvas2D(ctx)) {
    throw new Error("Missing fake 2d context");
  }
  return ctx;
}

function snapshotSessionFields(session: GT027Session): string {
  const entries: [string, string][] = [];
  for (const key of Object.keys(session).sort()) {
    const val: object | string | number | boolean | null | undefined =
      Reflect.get(session, key);
    if (typeof val === "function") {
      continue;
    }
    if (val instanceof Map) {
      entries.push([key, JSON.stringify(Array.from(val.entries()))]);
    } else if (val instanceof Set) {
      entries.push([key, JSON.stringify(Array.from(val.values()))]);
    } else {
      entries.push([key, JSON.stringify(val)]);
    }
  }
  return JSON.stringify(entries);
}

describe("GT-027 — đổi luật phân loại trên bề mặt web (BR-E027, BR-PNR-02)", () => {
  const fixture = GT027_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-027 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(
    customContent: GT027Content = content,
    customDifficulty: GT027Difficulty = difficulty,
    layoutSeed = 1
  ): GT027Session {
    const session = new GT027Session(
      customContent,
      customDifficulty,
      layoutSeed
    );
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "5-6",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
    return session;
  }

  it("getView().entities có spokenLabel tiếng Việt, hitShape square, hitW/hitH và khớp vùng chạm findHitEntity", () => {
    const session = buildStageSession();
    const view = session.getView();
    expect(view.entities).toHaveLength(content.items.length);

    for (let i = 0; i < view.entities.length; i++) {
      const entity = view.entities[i];
      const slot = session.slots[i];
      if (!(entity && slot)) {
        throw new Error("Missing entity or slot");
      }
      expect(entity.spokenLabel).toBeDefined();
      expect(entity.role).toBe("source");
      expect(entity.hitShape).toBe("square");
      expect(entity.hitW).toBe(slot.hitW);
      expect(entity.hitH).toBe(slot.hitH);
      expect(findHitEntity(view.entities, entity.x, entity.y)?.id).toBe(
        entity.id
      );
    }
  });

  it("getHintTargetIndex ưu tiên phần tử hợp lệ chưa được chọn", () => {
    const session = buildStageSession();
    const firstHint = session.getHintTargetIndex();
    expect(firstHint).not.toBeNull();
    const firstSlot = session.slots[firstHint ?? 0];
    if (!firstSlot) {
      throw new Error("Missing first hinted slot");
    }

    session.dispatch({
      type: "tap",
      x: firstSlot.x,
      y: firstSlot.y,
      timeMs: 10,
    });

    const secondHint = session.getHintTargetIndex();
    expect(secondHint).not.toBeNull();
    expect(secondHint).not.toBe(firstHint);
  });

  it("BR-ERC-02: render() hoàn toàn thuần, không mutate bất kỳ thuộc tính nào trên GT027Session", () => {
    const session = buildStageSession();
    const ctx = getCanvas2DContext();
    const rs = new RenderSystem();

    const snap0 = snapshotSessionFields(session);
    session.render(ctx, rs, 0);
    expect(snapshotSessionFields(session)).toBe(snap0);

    // Chạm sai -> kiểm tra tính thuần khi đang nháy sai
    session.onSelectItem("it-3");
    const snapWrong = snapshotSessionFields(session);
    session.render(ctx, rs, 100);
    session.render(ctx, rs, 250);
    expect(snapshotSessionFields(session)).toBe(snapWrong);

    // Đổi luật -> kiểm tra tính thuần khi đang lật thẻ đổi luật
    session.onSelectItem("it-1");
    session.onSelectItem("it-2");
    expect(session.isSignaling()).toBe(true);
    const snapSignal = snapshotSessionFields(session);
    session.render(ctx, rs, 1000);
    session.render(ctx, rs, 1130);
    session.render(ctx, rs, 1400);
    expect(snapshotSessionFields(session)).toBe(snapSignal);
  });

  it("Re-tap liên tiếp vào cùng thẻ sai luôn tái kích drawRetryRing & nhịp hổ phách trên Bảng Luật; Dual-Clock tự hết flash cả qua update lẫn render", () => {
    const session = buildStageSession();
    const ctx = getCanvas2DContext();
    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");

    // Chạm sai lần 1 vào it-3
    session.onSelectItem("it-3");
    expect(session.isBannerWrongFlashing()).toBe(true);
    expect(session.getView().entities.find((e) => e.id === "it-3")?.state).toBe(
      "incorrect"
    );

    session.update(WRONG_FLASH_MS - 50);
    // Chạm lại chính thẻ sai it-3 -> phải tái kích từ đầu
    session.onSelectItem("it-3");
    session.update(100);
    expect(session.isBannerWrongFlashing()).toBe(true);
    expect(session.getView().entities.find((e) => e.id === "it-3")?.state).toBe(
      "incorrect"
    );

    session.render(ctx, rs, 200);
    expect(retrySpy).toHaveBeenCalled();

    // Hết thời gian qua update(dt)
    session.update(WRONG_FLASH_MS);
    expect(session.isBannerWrongFlashing()).toBe(false);
    expect(session.getView().entities.find((e) => e.id === "it-3")?.state).toBe(
      "idle"
    );

    // Hết thời gian chỉ qua render(timeMs) mà không gọi update(dt)
    session.onSelectItem("it-3");
    session.render(ctx, rs, 1000);
    expect(session.getView().entities.find((e) => e.id === "it-3")?.state).toBe(
      "incorrect"
    );
    session.render(ctx, rs, 1000 + WRONG_FLASH_MS + 10);
    expect(session.getView().entities.find((e) => e.id === "it-3")?.state).toBe(
      "idle"
    );
  });

  it("allow_retry: false đóng cổng tương tác ngay khi chọn sai 1 lần và không thắng", () => {
    const strictSession = buildStageSession(content, {
      ...difficulty,
      allow_retry: false,
    });
    expect(strictSession.isAcceptingInput()).toBe(true);

    const resWrong = strictSession.onSelectItem("it-3");
    expect(resWrong.valid).toBe(false);
    expect(strictSession.isAcceptingInput()).toBe(false);
    expect(strictSession.checkWinCondition()).toBe(false);

    // Mọi thao tác sau đó bị từ chối
    const resAfterClose = strictSession.onSelectItem("it-1");
    expect(resAfterClose).toEqual({ valid: false, feedback: "none" });
    const slot0 = strictSession.slots[0];
    if (!slot0) {
      throw new Error("Missing slot0");
    }
    const tapAfterClose = strictSession.dispatch({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 100,
    });
    expect(tapAfterClose).toEqual({ valid: false, feedback: "none" });
  });

  it("Chống tap lặp vào thẻ đã correct qua dispatch khi trên bàn còn thẻ hợp lệ khác, nhưng onSelectItem trực tiếp vẫn tương thích ngược", () => {
    const session = buildStageSession();
    const slot0 = session.slots[0]; // it-1 (red circle)
    const slot1 = session.slots[1]; // it-2 (red square)
    if (!(slot0 && slot1)) {
      throw new Error("Missing slots");
    }

    // Tap lần 1 vào slot0 -> đúng
    const firstTap = session.dispatch({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 100,
    });
    expect(firstTap?.valid).toBe(true);
    expect(session.isSignaling()).toBe(false);

    // Tap lặp lần 2 vào chính slot0 khi slot1 vẫn chưa chọn -> bị bỏ qua trên canvas
    const repeatTap = session.dispatch({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 200,
    });
    expect(repeatTap).toEqual({ valid: false, feedback: "none" });
    expect(session.isSignaling()).toBe(false);

    // Nhưng gọi trực tiếp onSelectItem("it-1") (programmatic harness) vẫn hợp lệ và kích đổi luật
    const progRes = session.onSelectItem("it-1");
    expect(progRes.valid).toBe(true);
    expect(session.isSignaling()).toBe(true);
  });

  it("Fallback asset hỏng (EMJ-BROKEN_TEST) render khối hình học đủ màu + hình mà không ném lỗi", () => {
    const brokenContent: GT027Content = {
      ...content,
      items: content.items.map((it, idx) =>
        idx === 0
          ? {
              ...it,
              asset: { kind: "emoji", ref: "EMJ-BROKEN_TEST" },
              size: "large",
            }
          : { ...it, size: idx % 2 === 0 ? "small" : "medium" }
      ),
    };
    const session = buildStageSession(brokenContent);
    const ctx = getCanvas2DContext();
    const rs = new RenderSystem();
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };

    const shadowBlurs: number[] = [];
    const origFill = ctx.fill.bind(ctx);
    vi.spyOn(ctx, "fill").mockImplementation(function (
      this: CanvasRenderingContext2D
    ) {
      shadowBlurs.push(ctx.shadowBlur);
      origFill();
    });

    expect(() => session.render(ctx, rs, 100)).not.toThrow();
    expect(shadowBlurs).not.toContain(8);
    expect(shadowBlurs).not.toContain(6);
    rs.reducedMotion = true;
    rs.softShadowsEnabled = false;
    expect(() => session.render(ctx, rs, 200)).not.toThrow();
  });

  it("N7: vòng chơi lại với layoutSeed > 0 hoán vị thứ tự vật khác vòng 1, đặt lại về rules[0] và xoá gợi ý về L0", () => {
    const session = buildStageSession(content, difficulty, 42);
    const round1Order = session.getRoundItems().map((it) => it.id);
    expect(round1Order).toEqual(content.items.map((it) => it.id));

    // Kích gợi ý L2 và chuyển sang luật 2
    session.getHintTargetForLevel(2);
    session.onSelectItem("it-1");
    session.onSelectItem("it-2");
    session.update(difficulty.signal_duration_ms + 10);
    expect(session.getActiveRule()?.id).toBe("rule-star");

    // Chuẩn bị vòng chơi lại (round 2)
    session.setupEntities();
    const round2Order = session.getRoundItems().map((it) => it.id);
    expect(round2Order).not.toEqual(round1Order);
    expect([...round2Order].sort()).toEqual([...round1Order].sort());
    expect(session.getActiveRule()?.id).toBe("rule-red");
  });

  it("Thang gợi ý L1 -> L2 -> L3, getHintDemoSequence(3) và onHintCleared()", () => {
    const session = buildStageSession();

    const h1 = session.getHintTargetForLevel(1);
    expect(h1).toEqual({
      kind: "region",
      ids: ["rule-banner:rule-red"],
    });

    const h2 = session.getHintTargetForLevel(2);
    expect(h2).toEqual({
      kind: "region",
      ids: ["rule-attr:color:red", "it-1"],
    });

    const h3 = session.getHintTargetForLevel(3);
    expect(h3).toEqual({
      kind: "slot",
      index: 0,
    });

    const demoSeq = session.getHintDemoSequence(3);
    expect(demoSeq).toEqual([{ from: 0 }, { from: 1 }]);
    expect(session.getHintDemoSequence(1)).toBeNull();

    session.onHintCleared();

    // Khi đang phát tín hiệu đổi luật -> gợi ý và demo trả null
    session.onSelectItem("it-1");
    session.onSelectItem("it-2");
    expect(session.isSignaling()).toBe(true);
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("GT027Generator sinh level hợp lệ, đủ vật cho từng luật và cắt chéo thực sự qua nhiều seed & escalation_step", () => {
    const theme = CONTENT_THEMES[0];
    if (!theme) {
      throw new Error("Missing theme");
    }
    const vocab: ThemeVocabulary = {
      theme: theme.code,
      label_vi: theme.label_vi,
      icon_emoji_ref: theme.icon_emoji_ref,
      nouns: theme.nouns.map((n) => ({
        emoji_ref: n.emoji_ref,
        label_vi: n.text_vi,
      })),
    };

    for (let step = 0; step <= 6; step++) {
      for (const seed of [101, 202, 303]) {
        const generated = GT027Generator.generate({
          rng: createRng(seed + step * 17),
          age_band: "5-6",
          theme: vocab.theme,
          vocabulary: vocab,
          escalation_step: step,
        });

        const parsedContent = template.content_contract.safeParse(
          generated.content_pack
        );
        const parsedDiff = template.difficulty_contract.safeParse(
          generated.difficulty_params
        );
        expect(parsedContent.success).toBe(true);
        expect(parsedDiff.success).toBe(true);

        const pack = generated.content_pack;
        const matchesRule = (
          it: GT027Content["items"][number],
          r: GT027Content["rules"][number]
        ): boolean => {
          if (r.dimension === "color") {
            return it.color === r.target_value;
          }
          if (r.dimension === "shape") {
            return it.shape === r.target_value;
          }
          return it.size === r.target_value;
        };

        for (const r of pack.rules) {
          const matching = pack.items.filter((it) => matchesRule(it, r));
          expect(matching.length).toBeGreaterThanOrEqual(
            pack.switch_after_trials
          );
        }

        for (let k = 0; k < pack.rules.length - 1; k++) {
          const rk = pack.rules[k];
          const rNext = pack.rules[k + 1];
          if (rk && rNext) {
            const matchPrevOnly = pack.items.filter(
              (it) => matchesRule(it, rk) && !matchesRule(it, rNext)
            );
            const matchNextOnly = pack.items.filter(
              (it) => !matchesRule(it, rk) && matchesRule(it, rNext)
            );
            expect(matchPrevOnly.length).toBeGreaterThanOrEqual(1);
            expect(matchNextOnly.length).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }

    // Kiểm tra vocabulary tối thiểu 4 nouns vẫn sinh đủ 10 items ở step = 4 và step = 6
    const minimalVocab: ThemeVocabulary = {
      ...vocab,
      nouns: vocab.nouns.slice(0, 4),
    };
    for (const step of [4, 6]) {
      const genMin = GT027Generator.generate({
        rng: createRng(777 + step),
        age_band: "5-6",
        theme: minimalVocab.theme,
        vocabulary: minimalVocab,
        escalation_step: step,
      });
      expect(genMin.content_pack.items).toHaveLength(10);
    }
  });
});
