import { z } from "zod";
import { assetSchema } from "#src/contracts/shared-fields";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  defineTemplate,
  type GameAction,
  type GameActionValue,
} from "#src/contracts/types";
import {
  GT000AssetRepresentationSchema,
  GT000InteractionHintSchema,
  GT000SceneBoardSchema,
  GT000StoryContextSchema,
} from "./scene-board-schema.js";

// biome-ignore lint/performance/noBarrelFile: Re-export scene-board contracts on canonical GT-000 template module
export {
  type GT000AssetRepresentation,
  GT000AssetRepresentationSchema,
  type GT000InteractionHint,
  GT000InteractionHintSchema,
  type GT000PartWholeOperation,
  GT000PartWholeOperationSchema,
  type GT000QuantityRepKind,
  GT000QuantityRepKindSchema,
  type GT000RuleMemoryVariant,
  GT000RuleMemoryVariantSchema,
  type GT000SceneBoard,
  type GT000SceneBoardMode,
  GT000SceneBoardSchema,
  type GT000ShapeBadge,
  GT000ShapeBadgeSchema,
  type GT000SortingBasket,
  GT000SortingBasketSchema,
  type GT000SpatialAnchorProp,
  GT000SpatialAnchorPropSchema,
  type GT000SpatialRelation,
  GT000SpatialRelationSchema,
  type GT000StoryContext,
  GT000StoryContextSchema,
  type GT000ToneMark,
  GT000ToneMarkSchema,
  resolveStepInteractionHint,
  resolveStepSceneBoard,
  resolveStoryContext,
} from "./scene-board-schema.js";

const GT000AssetKindSchema = z.enum(["glyph", "word", "image"]);

export const GT000AssetSchema = z
  .object({
    asset_id: z.string().min(1),
    kind: GT000AssetKindSchema,
    label: z.string().min(1),
    audio_path: z.string().optional(),
    glyph: z.string().optional(),
    text: z.string().optional(),
    value: z.number().optional(),
    image_ref: assetSchema().optional(),
    contrast_group: z.string().min(1),
    syllables: z.array(z.string().min(1)).min(1).max(6).optional(),
    representation: GT000AssetRepresentationSchema.optional(),
  })
  .refine((asset) => Boolean(asset.glyph || asset.image_ref), {
    message:
      "Mọi chất liệu BẮT BUỘC có một hình minh hoạ (glyph hoặc image_ref) và một nhãn tiếng Việt (BR-E000-02)",
  });

const GT000StepPresentSchema = z.object({
  action: z.literal("present"),
  target_asset_id: z.string().min(1),
  narration_line: z.string().optional(),
  interaction_hint: GT000InteractionHintSchema.optional(),
  scene_board: GT000SceneBoardSchema.optional(),
});

/**
 * Tập nói theo — `BR-CIM-19`, `BR-E000-10`.
 *
 * Máy đọc mẫu, trẻ nói theo thành tiếng, rồi chạm để đi tiếp.
 * Cấm — NEVER yêu cầu micro, NEVER ghi âm, NEVER chấm phát âm (`BR-CIR-23`).
 */
const GT000StepEchoSchema = z.object({
  action: z.literal("echo"),
  target_asset_id: z.string().min(1),
  repeat_count: z.number().int().min(1).max(3).default(1),
  prompt_line: z.string().optional(),
  scene_board: GT000SceneBoardSchema.optional(),
});

const GT000StepRecogniseSchema = z.object({
  action: z.literal("recognise"),
  target_asset_id: z.string().min(1),
  distractor_asset_ids: z.array(z.string().min(1)).min(1).max(3),
  prompt_line: z.string().optional(),
  scene_board: GT000SceneBoardSchema.optional(),
});

const GT000StepLinkSchema = z.object({
  action: z.literal("link"),
  source_asset_id: z.string().min(1),
  target_asset_id: z.string().min(1),
  prompt_line: z.string().optional(),
  scene_board: GT000SceneBoardSchema.optional(),
});

const GT000StepRecallSchema = z.object({
  action: z.literal("recall"),
  target_asset_id: z.string().min(1),
  option_asset_ids: z.array(z.string().min(1)).min(2).max(4),
  prompt_line: z.string().optional(),
  scene_board: GT000SceneBoardSchema.optional(),
});

export const GT000StepSchema = z.discriminatedUnion("action", [
  GT000StepPresentSchema,
  GT000StepEchoSchema,
  GT000StepRecogniseSchema,
  GT000StepLinkSchema,
  GT000StepRecallSchema,
]);

export const GT000SegmentSchema = z
  .object({
    segment_id: z.string().min(1),
    asset_ids: z.array(z.string().min(1)).min(2).max(6),
    steps: z.array(GT000StepSchema).min(2).max(12),
    is_review: z.boolean().default(false),
    scene_cue: z.string().min(1).optional(),
    milestone_line: z.string().min(1).optional(),
  })
  .refine((seg) => seg.is_review || seg.asset_ids.length <= 3, {
    message:
      "Mỗi phân đoạn dạy chỉ được có 2–3 chất liệu (BR-CIM-03, BR-E000-03)",
  })
  .refine(
    (seg) => {
      const lastStep = seg.steps.at(-1);
      return lastStep?.action === "recall";
    },
    {
      message:
        "Mọi phân đoạn BẮT BUỘC kết thúc bằng ít nhất một hành động recall (BR-E000-04)",
    }
  )
  .refine(
    (seg) =>
      seg.is_review ||
      seg.steps.some(
        (step) => step.action === "present" || step.action === "echo"
      ),
    {
      message:
        "Mọi phân đoạn dạy BẮT BUỘC có ít nhất một hành động giới thiệu hoặc tập nói (present hoặc echo) (BR-E000-10)",
    }
  );

export const GT000ContentSchema = z
  .object({
    concept: z.object({
      // BR-CTM-03: neo vào một kỹ năng chơi thật. Bậc `pre` đã bị gỡ 2026-09-06,
      // nên `pre_skill_code` không còn là trường hợp lệ.
      skill_code: z.string().regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/),
      label: z.string().min(1),
      /** Mã mọi kỹ năng chơi mà chủ đề này dạy — BR-CTM-04. */
      teaches: z.array(z.string().regex(/^C[1-6]\.[A-Z]{2,5}\.\d{2}$/)).min(1),
      /** Dãy giá trị có thứ tự của chủ đề — BR-CTM-09. */
      values: z.array(z.string().min(1)).min(2).max(21),
      /** Thứ tự tiết trong chủ đề nhiều tiết — BR-CIM-20. */
      sequence_no: z.number().int().min(1).default(1),
    }),
    prompt: z.string().optional(),
    story_context: GT000StoryContextSchema.optional(),
    assets: z.array(GT000AssetSchema).min(2).max(21),
    segments: z.array(GT000SegmentSchema).min(1).max(8).optional(),
    steps: z.array(GT000StepSchema).min(2).max(12).optional(),
    requires_reintro: z.boolean().default(false),
    resume_segment_index: z.number().int().min(0).optional(),
  })
  .refine((data) => Boolean(data.segments || data.steps), {
    message: "content_pack phải có segments hoặc steps",
  })
  .refine(
    (data) => {
      if (!data.segments || data.segments.length === 0) {
        return true;
      }
      const lastSeg = data.segments.at(-1);
      return lastSeg?.is_review === true;
    },
    {
      message:
        "Level BẮT BUỘC đóng bằng một phân đoạn ôn gộp mọi giá trị đã dạy (is_review = true) (BR-E000-04)",
    }
  )
  .refine(
    (data) =>
      !data.steps ||
      data.steps.some(
        (step) => step.action === "present" || step.action === "echo"
      ),
    {
      message:
        "Bài dùng dãy `steps` phẳng BẮT BUỘC có ít nhất một hành động giới thiệu hoặc tập nói (present hoặc echo) (BR-E000-10)",
    }
  )
  .refine(
    (data) => {
      // BR-CTM-09: mọi giá trị của chủ đề phải được dạy trong bài.
      const taught = new Set(data.assets.map((a) => a.asset_id));
      return data.concept.values.every(
        (v) => taught.has(v) || taught.has(`asset_${v}`)
      );
    },
    {
      message:
        "content_pack BẮT BUỘC dạy mọi giá trị khai trong concept.values (BR-CTM-09)",
    }
  );

/** Các bậc "tập nói theo" của bài làm quen (`BR-E000-11`). */
export type SpeakAlongMode = "off" | "tap";

/**
 * Mặc định của `speak_along` — một nguồn cho cả schema và runtime.
 *
 * `difficulty_params` tới session ở dạng THÔ (`createGameSessionSync` không
 * parse schema), nên `.default()` của Zod không có tác dụng lúc chơi: session
 * phải tự đọc trường thiếu bằng hằng này (`resolveSpeakAlong`).
 */
const SPEAK_ALONG_DEFAULT: SpeakAlongMode = "off";

export function resolveSpeakAlong(difficulty: {
  readonly speak_along?: SpeakAlongMode;
}): SpeakAlongMode {
  return difficulty.speak_along ?? SPEAK_ALONG_DEFAULT;
}

export const GT000DifficultySchema = z
  .object({
    hint_after_ms: z.number().int().min(5000).max(30_000).default(12_000),
    allow_retry: z.boolean().default(true),
    auto_play_audio: z.boolean().default(true),
    /**
     * Bậc "tập nói theo" của bài làm quen (Task #273, `BR-E000-11`).
     *
     * `off` (mặc định, Task #274 `D-274-2`) — bước `echo` vẫn tồn tại trong
     * content và vẫn đọc từ khoá, nhưng mọi lời mời "nói theo" tắt: khung câu
     * hỏi hiện câu trình bày, nút là "Tiếp tục" thường, không icon micro.
     * `tap` — máy đọc mẫu, trẻ nói theo thành tiếng (máy không nghe), rồi
     * chạm nút "Bé nói theo" để đi tiếp; bài cần tập phát âm khai tường minh.
     * Cấm — NEVER có bậc thứ ba mở micro thật; xem `BR-CIM-10`.
     */
    speak_along: z.enum(["off", "tap"]).default(SPEAK_ALONG_DEFAULT),
    resume_segment_index: z.number().int().min(0).optional(),
  })
  .strict();

export type GT000Asset = z.infer<typeof GT000AssetSchema>;
export type GT000Step = z.infer<typeof GT000StepSchema>;
export type GT000Segment = z.infer<typeof GT000SegmentSchema>;
export type GT000Content = z.infer<typeof GT000ContentSchema>;
export type GT000Difficulty = z.infer<typeof GT000DifficultySchema>;

export function getStepItemCount(step: GT000Step): number {
  if (step.action === "recognise") {
    return 1 + step.distractor_asset_ids.length;
  }
  if (step.action === "link") {
    return 2;
  }
  return step.action === "recall" ? step.option_asset_ids.length : 1;
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
  return Number.isInteger(raw) && raw > 0 && raw < totalSegments ? raw : 0;
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

export function resolveGT000HintTargetIndex(
  step: GT000Step | undefined,
  ids: readonly string[],
  selectedAssetId: string | null
): number | null {
  if (!step) {
    return null;
  }
  if (step.action === "present" || step.action === "echo") {
    return 0;
  }
  let wanted = step.target_asset_id;
  if (step.action === "link") {
    wanted =
      selectedAssetId === step.source_asset_id
        ? step.target_asset_id
        : step.source_asset_id;
  }
  const idx = ids.indexOf(wanted);
  return idx >= 0 ? idx : null;
}

export function resolveGT000HintDestinationIndex(
  step: GT000Step | undefined,
  ids: readonly string[],
  selectedAssetId: string | null
): number | null {
  if (step?.action !== "link") {
    return null;
  }
  const wanted =
    selectedAssetId === step.target_asset_id
      ? step.source_asset_id
      : step.target_asset_id;
  const idx = ids.indexOf(wanted);
  return idx >= 0 ? idx : null;
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

export function resolveRecallCorrectAssetId(
  step: Extract<GT000Step, { action: "recall" }>
): string {
  const legacy = Reflect.get(step, "correct_asset_id");
  return typeof legacy === "string" && legacy.length > 0
    ? legacy
    : step.target_asset_id;
}

export function evaluateGT000StepAnswer(
  payload: Record<string, string | boolean | number>,
  step: GT000Step
): ActionResult {
  switch (step.action) {
    case "present":
    case "echo":
      return ACTION_CORRECT;
    case "recall":
      return extractAssetId(payload) === resolveRecallCorrectAssetId(step)
        ? ACTION_CORRECT
        : ACTION_IGNORED;
    case "recognise":
      return extractAssetId(payload) === step.target_asset_id
        ? ACTION_CORRECT
        : ACTION_RETRY;
    case "link": {
      const sId = String(payload.source_id ?? "");
      const tId = String(payload.target_id ?? "");
      const matched =
        (sId === step.source_asset_id && tId === step.target_asset_id) ||
        (sId === step.target_asset_id && tId === step.source_asset_id);
      return matched ? ACTION_CORRECT : ACTION_RETRY;
    }
    default:
      return ACTION_IGNORED;
  }
}

export function resolveGT000LinkTapSelection(
  currentSelectedId: string | null,
  tappedItemId: string,
  renderItemStates: Map<
    string,
    | "idle"
    | "selected"
    | "correct"
    | "wrong"
    | "disabled"
    | "touching"
    | "locked"
  >
): {
  readonly nextSelectedId: string | null;
  readonly action: GameAction | null;
} {
  if (currentSelectedId === null) {
    renderItemStates.set(tappedItemId, "selected");
    return { nextSelectedId: tappedItemId, action: null };
  }
  if (currentSelectedId === tappedItemId) {
    renderItemStates.delete(tappedItemId);
    return { nextSelectedId: null, action: null };
  }
  renderItemStates.delete(currentSelectedId);
  return {
    nextSelectedId: null,
    action: {
      type: "tap_item",
      data: {
        source_id: currentSelectedId,
        target_id: tappedItemId,
        item_id: tappedItemId,
        asset_id: tappedItemId,
      },
    },
  };
}

export function resolveGT000InitialState(
  content: GT000Content,
  difficulty: GT000Difficulty,
  initialResumeSegmentIndex?: number
): {
  readonly normalizedSegments: GT000Segment[];
  readonly allSteps: GT000Step[];
  readonly currentSegmentIndex: number;
  readonly currentStepIndex: number;
} {
  const normalizedSegments = resolveNormalizedSegments(content);
  const allSteps = normalizedSegments.flatMap((s) => s.steps);
  const currentSegmentIndex = resolveStartSegmentIndex(
    initialResumeSegmentIndex,
    difficulty.resume_segment_index,
    content.resume_segment_index,
    normalizedSegments.length
  );
  return {
    normalizedSegments,
    allSteps,
    currentSegmentIndex,
    currentStepIndex: computeGlobalStepOffset(
      normalizedSegments,
      currentSegmentIndex
    ),
  };
}

export type GT000ActionPayload = Record<string, string | boolean | number>;

function isPrimitiveActionField(
  val: GameActionValue
): val is string | boolean | number {
  return (
    typeof val === "string" ||
    typeof val === "boolean" ||
    typeof val === "number"
  );
}

export function readGT000ActionPayload(action: GameAction): GT000ActionPayload {
  if (typeof action.data !== "object" || action.data === null) {
    return {};
  }
  const out: GT000ActionPayload = {};
  for (const [key, val] of Object.entries(action.data)) {
    if (isPrimitiveActionField(val)) {
      out[key] = val;
    }
  }
  return out;
}

export function validateGT000SessionAction(
  action: GameAction,
  step: GT000Step | undefined,
  currentStepIndex: number,
  echoReplayCounts: ReadonlyMap<string, number>
): ActionResult {
  if (!step) {
    return ACTION_IGNORED;
  }
  const payload = readGT000ActionPayload(action);
  switch (routeGT000Action(payload, step)) {
    case "prev":
    case "replay_present":
    case "advance":
      return ACTION_CORRECT;
    case "replay_echo": {
      if (step.action !== "echo") {
        return ACTION_IGNORED;
      }
      const used = echoReplayCounts.get(`step_${currentStepIndex}`) ?? 0;
      return used >= step.repeat_count ? ACTION_IGNORED : ACTION_CORRECT;
    }
    default:
      return evaluateGT000StepAnswer(payload, step);
  }
}

export function computeGT000TotalMisses(
  missCounts: ReadonlyMap<string, number>
): number {
  let total = 0;
  for (const count of missCounts.values()) {
    total += count;
  }
  return total;
}

export function resolveGT000AnswerReaction(
  step: GT000Step,
  result: ActionResult
): "happy" | "listen" | null {
  if (step.action === "present" || step.action === "echo") {
    return null;
  }
  if (result.valid) {
    return "happy";
  }
  return step.action === "recall" ? null : "listen";
}

export interface GT000CardPose {
  readonly scale: number;
  readonly offsetY: number;
  readonly depressed: boolean;
}

/** Tư thế động của Flashcard ở `present` / `echo`; tĩnh khi `reducedMotion`. */
export function computeGT000CardPose(
  stepElapsedMs: number,
  cardBounceMs: number,
  reducedMotion: boolean
): GT000CardPose {
  const depressed = cardBounceMs > 0;
  if (reducedMotion) {
    return { scale: 1, offsetY: 0, depressed };
  }
  const t = Math.max(0, Math.min(1, stepElapsedMs / 200));
  let scale =
    stepElapsedMs < 200
      ? 0.94 + 0.06 * (1 - (1 - t) ** 3)
      : 1 + 0.008 * Math.sin(((stepElapsedMs - 200) / 1400) * Math.PI * 2);
  let offsetY = 0;
  if (cardBounceMs > 0) {
    const p = 1 - Math.max(0, Math.min(1, cardBounceMs / 220));
    const wave = Math.sin(p * Math.PI);
    scale *= 1 - 0.024 * wave;
    offsetY = Math.round(3 * wave);
  }
  return { scale, offsetY, depressed };
}

const INTRO_SCORING = {
  max_score: 0,
  pass_threshold: 0,
  star_thresholds: [0, 0, 0] as [number, number, number],
};

export default defineTemplate({
  code: "GT-000",
  name: "Làm quen khái niệm",
  mechanic: "concept-intro",
  layouts: ["single-focus", "grid", "horizontal-row", "flex-wrap"],
  content_contract: GT000ContentSchema,
  difficulty_contract: GT000DifficultySchema,
  limits: {
    item_count: [2, 21],
    distractor_count: [1, 3],
    target_count: [1, 1],
  },
  age_min: 3,
  age_max: 6,
  requires_tap_fallback: false,
  asset_kinds: ["emoji", "image", "audio"],
  kind: "teach",
  scoring: INTRO_SCORING,
  events: [
    "game_started",
    "intro_step_started",
    "intro_step_answered",
    "intro_step_deferred",
    "intro_echo_started",
    "intro_echo_completed",
    "intro_recall_answered",
    "intro_segment_started",
    "intro_segment_completed",
    "tts_unavailable",
    "game_completed",
  ],
  engine_session: "GT000Session",
  status: "published",
  version: 1,
  input: {
    family: "tap",
    verbs: ["tap"],
    tolerance_px: 24,
  },
});
