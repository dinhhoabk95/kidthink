import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, getTouchFloor } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  BOOK_SPREAD_ASPECT_THRESHOLD,
  BOOK_TURN_DURATION_MS,
  computeResponsiveBookSpread,
} from "#src/render/storybook-frame";
import { RenderSystem } from "#src/systems/render-system";
import { resolveStepSceneBoard } from "#src/templates/GT-000/scene-board-schema";
import { GT000Session } from "#src/templates/GT-000/session";
import {
  type GT000Content,
  GT000ContentSchema,
  type GT000Difficulty,
  type GT000SceneBoard,
  GT000SceneBoardSchema,
} from "#src/templates/GT-000/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import {
  findDrawsOutsideStage,
  findHitPairViolations,
  findSlotsOutsideStage,
} from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

const BASE_DIFFICULTY: GT000Difficulty = {
  hint_after_ms: 12_000,
  allow_retry: true,
  auto_play_audio: true,
  speak_along: "off",
};

const BASE_ASSETS: GT000Content["assets"] = [
  {
    asset_id: "item_a",
    kind: "image",
    label: "Táo đỏ",
    value: 3,
    glyph: "3",
    image_ref: { kind: "emoji", ref: "🍎" },
    contrast_group: "fruits",
    syllables: ["táo", "đỏ"],
    representation: { kind: "ten-frame", count: 3, max: 10 },
  },
  {
    asset_id: "item_b",
    kind: "image",
    label: "Chuối vàng",
    value: 2,
    glyph: "2",
    image_ref: { kind: "emoji", ref: "🍌" },
    contrast_group: "fruits",
  },
  {
    asset_id: "item_c",
    kind: "image",
    label: "Cam ngọt",
    value: 4,
    glyph: "4",
    image_ref: { kind: "emoji", ref: "🍊" },
    contrast_group: "fruits",
  },
  {
    asset_id: "item_d",
    kind: "word",
    label: "Con cá",
    text: "CÁ",
    image_ref: { kind: "emoji", ref: "🐟" },
    contrast_group: "animals",
    syllables: ["con", "cá"],
  },
];

const ALL_NINE_BOARDS: readonly GT000SceneBoard[] = [
  { mode: "single_card" },
  {
    mode: "cpa_bridge",
    count: 3,
    rep_kind: "ten-frame",
    concrete_glyph: "🍎",
    interactive_count: true,
  },
  {
    mode: "part_whole",
    whole_count: 5,
    part_a_count: 3,
    part_b_count: 2,
    item_glyph: "🍎",
    operation: "split",
  },
  {
    mode: "spatial_stage",
    anchor_prop: "wood_table",
    relation: "on",
  },
  {
    mode: "sequence_strip",
    strip_asset_ids: ["item_a", "item_b", "item_a", "item_b"],
    focus_slot_index: 3,
    rhythm_labels: ["Đỏ", "Vàng", "Đỏ", "?"],
  },
  {
    mode: "sorting_baskets",
    baskets: [
      {
        basket_id: "b_red",
        label: "Nhóm táo",
        shape_badge: "circle",
        sample_asset_ids: ["item_a"],
      },
      {
        basket_id: "b_yellow",
        label: "Nhóm chuối",
        shape_badge: "triangle",
        sample_asset_ids: ["item_b"],
      },
    ],
  },
  {
    mode: "cause_effect",
    before_asset_id: "item_a",
    trigger_glyph: "🔪",
    after_asset_id: "item_b",
  },
  {
    mode: "word_phonics_box",
    meaning_asset_id: "item_d",
    parts: ["c", "á"],
    tone_mark: "sac",
  },
  {
    mode: "rule_memory_stage",
    variant: "rule_signal",
    rule_badge_glyph: "🟢",
    rule_label: "Thấy xanh thì chạm",
  },
];

const VIEWPORTS = [
  { name: "tablet 964x628", cssW: 964, cssH: 628, expectHorizontal: true },
  {
    name: "ngang thấp 610x350",
    cssW: 610,
    cssH: 350,
    // Band 3-4 có cột prompt bên trái + cột action bên phải nên stage giữa còn 579x508 (aspect 1.14 < 1.35) -> mở dọc trên-dưới để đủ sàn chạm 96px CSS.
    expectHorizontal: false,
  },
  { name: "dọc 330x697", cssW: 330, cssH: 697, expectHorizontal: false },
] as const;

const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];

function buildContentForBoard(board: GT000SceneBoard): GT000Content {
  return {
    concept: {
      skill_code: "C1.CNT.01",
      label: `Chủ đề ${board.mode}`,
      teaches: ["C1.CNT.01"],
      values: ["item_a", "item_b", "item_c", "item_d"],
      sequence_no: 1,
    },
    story_context: {
      theme_code: "farm",
      guide_character: "owl_teacher",
      hook_line: "Cô Cú mở trang sách mới cho bé nhé!",
      resolution_line: "Tuyệt vời, bé đã khám phá trọn cuốn sách!",
    },
    assets: BASE_ASSETS,
    segments: [
      {
        segment_id: "seg_review",
        asset_ids: ["item_a", "item_b", "item_c", "item_d"],
        is_review: true,
        scene_cue: "Mình cùng quan sát trang sách nhé!",
        steps: [
          {
            action: "present",
            target_asset_id: "item_a",
            narration_line: "Đây là ba quả táo đỏ.",
            interaction_hint: "tap_to_count",
            scene_board: board,
          },
          {
            action: "recognise",
            target_asset_id: "item_a",
            distractor_asset_ids: ["item_b", "item_c", "item_d"].slice(0, 3),
            prompt_line: "Đố bé chạm đúng táo đỏ!",
            scene_board: board,
          },
          {
            action: "recall",
            target_asset_id: "item_b",
            option_asset_ids: ["item_a", "item_b", "item_c", "item_d"],
            prompt_line: "Đâu là chuối vàng nhỉ?",
            scene_board: board,
          },
        ],
      },
    ],
    requires_reintro: false,
  };
}

function silenceAudio(session: GT000Session): void {
  vi.spyOn(session.audio, "speakPrompt").mockImplementation((_text, onEnd) => {
    onEnd?.();
    return true;
  });
  vi.spyOn(session.audio, "playPromptAudio").mockImplementation(
    (_ref, onEnd) => {
      onEnd?.();
    }
  );
  vi.spyOn(session.audio, "playMarimbaNote").mockImplementation(() => {
    /* noop */
  });
}

describe("GT-000 — Hợp đồng Schema 9 Modes scene_board & Tương thích ngược", () => {
  it.each(ALL_NINE_BOARDS)(
    "parse thành công chế độ scene_board '$mode' qua GT000ContentSchema",
    (board) => {
      const content = buildContentForBoard(board);
      const parsed = GT000ContentSchema.safeParse(content);
      expect(parsed.success).toBe(true);
    }
  );

  it("ca âm: từ chối mode lạ, sorting_baskets khác 2 rổ, sequence_strip < 3 phần tử và rơi êm về single_card ở runtime", () => {
    expect(
      GT000SceneBoardSchema.safeParse({ mode: "unknown_mode" }).success
    ).toBe(false);
    expect(
      GT000SceneBoardSchema.safeParse({
        mode: "sorting_baskets",
        baskets: [
          {
            basket_id: "only_one",
            label: "Một rổ",
            shape_badge: "circle",
            sample_asset_ids: ["item_a"],
          },
        ],
      }).success
    ).toBe(false);
    expect(
      GT000SceneBoardSchema.safeParse({
        mode: "sequence_strip",
        strip_asset_ids: ["item_a", "item_b"],
        focus_slot_index: 1,
      }).success
    ).toBe(false);

    // Dữ liệu thô hỏng lúc runtime không crash session, rơi êm về single_card
    const brokenStep = JSON.parse('{"scene_board":{"mode":"corrupted"}}') as {
      readonly scene_board?: GT000SceneBoard;
    };
    expect(resolveStepSceneBoard(brokenStep)).toEqual({ mode: "single_card" });
  });

  it("hỗ trợ thêm cpa_bridge rep_kind 'finger' / 'numeral' và rule_memory_stage 'peekaboo_cover' không ném lỗi BR-NRL-10", () => {
    const extraBoards: readonly GT000SceneBoard[] = [
      {
        mode: "cpa_bridge",
        count: 7,
        rep_kind: "finger",
        concrete_glyph: "🍎",
      },
      {
        mode: "cpa_bridge",
        count: 0,
        rep_kind: "numeral",
        concrete_glyph: "🍎",
      },
      { mode: "rule_memory_stage", variant: "peekaboo_cover" },
      {
        mode: "spatial_stage",
        anchor_prop: "balance_scale",
        relation: "heavier_than",
      },
      {
        mode: "spatial_stage",
        anchor_prop: "mirror_axis",
        relation: "mirror_x",
      },
    ];
    for (const board of extraBoards) {
      const session = new GT000Session(
        buildContentForBoard(board),
        BASE_DIFFICULTY
      );
      silenceAudio(session);
      session.prepareRound("3-4");
      const ctx = createFakeCanvas(960, 540).getContext("2d");
      if (!ctx) {
        throw new Error("Missing context");
      }
      const rs = new RenderSystem();
      expect(() =>
        session.render(ctx as CanvasRenderingContext2D, rs, 200)
      ).not.toThrow();
    }
  });
});

describe("GT-000 — Sách Giấy Dó Thích ứng 3 Tỉ lệ Màn hình × 9 Modes × 3 Band Tuổi", () => {
  it.each(VIEWPORTS)(
    "$name: sách xoay đúng chiều ngang/dọc theo tỉ lệ stageRect",
    ({ cssW, cssH, expectHorizontal }) => {
      const space = deriveLogicSpace(cssW, cssH);
      const cssPerLogic = Math.min(cssW / space.w, cssH / space.h);
      const zones = computeStageZones({
        logicW: space.w,
        logicH: space.h,
        ageBand: "3-4",
        cssPerLogic,
        needsTray: false,
        needsCommit: false,
      });
      const spread = computeResponsiveBookSpread(zones.stage);
      expect(spread.isHorizontalSpread).toBe(
        zones.stage.w >= zones.stage.h * BOOK_SPREAD_ASPECT_THRESHOLD
      );
      expect(spread.isHorizontalSpread).toBe(expectHorizontal);
    }
  );

  it("sân khấu ngang trực tiếp (w >= h * 1.35) mở sách 2 trang ngang Trái-Phải, sân khấu hẹp mở dọc Trên-Dưới", () => {
    expect(
      computeResponsiveBookSpread({ x: 160, y: 16, w: 720, h: 508 })
        .isHorizontalSpread
    ).toBe(true);
    expect(
      computeResponsiveBookSpread({ x: 16, y: 140, w: 508, h: 720 })
        .isHorizontalSpread
    ).toBe(false);
  });

  for (const vp of VIEWPORTS) {
    it(`9 modes trên ${vp.name} (band 3-4/4-5/5-6): 0 nét vẽ tràn stage, 0 chồng chạm, đạt cứng sàn chạm 96/76/64px`, () => {
      const space = deriveLogicSpace(vp.cssW, vp.cssH);
      const cssPerLogic = Math.min(vp.cssW / space.w, vp.cssH / space.h);

      for (const band of BANDS) {
        const floorPx = getTouchFloor(band);
        const zones = computeStageZones({
          logicW: space.w,
          logicH: space.h,
          ageBand: band,
          cssPerLogic,
          needsTray: false,
          needsCommit: false,
        });
        const rs = new RenderSystem();
        rs.logicSpace = space;

        for (const board of ALL_NINE_BOARDS) {
          const session = new GT000Session(
            buildContentForBoard(board),
            BASE_DIFFICULTY
          );
          silenceAudio(session);
          session.prepareRound(
            band,
            space,
            zones.stage,
            zones.tray ?? undefined,
            cssPerLogic
          );

          // Kiểm bước 0 (present) và bước 1 (recognise 4 lựa chọn) + bước 2 (recall có rèm)
          for (let stepIdx = 0; stepIdx < 3; stepIdx++) {
            expect(
              findSlotsOutsideStage(session.slots, zones.stage),
              `${vp.name} ${band} ${board.mode} step ${stepIdx}`
            ).toEqual([]);
            expect(
              findHitPairViolations(session.slots),
              `${vp.name} ${band} ${board.mode} step ${stepIdx}`
            ).toEqual([]);
            for (const slot of session.slots) {
              expect(
                Math.min(slot.hitW, slot.hitH) * cssPerLogic
              ).toBeGreaterThanOrEqual(floorPx - 0.01);
            }

            const outDraws = findDrawsOutsideStage(zones.stage, (ctx) => {
              session.render(ctx, rs, 250);
            });
            expect(
              outDraws,
              `${vp.name} ${band} ${board.mode} step ${stepIdx} draws`
            ).toEqual([]);

            if (stepIdx === 0) {
              session.dispatch({
                type: "commit",
                intent: "advance",
                timeMs: 10,
              });
            } else if (stepIdx === 1) {
              const target = session
                .getView()
                .entities.find((e) => e.id === "item_a");
              session.dispatch({
                type: "tap",
                x: target?.x ?? 0,
                y: target?.y ?? 0,
                timeMs: 20,
              });
            }
          }
        }
      }
    });
  }
});

describe("GT-000 — Chạm khám phá Ngũ cung ở present, Lật trang 340ms & Nối chuỗi Âm thanh", () => {
  it("chạm khám phá ở present tăng exploredCount, phát nốt ngũ cung xoay vòng 0..4, không tự qua bước và giữ render() thuần 100%", () => {
    const content = buildContentForBoard({
      mode: "cpa_bridge",
      count: 3,
      rep_kind: "ten-frame",
      concrete_glyph: "🍎",
      interactive_count: true,
    });
    const session = new GT000Session(content, BASE_DIFFICULTY);
    silenceAudio(session);
    // Giọng còn đang đọc: chạm là khám phá, chưa phải đi tiếp (`BR-E000-14`).
    vi.spyOn(session.audio, "speakPrompt").mockImplementation(() => true);
    const marimbaNotes: number[] = [];
    vi.spyOn(session.audio, "playMarimbaNote").mockImplementation((idx) => {
      marimbaNotes.push(idx);
    });

    session.prepareRound("3-4");
    const entity = session.getView().entities[0];
    if (!entity) {
      throw new Error("Missing present entity");
    }

    for (let k = 0; k < 6; k++) {
      session.dispatch({
        type: "tap",
        x: entity.x,
        y: entity.y,
        timeMs: k * 50,
      });
    }
    expect(session.currentStepIndex).toBe(0);
    expect(session.exploredCount).toBe(6);
    expect(marimbaNotes).toEqual([0, 1, 2, 3, 4, 0]);

    // Kiểm tính thuần render() sau khi có exploredCount & lastExploredAtMs
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Missing ctx");
    }
    const rs = new RenderSystem();
    const snapshotBefore = Object.entries(session);
    for (let i = 0; i < 20; i++) {
      session.render(ctx as CanvasRenderingContext2D, rs, 300);
    }
    expect(Object.entries(session)).toEqual(snapshotBefore);

    // Qua bước đặt lại exploredCount = 0 và bật pageTurnMs = 340ms
    session.dispatch({ type: "commit", intent: "advance", timeMs: 400 });
    expect(session.currentStepIndex).toBe(1);
    expect(session.exploredCount).toBe(0);
    expect(session.pageTurnMs).toBe(BOOK_TURN_DURATION_MS);
    session.update(BOOK_TURN_DURATION_MS);
    expect(session.pageTurnMs).toBe(0);
  });

  it("replayStepAudio() phát lại đúng câu dẫn ở mọi loại bước mà không khoá cử chỉ, không trừ lượt echo và không tăng miss", () => {
    const content: GT000Content = {
      ...buildContentForBoard({ mode: "single_card" }),
      segments: [
        {
          segment_id: "seg_replay",
          asset_ids: ["item_a", "item_b"],
          is_review: true,
          steps: [
            {
              action: "present",
              target_asset_id: "item_a",
              narration_line: "Cô giới thiệu ba quả táo đỏ.",
            },
            {
              action: "echo",
              target_asset_id: "item_a",
              repeat_count: 1,
              prompt_line: "Bé nói theo cô nhé: táo đỏ",
            },
            {
              action: "recognise",
              target_asset_id: "item_a",
              distractor_asset_ids: ["item_b"],
              prompt_line: "Bé chỉ vào táo đỏ giúp cô nhé!",
            },
            {
              action: "recall",
              target_asset_id: "item_a",
              option_asset_ids: ["item_a", "item_b"],
              prompt_line: "Quả gì màu đỏ vừa học nhỉ?",
            },
          ],
        },
      ],
    };
    const session = new GT000Session(content, {
      ...BASE_DIFFICULTY,
      speak_along: "tap",
    });
    const spoken: string[] = [];
    vi.spyOn(session.audio, "speakPrompt").mockImplementation((text, onEnd) => {
      spoken.push(typeof text === "string" ? text : text.join(" "));
      // Giả lập bất đồng bộ: không gọi onEnd ngay để chứng minh replayStepAudio không khoá cổng!
      setTimeout(() => onEnd?.(), 50);
      return true;
    });

    session.prepareRound("3-4");
    expect(spoken[0]).toContain("Cô Cú mở trang sách mới cho bé nhé!");
    expect(spoken[0]).toContain("Cô giới thiệu ba quả táo đỏ.");

    // Replay ở present: chỉ đọc narration_line bước đó, không lặp lại hook_line đầu bài
    spoken.length = 0;
    session.replayStepAudio();
    expect(spoken).toEqual(["Cô giới thiệu ba quả táo đỏ."]);
    expect(session.isAcceptingInput()).toBe(true);

    // Sang echo: replayStepAudio nhiều lần vẫn hoạt động, không tiêu tốn repeat_count = 1
    session.dispatch({ type: "commit", intent: "advance", timeMs: 10 });
    spoken.length = 0;
    session.replayStepAudio();
    session.replayStepAudio();
    expect(spoken).toHaveLength(2);
    expect(
      session.validateAction({ type: "tap_item", data: { intent: "replay" } })
        .valid
    ).toBe(true);

    // Sang recognise: hoàn tất câu hỏi đầu rồi bấm replayStepAudio -> không khoá isAcceptingInput
    vi.spyOn(session.audio, "speakPrompt").mockImplementation((text, onEnd) => {
      spoken.push(typeof text === "string" ? text : text.join(" "));
      onEnd?.();
      return true;
    });
    session.dispatch({ type: "commit", intent: "advance", timeMs: 20 });
    expect(session.isAcceptingInput()).toBe(true);

    // Chuyển lại sang mock bất đồng bộ (không gọi onEnd) rồi gọi replayStepAudio()
    vi.spyOn(session.audio, "speakPrompt").mockImplementation((text) => {
      spoken.push(typeof text === "string" ? text : text.join(" "));
      return true;
    });
    spoken.length = 0;
    session.replayStepAudio();
    expect(spoken).toEqual(["Bé chỉ vào táo đỏ giúp cô nhé!"]);
    expect(session.isAcceptingInput()).toBe(true);
    expect(session.missCounts.size).toBe(0);
  });

  it("nối mượt milestone_line cuối phân đoạn trước với scene_cue đầu phân đoạn kế", () => {
    const twoSegContent: GT000Content = {
      concept: {
        skill_code: "C1.CNT.01",
        label: "Chuyến tàu hoa quả",
        teaches: ["C1.CNT.01"],
        values: ["item_a", "item_b"],
        sequence_no: 1,
      },
      story_context: {
        theme_code: "farm",
        guide_character: "owl_teacher",
        hook_line: "Chào mừng bé tới vườn quả!",
      },
      assets: BASE_ASSETS.slice(0, 2),
      segments: [
        {
          segment_id: "seg_1",
          asset_ids: ["item_a", "item_b"],
          is_review: false,
          scene_cue: "Chương một bắt đầu.",
          milestone_line: "Bé qua chương một giỏi quá!",
          steps: [
            {
              action: "present",
              target_asset_id: "item_a",
              narration_line: "Đây là táo đỏ.",
            },
            {
              action: "recall",
              target_asset_id: "item_a",
              option_asset_ids: ["item_a", "item_b"],
            },
          ],
        },
        {
          segment_id: "seg_2",
          asset_ids: ["item_a", "item_b"],
          is_review: true,
          scene_cue: "Giờ mình sang chương ôn tập nhé!",
          steps: [
            {
              action: "present",
              target_asset_id: "item_b",
              narration_line: "Đây là chuối vàng.",
            },
            {
              action: "recall",
              target_asset_id: "item_b",
              option_asset_ids: ["item_a", "item_b"],
            },
          ],
        },
      ],
      requires_reintro: false,
    };

    const session = new GT000Session(twoSegContent, BASE_DIFFICULTY);
    const spoken: string[] = [];
    vi.spyOn(session.audio, "speakPrompt").mockImplementation((text, onEnd) => {
      spoken.push(typeof text === "string" ? text : text.join(" "));
      onEnd?.();
      return true;
    });

    session.prepareRound("3-4");
    expect(spoken[0]).toBe(
      "Chào mừng bé tới vườn quả! Chương một bắt đầu. Đây là táo đỏ."
    );

    // Qua bước present -> tới recall của seg_1
    session.dispatch({ type: "commit", intent: "advance", timeMs: 10 });
    const targetA = session.getView().entities.find((e) => e.id === "item_a");
    spoken.length = 0;
    session.dispatch({
      type: "tap",
      x: targetA?.x ?? 0,
      y: targetA?.y ?? 0,
      timeMs: 20,
    });

    // Bước đầu của seg_2 đọc nối milestone_line + scene_cue + narration_line
    expect(spoken[0]).toBe(
      "Bé qua chương một giỏi quá! Giờ mình sang chương ôn tập nhé! Đây là chuối vàng."
    );
  });
});
