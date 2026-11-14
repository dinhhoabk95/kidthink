import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type { GameAction } from "#src/game-session";
import type { EngineView, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawGT033AxisGuides,
  drawGT033LoomBackdrop,
  drawGT033SpoolHalo,
  drawGT033WeaveCell,
  type GT033CellVisualState,
} from "#src/render/gt-033-shapes.js";
import {
  boxFromSlots,
  brocadeFrame,
  drawBrocadeFrame,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  drawYarnBall,
  drawYarnThread,
  type YarnThread,
} from "#src/render/index.js";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder.js";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT033Content, GT033PaletteItem } from "./template.js";

export interface DualStamp {
  readonly simMs: number;
  readonly wallMs: number;
}

export interface GT033Clock {
  simMs: number;
  lastWallMs: number;
  winStamp: DualStamp | null;
  activeHintLevel: number;
  hoveredEntityId: string | null;
  wrongFlashes: Map<number, DualStamp>;
  particles: Particle[];
}

export interface GT033ActionPayload {
  readonly cellIndex: number | null;
  readonly colorId: string | null;
}

export interface GT033HintTarget {
  readonly cellIndex: number;
  readonly colorId: string;
  readonly paletteIndex: number;
}

export interface GT033ViewState {
  readonly content: GT033Content;
  readonly placedCells: readonly (string | null)[];
  readonly selectedColorId: string | null;
  readonly slots: readonly Slot[];
  readonly hoveredEntityId: string | null;
  readonly brokenRowIndex: number | null;
  readonly brokenColIndex: number | null;
  readonly isWin: boolean;
}

export interface GT033RenderState {
  readonly clockKey: object;
  readonly content: GT033Content;
  readonly initialCells: readonly (string | null)[];
  readonly placedCells: readonly (string | null)[];
  readonly expectedCells: readonly (string | null)[];
  readonly slots: readonly Slot[];
  readonly stageRect: ZoneRect | undefined;
  readonly trayRect: ZoneRect | undefined;
  readonly themeId: string | undefined;
  readonly selectedColorId: string | null;
  readonly selectedCellIndex: number | null;
  readonly brokenRowIndex: number | null;
  readonly brokenColIndex: number | null;
  readonly isWin: boolean;
  readonly roundClosed: boolean;
  readonly particlesEnabled: boolean;
  readonly thread: YarnThread | null;
}

const KNOWN_WEAVE_COLOR_KEYS = new Set([
  "red",
  "blue",
  "yellow",
  "green",
  "amber",
  "purple",
  "pink",
  "teal",
]);
const FALLBACK_WEAVE_COLORS = ["red", "blue", "amber", "green"] as const;
const WEAVE_COLOR_NAME_VI: Readonly<Record<string, string>> = {
  red: "Đỏ",
  blue: "Xanh dương",
  yellow: "Vàng",
  amber: "Vàng",
  green: "Xanh lá",
  purple: "Tím",
  pink: "Hồng",
  teal: "Ngọc",
};

const clockMap = new WeakMap<object, GT033Clock>();

export function getGT033Clock(key: object): GT033Clock {
  let clock = clockMap.get(key);
  if (!clock) {
    clock = {
      simMs: 0,
      lastWallMs: 0,
      winStamp: null,
      activeHintLevel: 0,
      hoveredEntityId: null,
      wrongFlashes: new Map(),
      particles: [],
    };
    clockMap.set(key, clock);
  }
  return clock;
}

export function peekGT033Clock(key: object): GT033Clock | undefined {
  return clockMap.get(key);
}

export function resetGT033Clock(key: object): void {
  clockMap.delete(key);
}

export function elapsedDual(
  simMs: number,
  wallMs: number,
  stamp: DualStamp
): number {
  return Math.max(0, simMs - stamp.simMs, wallMs - stamp.wallMs);
}

export function resolveCellEntityId(
  cellIndex: number,
  paletteColorIds: ReadonlySet<string>
): string {
  const rawCellId = `cell_${cellIndex}`;
  return paletteColorIds.has(rawCellId) ? `grid:${rawCellId}` : rawCellId;
}

export function resolveVisualColorId(
  palette: readonly GT033PaletteItem[],
  colorId: string | null
): string | null {
  if (!colorId) {
    return null;
  }
  const lower = colorId.toLowerCase();
  if (KNOWN_WEAVE_COLOR_KEYS.has(lower)) {
    return colorId;
  }
  const palIdx = palette.findIndex((p) => p.color_id === colorId);
  const safeIdx = palIdx >= 0 ? palIdx : 0;
  return FALLBACK_WEAVE_COLORS[safeIdx % FALLBACK_WEAVE_COLORS.length] ?? "red";
}

export function resolvePaletteDisplayLabel(
  palette: readonly GT033PaletteItem[],
  item: GT033PaletteItem,
  index: number
): string {
  if (item.name_vi) {
    return item.name_vi;
  }
  const visualKey = (
    resolveVisualColorId(palette, item.color_id) ?? "red"
  ).toLowerCase();
  return WEAVE_COLOR_NAME_VI[visualKey] ?? `Màu ${index + 1}`;
}

export function extractGT033Payload(action: GameAction): GT033ActionPayload {
  const data = action.data;
  if (!data || typeof data !== "object") {
    return { cellIndex: null, colorId: null };
  }
  const rawIndex =
    Reflect.get(data, "cell_index") ??
    Reflect.get(data, "index") ??
    Reflect.get(data, "slot_index");
  const rawColor = Reflect.get(data, "color_id");
  let cellIndex: number | null = null;
  if (typeof rawIndex === "number" && Number.isFinite(rawIndex)) {
    cellIndex = rawIndex;
  } else if (typeof rawIndex === "string" && rawIndex.trim() !== "") {
    const parsed = Number(rawIndex);
    cellIndex = Number.isFinite(parsed) ? parsed : null;
  }
  return {
    cellIndex,
    colorId: typeof rawColor === "string" ? rawColor : null,
  };
}

export function computeGT033Slots(
  content: GT033Content,
  ageBand: AgeBand,
  cssPerLogic: number,
  logicSpace: { readonly w: number; readonly h: number },
  stageRect: ZoneRect | undefined,
  trayRect: ZoneRect | undefined
): readonly Slot[] {
  const { rows, cols } = content.grid;
  const totalCells = rows * cols;
  const paletteCount = content.palette.length;
  const zones = pickTrayZones(stageRect, trayRect);

  if (zones) {
    const touchFloor = resolveTouchFloor(ageBand, cssPerLogic);
    const cells = computeStageCellSlots({
      count: totalCells,
      cols,
      stage: zones.stage,
      touchFloor,
      maxCell: { w: 68, h: 68 },
      role: "target",
    });
    const palette = computeTraySourceSlots(
      paletteCount,
      zones.tray,
      touchFloor,
      totalCells,
      true
    );
    return insetDrawSize([...cells, ...palette], zones.stage);
  }

  const layoutFn = resolveLayout("weave-grid");
  return layoutFn({
    slotCount: paletteCount,
    ageBand,
    targetCount: totalCells,
    logic: logicSpace,
  });
}

function resolveCellEntityState(
  isWin: boolean,
  isBrokenCell: boolean,
  placedColorId: string | null,
  isHovered: boolean
): ViewEntity["state"] {
  if (isWin) {
    return "correct";
  }
  if (isBrokenCell) {
    return "incorrect";
  }
  if (placedColorId !== null) {
    return "selected";
  }
  return isHovered ? "active" : "idle";
}

function resolvePaletteEntityState(
  isSelected: boolean,
  isHovered: boolean
): ViewEntity["state"] {
  if (isSelected) {
    return "selected";
  }
  return isHovered ? "active" : "idle";
}

function buildCellEntity(
  i: number,
  slot: Slot,
  viewState: GT033ViewState,
  paletteColorIds: ReadonlySet<string>
): ViewEntity {
  const {
    content,
    placedCells,
    hoveredEntityId,
    brokenRowIndex,
    brokenColIndex,
    isWin,
  } = viewState;
  const placedColorId = placedCells[i] ?? null;
  const cellEntityId = resolveCellEntityId(i, paletteColorIds);
  const row = Math.floor(i / content.grid.cols);
  const col = i % content.grid.cols;
  const isBrokenCell =
    placedColorId !== null &&
    (brokenRowIndex === row || brokenColIndex === col);
  const palIdx = placedColorId
    ? content.palette.findIndex((p) => p.color_id === placedColorId)
    : -1;
  const paletteItem = palIdx >= 0 ? content.palette[palIdx] : undefined;
  const itemLabels = paletteItem
    ? resolveAssetLabels(paletteItem.asset)
    : undefined;
  const displayLabel =
    paletteItem && palIdx >= 0
      ? resolvePaletteDisplayLabel(content.palette, paletteItem, palIdx)
      : "?";
  const spokenLabel =
    paletteItem && palIdx >= 0
      ? (formatSpokenLabel(displayLabel) ??
        itemLabels?.spokenLabel ??
        formatSpokenLabel(`ô số ${formatNumberWord(i + 1)}`))
      : formatSpokenLabel(`ô trống số ${formatNumberWord(i + 1)}`);
  return {
    id: cellEntityId,
    slotIndex: i,
    role: "target",
    state: resolveCellEntityState(
      isWin,
      isBrokenCell,
      placedColorId,
      hoveredEntityId === cellEntityId
    ),
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    hitW: slot.hitW,
    hitH: slot.hitH,
    hitShape: "square",
    glyph: itemLabels?.glyph,
    label: displayLabel,
    spokenLabel,
    spokenAudioPath: itemLabels?.spokenAudioPath,
  };
}

function buildPaletteEntity(
  p: number,
  item: GT033PaletteItem,
  slot: Slot,
  viewState: GT033ViewState,
  totalCells: number
): ViewEntity {
  const { content, selectedColorId, hoveredEntityId } = viewState;
  const itemLabels = resolveAssetLabels(item.asset);
  const displayLabel = resolvePaletteDisplayLabel(content.palette, item, p);
  const spokenLabel =
    formatSpokenLabel(displayLabel) ??
    itemLabels.spokenLabel ??
    formatSpokenLabel(`màu số ${formatNumberWord(p + 1)}`);
  return {
    id: item.color_id,
    slotIndex: totalCells + p,
    role: "source",
    state: resolvePaletteEntityState(
      selectedColorId === item.color_id,
      hoveredEntityId === item.color_id
    ),
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    hitW: slot.hitW,
    hitH: slot.hitH,
    hitShape: "circle",
    glyph: itemLabels.glyph,
    label: displayLabel,
    spokenLabel,
    spokenAudioPath: itemLabels.spokenAudioPath,
  };
}

export function buildGT033View(viewState: GT033ViewState): EngineView {
  const { content, slots } = viewState;
  const entities: ViewEntity[] = [];
  const totalCells = content.grid.rows * content.grid.cols;
  const paletteColorIds = new Set(content.palette.map((p) => p.color_id));

  for (let i = 0; i < totalCells; i++) {
    const slot = slots[i];
    if (slot) {
      entities.push(buildCellEntity(i, slot, viewState, paletteColorIds));
    }
  }
  for (let p = 0; p < content.palette.length; p++) {
    const item = content.palette[p];
    const slot = slots[totalCells + p];
    if (item && slot) {
      entities.push(buildPaletteEntity(p, item, slot, viewState, totalCells));
    }
  }
  return { activePrompt: content.prompt, entities };
}

export function resolveGT033HintTarget(
  content: GT033Content,
  placedCells: readonly (string | null)[],
  expectedCells: readonly (string | null)[]
): GT033HintTarget | null {
  const totalCells = content.grid.rows * content.grid.cols;
  for (let i = 0; i < totalCells; i++) {
    const expected = expectedCells[i] ?? null;
    if (expected && placedCells[i] !== expected) {
      const paletteIndex = content.palette.findIndex(
        (p) => p.color_id === expected
      );
      if (paletteIndex >= 0) {
        return { cellIndex: i, colorId: expected, paletteIndex };
      }
    }
  }
  return null;
}

export function resolveGT033HintTargetForLevel(
  level: HintLevel,
  content: GT033Content,
  placedCells: readonly (string | null)[],
  expectedCells: readonly (string | null)[],
  selectedColorId: string | null
): HintTarget | null {
  const target = resolveGT033HintTarget(content, placedCells, expectedCells);
  if (!target) {
    return null;
  }
  const { rows, cols } = content.grid;
  const totalCells = rows * cols;
  const paletteColorIds = new Set(content.palette.map((p) => p.color_id));
  const targetRow = Math.floor(target.cellIndex / cols);
  const targetCol = target.cellIndex % cols;
  const rowIds = Array.from({ length: cols }, (_, c) =>
    resolveCellEntityId(targetRow * cols + c, paletteColorIds)
  );
  if (level <= 1) {
    return { kind: "region", ids: rowIds };
  }
  if (level === 2) {
    const colIds = Array.from({ length: rows }, (_, r) =>
      resolveCellEntityId(r * cols + targetCol, paletteColorIds)
    );
    return { kind: "region", ids: [...new Set([...rowIds, ...colIds])] };
  }
  if (selectedColorId === target.colorId) {
    return { kind: "slot", index: target.cellIndex };
  }
  return {
    kind: "slot",
    index: totalCells + target.paletteIndex,
    toIndex: target.cellIndex,
  };
}

export function resolveGT033HintDemoSequence(
  level: HintLevel,
  content: GT033Content,
  placedCells: readonly (string | null)[],
  expectedCells: readonly (string | null)[],
  selectedColorId: string | null
): readonly HintDemoStep[] | null {
  if (level < 3) {
    return null;
  }
  const target = resolveGT033HintTarget(content, placedCells, expectedCells);
  if (!target) {
    return null;
  }
  if (selectedColorId === target.colorId) {
    return [{ from: target.cellIndex }];
  }
  const totalCells = content.grid.rows * content.grid.cols;
  return [{ from: totalCells + target.paletteIndex, to: target.cellIndex }];
}

function resolveCellVisualState(
  isOriginal: boolean,
  placedColorId: string | null,
  expectedColorId: string | null,
  isSelected: boolean,
  isHovered: boolean,
  isBrokenAxis: boolean,
  wrongFlashActive: boolean,
  isWin: boolean
): GT033CellVisualState {
  if (isOriginal) {
    return "given";
  }
  if (wrongFlashActive || (isBrokenAxis && placedColorId !== null)) {
    return "wrong";
  }
  if (isWin || (placedColorId !== null && placedColorId === expectedColorId)) {
    return "correct";
  }
  if (isHovered || isSelected) {
    return "hovered";
  }
  return "idle";
}

function computeWinWavePhase(
  isWin: boolean,
  reducedMotion: boolean,
  winElapsed: number,
  row: number,
  col: number,
  rows: number,
  cols: number
): number {
  if (!isWin) {
    return 0;
  }
  if (reducedMotion || winElapsed >= 600) {
    return 0.35;
  }
  if (winElapsed < 300) {
    const activeRow = Math.min(rows - 1, Math.floor((winElapsed / 300) * rows));
    if (row === activeRow) {
      return 1;
    }
    return row < activeRow ? 0.35 : 0;
  }
  const activeCol = Math.min(
    cols - 1,
    Math.floor(((winElapsed - 300) / 300) * cols)
  );
  return col === activeCol ? 1 : 0.35;
}

function renderGT033Cells(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number,
  state: GT033RenderState,
  clock: GT033Clock,
  hintTarget: GT033HintTarget | null,
  paletteColorIds: ReadonlySet<string>,
  stageClip: ZoneRect | undefined
): void {
  const { rows, cols } = state.content.grid;
  const totalCells = rows * cols;
  const winElapsed = clock.winStamp
    ? elapsedDual(clock.simMs, timeMs, clock.winStamp)
    : 0;
  for (let i = 0; i < totalCells; i++) {
    const slot = state.slots[i];
    if (!slot) {
      continue;
    }
    const row = Math.floor(i / cols);
    const col = i % cols;
    const isOriginal = state.initialCells[i] !== null;
    const placedColorId = state.placedCells[i] ?? null;
    const expectedColorId = state.expectedCells[i] ?? null;
    const visualColorId = resolveVisualColorId(
      state.content.palette,
      placedColorId
    );
    const wrongStamp = clock.wrongFlashes.get(i);
    const wrongFlashActive =
      wrongStamp !== undefined &&
      elapsedDual(clock.simMs, timeMs, wrongStamp) < 800;
    const isBrokenAxis =
      state.brokenRowIndex === row || state.brokenColIndex === col;
    const cellId = resolveCellEntityId(i, paletteColorIds);
    const isHovered = clock.hoveredEntityId === cellId;
    const cellState = resolveCellVisualState(
      isOriginal,
      placedColorId,
      expectedColorId,
      state.selectedCellIndex === i,
      isHovered,
      isBrokenAxis,
      wrongFlashActive,
      state.isWin
    );
    const showGhost =
      (state.roundClosed && !isOriginal && placedColorId !== expectedColorId) ||
      (clock.activeHintLevel >= 3 &&
        hintTarget?.cellIndex === i &&
        placedColorId !== hintTarget.colorId);
    const ghostColorId = showGhost
      ? resolveVisualColorId(state.content.palette, expectedColorId)
      : null;

    drawGT033WeaveCell(ctx, rs, {
      slot,
      clip: stageClip,
      colorId: visualColorId,
      ghostColorId,
      state: cellState,
      isSelectedCell: state.selectedCellIndex === i,
      winWavePhase: computeWinWavePhase(
        state.isWin,
        rs.reducedMotion,
        winElapsed,
        row,
        col,
        rows,
        cols
      ),
      timeMs,
    });
  }
}

function renderGT033Palette(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number,
  state: GT033RenderState,
  clock: GT033Clock,
  hintTarget: GT033HintTarget | null,
  trayClip: ZoneRect | undefined
): void {
  const totalCells = state.content.grid.rows * state.content.grid.cols;
  for (let p = 0; p < state.content.palette.length; p++) {
    const item = state.content.palette[p];
    const slot = state.slots[totalCells + p];
    if (!(item && slot)) {
      continue;
    }
    const isSelected = state.selectedColorId === item.color_id;
    const isHovered = clock.hoveredEntityId === item.color_id;
    const isHinted =
      clock.activeHintLevel >= 3 && hintTarget?.colorId === item.color_id;
    drawGT033SpoolHalo(ctx, rs, {
      slot,
      clip: trayClip,
      isSelected,
      isHovered,
      isHinted,
      timeMs,
    });
    drawSlotItem(
      ctx,
      rs,
      slot,
      {
        id: item.color_id,
        text: "",
        label: resolvePaletteDisplayLabel(state.content.palette, item, p),
        state: isSelected ? "selected" : "idle",
      },
      "circle"
    );
    drawYarnBall(
      ctx,
      resolveVisualColorId(state.content.palette, item.color_id) ??
        item.color_id,
      slot.x,
      slot.y,
      Math.min(slot.w, slot.h) * 0.36
    );
  }
}

export function renderGT033Frame(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number,
  state: GT033RenderState
): void {
  const clock = getGT033Clock(state.clockKey);
  clock.lastWallMs = timeMs;
  drawSceneBackground(ctx, rs, state.themeId);
  const zones = pickTrayZones(state.stageRect, state.trayRect);
  if (!zones) {
    const subPrompt = state.isWin
      ? "Tuyệt vời! Tấm thảm hoa văn đã hoàn thành!"
      : "Chọn sợi màu và dệt vào ô trống nhé";
    drawSubPromptText(ctx, rs, subPrompt);
  }

  const { rows, cols } = state.content.grid;
  const totalCells = rows * cols;
  const gridSlots = state.slots.slice(0, totalCells);
  const gridBox = boxFromSlots(gridSlots);
  const paletteColorIds = new Set(state.content.palette.map((p) => p.color_id));
  const hintTarget =
    clock.activeHintLevel > 0
      ? resolveGT033HintTarget(
          state.content,
          state.placedCells,
          state.expectedCells
        )
      : null;

  const rowColors = Array.from({ length: rows }, (_, r) =>
    resolveVisualColorId(
      state.content.palette,
      state.placedCells[r * cols] ?? null
    )
  );
  const colColors = Array.from({ length: cols }, (_, c) =>
    resolveVisualColorId(state.content.palette, state.placedCells[c] ?? null)
  );
  const stageClip = zones?.stage ?? state.stageRect;

  drawGT033LoomBackdrop(ctx, rs, {
    gridBox,
    clip: stageClip,
    rows,
    cols,
    slots: gridSlots,
    rowColors,
    colColors,
  });

  const frame =
    gridBox && state.stageRect ? brocadeFrame(gridBox, state.stageRect) : null;
  if (frame) {
    drawBrocadeFrame(ctx, frame);
  }

  drawGT033AxisGuides(ctx, rs, {
    gridBox,
    clip: stageClip,
    rows,
    cols,
    slots: gridSlots,
    brokenRowIndex: state.brokenRowIndex,
    brokenColIndex: state.brokenColIndex,
    hintRowIndex: hintTarget ? Math.floor(hintTarget.cellIndex / cols) : null,
    hintColIndex: hintTarget ? hintTarget.cellIndex % cols : null,
    hintLevel: clock.activeHintLevel,
    timeMs,
  });

  renderGT033Cells(
    ctx,
    rs,
    timeMs,
    state,
    clock,
    hintTarget,
    paletteColorIds,
    stageClip
  );
  drawWoodenTokenDock(ctx, rs, zones?.tray);
  renderGT033Palette(
    ctx,
    rs,
    timeMs,
    state,
    clock,
    hintTarget,
    zones?.tray ?? state.trayRect
  );

  if (state.thread) {
    drawYarnThread(ctx, state.thread);
  }
  if (state.particlesEnabled) {
    rs.drawParticles(ctx, clock.particles);
  }
}
