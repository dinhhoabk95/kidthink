import type { EngineView, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { dockRectAroundSlots } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT012OptionToken,
  drawGT012PlayMedallion,
  drawGT012ReplayMedallion,
  drawGT012StageMat,
} from "#src/render/gt-012-shapes";
import {
  bellLiftProgress,
  drawFireflyGlow,
  drawGlassBell,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenPlate,
  drawWoodenTokenDock,
  fireflyGlow,
  type SceneBox,
} from "#src/render/index.js";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT012Content } from "./template.js";
import {
  type GT012OptionVisualState,
  type GT012SessionVariant,
  type GT012StagePhase,
  plateSlot,
} from "./zone-layout.js";

export const TOUCH_PULSE_MS = 180;
export const WIN_POP_MS = 280;

export interface GT012Clock {
  logicMs: number;
  flashStartLogicMs: number;
  flashStartOriginMs: number;
  winAtMs: number | null;
  closeAtMs: number | null;
  touchingPlateUntilMs: number;
  touchingOptIndex: number | null;
  touchingOptUntilMs: number;
  hoveredOptIndex: number | null;
  hoveredPlate: boolean;
}

export interface GT012ViewInput {
  readonly content: GT012Content;
  readonly variant: GT012SessionVariant;
  readonly slots: readonly Slot[];
  readonly flashSlots: readonly Slot[];
  readonly plateRect: ZoneRect | null;
  readonly clk: GT012Clock;
  readonly awaitingStart: boolean;
  readonly isFlashVisible: boolean;
  readonly isWon: boolean;
  readonly isRoundClosed: boolean;
  readonly canReplay: boolean;
  readonly selectedValue: number | null;
  readonly wrongActive: boolean;
}

export interface GT012RenderSceneInput extends GT012ViewInput {
  readonly ctx: CanvasRenderingContext2D;
  readonly rs: RenderSystem;
  readonly timeMs: number;
  readonly stageRect: ZoneRect | undefined;
  readonly cachedDockRect: SceneBox | null;
  readonly durationMs: number;
  readonly wrongProg: number | null;
  readonly scaffoldHintLevel: number;
  readonly degraded: boolean;
}

const SESSION_CLOCK = new WeakMap<object, GT012Clock>();

export function clockOf(session: object): GT012Clock {
  const existing = SESSION_CLOCK.get(session);
  if (existing) {
    return existing;
  }
  const created: GT012Clock = {
    logicMs: 0,
    flashStartLogicMs: 0,
    flashStartOriginMs: 0,
    winAtMs: null,
    closeAtMs: null,
    touchingPlateUntilMs: 0,
    touchingOptIndex: null,
    touchingOptUntilMs: 0,
    hoveredOptIndex: null,
    hoveredPlate: false,
  };
  SESSION_CLOCK.set(session, created);
  return created;
}

export const resetClock = (s: object): void => {
  SESSION_CLOCK.delete(s);
};

export function tickGT012Clock(clk: GT012Clock, deltaMs: number): void {
  clk.logicMs += deltaMs;
  if (clk.touchingPlateUntilMs > 0 && clk.logicMs >= clk.touchingPlateUntilMs) {
    clk.touchingPlateUntilMs = 0;
  }
  if (clk.touchingOptIndex !== null && clk.logicMs >= clk.touchingOptUntilMs) {
    clk.touchingOptIndex = null;
    clk.touchingOptUntilMs = 0;
  }
}

export function resolveFlashElapsedMs(clk: GT012Clock, timeMs: number): number {
  return clk.logicMs > clk.flashStartLogicMs
    ? clk.logicMs - clk.flashStartLogicMs
    : Math.max(0, timeMs - clk.flashStartOriginMs);
}

export function resolveOptionVisualState(
  opt: GT012Content["options"][number],
  index: number,
  selectedValue: number | null,
  clk: GT012Clock,
  wrongActive: boolean,
  isRoundClosed: boolean
): GT012OptionVisualState {
  if (selectedValue === opt.value && opt.is_correct) {
    return "correct";
  }
  if (
    selectedValue === opt.value &&
    !opt.is_correct &&
    (wrongActive || isRoundClosed)
  ) {
    return "wrong";
  }
  if (clk.touchingOptIndex === index && clk.logicMs < clk.touchingOptUntilMs) {
    return "touching";
  }
  return clk.hoveredOptIndex === index ? "selected" : "idle";
}

const isTouchingPlate = (c: GT012Clock): boolean =>
  (c.touchingPlateUntilMs > 0 && c.logicMs < c.touchingPlateUntilMs) ||
  c.hoveredPlate;

const VIEW_STATE: Record<GT012OptionVisualState, ViewEntity["state"]> = {
  idle: "idle",
  touching: "selected",
  selected: "selected",
  correct: "correct",
  wrong: "incorrect",
};

function renderOpenDish(
  s: GT012RenderSceneInput,
  plate: Slot,
  pulse01: number
): void {
  const isReveal = s.isWon || s.isRoundClosed;
  if (!(s.stageRect || isReveal)) {
    drawSubPromptText(s.ctx, s.rs, "Nhìn nhanh!");
  }
  let phase: GT012StagePhase = s.isRoundClosed ? "reveal_closed" : "flashing";
  if (s.isWon) {
    phase = "reveal_win";
  }
  const elapsed = resolveFlashElapsedMs(s.clk, s.timeMs);
  const lift = isReveal
    ? 1
    : bellLiftProgress(elapsed, s.durationMs, s.rs.reducedMotion);
  drawGT012StageMat(s.ctx, s.rs, plate, phase, pulse01, s.degraded);
  drawWoodenPlate(s.ctx, plate, false);
  drawGlassBell(s.ctx, plate, lift);
  s.content.flash_items.forEach((item, i) => {
    const slot = s.flashSlots[i];
    if (slot) {
      drawFireflyGlow(s.ctx, slot, fireflyGlow(elapsed, i, s.rs.reducedMotion));
      drawSlotItem(s.ctx, s.rs, slot, { id: item.item_id, asset: item.asset });
    }
  });
}

export function renderGT012Scene(s: GT012RenderSceneInput): void {
  const plate = s.plateRect ? plateSlot(s.plateRect) : null;
  if (!plate) {
    return;
  }
  const pulse01 = s.rs.reducedMotion
    ? 0.5
    : 0.5 + 0.5 * Math.sin(s.timeMs / 280);
  const touching = isTouchingPlate(s.clk);
  if (s.awaitingStart) {
    const p: GT012StagePhase = "awaiting_start";
    drawGT012StageMat(s.ctx, s.rs, plate, p, pulse01, s.degraded);
    drawWoodenPlate(s.ctx, plate, false);
    drawGlassBell(s.ctx, plate, 0);
    const playOpts = { touching, breath01: pulse01, degraded: s.degraded };
    drawGT012PlayMedallion(s.ctx, s.rs, plate, playOpts);
    return;
  }
  if (s.isFlashVisible || s.isWon || s.isRoundClosed) {
    renderOpenDish(s, plate, pulse01);
    return;
  }
  if (!s.stageRect) {
    drawSubPromptText(s.ctx, s.rs, "Bé nhớ có bao nhiêu đồ vật?");
  }
  drawGT012StageMat(s.ctx, s.rs, plate, "answering", pulse01, s.degraded);
  drawWoodenPlate(s.ctx, plate, false);
  drawGlassBell(s.ctx, plate, 0);
  if (s.canReplay) {
    const emphasized = s.scaffoldHintLevel === 1 || s.wrongActive;
    const repOpts = { touching, emphasized, pulse01, degraded: s.degraded };
    drawGT012ReplayMedallion(s.ctx, s.rs, plate, repOpts);
  }
  const dock = s.cachedDockRect ?? dockRectAroundSlots(s.slots, s.stageRect);
  drawWoodenTokenDock(s.ctx, s.rs, dock);
  const winRatio =
    s.clk.winAtMs === null ? 0 : (s.clk.logicMs - s.clk.winAtMs) / WIN_POP_MS;
  const winPop01 = Math.min(1, Math.max(0, winRatio));
  s.variant.displayOptions.forEach((opt, i) => {
    const slot = s.slots[i];
    if (!slot) {
      return;
    }
    const state = resolveOptionVisualState(
      opt,
      i,
      s.selectedValue,
      s.clk,
      s.wrongActive,
      s.isRoundClosed
    );
    const dimmed =
      s.scaffoldHintLevel >= 2 && !s.variant.narrowedValues.has(opt.value);
    const wrongProgress = state === "wrong" ? s.wrongProg : null;
    drawGT012OptionToken(s.ctx, s.rs, slot, {
      value: opt.value,
      state,
      dimmed,
      wrongProgress,
      winPop01,
      degraded: s.degraded,
      stageRect: s.stageRect,
    });
  });
}

function clocheEntity(
  rect: ZoneRect,
  touching: boolean,
  label: string,
  spokenLabel: string
): ViewEntity {
  const ps = plateSlot(rect);
  return {
    id: "cloche-plate",
    role: "neutral",
    state: touching ? "selected" : "idle",
    x: ps.x,
    y: ps.y,
    w: ps.hitW,
    h: ps.hitH,
    hitShape: "circle",
    slotIndex: -1,
    label,
    spokenLabel,
  };
}

export function buildGT012View(v: GT012ViewInput): EngineView {
  const isCovered = !(v.awaitingStart || v.isFlashVisible);
  const flashPrompt =
    v.content.prompt || "Bé hãy nhìn kỹ các đồ vật trên đĩa nhé!";
  const activePrompt = isCovered ? v.content.prompt : flashPrompt;
  const touchingPlate = isTouchingPlate(v.clk);
  if (v.awaitingStart && v.plateRect) {
    const ent = clocheEntity(
      v.plateRect,
      touchingPlate,
      "Bắt đầu",
      "Chạm để mở nắp và nhìn thật kỹ"
    );
    return { activePrompt: v.content.prompt, entities: [ent] };
  }
  if (v.isFlashVisible || v.isWon || v.isRoundClosed) {
    const entities: ViewEntity[] = [];
    v.content.flash_items.forEach((item, i) => {
      const slot = v.flashSlots[i];
      if (slot) {
        entities.push({
          id: item.item_id,
          slotIndex: -1,
          role: "neutral",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: Math.max(slot.w, slot.hitW),
          h: Math.max(slot.h, slot.hitH),
          ...resolveAssetLabels(item.asset),
        });
      }
    });
    return { activePrompt, entities };
  }
  const entities: ViewEntity[] = [];
  if (isCovered && v.canReplay && v.plateRect) {
    entities.push(
      clocheEntity(
        v.plateRect,
        touchingPlate,
        "Mở lại nắp",
        "Chạm để xem lại các đồ vật"
      )
    );
  }
  v.variant.displayOptions.forEach((opt, i) => {
    const slot = v.slots[i];
    if (!slot) {
      return;
    }
    const vis = resolveOptionVisualState(
      opt,
      i,
      v.selectedValue,
      v.clk,
      v.wrongActive,
      v.isRoundClosed
    );
    const optLabel = String(opt.value);
    entities.push({
      id: `opt-${opt.value}`,
      slotIndex: i,
      role: "source",
      state: VIEW_STATE[vis],
      x: slot.x,
      y: slot.y,
      w: Math.max(slot.w, slot.hitW),
      h: Math.max(slot.h, slot.hitH),
      hitShape: "circle",
      label: optLabel,
      spokenLabel: `Số ${optLabel}`,
    });
  });
  return { activePrompt, entities };
}
