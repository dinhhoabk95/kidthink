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
import type { EngineView, Gesture } from "#src/interaction";
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT015Board,
  drawGT015PaletteItem,
  type GT015RenderContext,
} from "#src/render/gt-015-shapes.js";
import {
  boxFromSlots,
  type CompleteLines,
  completeDistinctLines,
  drawMatchGlow,
  drawMontessoriControlOfErrorPill,
  drawSceneBackground,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  matchGlowAlpha,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import {
  type ConstraintViolation,
  findConstraintViolations,
  isSudokuCompleteAndValid,
} from "#src/systems/constraint-system";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  type GT015Clock,
  type GT015HintInput,
  type GT015Symbol,
  L,
  type SolMap,
  type SudokuCellState,
} from "./layout.js";
import type { GT015Content, GT015Difficulty } from "./template.js";

const CELL_MAX = { w: 96, h: 96 } as const;
type PtArg = { readonly x: number; readonly y: number } | number;
type Ctx = CanvasRenderingContext2D;
type Sys = RenderSystem;
type V = GT015RenderContext & {
  readonly clock: GT015Clock;
  readonly content: GT015Content;
};

export const GT015_STORY_LINE =
  "Hươu Cao Cổ xếp chỗ ngồi cho các bạn thú, mỗi hàng và mỗi cột không có hai bạn giống nhau. Bé giúp Hươu nhé!";
export const GT015_CHEER_MS = 1000;
export const GT015_WONDER_MS = 1500;

function drawCells(ctx: Ctx, rs: Sys, v: V): void {
  const [n, ph] = [v.content.grid_size, v.clock.elapsedMs / 600];
  for (let i = 0; i < n * n; i++) {
    const s0 = v.slots[i];
    if (s0) {
      L.drawCellAt(ctx, rs, v, i, s0);
      if (v.clock.scaffoldHintLevel === 1 && v.hintIdx === i) {
        const hr = Math.min(s0.w, s0.h) * 0.45;
        rs.drawScaffoldingHighlight(ctx, s0.x, s0.y, hr, ph);
      }
    }
  }
}

export class SudokuMiniSession extends TemplateGameSession<
  GT015Content,
  GT015Difficulty
> {
  degradation: DegradationState | null = null;
  private readonly cellStates = new Map<string, SudokuCellState>();
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private displaySymbols: GT015Symbol[] = [];
  private solution: SolMap = null;
  private selectedSymbolId: string | null = null;
  private activeViolations: readonly ConstraintViolation[] = [];
  private isRoundClosed = false;
  private viewCache: EngineView | null = null;
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();

  override readonly needsTray = true;
  override readonly usesPromptZone = true;

  override get trayItemCount(): number {
    return this.content.symbols.length;
  }
  override get stageRowCount(): number {
    return this.content.grid_size;
  }
  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    const c = this.content;
    const n = c.grid_size;
    this.exploreTracker.reset(false);
    this.cellStates.clear();
    this.displaySymbols = L.dispSyms(c.symbols, this.layoutSeed);
    this.solution = L.solveGivens(c);
    this.activeViolations = [];
    this.selectedSymbolId = null;
    this.wrongFlash.clear();
    this.mood.clear();
    this.isWon = false;
    this.isRoundClosed = false;
    this.viewCache = null;
    L.resetClk(this);
    const givens = new Map(c.cells.map((x) => [`${x.row},${x.col}`, x]));
    for (let i = 0; i < n * n; i++) {
      const [row, col] = [Math.floor(i / n), i % n];
      const value = givens.get(`${row},${col}`)?.symbol_id ?? null;
      const isInitial = value !== null;
      this.cellStates.set(`${row},${col}`, { row, col, value, isInitial });
    }
    const g = L.gridOf(c, this.cellStates);
    this.activeViolations = findConstraintViolations(g);
    this.recordEvent("game_started", { template_code: "GT-015", grid_size: n });
  }

  override isAcceptingInput(): boolean {
    return super.isAcceptingInput() && !this.isWon && !this.isRoundClosed;
  }
  override dispatch(gesture: Gesture): ActionResult | undefined {
    return this.isAcceptingInput() ? super.dispatch(gesture) : ACTION_IGNORED;
  }
  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }
  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }
  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }
  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }
  getGridSize(): number {
    return this.content.grid_size;
  }
  getSymbols(): readonly GT015Symbol[] {
    return this.displaySymbols.length
      ? this.displaySymbols
      : this.content.symbols;
  }
  getCellState(row: number, col: number): SudokuCellState | undefined {
    return this.cellStates.get(`${row},${col}`);
  }
  getAllCellStates(): readonly SudokuCellState[] {
    return [...this.cellStates.values()];
  }
  clearCell(row: number, col: number): boolean {
    return this.fillCell(row, col, null);
  }
  getSelectedSymbolId(): string | null {
    return this.selectedSymbolId;
  }
  getStagedItemId(): string | null {
    return this.selectedSymbolId;
  }
  isRoundClosedState(): boolean {
    return this.isRoundClosed;
  }
  getGhostSolution(): SolMap {
    return this.solution;
  }
  selectSymbol(symbolId: string | null): void {
    if (this.isAcceptingInput()) {
      this.selectedSymbolId = symbolId;
      this.viewCache = null;
      this.exploreTracker.recordExploreAction("symbol_selected");
    }
  }
  getViolations(): readonly ConstraintViolation[] {
    return this.activeViolations;
  }
  isConflicted(row: number, col: number): boolean {
    return this.activeViolations.some((v) => v.row === row && v.col === col);
  }

  private onFilledSymbol(row: number, col: number, symId: string): void {
    const clk = L.getClk(this);
    clk.stepPopMap.set(`${row},${col}`, clk.elapsedMs);
    const bad = this.isConflicted(row, col);
    const ev = { row, col, symbol_id: symId };
    this.recordEvent("cell_filled", { ...ev, is_valid: !bad });
    if (!bad) {
      this.wrongFlash.clear();
      clk.scaffoldHintLevel = 0;
      this.queueSfx("seat_pat");
      this.mood.set("cheer", GT015_CHEER_MS);
      this.exploreTracker.recordExploreAction("cell_filled");
      return;
    }
    this.mood.set("wonder", GT015_WONDER_MS);
    this.wrongFlash.trigger(clk.elapsedMs);
    this.recordEvent("constraint_violated", ev);
    const box = this.activeViolations.some(
      (v) => v.row === row && v.col === col && v.kind === "box"
    );
    const pfx = box
      ? "Trùng hình trong vùng 2×2, hàng"
      : "Trùng hình trên hàng";
    const reasonVi = `${pfx} ${row + 1} hoặc cột ${col + 1}`;
    const diag = { reasonVi, targetId: `${row}:${col}`, actualValue: symId };
    this.exploreTracker.recordWrongAttempt(diag);
    const ms = this.exploreTracker.isMicroSandboxActive();
    this.recordEvent("control_of_error", { ...ev, micro_sandbox: ms });
    if (!this.difficulty.allow_retry) {
      this.isRoundClosed = true;
      this.selectedSymbolId = null;
      clk.selectedCellIndex = null;
      this.completeSession();
    }
  }

  fillCell(row: number, col: number, symbolId: string | null): boolean {
    if (!this.isAcceptingInput()) {
      return false;
    }
    const key = `${row},${col}`;
    const st = this.cellStates.get(key);
    const clk = L.getClk(this);
    if (!st || st.isInitial) {
      if (st?.isInitial) {
        clk.lockedShakeMap.set(key, clk.elapsedMs);
      }
      return false;
    }
    const known = this.content.symbols.some((s) => s.symbol_id === symbolId);
    if (symbolId !== null && !known) {
      return false;
    }
    this.cellStates.set(key, { ...st, value: symbolId });
    this.viewCache = null;
    const g = L.gridOf(this.content, this.cellStates);
    this.activeViolations = findConstraintViolations(g);
    if (symbolId !== null) {
      this.onFilledSymbol(row, col, symbolId);
      if (this.isRoundClosed) {
        return true;
      }
    } else if (this.activeViolations.length === 0) {
      this.wrongFlash.clear();
    }
    if (this.checkWinCondition()) {
      clk.winAtMs = clk.winAtMs ?? clk.elapsedMs;
      this.selectedSymbolId = null;
      clk.selectedCellIndex = null;
      this.exploreTracker.recordCorrectAttempt();
      this.winSession();
    }
    return true;
  }

  override storyLine(): string {
    return GT015_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    if (!(deltaMs > 0 && Number.isFinite(deltaMs))) {
      return;
    }
    this.mood.tick(deltaMs);
    this.exploreTracker.tick(deltaMs);
    const clk = L.getClk(this);
    clk.elapsedMs += deltaMs;
    if (clk.pressedSlotIndex !== null && clk.elapsedMs >= clk.pressedUntilMs) {
      clk.pressedSlotIndex = null;
    }
  }

  override validateAction(action: GameAction): ActionResult {
    const f = L.actFields(action.data);
    if (!this.isAcceptingInput() || f.r === null || f.c === null || !f.sym) {
      return ACTION_IGNORED;
    }
    const ts = this.cellStates.get(`${f.r},${f.c}`);
    const known = this.content.symbols.some((s) => s.symbol_id === f.sym);
    if (!ts || ts.isInitial || !known) {
      return ACTION_IGNORED;
    }
    const fk = action.type === "move_cell" ? `${f.fr},${f.fc}` : undefined;
    if (fk !== undefined) {
      const fs = this.cellStates.get(fk);
      if (!fs || fs.isInitial || !fs.value) {
        return ACTION_IGNORED;
      }
    } else if (action.type !== "fill_cell") {
      return ACTION_IGNORED;
    }
    const ov = { clearKey: fk, setRow: f.r, setCol: f.c, setValue: f.sym };
    const g = L.gridOf(this.content, this.cellStates, ov);
    const bad = findConstraintViolations(g).some(
      (v) => v.row === f.r && v.col === f.c
    );
    return bad ? ACTION_RETRY : ACTION_CORRECT;
  }

  override checkWinCondition(): boolean {
    const g = L.gridOf(this.content, this.cellStates);
    return isSudokuCompleteAndValid(g);
  }

  override destroy(): void {
    super.destroy();
    this.cellStates.clear();
    this.activeViolations = [];
    this.selectedSymbolId = null;
    this.isRoundClosed = false;
    L.resetClk(this);
  }

  private hintIn(): GT015HintInput {
    const { content, cellStates: states, solution } = this;
    return { content, states, violations: this.activeViolations, solution };
  }

  private pickHintCell(): number | null {
    return this.isAcceptingInput() ? L.pickHint(this.hintIn()) : null;
  }

  private hintPair(): [number, number] | null {
    const cell = this.pickHintCell();
    if (cell === null) {
      return null;
    }
    const id = L.hintSym(this.hintIn(), cell);
    return [cell, this.getSymbols().findIndex((s) => s.symbol_id === id)];
  }

  override getHintTargetIndex(): number | null {
    const p = this.hintPair();
    if (!p) {
      return null;
    }
    return p[1] < 0 ? p[0] : this.content.grid_size ** 2 + p[1];
  }

  override getHintDestinationIndex(): number | null {
    const p = this.hintPair();
    return p && p[1] >= 0 ? p[0] : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const cell = this.pickHintCell();
    if (cell === null) {
      return null;
    }
    const n = this.content.grid_size;
    if (level === 1 || level === 2) {
      // Một ô đích duy nhất ở L1 và L2 (`BR-SCF-12`): tô cả hàng/cột/hộp làm sáng nhiều ô một lúc.
      return {
        kind: "region",
        ids: [`cell-${Math.floor(cell / n)}-${cell % n}`],
      };
    }
    return this.getHintTarget();
  }

  override onScaffoldEscalated(level: HintLevel, _tr: string): void {
    L.getClk(this).scaffoldHintLevel = level;
  }
  override onHintCleared(): void {
    L.getClk(this).scaffoldHintLevel = 0;
  }

  private hitSlot(ptOrX: PtArg, maybeY?: number): number | null | undefined {
    const pt = L.parsePt(ptOrX, maybeY);
    const n2 = this.content.grid_size ** 2;
    return pt ? L.hitAt(this.slots, n2, pt) : undefined;
  }

  onPointerDown(ptOrX: PtArg, maybeY?: number): void {
    const hit = this.hitSlot(ptOrX, maybeY);
    if (hit !== undefined) {
      const clk = L.getClk(this);
      clk.pressedSlotIndex = hit;
      clk.pressedUntilMs = hit === null ? 0 : clk.elapsedMs + L.PRESS_MS;
    }
  }

  setPointerOver(ptOrX: PtArg, maybeY?: number): void {
    const hit = this.hitSlot(ptOrX, maybeY);
    if (hit !== undefined) {
      L.getClk(this).hoveredSlotIndex = hit;
    }
  }

  clearPointerOver(): void {
    const clk = L.getClk(this);
    clk.hoveredSlotIndex = null;
    clk.pressedSlotIndex = null;
  }

  override commit(action: GameAction): void {
    const f = L.actFields(action.data);
    if (!this.isAcceptingInput() || f.r === null || f.c === null) {
      return;
    }
    L.getClk(this).selectedCellIndex = null;
    if (action.type === "clear_cell") {
      this.fillCell(f.r, f.c, null);
    } else if (action.type === "move_cell" && f.fr !== null && f.fc !== null) {
      if (f.sym && this.fillCell(f.fr, f.fc, null)) {
        this.fillCell(f.r, f.c, f.sym);
      }
    } else if (action.type === "fill_cell" && f.sym !== undefined) {
      this.fillCell(f.r, f.c, f.sym);
      this.selectedSymbolId = null;
    }
  }

  private buildRenderCtx(st?: ZoneRect, tr?: ZoneRect, withHint = false): V {
    const clk = L.getClk(this);
    const { w, h } = this.logicSpace;
    const stageBounds = st ?? this.stageRect ?? { x: 0, y: 0, w, h };
    const wf = this.wrongFlash.isActive(clk.elapsedMs)
      ? Math.max(0.02, this.wrongFlash.progress(clk.elapsedMs))
      : 0;
    const syms = this.getSymbols();
    const sel = this.selectedSymbolId;
    const needHint =
      withHint && (clk.scaffoldHintLevel === 1 || clk.scaffoldHintLevel === 2);
    const hintIdx = needHint ? this.pickHintCell() : null;
    const a = { slots: this.slots, symbols: syms, selectedSymbolId: sel };
    const b = { hintIdx, clock: clk, trayBounds: tr };
    const deg = Boolean(
      this.degradation && !this.degradation.soft_shadows_enabled
    );
    const c = { stageBounds, isWon: this.isWon, degraded: deg };
    const d = { isRoundClosed: this.isRoundClosed, wrongFlashAlpha: wf };
    return { ...this.hintIn(), ...a, ...b, ...c, ...d };
  }

  override toAction(gesture: Gesture): GameAction | null {
    this.viewCache = null;
    return this.isAcceptingInput()
      ? L.onGesture(this.buildRenderCtx(), gesture, (id) =>
          this.selectSymbol(id)
        )
      : null;
  }

  override getView(): EngineView {
    this.viewCache ??= {
      activePrompt: this.content.prompt,
      entities: L.viewEnts(this.buildRenderCtx()),
    };
    return this.viewCache;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    this.viewCache = null;
    const syms = this.getSymbols();
    const n = this.content.grid_size;
    const z = pickTrayZones(this.stageRect, this.trayRect);
    if (!z) {
      const a = { slotCount: syms.length, targetCount: n * n, ageBand };
      const fn = resolveLayout("matrix-slot-grid");
      return fn({ ...a, logic: this.logicSpace });
    }
    const tf = resolveTouchFloor(ageBand, this.cssPerLogic);
    const a = { count: n * n, cols: n, stage: z.stage, touchFloor: tf };
    const b = { ...a, maxCell: CELL_MAX, role: "target" as const };
    const cs = computeStageCellSlots(b);
    return [
      ...cs,
      ...computeTraySourceSlots(syms.length, z.tray, tf, cs.length),
    ];
  }

  getCompleteLines(): CompleteLines {
    const n = this.content.grid_size;
    const st = (r: number, c: number) => this.cellStates.get(`${r},${c}`);
    const ch = (r: number, c: number) =>
      st(r, c)?.isInitial === false && Boolean(st(r, c)?.value);
    const idx = Array.from({ length: n }, (_, i) => i);
    const l = completeDistinctLines(n, (r, c) => st(r, c)?.value ?? null);
    return {
      rows: l.rows.filter((r) => idx.some((c) => ch(r, c))),
      cols: l.cols.filter((c) => idx.some((r) => ch(r, c))),
    };
  }

  render(ctx: CanvasRenderingContext2D, rs: Sys, timeMs: number): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const n = this.content.grid_size;
    const cs = this.slots.slice(0, n * n);
    const stageBounds = this.stageRect ?? sceneBox(rs);
    const rctx = this.buildRenderCtx(stageBounds, zones?.tray, true);
    drawStoryCharacterInStage(ctx, "giraffe", this.stageRect, this.slots);
    drawGT015Board(ctx, rs, rctx);
    const lines = this.getCompleteLines();
    const glow = matchGlowAlpha(timeMs, rs.reducedMotion);
    const grps = [
      ...lines.rows.map((r) => cs.slice(r * n, (r + 1) * n)),
      ...lines.cols.map((c) => cs.filter((_, i) => i % n === c)),
    ];
    for (const grp of grps) {
      const box = boxFromSlots(grp);
      if (box) {
        drawMatchGlow(ctx, box, glow);
      }
    }
    drawCells(ctx, rs, rctx);
    for (let i = 0; i < rctx.symbols.length; i++) {
      drawGT015PaletteItem(ctx, rs, rctx, i);
    }
    const [trk, sc] = [this.exploreTracker, rs.viewport?.scale];
    drawMontessoriControlOfErrorPill(ctx, stageBounds, trk, sc);
  }
}

export const GT015Session = SudokuMiniSession;
