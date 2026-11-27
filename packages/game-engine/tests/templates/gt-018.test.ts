import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_QUIET_OK,
  ACTION_RETRY,
} from "#src/game-session";
import { GT018Generator } from "#src/generators/gt018";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures";
import {
  GT018_HOP_MS,
  GT018_STORY_LINE,
  GT018_WONDER_MS,
  GT018Session,
} from "#src/templates/GT-018/session";
import {
  type GT018Content,
  GT018ContentSchema,
  type GT018Difficulty,
} from "#src/templates/GT-018/template";
import { createFakeCanvas, type FakeContext } from "#tests/gates/fake-canvas";
import { solveWithWebGestures } from "#tests/gates/web-gesture-solver";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function get2DContext(
  w = 960,
  h = 540
): {
  ctx: CanvasRenderingContext2D;
  fake: FakeContext;
} {
  const fake = createFakeCanvas(w, h).getContext("2d");
  if (!(fake && isCanvas2D(fake))) {
    throw new Error("Không lấy được context 2D");
  }
  return { ctx: fake, fake };
}

function renderFrame(
  session: GT018Session,
  opts: { reducedMotion?: boolean; timeMs?: number } = {}
): FakeContext {
  const { ctx, fake } = get2DContext();
  const rs = new RenderSystem();
  rs.reducedMotion = opts.reducedMotion ?? false;
  session.render(ctx, rs, opts.timeMs ?? 0);
  return fake;
}

const SELECT_CONTENT: GT018Content = {
  prompt: "Bé hãy nghe và tìm con vật đúng nhé!",
  audio_prompt: { text: "Con mèo", strip_item_ids: ["cat"] },
  response_mode: "select",
  options: [
    { item_id: "cat", asset: { kind: "emoji", ref: "🐱" }, is_correct: true },
    { item_id: "dog", asset: { kind: "emoji", ref: "🐶" }, is_correct: false },
    { item_id: "pig", asset: { kind: "emoji", ref: "🐷" }, is_correct: false },
  ],
};

const SEQUENCE_CONTENT: GT018Content = {
  prompt: "Bé hãy nghe kỹ và xếp hình theo đúng thứ tự nhé!",
  audio_prompt: {
    text: "Con kiến, rồi con thỏ, rồi con voi",
    strip_item_ids: ["ant", "rabbit", "elephant"],
  },
  response_mode: "sequence",
  options: [
    {
      item_id: "rabbit",
      asset: { kind: "emoji", ref: "🐰" },
      is_correct: true,
    },
    { item_id: "ant", asset: { kind: "emoji", ref: "🐜" }, is_correct: true },
    {
      item_id: "elephant",
      asset: { kind: "emoji", ref: "🐘" },
      is_correct: true,
    },
    { item_id: "frog", asset: { kind: "emoji", ref: "🐸" }, is_correct: false },
  ],
  target_sequence: ["ant", "rabbit", "elephant"],
};

const BASE_DIFFICULTY: GT018Difficulty = {
  hint_after_ms: 8000,
  allow_retry: true,
  auto_play_audio: true,
};

describe("GT-018: Nghe rồi làm — kiểm thử toàn diện UI/UX & cơ chế", () => {
  it("giải thắng trọn vẹn cả 3 fixtures qua solveWithWebGestures", async () => {
    for (const [index, fixture] of GT018_FIXTURES.entries()) {
      const outcome = await solveWithWebGestures("GT-018", fixture, index);
      expect(outcome).toBe("won");
    }
  });

  it("sequence mode: drop & 2-step tap staging đồng bộ getView, vẽ và thắng với distractor", () => {
    const session = new GT018Session(SEQUENCE_CONTENT, BASE_DIFFICULTY, 0);
    session.prepareRound("5-6");
    expect(session.needsCommit).toBe(true);
    expect(session.storyLine()).toBe(GT018_STORY_LINE);

    const view0 = session.getView();
    const optEntities0 = view0.entities.filter((e) => e.id !== "gramophone");
    expect(optEntities0.map((e) => e.id)).toEqual([
      "rabbit",
      "ant",
      "elephant",
      "frog",
    ]);
    expect(optEntities0.map((e) => e.label)).toEqual(["1", "2", "3", "4"]);

    const slot0 = session.slots[0];
    const slot1 = session.slots[1];
    if (!(slot0 && slot1)) {
      throw new Error("Thiếu slot");
    }

    // Bước 1 của 2-step tap: chạm slot 0 -> state "selected"
    const actTapA = session.toAction({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 10,
    });
    expect(actTapA).toBeNull();
    expect(session.getView().entities[0]?.state).toBe("selected");
    renderFrame(session);

    // Chạm lại chính slot 0 -> huỷ chọn về "idle"
    const actUnstage = session.toAction({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 20,
    });
    expect(actUnstage).toBeNull();
    expect(session.getView().entities[0]?.state).toBe("idle");

    // Chạm slot 1 rồi chạm slot 0 -> tạo action reorder_step { from_index: 1, to_index: 0 }
    expect(
      session.toAction({ type: "tap", x: slot1.x, y: slot1.y, timeMs: 30 })
    ).toBeNull();
    const actSwap = session.toAction({
      type: "tap",
      x: slot0.x,
      y: slot0.y,
      timeMs: 40,
    });
    expect(actSwap).toEqual({
      type: "reorder_step",
      data: { from_index: 1, to_index: 0 },
    });
    if (actSwap) {
      // Một bước sắp xếp chưa phải câu trả lời — không chấm (BR-EIC-10).
      expect(session.validateAction(actSwap)).toEqual(ACTION_QUIET_OK);
      session.commit(actSwap);
    }
    expect(session.mascotMood()).toBe("happy");
    session.update(GT018_HOP_MS + 10);
    expect(session.mascotMood()).toBeNull();

    // Kiểm tra thứ tự mới trong getView(): ["ant", "rabbit", "elephant", "frog"]
    const view1 = session.getView();
    const optEntities1 = view1.entities.filter((e) => e.id !== "gramophone");
    expect(optEntities1.map((e) => e.id)).toEqual([
      "ant",
      "rabbit",
      "elephant",
      "frog",
    ]);
    expect(optEntities1.map((e) => e.label)).toEqual(["1", "2", "3", "4"]);

    // Kéo thả (drop) từ slot 0 sang slot 1 rồi kéo lại
    const actDrop = session.toAction({
      type: "drop",
      fromX: slot0.x,
      fromY: slot0.y,
      toX: slot1.x,
      toY: slot1.y,
      timeMs: 50,
    });
    expect(actDrop).toEqual({
      type: "reorder_step",
      data: { from_index: 0, to_index: 1 },
    });
    if (actDrop) {
      session.commit(actDrop);
    }

    // Nộp khi chuỗi đang sai ["rabbit", "ant", "elephant", "frog"]:
    // Chỉ "rabbit" và "ant" bị sai vị trí ("incorrect"), còn "elephant" ở vị trí 2 đã đúng ("idle")
    const wrongSubmit = session.onSubmitSequence();
    expect(wrongSubmit).toEqual(ACTION_RETRY);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.getRenderItemState("rabbit")).toBe("wrong");
    const wrongView = session.getView();
    expect(wrongView.entities[0]?.state).toBe("incorrect");
    expect(wrongView.entities[1]?.state).toBe("incorrect");
    expect(wrongView.entities[2]?.state).toBe("idle");
    expect(wrongView.entities[3]?.state).toBe("idle");
    renderFrame(session);

    // Sau khi hết wrongFlash (600ms), các thẻ tự về "idle"
    session.update(650);
    expect(session.getView().entities[0]?.state).toBe("idle");

    // Đổi lại vị trí 0 và 1 để khớp prefix ["ant", "rabbit", "elephant"] (dù có distractor "frog" ở cuối)
    session.onReorderStep(1, 0);
    const commitAct = session.toAction({ type: "commit", timeMs: 800 });
    expect(commitAct).toEqual({ type: "submit_order", data: null });
    if (commitAct) {
      expect(session.validateAction(commitAct)).toEqual(ACTION_CORRECT);
      session.commit(commitAct);
    }
    expect(session.checkWinCondition()).toBe(true);
    expect(session.takeSfxCues()).toEqual(["rabbit_hop"]);
    expect(session.getView().entities[0]?.state).toBe("correct");
  });

  it("select mode: chạm sai 1 -> sai 2 xoá sai 1, chạm lại cùng thẻ sai kích hoạt lại flash, allow_retry: false đóng vòng", () => {
    const session = new GT018Session(SELECT_CONTENT, BASE_DIFFICULTY, 0);
    session.prepareRound("4-5");
    expect(session.needsCommit).toBe(false);

    // Chạm sai "dog"
    expect(session.onItemSelect("dog")).toEqual(ACTION_RETRY);
    expect(session.getRenderItemState("dog")).toBe("wrong");
    expect(session.mascotMood()).toBe("wonder");

    // Chạm sai "pig" ngay lập tức -> "dog" về "idle", "pig" thành "wrong"
    expect(session.onItemSelect("pig")).toEqual(ACTION_RETRY);
    expect(session.getRenderItemState("dog")).toBe("idle");
    expect(session.getRenderItemState("pig")).toBe("wrong");

    // Đợi hết flash rồi chạm lại chính "pig" -> kích hoạt lại wrong
    session.update(GT018_WONDER_MS + 100);
    expect(session.getRenderItemState("pig")).toBe("idle");
    expect(session.onItemSelect("pig")).toEqual(ACTION_RETRY);
    expect(session.getRenderItemState("pig")).toBe("wrong");

    // allow_retry: false ở cả select và sequence đóng vòng ngay sau 1 lần sai
    const strictSelect = new GT018Session(
      SELECT_CONTENT,
      { ...BASE_DIFFICULTY, allow_retry: false },
      0
    );
    strictSelect.prepareRound("4-5");
    expect(strictSelect.onItemSelect("dog")).toEqual(ACTION_RETRY);
    expect(strictSelect.checkWinCondition()).toBe(false);
    expect(
      strictSelect
        .getTelemetry()
        .events.some((e) => e.event_name === "game_completed")
    ).toBe(true);
    expect(strictSelect.onItemSelect("cat")).toEqual(ACTION_IGNORED);
    renderFrame(strictSelect);

    const strictSeq = new GT018Session(
      SEQUENCE_CONTENT,
      { ...BASE_DIFFICULTY, allow_retry: false },
      0
    );
    strictSeq.prepareRound("5-6");
    expect(strictSeq.onSubmitSequence()).toEqual(ACTION_RETRY);
    expect(strictSeq.checkWinCondition()).toBe(false);
    expect(
      strictSeq
        .getTelemetry()
        .events.some((e) => e.event_name === "game_completed")
    ).toBe(true);
    expect(strictSeq.onSubmitSequence()).toEqual(ACTION_IGNORED);
    renderFrame(strictSeq);
  });

  it("gramophone replay: chạm máy hát kích hoạt sóng âm, tăng replayCount, truyền spokenAudioPath, không xếp đúp pendingInvitation khi tap gesture", () => {
    const audioPromptWithPath = {
      text: "Con mèo",
      audio_path: "/audio/prompts/cat.mp3",
    };
    const contentWithPath: GT018Content = {
      ...SELECT_CONTENT,
      audio_prompt: audioPromptWithPath,
    };
    const session = new GT018Session(
      contentWithPath,
      { ...BASE_DIFFICULTY, auto_play_audio: false },
      0
    );
    session.prepareRound("4-5");
    expect(session.getOpeningAudioText()).toBeNull();
    expect(session.getReplayCount()).toBe(0);

    const gramEntity0 = session
      .getView()
      .entities.find((e) => e.id === "gramophone");
    expect(gramEntity0).toBeDefined();
    expect(gramEntity0?.state).toBe("idle");
    expect(gramEntity0?.spokenLabel).toBe("Con mèo");
    expect(gramEntity0?.spokenAudioPath).toBe("/audio/prompts/cat.mp3");

    if (!gramEntity0) {
      throw new Error("Thiếu gramophone entity");
    }

    const tapGram = session.toAction({
      type: "tap",
      x: gramEntity0.x,
      y: gramEntity0.y,
      timeMs: 50,
    });
    expect(tapGram).toBeNull();
    expect(session.getReplayCount()).toBe(1);
    expect(session.takeSpokenInvitation()).toBeNull();

    session.replayAudio();
    expect(session.getReplayCount()).toBe(2);
    expect(session.takeSpokenInvitation()).toBe("Con mèo");
    expect(session.takeSpokenInvitation()).toBeNull();

    const gramEntity1 = session
      .getView()
      .entities.find((e) => e.id === "gramophone");
    expect(gramEntity1?.state).toBe("active");
    renderFrame(session);
  });

  it("thang gợi ý L1/L2/L3 thuần khiết ở getHintTargetForLevel và kích hoạt đúng qua onScaffoldEscalated", () => {
    const selSession = new GT018Session(
      SELECT_CONTENT,
      { ...BASE_DIFFICULTY, auto_play_audio: false },
      0
    );
    selSession.prepareRound("4-5");

    // getHintTargetForLevel thuần khiết: gọi L1/L2/L3 không tự ý xếp spokenInvitation
    expect(selSession.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["gramophone"],
    });
    expect(selSession.takeSpokenInvitation()).toBeNull();
    expect(selSession.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["cat", "dog"],
    });
    expect(selSession.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: 0,
    });
    expect(selSession.getHintDemoSequence(3)).toBeNull();

    // Khi leo thang L1 qua onScaffoldEscalated(1) -> phát lại lời đọc
    selSession.onScaffoldEscalated(1);
    expect(selSession.takeSpokenInvitation()).toBe("Con mèo");
    selSession.onHintCleared();

    // Sequence mode: kiểm tra L1, L2, L3 và getHintDemoSequence(3) >= 2 bước
    const seqContent3Steps: GT018Content = {
      ...SEQUENCE_CONTENT,
      options: [
        {
          item_id: "elephant",
          asset: { kind: "emoji", ref: "🐘" },
          is_correct: true,
        },
        {
          item_id: "rabbit",
          asset: { kind: "emoji", ref: "🐰" },
          is_correct: true,
        },
        {
          item_id: "ant",
          asset: { kind: "emoji", ref: "🐜" },
          is_correct: true,
        },
      ],
      target_sequence: ["ant", "rabbit", "elephant"],
    };
    const seqSession = new GT018Session(seqContent3Steps, BASE_DIFFICULTY, 0);
    seqSession.prepareRound("5-6");

    expect(seqSession.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["gramophone"],
    });
    expect(seqSession.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["ant", "elephant"],
    });
    expect(seqSession.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: 2,
      toIndex: 0,
    });

    const demo = seqSession.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect(demo?.length).toBeGreaterThanOrEqual(2);

    // L2 bật dải cue sáng từng bước theo thời gian logicMs
    seqSession.onScaffoldEscalated(2);
    renderFrame(seqSession);
    seqSession.update(700);
    renderFrame(seqSession);
  });

  it("layoutSeed === 0 giữ nguyên thứ tự gốc; layoutSeed !== 0 xáo trộn tất định và không trùng sẵn target_sequence", () => {
    const s0 = new GT018Session(SEQUENCE_CONTENT, BASE_DIFFICULTY, 0);
    s0.prepareRound("5-6");
    const ids0 = s0
      .getView()
      .entities.filter((e) => e.id !== "gramophone")
      .map((e) => e.id);
    expect(ids0).toEqual(["rabbit", "ant", "elephant", "frog"]);

    for (const seed of [1, 2, 7, 42, 99, 1234]) {
      const seeded = new GT018Session(SEQUENCE_CONTENT, BASE_DIFFICULTY, seed);
      seeded.prepareRound("5-6");
      const ids = seeded
        .getView()
        .entities.filter((e) => e.id !== "gramophone")
        .map((e) => e.id);
      expect(ids.slice(0, 3)).not.toEqual(["ant", "rabbit", "elephant"]);
    }

    // Chơi lại vòng 2 trên cùng session (layoutSeed !== 0) vẫn giữ bất biến lệch target_sequence và về L0
    const replaySession = new GT018Session(
      SEQUENCE_CONTENT,
      BASE_DIFFICULTY,
      7
    );
    replaySession.prepareRound("5-6");
    replaySession.onScaffoldEscalated(2);
    replaySession.prepareRound("5-6");
    const replayIds = replaySession
      .getView()
      .entities.filter((e) => e.id !== "gramophone")
      .map((e) => e.id);
    expect(replayIds.slice(0, 3)).not.toEqual(["ant", "rabbit", "elephant"]);
  });

  it("render() thuần 100%, hỗ trợ hover, reducedMotion, degradation, fallback khi asset rỗng và nằm gọn trong stageRect", () => {
    const stageRect = { x: 40, y: 90, w: 880, h: 360 };
    const contentWithEmptyRef: GT018Content = {
      ...SELECT_CONTENT,
      options: [
        { item_id: "cat", asset: { kind: "emoji", ref: "" }, is_correct: true },
        {
          item_id: "dog",
          asset: { kind: "emoji", ref: "🐶" },
          is_correct: false,
        },
      ],
    };
    const session = new GT018Session(contentWithEmptyRef, BASE_DIFFICULTY, 0);
    session.prepareRound("4-5", undefined, stageRect);

    // Hover vào thẻ 0 và vào gramophone
    const slot0 = session.slots[0];
    const gram = session.getView().entities.find((e) => e.id === "gramophone");
    if (!(slot0 && gram)) {
      throw new Error("Thiếu slot0 hoặc gramophone");
    }
    session.setPointerOver({ x: slot0.x, y: slot0.y });
    expect(session.getView().entities[0]?.state).toBe("active");
    session.setPointerOver(gram.x, gram.y);
    expect(
      session.getView().entities.find((e) => e.id === "gramophone")?.state
    ).toBe("active");
    session.clearPointerOver();
    expect(session.getView().entities[0]?.state).toBe("idle");

    // Kiểm tra tính thuần của render() và biên vẽ trong stageRect
    const eventsBefore = session.getTelemetry().events.length;
    const replayBefore = session.getReplayCount();
    const { ctx } = get2DContext(960, 540);
    const fillRectCalls: Array<{ x: number; y: number; w: number; h: number }> =
      [];
    vi.spyOn(ctx, "fillRect").mockImplementation((x, y, w, h) => {
      fillRectCalls.push({ x, y, w, h });
    });

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    session.render(ctx, rs, 250);

    expect(session.getTelemetry().events.length).toBe(eventsBefore);
    expect(session.getReplayCount()).toBe(replayBefore);
    expect(fillRectCalls.length).toBeGreaterThan(0);

    session.destroy();
  });

  it("GT018Generator sinh level hợp lệ cho cả hai chế độ select và sequence", () => {
    const theme = CONTENT_THEMES[0];
    if (!theme) {
      throw new Error("Thiếu theme");
    }
    const vocabulary: ThemeVocabulary = {
      theme: theme.code,
      label_vi: theme.label_vi,
      icon_emoji_ref: theme.icon_emoji_ref,
      nouns: theme.nouns.map((n) => ({
        emoji_ref: n.emoji_ref,
        label_vi: n.text_vi,
      })),
    };

    const selGen = GT018Generator.generate({
      rng: createRng(101),
      age_band: "4-5",
      what: "auditory",
      theme: theme.code,
      vocabulary,
      escalation_step: 0,
    });
    expect(GT018ContentSchema.safeParse(selGen.content_pack).success).toBe(
      true
    );
    expect(selGen.content_pack.response_mode).toBe("select");

    const seqGen = GT018Generator.generate({
      rng: createRng(202),
      age_band: "5-6",
      what: "sequence",
      theme: theme.code,
      vocabulary,
      escalation_step: 2,
    });
    expect(GT018ContentSchema.safeParse(seqGen.content_pack).success).toBe(
      true
    );
    expect(seqGen.content_pack.response_mode).toBe("sequence");
    expect(seqGen.content_pack.target_sequence?.length).toBe(3);
  });
});
