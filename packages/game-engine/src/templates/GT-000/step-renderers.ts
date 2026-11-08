import {
  formatDisplayLabel,
  formatPromptLabel,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "#src/game-session";
import type { Gesture, ViewEntity } from "#src/interaction";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import {
  curtainGeometry,
  drawCurtains,
  drawFlashcard,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  type ItemVisualState,
  type RenderAsset,
  type RenderItem,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { RenderSystem } from "#src/systems/render-system";
import type {
  GT000Asset,
  GT000Content,
  GT000Segment,
  GT000Step,
  SpeakAlongMode,
} from "./template.js";

/**
 * Trần chờ câu hỏi của bước đọc xong — cùng mốc `NARRATION_SETTLE_TIMEOUT_MS`
 * của câu dẫn vòng ở bề mặt chơi (`BR-E000-12`, `BR-PNR-09`).
 */
export const STEP_PROMPT_SETTLE_TIMEOUT_MS = 12_000;

export function resolveRenderAsset(asset: GT000Asset): RenderAsset | null {
  if (!asset.image_ref) {
    return null;
  }
  if (asset.image_ref.kind === "emoji") {
    return { kind: "emoji", ref: asset.image_ref.ref };
  }
  if (asset.image_ref.kind === "text") {
    return { kind: "text", text: asset.image_ref.text };
  }
  return { kind: "image", path: asset.image_ref.path };
}

export function createRenderItem(
  asset: GT000Asset,
  state: ItemVisualState = "idle"
): RenderItem {
  return {
    id: asset.asset_id,
    label: formatDisplayLabel(asset.label, {
      value: asset.value,
      glyph: asset.glyph,
    }),
    text: asset.glyph ?? asset.text,
    asset: resolveRenderAsset(asset),
    state,
  };
}

export function getStepItemCount(step: GT000Step): number {
  if (step.action === "recognise") {
    return 1 + step.distractor_asset_ids.length;
  }
  if (step.action === "link") {
    return 2;
  }
  if (step.action === "recall") {
    return step.option_asset_ids.length;
  }
  return 1;
}

export function computeStepAssetIds(
  step: GT000Step,
  layoutSeed: number,
  stepIndex: number,
  shouldShuffle: boolean
): string[] {
  const stream = deriveStream(layoutSeed * 31 + stepIndex, "items");

  if (step.action === "recognise") {
    const items = [step.target_asset_id, ...step.distractor_asset_ids];
    return shouldShuffle ? shuffle(items, stream) : items;
  }
  if (step.action === "recall") {
    const items = [...step.option_asset_ids];
    return shouldShuffle ? shuffle(items, stream) : items;
  }
  if (step.action === "link") {
    const items = [step.target_asset_id, step.source_asset_id];
    return shouldShuffle ? shuffle(items, stream) : items;
  }
  return [];
}

export function getStepPromptText(
  step: GT000Step,
  asset: GT000Asset | undefined,
  speakAlong: SpeakAlongMode
): string {
  const label = asset
    ? formatPromptLabel(asset.label, {
        value: asset.value,
        glyph: asset.glyph,
      })
    : "";
  const spokenLabel = asset
    ? formatSpokenLabel(asset.label, {
        value: asset.value,
        glyph: asset.glyph,
      })
    : "";

  if (step.action === "present") {
    return step.narration_line ?? `Đây là ${label}`;
  }
  if (step.action === "echo") {
    if (speakAlong === "off") {
      return `Đây là ${label}`;
    }
    return step.prompt_line ?? `Bé nói theo cô nhé: ${spokenLabel}`;
  }
  if (step.action === "recognise") {
    return step.prompt_line ?? `Bé hãy chỉ cho cô ${label} nhé!`;
  }
  if (step.action === "recall") {
    return step.prompt_line ?? `Đâu là ${label}?`;
  }
  if (step.action === "link") {
    return step.prompt_line ?? "Nối đối tượng tương ứng";
  }
  return "Đây là gì?";
}

export function resolveItemState(
  state?: string
): "idle" | "selected" | "correct" | "incorrect" {
  if (state === "wrong") {
    return "incorrect";
  }
  if (state === "correct") {
    return "correct";
  }
  if (state === "selected") {
    return "selected";
  }
  return "idle";
}

export function toGT000ViewEntity(
  item: RenderItem,
  slot: Slot,
  slotIndex: number,
  isCard: boolean,
  asset: GT000Asset | undefined
): ViewEntity {
  const spokenLabel = asset
    ? formatSpokenLabel(asset.label, {
        value: asset.value,
        glyph: asset.glyph,
      })
    : item.label;
  const emojiRef =
    asset?.image_ref?.kind === "emoji" ? asset.image_ref.ref : undefined;
  return {
    id: item.id,
    slotIndex,
    role: "target",
    state: resolveItemState(item.state),
    x: slot.x,
    y: slot.y,
    w: isCard ? 350 : slot.w,
    h: isCard ? 320 : slot.h,
    hitShape: isCard ? "square" : "circle",
    label: item.label,
    spokenLabel,
    spokenAudioPath: asset?.audio_path,
    glyph: asset?.glyph ?? emojiRef,
  };
}

export function extractAssetId(data: GameAction["data"]): string {
  if (typeof data === "object" && data !== null) {
    const item = Reflect.get(data, "item_id");
    if (typeof item === "string") {
      return item;
    }
    const asset = Reflect.get(data, "asset_id");
    if (typeof asset === "string") {
      return asset;
    }
  }
  return "";
}

export function routeGT000Action(
  payload: Record<string, string | boolean | number>,
  step: GT000Step
): "prev" | "replay_echo" | "replay_present" | "advance" | "step" {
  if (payload.intent === "prev") {
    return "prev";
  }
  if (payload.intent === "replay") {
    if (step.action === "echo") {
      return "replay_echo";
    }
    if (step.action === "present") {
      return "replay_present";
    }
  }
  if (
    payload.intent === "advance" &&
    (step.action === "present" || step.action === "echo")
  ) {
    return "advance";
  }
  return "step";
}

export function evaluateGT000StepAnswer(
  payload: Record<string, string | boolean | number>,
  step: GT000Step
): ActionResult {
  switch (step.action) {
    case "present":
    case "echo":
      return ACTION_CORRECT;
    case "recall": {
      const selectedId = extractAssetId(payload);
      const correctId =
        (step as { correct_asset_id?: string; target_asset_id?: string })
          .correct_asset_id ?? step.target_asset_id;
      // Recall sai không chấm thử lại (`BR-CIR-07`) — xem `handleRecallAction`.
      return selectedId === correctId ? ACTION_CORRECT : ACTION_IGNORED;
    }
    case "recognise": {
      const selectedId = extractAssetId(payload);
      return selectedId === step.target_asset_id
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    case "link": {
      const sourceId = String(payload.source_id ?? "");
      const targetId = String(payload.target_id ?? "");
      const isMatch =
        (sourceId === step.source_asset_id &&
          targetId === step.target_asset_id) ||
        (sourceId === step.target_asset_id &&
          targetId === step.source_asset_id);
      return isMatch ? ACTION_CORRECT : ACTION_RETRY;
    }
    default:
      return ACTION_IGNORED;
  }
}

/** Rèm phủ hàng lựa chọn lúc vào bước `recall`, mở dần ra hai bên (`BR-E000-16`). */
function drawRecallCurtains(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slots: readonly Slot[],
  openness: number | undefined
): void {
  if (openness === undefined) {
    return;
  }
  const curtains = curtainGeometry(
    slots.map((s) => ({
      x: s.x - s.hitW / 2,
      y: s.y - s.hitH / 2,
      w: s.hitW,
      h: s.hitH,
    })),
    rs.LOGIC_WIDTH,
    openness
  );
  if (curtains) {
    drawCurtains(ctx, curtains);
  }
}

export function renderGT000Step(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  options: {
    themeId?: string;
    step?: GT000Step;
    promptText: string;
    conceptLabel: string;
    renderItems: readonly RenderItem[];
    slots: readonly Slot[];
    targetAsset?: GT000Asset;
    /** Độ mở rèm của bước `recall` (0..1); thiếu thì không vẽ rèm (`BR-E000-16`). */
    curtainOpenness?: number;
  }
): void {
  drawSceneBackground(ctx, rs, options.themeId);

  if (!options.step) {
    drawPromptText(ctx, rs, "Bé đã hoàn thành bài làm quen!");
    return;
  }

  drawPromptText(ctx, rs, options.promptText);
  drawSubPromptText(ctx, rs, options.conceptLabel);

  const isCard =
    options.step.action === "present" || options.step.action === "echo";

  if (isCard) {
    const item = options.renderItems[0];
    const slot = options.slots[0];
    if (item && slot && options.targetAsset) {
      drawFlashcard(ctx, rs, slot, options.targetAsset, item.label);
    }
  } else {
    for (let i = 0; i < options.renderItems.length; i++) {
      const item = options.renderItems[i];
      const slot = options.slots[i];
      if (item && slot) {
        drawSlotItem(ctx, rs, slot, item);
      }
    }
    if (options.step.action === "recall") {
      drawRecallCurtains(
        ctx,
        rs,
        options.slots.slice(0, options.renderItems.length),
        options.curtainOpenness
      );
    }
  }
}

export function resolveNormalizedSegments(
  content: GT000Content
): GT000Segment[] {
  if (content.segments && content.segments.length > 0) {
    return [...content.segments];
  }
  return [
    {
      segment_id: "seg_1",
      asset_ids: content.assets.map((a) => a.asset_id),
      steps: [...(content.steps ?? [])],
      is_review: false,
    },
  ];
}

export function resolveStartSegmentIndex(
  initialResumeSegmentIndex: number | undefined,
  difficultyResume: number | undefined,
  contentResume: number | undefined,
  totalSegments: number
): number {
  const raw =
    initialResumeSegmentIndex ?? difficultyResume ?? contentResume ?? 0;
  if (!Number.isInteger(raw) || raw <= 0 || raw >= totalSegments) {
    return 0;
  }
  return raw;
}

export function computeGlobalStepOffset(
  segments: readonly GT000Segment[],
  segmentIndex: number
): number {
  let offset = 0;
  for (let i = 0; i < segmentIndex; i++) {
    offset += segments[i]?.steps.length ?? 0;
  }
  return offset;
}

export function syncSegmentCursorFromStepIndex(
  segments: readonly GT000Segment[],
  globalStepIdx: number
): { segmentIndex: number; segmentStepIndex: number } {
  let remaining = globalStepIdx;
  for (let i = 0; i < segments.length; i++) {
    const len = segments[i]?.steps.length ?? 0;
    if (remaining < len) {
      return { segmentIndex: i, segmentStepIndex: remaining };
    }
    remaining -= len;
  }
  return { segmentIndex: 0, segmentStepIndex: 0 };
}

export function findTappedItem(
  gesture: Extract<Gesture, { type: "tap" }>,
  step: GT000Step,
  renderItems: readonly RenderItem[],
  slots: readonly Slot[]
): { itemId: string; isLink: boolean } | null {
  const isCard = step.action === "present" || step.action === "echo";

  if (isCard) {
    const item = renderItems[0];
    const slot = slots[0];
    if (!(item && slot)) {
      return null;
    }
    const cardSlot: Slot = {
      ...slot,
      w: Math.max(slot.w, 350),
      h: Math.max(slot.h, 320),
      hitW: Math.max(slot.hitW, 350),
      hitH: Math.max(slot.hitH, 320),
    };
    if (
      !isPointInSlot(cardSlot, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
    ) {
      return null;
    }
    return { itemId: item.id, isLink: false };
  }

  const hitIdx = findHitSlotIndex(
    slots.slice(0, renderItems.length),
    gesture.x,
    gesture.y,
    "circle",
    TAP_TOLERANCE_PX
  );
  const item = hitIdx >= 0 ? renderItems[hitIdx] : undefined;
  if (!item) {
    return null;
  }

  return { itemId: item.id, isLink: step.action === "link" };
}

export interface StepActionContext {
  currentStepIndex: number;
  echoReplayCounts: Map<string, number>;
  missCounts: Map<string, number>;
  deferredAssetIds: string[];
  renderItemStates: Map<string, ItemVisualState>;
  recallAnswers: { asset_id: string; correct: boolean }[];
  requiresReintro?: boolean;
  lastTtsUsed: boolean;
  recordEvent: (
    eventName: string,
    data?: Record<string, string | number | boolean | null | undefined>
  ) => void;
  playEchoModel: (step: GT000Step & { action: "echo" }) => void;
  /** Sai ở recognise/link: chạy lại `present` của mục tiêu rồi hỏi lại (BR-E000-14). */
  replayTargetThenAsk: (
    step: GT000Step & { action: "recognise" | "link" }
  ) => void;
  advanceStep: () => void;
  /** Sang bước kế ở nhịp `update()` tới (recall sai — `BR-CIR-07`). */
  deferAdvance: () => void;
}

function handlePresentAction(ctx: StepActionContext): ActionResult {
  ctx.recordEvent("intro_step_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    action: "present",
    answer_correct: true,
    miss_count: 0,
    tts_used: ctx.lastTtsUsed,
  });
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleEchoAction(
  step: Extract<GT000Step, { action: "echo" }>,
  payload: Record<string, string | boolean | number>,
  ctx: StepActionContext
): ActionResult {
  const stepId = `step_${ctx.currentStepIndex}`;
  if (payload.intent === "replay") {
    const used = ctx.echoReplayCounts.get(stepId) ?? 0;
    if (used >= step.repeat_count) {
      return ACTION_IGNORED;
    }
    ctx.echoReplayCounts.set(stepId, used + 1);
    ctx.playEchoModel(step);
    return ACTION_CORRECT;
  }
  ctx.recordEvent("intro_echo_completed", {
    step_id: stepId,
    target_asset_id: step.target_asset_id,
    replay_count: ctx.echoReplayCounts.get(stepId) ?? 0,
  });
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleRecogniseAction(
  step: Extract<GT000Step, { action: "recognise" }>,
  payload: Record<string, string | boolean | number>,
  ctx: StepActionContext
): ActionResult {
  const selectedId = String(payload.item_id ?? payload.asset_id ?? "");
  const isCorrect = selectedId === step.target_asset_id;

  if (!isCorrect) {
    const misses = (ctx.missCounts.get(step.target_asset_id) ?? 0) + 1;
    ctx.missCounts.set(step.target_asset_id, misses);

    if (
      misses >= 3 &&
      ctx.requiresReintro &&
      !ctx.deferredAssetIds.includes(step.target_asset_id)
    ) {
      ctx.deferredAssetIds.push(step.target_asset_id);
      ctx.recordEvent("intro_step_deferred", {
        step_id: `step_${ctx.currentStepIndex}`,
        reason: "miss_limit",
      });
      ctx.advanceStep();
      return ACTION_RETRY;
    }
    ctx.replayTargetThenAsk(step);
    return ACTION_RETRY;
  }

  ctx.renderItemStates.set(selectedId, "correct");
  ctx.recordEvent("intro_step_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    action: "recognise",
    answer_correct: true,
    miss_count: ctx.missCounts.get(step.target_asset_id) ?? 0,
    tts_used: false,
  });
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleLinkAction(
  step: Extract<GT000Step, { action: "link" }>,
  payload: Record<string, string | boolean | number>,
  ctx: StepActionContext
): ActionResult {
  const sourceId = String(payload.source_id ?? "");
  const targetId = String(payload.target_id ?? "");

  const isMatch =
    (sourceId === step.source_asset_id && targetId === step.target_asset_id) ||
    (sourceId === step.target_asset_id && targetId === step.source_asset_id);

  if (!isMatch) {
    const misses = (ctx.missCounts.get(step.target_asset_id) ?? 0) + 1;
    ctx.missCounts.set(step.target_asset_id, misses);
    ctx.replayTargetThenAsk(step);
    return ACTION_RETRY;
  }

  ctx.recordEvent("intro_step_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    action: "link",
    answer_correct: true,
    miss_count: 0,
    tts_used: false,
  });
  ctx.advanceStep();
  return ACTION_CORRECT;
}

function handleRecallAction(
  step: Extract<GT000Step, { action: "recall" }>,
  payload: Record<string, string | boolean | number>,
  ctx: StepActionContext
): ActionResult {
  const selectedId = extractAssetId(payload);
  const correctId =
    (step as { correct_asset_id?: string; target_asset_id?: string })
      .correct_asset_id ?? step.target_asset_id;
  const isCorrect = selectedId === correctId;

  ctx.recallAnswers.push({
    asset_id: correctId,
    correct: isCorrect,
  });

  ctx.recordEvent("intro_recall_answered", {
    step_id: `step_${ctx.currentStepIndex}`,
    target_asset_id: correctId,
    answer_correct: isCorrect,
  });

  if (!isCorrect) {
    // `recall` là phép đo, không phải cửa (spec §5 nhánh 2, `BR-CIR-07`): sai
    // thì không báo sai, không bắt thử lại — sang bước kế ở nhịp `update()`
    // sau, để thắng ở bước cuối đi qua đường `onSessionWon` của engine.
    ctx.deferAdvance();
    return ACTION_IGNORED;
  }

  ctx.advanceStep();
  return ACTION_CORRECT;
}

export function handleGT000Action(
  step: GT000Step,
  payload: Record<string, string | boolean | number>,
  ctx: StepActionContext
): ActionResult {
  switch (step.action) {
    case "present":
      return handlePresentAction(ctx);
    case "echo":
      return handleEchoAction(step, payload, ctx);
    case "recognise":
      return handleRecogniseAction(step, payload, ctx);
    case "link":
      return handleLinkAction(step, payload, ctx);
    case "recall":
      return handleRecallAction(step, payload, ctx);
    default:
      return ACTION_IGNORED;
  }
}
