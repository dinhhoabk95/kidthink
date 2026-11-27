import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import {
  type EngineView,
  type Gesture,
  type PlayVerb,
  TAP_ONLY_VERBS,
  type ViewEntity,
} from "#src/interaction";
import { dockRectAroundSlots, splitCaption } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import { S018 } from "#src/render/gt-018-shapes";
import {
  drawSceneBackground,
  drawSubPromptText,
  drawWoodenTokenDock,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { HintDemoStep, HintLevel } from "#src/systems/hint-ladder";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import { type Fig018, L018 as L, type Opt018, type VP018 } from "./layout";
import type { GT018Content, GT018Difficulty } from "./template";

export const GT018_STORY_LINE =
  "Thỏ bảo: bé nghe thật kỹ rồi làm đúng theo lời Thỏ nhé!";
export const GT018_HOP_MS = 600;
export const GT018_WONDER_MS = 1500;

type Cnt = GT018Content;
type Diff = GT018Difficulty;
type PtArg = { readonly x: number; readonly y: number } | number;
type DemoSteps = readonly HintDemoStep[] | null;

export class GT018Session extends TemplateGameSession<Cnt, Diff> {
  degradation: DegradationState | null = null;
  private readonly selMech = new SelectionMechanic({ mode: "single" });
  private readonly ordMech = new OrderingMechanic();
  selectedItemId: string | null = null;
  private readonly wrongFlash = new WrongFlash();
  override readonly usesPromptZone = true;
  override readonly needsCommit: boolean;

  /** Chỉ `sequence` kéo sắp xếp và nộp; `choice` chạm chọn đáp án. (`BR-EIC-08`) */
  override acceptedVerbs(): readonly PlayVerb[] {
    return this.needsCommit ? super.acceptedVerbs() : TAP_ONLY_VERBS;
  }

  constructor(c: Cnt, d: Diff, layoutSeed = 0, themeId?: string) {
    super(c, d, layoutSeed, themeId);
    this.needsCommit = c.response_mode === "sequence";
    L.clk(this, c.options);
  }

  private canAct(): boolean {
    return !(L.clk(this).isRoundClosed || this.checkWinCondition());
  }

  private seqIds(): readonly string[] {
    const seq = this.ordMech.getCurrentSequence();
    return seq.length > 0 ? seq : this.content.options.map((o) => o.item_id);
  }

  private ordOpts(): readonly Opt018[] {
    return this.needsCommit
      ? L.seqOpts(this.content.options, this.seqIds())
      : L.clk(this).displayOptions;
  }

  private selItems(): { id: string; isCorrect: boolean }[] {
    return this.content.options.map((o) => ({
      id: o.item_id,
      isCorrect: o.is_correct === true,
    }));
  }

  private setAllStates(state: "idle" | "wrong"): void {
    for (const opt of this.content.options) {
      this.setRenderItemState(opt.item_id, state);
    }
  }

  private finishRound(win: boolean): ActionResult {
    const c = L.clk(this);
    if (win) {
      this.wrongFlash.clear();
      c.winAtMs = c.logicMs;
      this.queueSfx("rabbit_hop");
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return L.OK;
    }
    [c.reactionPose, c.reactionRemainingMs] = ["wonder", GT018_WONDER_MS];
    this.wrongFlash.trigger(c.logicMs);
    if (!this.difficulty.allow_retry) {
      [c.isRoundClosed, c.closedAtMs] = [true, c.logicMs];
      this.completeSession();
    }
    return L.RETRY;
  }

  setupEntities(): void {
    [this.isWon, this.selectedItemId] = [false, null];
    this.setAllStates("idle");
    this.wrongFlash.clear();
    this.selMech.reset();
    const autoPlay = this.difficulty.auto_play_audio && this.isAudioEnabled();
    const seed = this.layoutSeed
      ? this.layoutSeed + this.roundGeneration * 97
      : 0;
    L.resetClk(this, autoPlay, this.content.options, seed);
    if (this.needsCommit) {
      const target = this.content.target_sequence ?? [];
      const seq = L.initSeq(this.content.options, target, seed);
      this.ordMech.setInitialSequence([...seq]);
    }
    const mode = this.content.response_mode;
    const item_count = this.content.options.length;
    this.recordEvent("round_started", { round_index: 0, mode, item_count });
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.canAct()) {
      return L.IGN;
    }
    const t = action.type;
    if (this.needsCommit) {
      const target = this.content.target_sequence ?? [];
      if (t === "reorder_step") {
        return this.ordMech.validate(action, target);
      }
      const isSub = t === "submit_order" || t === "sequence_submitted";
      const match = L.prefixMatch(this.seqIds(), target);
      return isSub ? this.ordMech.validate(action, target, match) : L.IGN;
    }
    const isTap = t === "tap_option" || t === "select_item";
    return isTap ? this.selMech.validate(action, this.selItems()) : L.IGN;
  }

  onItemSelect(itemId: string): ActionResult {
    if (this.needsCommit || !this.canAct()) {
      return L.IGN;
    }
    const c = L.clk(this);
    if (c.wrongItemId) {
      this.setRenderItemState(c.wrongItemId, "idle");
      c.wrongItemId = null;
    }
    [c.scaffoldHintLevel, this.selectedItemId] = [0, itemId];
    this.selMech.select(itemId);
    const opt = this.content.options.find((o) => o.item_id === itemId);
    const is_correct = opt?.is_correct === true;
    this.recordEvent("item_selected", { item_id: itemId, is_correct });
    this.setRenderItemState(itemId, is_correct ? "correct" : "wrong");
    if (!is_correct) {
      c.wrongItemId = itemId;
    }
    return this.finishRound(is_correct);
  }

  onReorderStep(fromIndex: number, toIndex: number): boolean {
    const ok =
      !(Number.isNaN(fromIndex) || Number.isNaN(toIndex)) &&
      this.needsCommit &&
      this.canAct();
    const moved = ok && this.ordMech.reorder(fromIndex, toIndex);
    if (moved) {
      const c = L.clk(this);
      [c.lastReorderAtMs, c.scaffoldHintLevel, c.stagedStepIndex] = [
        c.logicMs,
        0,
        null,
      ];
      this.wrongFlash.clear();
      this.clearWrongState();
      [c.reactionPose, c.reactionRemainingMs] = ["happy", GT018_HOP_MS];
    }
    return moved;
  }

  onSubmitSequence(): ActionResult {
    if (!(this.needsCommit && this.canAct())) {
      return L.IGN;
    }
    const c = L.clk(this);
    [c.scaffoldHintLevel, c.stagedStepIndex] = [0, null];
    const [target, sequence] = [
      this.content.target_sequence ?? [],
      this.seqIds(),
    ];
    const is_correct = L.prefixMatch(sequence, target);
    this.recordEvent("sequence_submitted", { is_correct, sequence });
    if (is_correct) {
      this.clearWrongState();
      return this.finishRound(true);
    }
    c.isSequenceWrong = true;
    c.wrongItemIds.clear();
    target.forEach((w, i) => {
      if (sequence[i] && sequence[i] !== w) {
        c.wrongItemIds.add(sequence[i]);
      }
    });
    this.setAllStates("wrong");
    return this.finishRound(false);
  }

  replayAudio(queueInvitation = true): void {
    const c = L.clk(this);
    c.replayCount += 1;
    [c.gramTapAtMs, c.playingUntilMs] = [c.logicMs, c.logicMs + 2200];
    if (queueInvitation) {
      c.pendingInvitation = this.content.audio_prompt.text;
    }
  }

  getReplayCount(): number {
    return L.clk(this).replayCount;
  }

  setPointerOver(pt: PtArg, maybeY?: number): void {
    const x = typeof pt === "number" ? pt : pt.x;
    const y = typeof pt === "number" ? (maybeY ?? 0) : pt.y;
    const [n, gSlot] = [this.content.options.length, this.gramSlot()];
    L.clk(this).hoveredTarget = L.hitTarget(this.slots, n, gSlot, x, y);
  }

  clearPointerOver(): void {
    L.clk(this).hoveredTarget = null;
  }

  private clearWrongState(): void {
    const c = L.clk(this);
    if (c.wrongItemId) {
      this.setRenderItemState(c.wrongItemId, "idle");
      this.selMech.reset();
      if (this.selectedItemId === c.wrongItemId) {
        this.selectedItemId = null;
      }
      c.wrongItemId = null;
    }
    if (c.isSequenceWrong) {
      this.setAllStates("idle");
      c.isSequenceWrong = false;
      c.wrongItemIds.clear();
    }
  }

  override storyLine(): string {
    return GT018_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    const c = L.clk(this);
    return c.reactionRemainingMs > 0 && !this.isWon ? c.reactionPose : null;
  }

  update(deltaMs: number): void {
    const c = L.tickClk(this, deltaMs);
    if (this.wrongFlash.hasExpired(c.logicMs)) {
      this.wrongFlash.clear();
      this.clearWrongState();
    }
  }

  override destroy(): void {
    super.destroy();
    this.selectedItemId = null;
    this.wrongFlash.clear();
    L.resetClk(this, false, this.content.options, 0);
  }

  override checkWinCondition(): boolean {
    return this.needsCommit
      ? this.isWon
      : this.selMech.isSelectionComplete(this.selItems());
  }

  override toAction(gesture: Gesture): GameAction | null {
    const gTap =
      gesture.type === "tap" &&
      L.hitGram(this.gramSlot(), gesture.x, gesture.y);
    if (gTap) {
      this.replayAudio(false);
      return null;
    }
    if (!this.canAct()) {
      return null;
    }
    if (this.needsCommit) {
      const n = this.content.options.length;
      return L.toSeqAct(L.clk(this), this.slots, n, gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const opts = this.ordOpts();
    const idx = L.hitOpt(this.slots, opts.length, gesture.x, gesture.y);
    const id = idx >= 0 ? opts[idx]?.item_id : undefined;
    return id ? { type: "tap_option", data: { item_id: id } } : null;
  }

  override getOpeningAudioText(): string | null {
    return this.difficulty.auto_play_audio
      ? this.content.audio_prompt.text
      : null;
  }

  private seqMove(): { readonly from: number; readonly to: number } | null {
    const ok = this.needsCommit && this.slots.length > 0 && this.canAct();
    const tgt = this.content.target_sequence ?? [];
    return ok ? L.nextMove(this.seqIds(), tgt) : null;
  }

  override getHintTargetIndex(): number | null {
    if (!this.canAct()) {
      return null;
    }
    if (this.needsCommit) {
      return this.seqMove()?.from ?? null;
    }
    const i = this.ordOpts().findIndex((o) => o.is_correct === true);
    return i >= 0 ? i : null;
  }
  override getHintDestinationIndex(): number | null {
    return this.seqMove()?.to ?? null;
  }
  override getHintTarget(): HintTarget | null {
    if (!this.canAct()) {
      return null;
    }
    if (this.needsCommit) {
      const m = this.seqMove();
      return m ? { kind: "slot", index: m.to } : { kind: "action" };
    }
    const idx = this.getHintTargetIndex();
    return idx === null ? null : { kind: "slot", index: idx };
  }
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const [opts, seq] = [this.ordOpts(), this.seqIds()];
    return this.canAct()
      ? L.hintForLevel(level, this.content, this.slots, opts, seq)
      : null;
  }
  override getHintDemoSequence(level: HintLevel = 3): DemoSteps {
    const tgt = this.content.target_sequence ?? [];
    const s =
      level === 3 && this.seqMove() ? L.demoSteps(this.seqIds(), tgt) : [];
    return s.length >= 2 ? s : null;
  }
  override onScaffoldEscalated(level: HintLevel): void {
    const c = L.clk(this);
    c.scaffoldHintLevel = level;
    if (level === 1) {
      c.playingUntilMs = c.logicMs + 2400;
      c.pendingInvitation = this.content.audio_prompt.text;
    }
  }
  override onHintCleared(): void {
    L.clk(this).scaffoldHintLevel = 0;
  }
  override takeSpokenInvitation(): string | null {
    const c = L.clk(this);
    const text = c.pendingInvitation;
    c.pendingInvitation = null;
    return text;
  }

  override commit(action: GameAction): void {
    const d = typeof action.data === "object" && action.data ? action.data : {};
    const t = action.type;
    if (t === "reorder_step") {
      L.clk(this).stagedStepIndex = null;
      const f = Number(Reflect.get(d, "from_index"));
      this.onReorderStep(f, Number(Reflect.get(d, "to_index")));
    } else if (t === "tap_option" || t === "select_item") {
      const id = Reflect.get(d, "item_id");
      if (typeof id === "string") {
        this.onItemSelect(id);
      }
    } else if (t === "submit_order" || t === "sequence_submitted") {
      this.onSubmitSequence();
    }
  }

  private optVis(opt: Opt018, i: number): VP018 {
    const [c, id] = [L.clk(this), opt.item_id];
    const sel = this.selectedItemId === id || this.selMech.isSelected(id);
    const flash = this.wrongFlash.isActive(c.logicMs);
    return L.optVis(c, opt, i, [this.needsCommit, this.isWon, sel, flash]);
  }

  override getView(): EngineView {
    const c = L.clk(this);
    const entities: ViewEntity[] = this.ordOpts().map((opt, i) => {
      const st = this.optVis(opt, i).viewState;
      return L.optEntity(opt, i, st, this.needsCommit, this.slots[i]);
    });
    const gram = this.figureLayout().gramophone;
    const act =
      c.playingUntilMs > c.logicMs || c.hoveredTarget?.kind === "gramophone";
    entities.push(L.gramEntity(gram, act, this.content.audio_prompt));
    return { activePrompt: this.content.prompt, entities };
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const [sp, st, cs] = [this.logicSpace, this.stageRect, this.cssPerLogic];
    return L.computeSlots(this.content, ageBand, sp, st, cs);
  }

  getInstructionStrip(): readonly Opt018[] {
    return L.cueItems(this.content, false, this.isAudioEnabled());
  }

  private figureLayout(): Fig018 {
    const c = L.clk(this);
    const cue = c.scaffoldHintLevel >= 2 || this.isWon || c.isRoundClosed;
    const aud = this.isAudioEnabled();
    return L.figLayout(this.content, this.logicSpace, aud, cue, this.stageRect);
  }

  private gramSlot(): Slot {
    return L.gramSlot(this.figureLayout().gramophone);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    const [c, fig] = [L.clk(this), this.figureLayout()];
    const deg = this.degradation?.particles_enabled === false;
    const sb: ZoneRect = this.stageRect ?? { x: 0, y: 0, ...this.logicSpace };
    drawSceneBackground(ctx, rs, this.themeId);
    if (L.hasCaption(this.content, this.stageRect)) {
      const cap = this.stageRect ? splitCaption(this.stageRect).caption : sb;
      drawSubPromptText(ctx, rs, this.content.audio_prompt.text, cap);
    }
    const isPlaying = c.playingUntilMs > c.logicMs || this.isWon;
    const touching =
      c.hoveredTarget?.kind === "gramophone" || c.logicMs - c.gramTapAtMs < 240;
    const slot = L.gramSlot(fig.gramophone);
    const gp = { slot, isPlaying, touching, timeMs: c.logicMs, degraded: deg };
    S018.drawGT018Gramophone(ctx, rs, { ...gp, clampBounds: fig.figure });

    const act = isPlaying || c.scaffoldHintLevel >= 2 || c.isRoundClosed;
    const activeStepIndex = L.activeStep(c, fig.items.length, act);
    const cp = { chips: fig.chips, items: fig.items, activeStepIndex };
    if (fig.stripMode === "step-beads") {
      S018.drawGT018StepBeads(ctx, rs, { ...cp, muted: false });
    } else if (fig.stripMode !== "none") {
      const muted = fig.stripMode === "muted-cue";
      S018.drawGT018CueStrip(ctx, rs, { ...cp, muted });
    }
    const dock = dockRectAroundSlots(this.slots, this.stageRect);
    drawWoodenTokenDock(ctx, rs, dock);

    const [opts, tgt] = [this.ordOpts(), this.content.target_sequence ?? []];
    const wa = this.wrongFlash.isActive(c.logicMs)
      ? Math.max(0.15, 1 - this.wrongFlash.progress(c.logicMs))
      : 0;
    opts.forEach((opt, i) => {
      const s = this.slots[i];
      if (s) {
        const state = this.optVis(opt, i).cardState;
        const ok = this.needsCommit ? tgt[i] === opt.item_id : opt.is_correct;
        const orderNum = this.needsCommit ? i + 1 : undefined;
        const isSolutionReveal = c.isRoundClosed && Boolean(ok);
        const a = { id: opt.item_id, asset: opt.asset, state, index: i };
        const b = { orderNum, timeMs: c.logicMs, winAtMs: c.winAtMs };
        const d = { wrongAlpha: state === "wrong" ? wa : 0, degraded: deg };
        const e = { isRoundClosed: c.isRoundClosed, isSolutionReveal };
        const p = { ...a, ...b, ...d, ...e, stageBounds: sb };
        S018.drawGT018Card(ctx, rs, s, p);
      }
    });
  }
}
