import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import type { Slot } from "#src/layout/types";
import {
  drawGT017ModelOverlays,
  drawGT017OptionCard,
  drawGT017TurntableStage,
} from "#src/render/gt-017-shapes";
import {
  drawIsometricModel,
  drawSceneBackground,
  drawStoryCharacterInStage,
  type ItemVisualState,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  type CubeCoord,
  computeTopView,
  countHiddenCubes,
  type RotationAngle,
  sortCubesForRender,
} from "#src/systems/isometric-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlashMap } from "#src/systems/wrong-flash";
import {
  computeGT017HeroLayout,
  computeGT017ProjectedModel,
  computeGT017Slots,
  findBestUnoccludedRotation,
  findHitGT017OptionId,
  resolveGT017GestureAction,
  resolveGT017HeroBox,
  resolveGT017HeroHitSide,
  resolveGT017RoundSetup,
} from "./layout.js";
import type { GT017Content, GT017Difficulty } from "./template.js";

/** Khung chuyện theo câu hỏi, đọc một lần ở vòng đầu (`BR-E017-05`, `BR-FBK-16`). */
export const GT017_STORY_LINES: Record<GT017Content["question"], string> = {
  count_cubes:
    "Hải Ly xây nhà bằng những khối gỗ. Bé đếm xem Hải Ly đã dùng bao nhiêu khối nhé!",
  top_view:
    "Hải Ly xây nhà bằng những khối gỗ. Bé nhìn từ trên xuống rồi chọn hình đúng nhé!",
  match_solid:
    "Hải Ly xây nhà bằng những khối gỗ. Bé chọn mô hình giống ngôi nhà của Hải Ly nhé!",
};

/** Mascot vui ngắn sau mỗi lần xoay mô hình. */
export const GT017_HAPPY_MS = 500;
/** Mascot nghiêng đầu sau lần chọn chưa đúng. */
export const GT017_WONDER_MS = 1500;
const GT017_WRONG_FLASH_MS = 600;
const GT017_SPIN_MS = 220;

export class BlockStackSession extends TemplateGameSession<
  GT017Content,
  GT017Difficulty
> {
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;

  private orderedOptions: GT017Content["options"];
  private currentRotation: RotationAngle = 0;
  private visualAngleDeg = 0;
  private selectedOptionId: string | null = null;
  private wrongChoiceTimerMs = 0;
  private readonly wrongFlashes = new WrongFlashMap(GT017_WRONG_FLASH_MS);
  private elapsedMs = 0;
  private spinAnimMs = 0;
  private lastRotateDir: "cw" | "ccw" = "cw";
  private roundLocked = false;
  private activeHintLevel: HintLevel | null = null;
  private hoveredOptionId: string | null = null;
  private hoveredHeroSide: "cw" | "ccw" | "center" | null = null;
  private readonly mood = new MoodPulse();

  constructor(
    content: GT017Content,
    difficulty: GT017Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.orderedOptions = [...content.options];
  }

  override storyLine(): string {
    return GT017_STORY_LINES[this.content.question];
  }

  /** Vui sau khi xoay, nghiêng đầu sau lần chọn chưa đúng (`BR-E017-05`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  setupEntities(): void {
    this.mood.clear();
    this.wrongFlashes.clearAll();
    const setup = resolveGT017RoundSetup(
      this.content,
      this.difficulty,
      this.layoutSeed,
      this.roundGeneration
    );
    this.orderedOptions = setup.orderedOptions;
    this.currentRotation = setup.initialRotation;
    this.visualAngleDeg = setup.initialRotation;
    this.selectedOptionId = null;
    this.wrongChoiceTimerMs = 0;
    this.elapsedMs = 0;
    this.spinAnimMs = 0;
    this.lastRotateDir = "cw";
    this.roundLocked = false;
    this.activeHintLevel = null;
    this.hoveredOptionId = null;
    this.hoveredHeroSide = null;
    this.isWon = false;

    this.recordEvent("game_started", {
      template_code: "GT-017",
      cube_count: this.content.model.length,
      question: this.content.question,
    });
  }

  getModel(): readonly CubeCoord[] {
    return this.content.model;
  }

  getQuestion(): GT017Content["question"] {
    return this.content.question;
  }

  getOptions(): GT017Content["options"] {
    return this.orderedOptions;
  }

  getCurrentRotation(): RotationAngle {
    return this.currentRotation;
  }

  getSelectedOptionId(): string | null {
    return this.selectedOptionId;
  }

  isRoundLocked(): boolean {
    return this.roundLocked;
  }

  getRenderableCubes(): CubeCoord[] {
    return sortCubesForRender(this.content.model, this.currentRotation);
  }

  getTopView(): number[][] {
    return computeTopView(this.content.model);
  }

  getHiddenCubeCount(): number {
    return countHiddenCubes(this.content.model, this.currentRotation);
  }

  rotateModel(direction: "cw" | "ccw" = "cw"): RotationAngle {
    if (!this.difficulty.allow_rotate) {
      return this.currentRotation;
    }

    const angles: readonly RotationAngle[] = [0, 90, 180, 270];
    const currIdx = angles.indexOf(this.currentRotation);
    const nextIdx = direction === "cw" ? (currIdx + 1) % 4 : (currIdx + 3) % 4;

    this.currentRotation = angles[nextIdx] ?? 0;
    this.lastRotateDir = direction;
    this.spinAnimMs = GT017_SPIN_MS;
    // Tiếng "bụp" như nhau ở mọi góc: xoay là thao tác nháp (`BR-E017-05`).
    this.queueSfx("block_bump");
    this.mood.set("happy", GT017_HAPPY_MS);

    this.recordEvent("model_rotated", {
      angle: this.currentRotation,
      hidden_cubes_remaining: this.getHiddenCubeCount(),
    });

    return this.currentRotation;
  }

  selectOption(optionId: string): boolean {
    if (this.isWon || this.roundLocked) {
      return false;
    }
    const opt = this.orderedOptions.find((o) => o.option_id === optionId);
    if (!opt) {
      return false;
    }

    this.selectedOptionId = optionId;
    if (opt.is_correct) {
      this.wrongChoiceTimerMs = 0;
      this.wrongFlashes.clearAll();
      this.activeHintLevel = null;
      this.recordEvent("option_selected", {
        option_id: optionId,
        is_correct: true,
      });
      this.winSession();
      return true;
    }

    this.wrongChoiceTimerMs = GT017_WRONG_FLASH_MS;
    this.wrongFlashes.trigger(optionId, this.elapsedMs);
    this.mood.set("wonder", GT017_WONDER_MS);
    if (this.difficulty.allow_retry === false) {
      this.roundLocked = true;
    }

    this.recordEvent("option_selected", {
      option_id: optionId,
      is_correct: false,
    });

    return false;
  }

  setPointerOver(x: number, y: number): void {
    const allSlots =
      this.slots.length > 0 ? this.slots : this.computeSlots("5-6");
    const optionSlots =
      this.sourceSlots.length > 0
        ? this.sourceSlots
        : allSlots.filter((s) => s.role === "source");
    this.hoveredOptionId = findHitGT017OptionId(
      optionSlots,
      this.orderedOptions,
      x,
      y
    );
    const heroSlot = allSlots.find((s) => s.role === "target") ?? allSlots[0];
    this.hoveredHeroSide =
      this.hoveredOptionId === null
        ? resolveGT017HeroHitSide(heroSlot, x, y)
        : null;
  }

  clearPointerOver(): void {
    this.hoveredOptionId = null;
    this.hoveredHeroSide = null;
  }

  override onScaffoldEscalated(level: HintLevel): void {
    this.activeHintLevel = level;
    if (
      level === 2 &&
      this.difficulty.allow_rotate &&
      this.getHiddenCubeCount() > 0
    ) {
      const nextAngle = findBestUnoccludedRotation(
        this.content.model,
        this.currentRotation
      );
      if (nextAngle !== this.currentRotation) {
        this.currentRotation = nextAngle;
        this.lastRotateDir = "cw";
        this.spinAnimMs = GT017_SPIN_MS;
      }
    }
  }

  override onHintCleared(): void {
    this.activeHintLevel = null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const allSlots =
      this.slots.length > 0 ? this.slots : this.computeSlots("5-6");
    const optionSlots =
      this.sourceSlots.length > 0
        ? this.sourceSlots
        : allSlots.filter((s) => s.role === "source");
    const heroSlot = allSlots.find((s) => s.role === "target") ?? allSlots[0];
    return resolveGT017GestureAction(
      gesture,
      optionSlots,
      heroSlot,
      this.orderedOptions,
      this.difficulty.allow_rotate,
      !(this.isWon || this.roundLocked)
    );
  }

  override getHintTargetIndex(): number | null {
    const idx = this.orderedOptions.findIndex((o) => o.is_correct);
    if (idx < 0) {
      return null;
    }
    const slot = this.sourceSlots[idx];
    if (slot) {
      const slotIdx = this.slots.indexOf(slot);
      return slotIdx >= 0 ? slotIdx : slot.index;
    }
    return idx + 1;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.checkWinCondition()) {
      return null;
    }
    if (level === 1) {
      const bottomLayerIds = this.content.model
        .filter((c) => c.z === 0)
        .map((c) => `cube:${c.x},${c.y},${c.z}`);
      return {
        kind: "region",
        ids: ["model-layer-bottom", ...bottomLayerIds],
      };
    }
    if (level === 2) {
      return {
        kind: "region",
        ids: ["model-hidden-cubes", "model-view"],
      };
    }
    return this.getHintTarget();
  }

  override commit(action: GameAction): void {
    if (action.type === "select_option" && typeof action.data === "string") {
      this.selectOption(action.data);
    }
    if (
      action.type === "rotate_model" &&
      (action.data === "cw" || action.data === "ccw")
    ) {
      this.rotateModel(action.data);
    }
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "rotate_model") {
      return this.difficulty.allow_rotate ? ACTION_CORRECT : ACTION_IGNORED;
    }
    if (action.type === "select_option") {
      if (this.isWon || this.roundLocked || typeof action.data !== "string") {
        return ACTION_IGNORED;
      }
      const opt = this.orderedOptions.find((o) => o.option_id === action.data);
      if (!opt) {
        return ACTION_IGNORED;
      }
      return opt.is_correct ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const allSlots =
      this.slots.length > 0 ? this.slots : this.computeSlots("5-6");

    const targetSlot = allSlots.find((s) => s.role === "target") ?? allSlots[0];
    if (targetSlot) {
      entities.push({
        id: "model-view",
        slotIndex: targetSlot.index,
        role: "neutral",
        state: "idle",
        x: targetSlot.x,
        y: targetSlot.y,
        w: Math.max(targetSlot.hitW, targetSlot.w),
        h: Math.max(targetSlot.hitH, targetSlot.h),
        hitShape: "square",
        label: `Mô hình khối lập phương (${this.currentRotation}°)`,
        spokenLabel: "Mô hình khối lập phương",
      });
    }

    const optionSlots =
      this.sourceSlots.length > 0
        ? this.sourceSlots
        : allSlots.filter((s) => s.role === "source");

    this.orderedOptions.forEach((opt, i) => {
      const slot = optionSlots[i];
      if (slot) {
        const chosen = this.selectedOptionId === opt.option_id;
        const flashingWrong = this.wrongFlashes.isActive(
          opt.option_id,
          this.elapsedMs
        );
        let state: EntityVisual = "idle";
        if (chosen) {
          state = opt.is_correct ? "correct" : "incorrect";
        } else if (flashingWrong) {
          state = "incorrect";
        }
        const slotIndex = this.slots.indexOf(slot);
        entities.push({
          id: opt.option_id,
          slotIndex: slotIndex >= 0 ? slotIndex : slot.index,
          role: "source",
          state,
          x: slot.x,
          y: slot.y,
          w: Math.max(slot.hitW, slot.w),
          h: Math.max(slot.hitH, slot.h),
          hitShape: "square",
          ...resolveAssetLabels(opt.asset),
        });
      }
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    if (this.isWon) {
      return true;
    }
    if (!this.selectedOptionId) {
      return false;
    }
    const opt = this.orderedOptions.find(
      (o) => o.option_id === this.selectedOptionId
    );
    return opt?.is_correct === true;
  }

  update(deltaMs: number): void {
    const dt = Math.max(0, deltaMs);
    this.elapsedMs += dt;
    this.mood.tick(dt);
    this.wrongFlashes.drainExpired(this.elapsedMs);
    if (this.spinAnimMs > 0) {
      this.spinAnimMs = Math.max(0, this.spinAnimMs - dt);
    }
    const stepDeg = (dt / 1000) * 540;
    const diff =
      ((this.currentRotation - this.visualAngleDeg + 540) % 360) - 180;
    if (Math.abs(diff) <= stepDeg) {
      this.visualAngleDeg = this.currentRotation;
    } else {
      this.visualAngleDeg =
        (this.visualAngleDeg + Math.sign(diff) * stepDeg + 360) % 360;
    }
    if (this.wrongChoiceTimerMs > 0) {
      this.wrongChoiceTimerMs = Math.max(0, this.wrongChoiceTimerMs - dt);
      if (this.wrongChoiceTimerMs === 0 && !this.roundLocked && !this.isWon) {
        this.selectedOptionId = null;
      }
    }
  }

  override destroy(): void {
    super.destroy();
    this.wrongFlashes.clearAll();
    this.selectedOptionId = null;
    this.wrongChoiceTimerMs = 0;
    this.currentRotation = 0;
    this.visualAngleDeg = 0;
    this.lastRotateDir = "cw";
    this.roundLocked = false;
    this.activeHintLevel = null;
    this.hoveredOptionId = null;
    this.hoveredHeroSide = null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT017Slots(
      ageBand,
      this.logicSpace,
      this.stageRect,
      this.cssPerLogic,
      this.orderedOptions.length
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    // Hải Ly ở góc trống, ngoài vùng chạm (`BR-E017-06`).
    drawStoryCharacterInStage(ctx, "beaver", this.stageRect, this.slots);

    const heroBox = resolveGT017HeroBox(this.slots, this.stageRect, rs);
    const heroLayout = computeGT017HeroLayout(heroBox);
    const disableShadows = this.degradation?.soft_shadows_enabled === false;
    const showParticles =
      !rs.reducedMotion && this.degradation?.particles_enabled !== false;
    const hintLevel: 0 | 1 | 2 | 3 = this.activeHintLevel ?? 0;
    const showXray = this.isWon || this.roundLocked || hintLevel >= 2;
    const effectiveTimeMs = this.elapsedMs > 0 ? this.elapsedMs : timeMs;

    drawGT017TurntableStage(ctx, rs, heroLayout, {
      question: this.content.question,
      allowRotate: this.difficulty.allow_rotate,
      visualAngleDeg: rs.reducedMotion
        ? this.currentRotation
        : this.visualAngleDeg,
      spinProgress: this.spinAnimMs / GT017_SPIN_MS,
      rotateDir: this.lastRotateDir,
      hoveredSide: this.hoveredHeroSide,
      disableShadows,
    });

    drawIsometricModel(
      ctx,
      heroLayout.modelBox,
      this.content.model,
      this.currentRotation,
      "bottom"
    );

    const projected = computeGT017ProjectedModel(
      heroLayout.modelBox,
      this.content.model,
      this.currentRotation
    );
    drawGT017ModelOverlays(ctx, rs, heroLayout, {
      cubes: projected.cubes,
      cubeSize: projected.size,
      topView: projected.topView,
      question: this.content.question,
      hintLevel,
      showXray,
      timeMs: effectiveTimeMs,
    });

    const optionSlots =
      this.sourceSlots.length > 0
        ? this.sourceSlots
        : this.slots.filter((s) => s.role === "source");
    this.orderedOptions.forEach((opt, i) => {
      const slot = optionSlots[i] ?? this.slots[i + 1];
      if (!slot) {
        return;
      }
      const chosen = this.selectedOptionId === opt.option_id;
      const flashingWrong = this.wrongFlashes.isActive(
        opt.option_id,
        this.elapsedMs
      );
      let state: ItemVisualState = "idle";
      if (chosen) {
        state = opt.is_correct ? "correct" : "wrong";
      } else if (flashingWrong) {
        state = "wrong";
      }
      const isHinted = (hintLevel === 3 || this.roundLocked) && opt.is_correct;
      const wrongProgress = flashingWrong
        ? this.wrongFlashes.progress(opt.option_id, this.elapsedMs)
        : 1 - this.wrongChoiceTimerMs / GT017_WRONG_FLASH_MS;

      drawGT017OptionCard(ctx, rs, slot, {
        id: opt.option_id,
        asset: opt.asset,
        state,
        isHovered: this.hoveredOptionId === opt.option_id,
        isHinted,
        wrongProgress: Math.max(0, Math.min(1, wrongProgress)),
        showParticles,
      });
    });
  }
}

export const GT017Session = BlockStackSession;
export default BlockStackSession;
