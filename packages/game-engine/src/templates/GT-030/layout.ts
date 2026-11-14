import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT030BrokenFallback,
  drawGT030OptionCardOverlay,
  drawGT030PlacedUnitsOverlay,
  drawGT030ScaffoldOverlay,
  drawGT030SourceTrayEffect,
  drawGT030Workbench,
  type GT030ScaffoldVisual,
  type GT030VisualState,
} from "#src/render/gt-030-shapes";
import {
  drawGhostAssetInSlot,
  drawMeasurementGuideBar,
  drawNumberRodAcrossSlots,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawUnitGapHatch,
  drawWoodenTokenDock,
  type ItemVisualState,
  slotAtPoint,
} from "#src/render/index.js";
import { drawMeasuredAnimal } from "#src/render/scene-decor.js";
import type { RenderAsset } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT030Content } from "./template.js";
import {
  FIRST_OPTION_SLOT,
  measureGT030Zones,
  OBJECT_SLOT,
  SOURCE_SLOT,
  STRIP_SLOT,
} from "./zone-layout.js";

/** Khe hoặc chồng lấn của lần thả vừa rồi — trẻ phải thấy nó (`BR-E030-06`). */
export interface GapFlash {
  readonly kind: "gap" | "overlap";
  readonly slotIndex: number;
  readonly widthPx: number;
}

export type GT030AnswerOption = GT030Content["answer_options"][number];

export interface GT030Clock {
  activeHintLevel: HintLevel | 0;
  animalElapsedMs: number;
  closeAtMs: number | null;
  elapsedMs: number;
  hoveredSlot: number | null;
  lastSnapAtMs: number | null;
  particles: Particle[];
  winAtMs: number | null;
  readonly wrongOptionFlash: WrongFlash;
  readonly wrongPlaceFlash: WrongFlash;
}

export interface GT030LayoutHost {
  readonly content: GT030Content;
  readonly cssPerLogic?: number;
  readonly degradation: DegradationState | null;
  readonly displayOptions: readonly GT030AnswerOption[];
  readonly logicSpace: { readonly w: number; readonly h: number };
  readonly placedUnitsCount: number;
  readonly roundClosedOnWrong: boolean;
  readonly selectedOptionId: string | null;
  readonly slots: readonly Slot[];
  readonly stageRect?: ZoneRect;
  readonly themeId?: string;
  readonly trayRect?: ZoneRect;
  checkWinCondition(): boolean;
  getCellCenterX(i: number): number;
  getGapFlash(): GapFlash | null;
  getUnitWidth(): number;
  isAcceptingInput(): boolean;
}

type Host = GT030LayoutHost;
type Clk = GT030Clock;
type Ctx = CanvasRenderingContext2D;
type RS = RenderSystem;
type Opt = GT030AnswerOption;

const ANIMAL_WIGGLE_RAD_PER_MS = 0.006;
const BROKEN_ASSET_RE = /^EMJ-[a-z0-9-]+$/i;
const CLOCK_MAP = new WeakMap<object, GT030Clock>();

function createGT030Clock(): GT030Clock {
  return {
    activeHintLevel: 0,
    animalElapsedMs: 0,
    closeAtMs: null,
    elapsedMs: 0,
    hoveredSlot: null,
    lastSnapAtMs: null,
    particles: [],
    winAtMs: null,
    wrongOptionFlash: new WrongFlash(),
    wrongPlaceFlash: new WrongFlash(),
  };
}

export function getGT030Clock(host: object): GT030Clock {
  let clock = CLOCK_MAP.get(host);
  if (!clock) {
    clock = createGT030Clock();
    CLOCK_MAP.set(host, clock);
  }
  return clock;
}

export function resetGT030Clock(host: object): GT030Clock {
  const next = createGT030Clock();
  CLOCK_MAP.set(host, next);
  return next;
}

export function isBrokenGT030Asset(asset: RenderAsset): boolean {
  let raw = "";
  if (asset.kind === "text") {
    raw = asset.text.trim();
  } else if (asset.kind === "emoji") {
    raw = asset.ref.trim();
  } else {
    raw = asset.path.trim();
  }
  return raw.length === 0 || BROKEN_ASSET_RE.test(raw);
}

function swapOptions(arr: Opt[], i: number, j: number): void {
  const a = arr[i];
  const b = arr[j];
  if (a !== undefined && b !== undefined) {
    arr[i] = b;
    arr[j] = a;
  }
}

export function resolveDisplayOptions(
  baseOptions: readonly Opt[],
  prevOptions: readonly Opt[],
  layoutSeed: number,
  roundGeneration: number
): Opt[] {
  const copy = [...baseOptions];
  if (roundGeneration <= 0 || layoutSeed <= 0 || copy.length <= 1) {
    return copy;
  }
  const rng = deriveStream(layoutSeed + roundGeneration * 7919, "distractors");
  const out = shuffle(copy, rng);
  const prevRef =
    prevOptions.length === copy.length ? prevOptions : baseOptions;
  const prevCorrectIdx = prevRef.findIndex((o) => o.is_correct);
  const nextCorrectIdx = out.findIndex((o) => o.is_correct);
  if (nextCorrectIdx >= 0 && nextCorrectIdx === prevCorrectIdx) {
    swapOptions(out, nextCorrectIdx, (nextCorrectIdx + 1) % out.length);
  } else if (out.every((o, idx) => o.option_id === prevRef[idx]?.option_id)) {
    swapOptions(out, 0, 1);
  }
  return out;
}

export function buildGT030OptionEntities(host: Host): ViewEntity[] {
  if (host.placedUnitsCount < host.content.object.length_in_units) {
    return [];
  }
  const clock = getGT030Clock(host);
  const entities: ViewEntity[] = [];
  for (let i = 0; i < host.displayOptions.length; i++) {
    const opt = host.displayOptions[i];
    const slotIndex = FIRST_OPTION_SLOT + i;
    const slot = host.slots[slotIndex];
    if (!(opt && slot)) {
      continue;
    }
    let state: EntityVisual = "idle";
    if (host.selectedOptionId === opt.option_id) {
      state = opt.is_correct ? "correct" : "incorrect";
    } else if (clock.hoveredSlot === slotIndex) {
      state = "selected";
    }
    entities.push({
      id: opt.option_id,
      slotIndex,
      role: "target",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "square",
      label: String(opt.value),
      spokenLabel: formatNumberWord(opt.value),
    });
  }
  return entities;
}

function safeAssetLabels(asset: RenderAsset, defLbl: string, defSpk: string) {
  if (isBrokenGT030Asset(asset)) {
    return {
      glyph: undefined,
      label: defLbl,
      spokenLabel: defSpk,
      spokenAudioPath: undefined,
    };
  }
  const res = resolveAssetLabels(asset);
  return {
    glyph: res.glyph,
    label: res.label ?? defLbl,
    spokenLabel: res.spokenLabel ?? defSpk,
    spokenAudioPath: res.spokenAudioPath,
  };
}

function buildObjectEntity(host: Host): ViewEntity | null {
  const objSlot = host.slots[OBJECT_SLOT];
  if (!objSlot) {
    return null;
  }
  const lb = safeAssetLabels(
    host.content.object.asset,
    "Vật cần đo",
    "vật cần đo"
  );
  const rawId = host.content.object.object_id;
  const id = rawId === host.content.unit.unit_id ? `object:${rawId}` : rawId;
  return {
    id,
    slotIndex: OBJECT_SLOT,
    role: "neutral",
    state: "idle",
    x: objSlot.x,
    y: objSlot.y,
    w: objSlot.w,
    h: objSlot.h,
    hitShape: "square",
    ...lb,
  };
}

function buildSourceUnitEntity(host: Host): ViewEntity | null {
  const sourceSlot = host.slots[SOURCE_SLOT];
  if (!sourceSlot) {
    return null;
  }
  const clock = getGT030Clock(host);
  const lb = safeAssetLabels(
    host.content.unit.asset,
    "Chạm để xếp",
    "đơn vị đo"
  );
  let state: EntityVisual = "idle";
  if (clock.wrongPlaceFlash.isActive(clock.elapsedMs)) {
    state = "incorrect";
  } else if (clock.hoveredSlot === SOURCE_SLOT) {
    state = "selected";
  }
  return {
    id: host.content.unit.unit_id,
    slotIndex: SOURCE_SLOT,
    role: "source",
    state,
    x: sourceSlot.x,
    y: sourceSlot.y,
    w: sourceSlot.w,
    h: sourceSlot.h,
    hitShape: "square",
    ...lb,
  };
}

function buildStripEntity(host: Host): ViewEntity | null {
  const strip = host.slots[STRIP_SLOT];
  if (!strip) {
    return null;
  }
  const placed = host.placedUnitsCount;
  const broken = isBrokenGT030Asset(host.content.unit.asset);
  const glyph =
    placed > 0 && !broken
      ? resolveAssetLabels(host.content.unit.asset).glyph
      : undefined;
  const spoken =
    placed > 0 ? `dải đo, đã đặt ${formatNumberWord(placed)}` : "dải đo";
  return {
    id: "measure_strip",
    slotIndex: STRIP_SLOT,
    role: "target",
    state: placed > 0 ? "active" : "idle",
    x: strip.x,
    y: strip.y,
    w: strip.hitW,
    h: strip.hitH,
    hitShape: "square",
    glyph,
    label: placed > 0 ? String(placed) : "?",
    spokenLabel: formatSpokenLabel(spoken),
  };
}

export function buildGT030View(host: Host): EngineView {
  const entities: ViewEntity[] = [];
  for (const entity of [
    buildObjectEntity(host),
    buildStripEntity(host),
    buildSourceUnitEntity(host),
  ]) {
    if (entity) {
      entities.push(entity);
    }
  }
  entities.push(...buildGT030OptionEntities(host));
  return { activePrompt: host.content.prompt, entities };
}

export function resolveGT030HintTargetIndex(host: Host): number | null {
  if (host.checkWinCondition() || !host.isAcceptingInput()) {
    return null;
  }
  if (host.placedUnitsCount < host.content.object.length_in_units) {
    return SOURCE_SLOT;
  }
  const correctOptIdx = host.displayOptions.findIndex((opt) => opt.is_correct);
  return correctOptIdx >= 0 ? FIRST_OPTION_SLOT + correctOptIdx : null;
}

export function resolveGT030HintDestinationIndex(host: Host): number | null {
  if (host.checkWinCondition() || !host.isAcceptingInput()) {
    return null;
  }
  return host.placedUnitsCount < host.content.object.length_in_units
    ? STRIP_SLOT
    : null;
}

function resolveCandidateOptionIndices(host: Host): number[] {
  const target = host.content.object.length_in_units;
  const correctIdx = host.displayOptions.findIndex((o) => o.is_correct);
  if (correctIdx < 0) {
    return [];
  }
  let closestIdx = -1;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < host.displayOptions.length; i++) {
    const opt = host.displayOptions[i];
    if (!opt || i === correctIdx) {
      continue;
    }
    const diff = Math.abs(opt.value - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      closestIdx = i;
    }
  }
  return closestIdx >= 0
    ? [correctIdx, closestIdx].sort((a, b) => a - b)
    : [correctIdx];
}

export function resolveGT030HintTargetForLevel(
  host: Host,
  level: HintLevel
): HintTarget | null {
  if (host.checkWinCondition() || !host.isAcceptingInput()) {
    return null;
  }
  if (host.placedUnitsCount < host.content.object.length_in_units) {
    if (level === 1) {
      return { kind: "region", ids: ["strip"] };
    }
    if (level === 2) {
      return { kind: "region", ids: ["source-unit", "strip"] };
    }
    return { kind: "slot", index: SOURCE_SLOT, toIndex: STRIP_SLOT };
  }
  if (level === 1) {
    return {
      kind: "region",
      ids: ["strip", ...host.displayOptions.map((o) => o.option_id)],
    };
  }
  if (level === 2) {
    const candidates = resolveCandidateOptionIndices(host)
      .map((i) => host.displayOptions[i]?.option_id)
      .filter((id): id is string => typeof id === "string");
    return { kind: "region", ids: ["strip", ...candidates] };
  }
  const idx = resolveGT030HintTargetIndex(host);
  return idx === null ? null : { kind: "slot", index: idx };
}

export function resolveGT030HintDemoSequence(
  host: Host,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level < 3 || host.checkWinCondition() || !host.isAcceptingInput()) {
    return null;
  }
  const correctIdx = host.displayOptions.findIndex((o) => o.is_correct);
  if (correctIdx < 0) {
    return null;
  }
  const optionSlot = FIRST_OPTION_SLOT + correctIdx;
  const remaining = host.content.object.length_in_units - host.placedUnitsCount;
  if (remaining <= 0) {
    return [{ from: optionSlot }];
  }
  const steps: HintDemoStep[] = [];
  for (let i = 0; i < remaining; i++) {
    steps.push({ from: SOURCE_SLOT, to: STRIP_SLOT });
  }
  steps.push({ from: optionSlot });
  return steps;
}

function buildScaffoldVisual(
  host: Host,
  clock: Clk,
  zones: { readonly stage: ZoneRect; readonly tray: ZoneRect }
): GT030ScaffoldVisual | null {
  const level = clock.activeHintLevel;
  const stripSlot = host.slots[STRIP_SLOT];
  const sourceSlot = host.slots[SOURCE_SLOT];
  if (
    level === 0 ||
    !stripSlot ||
    !sourceSlot ||
    host.checkWinCondition() ||
    !host.isAcceptingInput()
  ) {
    return null;
  }
  const u = host.getUnitWidth();
  const phase =
    host.placedUnitsCount < host.content.object.length_in_units
      ? "place"
      : "select";
  const nextX = host.getCellCenterX(host.placedUnitsCount);
  const nextCellSlot =
    phase === "place" ? slotAtPoint(nextX, stripSlot.y, u) : null;
  const candidateOptionSlots = resolveCandidateOptionIndices(host)
    .map((idx) => host.slots[FIRST_OPTION_SLOT + idx])
    .filter((s): s is Slot => s !== undefined);
  const correctIdx = host.displayOptions.findIndex((o) => o.is_correct);
  const correctOptionSlot =
    correctIdx >= 0
      ? (host.slots[FIRST_OPTION_SLOT + correctIdx] ?? null)
      : null;
  return {
    candidateOptionSlots,
    correctOptionSlot,
    elapsedMs: clock.elapsedMs,
    level,
    nextCellSlot,
    phase,
    placedCount: host.placedUnitsCount,
    sourceSlot,
    stage: zones.stage,
    stripSlot,
    tray: zones.tray,
    unitWidth: u,
  };
}

function renderObjectLayer(
  host: Host,
  clock: Clk,
  ctx: Ctx,
  rs: RS,
  stage: ZoneRect
): void {
  const s = host.slots[OBJECT_SLOT];
  if (!s) {
    return;
  }
  drawMeasurementGuideBar(ctx, s);
  const animal = host.content.object.animal;
  if (animal) {
    const phase = rs.reducedMotion
      ? 0
      : clock.animalElapsedMs * ANIMAL_WIGGLE_RAD_PER_MS;
    const rect = { x: s.x - s.w / 2, y: s.y - s.h / 2, w: s.w, h: s.h };
    drawMeasuredAnimal(ctx, animal, rect, phase);
    return;
  }
  const obj = host.content.object;
  if (isBrokenGT030Asset(obj.asset)) {
    drawGT030BrokenFallback(ctx, stage, s);
    return;
  }
  drawSlotItem(
    ctx,
    rs,
    s,
    { id: obj.object_id, asset: obj.asset, state: "idle" },
    "square"
  );
}

function renderDiscreteUnits(
  host: Host,
  ctx: Ctx,
  rs: RS,
  stage: ZoneRect,
  stripY: number,
  u: number
): void {
  const asset = host.content.unit.asset;
  const broken = isBrokenGT030Asset(asset);
  const state: ItemVisualState = host.checkWinCondition()
    ? "correct"
    : "selected";
  for (let i = 0; i < host.placedUnitsCount; i++) {
    const slot = slotAtPoint(host.getCellCenterX(i), stripY, u);
    if (broken) {
      drawGT030BrokenFallback(ctx, stage, slot);
    } else {
      drawSlotItem(
        ctx,
        rs,
        slot,
        { id: `placed_unit_${i + 1}`, asset, state },
        "square"
      );
    }
  }
}

function renderStripLayer(
  host: Host,
  clock: Clk,
  ctx: Ctx,
  rs: RS,
  stage: ZoneRect,
  shadowsOff: boolean
): void {
  const strip = host.slots[STRIP_SLOT];
  if (!strip) {
    return;
  }
  drawMeasurementGuideBar(ctx, strip);
  const [u, placed, total] = [
    host.getUnitWidth(),
    host.placedUnitsCount,
    host.content.object.length_in_units,
  ];
  if (host.content.representation === "number-rod") {
    if (placed > 0) {
      const s0 = slotAtPoint(host.getCellCenterX(0), strip.y, u);
      const s1 = slotAtPoint(host.getCellCenterX(placed - 1), strip.y, u);
      drawNumberRodAcrossSlots(ctx, s0, s1, placed, total);
    }
  } else {
    renderDiscreteUnits(host, ctx, rs, stage, strip.y, u);
  }
  const snapElapsed =
    clock.lastSnapAtMs === null ? null : clock.elapsedMs - clock.lastSnapAtMs;
  drawGT030PlacedUnitsOverlay(ctx, rs, {
    elapsedMs: clock.elapsedMs,
    isRoundClosed: host.roundClosedOnWrong,
    isWon: host.checkWinCondition(),
    lastSnapElapsedMs: snapElapsed,
    placedCount: placed,
    stage,
    stripSlot: strip,
    unitWidth: u,
  });
  const flash = host.getGapFlash();
  if (flash && !shadowsOff) {
    const edgeX = strip.x - strip.w / 2 + placed * u;
    const left = flash.kind === "gap" ? edgeX : edgeX - flash.widthPx;
    drawUnitGapHatch(ctx, {
      x: left,
      y: strip.y - u / 2,
      w: flash.widthPx,
      h: u,
    });
  }
}

function renderSourceTray(
  host: Host,
  clock: Clk,
  ctx: Ctx,
  rs: RS,
  tray: ZoneRect
): void {
  drawWoodenTokenDock(ctx, rs, tray);
  const slot = host.slots[SOURCE_SLOT];
  if (!slot) {
    return;
  }
  const isWrong = clock.wrongPlaceFlash.isActive(clock.elapsedMs);
  const isHovered = clock.hoveredSlot === SOURCE_SLOT;
  let itemState: ItemVisualState = "idle";
  if (isWrong) {
    itemState = "wrong";
  } else if (isHovered) {
    itemState = "selected";
  }
  const unit = host.content.unit;
  if (isBrokenGT030Asset(unit.asset)) {
    drawGT030BrokenFallback(ctx, tray, slot);
  } else {
    drawSlotItem(
      ctx,
      rs,
      slot,
      { id: unit.unit_id, asset: unit.asset, state: itemState },
      "circle"
    );
  }
  drawGT030SourceTrayEffect(ctx, rs, {
    elapsedMs: clock.elapsedMs,
    isFull: host.placedUnitsCount >= host.content.object.length_in_units,
    isHovered,
    sourceSlot: slot,
    tray,
    wrongProgress: isWrong
      ? clock.wrongPlaceFlash.progress(clock.elapsedMs)
      : null,
  });
}

function resolveOptionStates(
  opt: Opt,
  isSelected: boolean,
  isHovered: boolean
): { readonly card: GT030VisualState; readonly item: ItemVisualState } {
  if (isSelected) {
    const st = opt.is_correct ? "correct" : "wrong";
    return { card: st, item: st };
  }
  if (isHovered) {
    return { card: "hovered", item: "selected" };
  }
  return { card: "idle", item: "idle" };
}

function renderSingleOptionCard(
  host: Host,
  clock: Clk,
  ctx: Ctx,
  rs: RS,
  stage: ZoneRect,
  particlesOff: boolean,
  j: number
): void {
  const opt = host.displayOptions[j];
  const slotIndex = FIRST_OPTION_SLOT + j;
  const slot = host.slots[slotIndex];
  if (!(opt && slot)) {
    return;
  }
  const isSelected = host.selectedOptionId === opt.option_id;
  const isWrongActive =
    isSelected &&
    !opt.is_correct &&
    clock.wrongOptionFlash.isActive(clock.elapsedMs);
  const states = resolveOptionStates(
    opt,
    isSelected,
    clock.hoveredSlot === slotIndex
  );
  drawSlotItem(
    ctx,
    rs,
    slot,
    { id: opt.option_id, text: String(opt.value), state: states.item },
    "square"
  );
  drawGT030OptionCardOverlay(ctx, rs, {
    isCorrectOption: opt.is_correct,
    isRoundClosed: host.roundClosedOnWrong,
    particlesOff,
    slot,
    stage,
    state: states.card,
    winElapsedMs:
      clock.winAtMs === null ? null : clock.elapsedMs - clock.winAtMs,
    wrongProgress: isWrongActive
      ? clock.wrongOptionFlash.progress(clock.elapsedMs)
      : null,
  });
}

export function renderGT030Frame(host: Host, ctx: Ctx, rs: RS): void {
  const clock = getGT030Clock(host);
  drawSceneBackground(ctx, rs, host.themeId);
  if (host.content.object.animal !== "caterpillar") {
    drawStoryCharacterInStage(ctx, "caterpillar", host.stageRect, host.slots);
  }
  const zones = measureGT030Zones(host);
  const objectSlot = host.slots[OBJECT_SLOT];
  const stripSlot = host.slots[STRIP_SLOT];
  const shadowsOff =
    !rs.softShadowsEnabled || host.degradation?.soft_shadows_enabled === false;
  const particlesOff = host.degradation?.particles_enabled === false;

  if (objectSlot && stripSlot) {
    drawGT030Workbench(ctx, rs, {
      isStripHovered: clock.hoveredSlot === STRIP_SLOT,
      isWon: host.checkWinCondition(),
      objectSlot,
      shadowsOff,
      stage: zones.stage,
      stripSlot,
    });
  }

  renderObjectLayer(host, clock, ctx, rs, zones.stage);
  renderStripLayer(host, clock, ctx, rs, zones.stage, shadowsOff);
  renderSourceTray(host, clock, ctx, rs, zones.tray);
  if (host.placedUnitsCount >= host.content.object.length_in_units) {
    for (let j = 0; j < host.displayOptions.length; j++) {
      renderSingleOptionCard(
        host,
        clock,
        ctx,
        rs,
        zones.stage,
        particlesOff,
        j
      );
    }
  }

  const scaffold = buildScaffoldVisual(host, clock, zones);
  if (scaffold) {
    drawGT030ScaffoldOverlay(ctx, rs, scaffold);
    if (
      scaffold.phase === "place" &&
      scaffold.level >= 2 &&
      scaffold.nextCellSlot &&
      !isBrokenGT030Asset(host.content.unit.asset)
    ) {
      drawGhostAssetInSlot(ctx, host.content.unit.asset, scaffold.nextCellSlot);
    }
  }

  if (!particlesOff && clock.particles.length > 0) {
    rs.drawParticles(ctx, clock.particles);
  }
}
