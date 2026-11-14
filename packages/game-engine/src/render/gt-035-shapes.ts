import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { alpha } from "#src/render/color-utils";
import { drawRobotTrail, drawStoryCharacter } from "#src/render/craft-shapes";
import { drawSlotItem, getColorsForState } from "#src/render/shared-render";
import { applyCanvasFontAtSize } from "#src/render/type-scale";
import type {
  CommandType,
  RobotState,
} from "#src/systems/command-queue-system";
import { designTokens } from "#src/systems/designTokens";
import type { RenderSystem } from "#src/systems/render-system";

export type GT035LineSegment = readonly [number, number, number, number];

export interface GT035MapBoardParams {
  readonly boardRect: ZoneRect;
  readonly gridLines: readonly GT035LineSegment[];
  readonly railSegments: readonly {
    readonly line: GT035LineSegment;
    readonly active: boolean;
  }[];
  readonly softShadowsEnabled: boolean;
}
export interface GT035GridCellParams {
  readonly asset?: Parameters<typeof drawSlotItem>[3]["asset"];
  readonly cellLabel?: string;
  readonly facing?: RobotState["facing"];
  readonly hintColor?: string;
  readonly isWalked: boolean;
  readonly kind: "empty" | "robot" | "goal" | "obstacle" | "collectible";
  readonly lampGlow: number;
  readonly slot: Slot;
  readonly stageZone: ZoneRect;
}
export interface GT035CommandCardParams {
  readonly border: string;
  readonly command?: CommandType;
  readonly fill: string;
  readonly fontPx: number;
  readonly ghostCommand?: CommandType;
  readonly hintColor?: string;
  readonly hintDashed?: boolean;
  readonly index: number;
  readonly liftY: number;
  readonly ringColor?: string;
  readonly slot: Slot;
  readonly stageZone: ZoneRect;
}

type Canvas2D = CanvasRenderingContext2D;
const WOOD = designTokens.colors.montessori;
const INK = designTokens.colors.surface[800];
const ANGLES: Record<string, number> = {
  right: Math.PI / 2,
  go_right: Math.PI / 2,
  down: Math.PI,
  go_down: Math.PI,
  left: -Math.PI / 2,
  go_left: -Math.PI / 2,
};

function paint(ctx: Canvas2D, col: string, lw = 0): void {
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = col;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = col;
  ctx.fill();
}

function box(ctx: Canvas2D, b: ZoneRect, r: number, col: string, lw = 0): void {
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, r);
  paint(ctx, col, lw);
}

function circle(
  ctx: Canvas2D,
  x: number,
  y: number,
  r: number,
  col: string,
  lw = 0
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  paint(ctx, col, lw);
}

function tip(ctx: Canvas2D, x: number, y: number, s: number, rot = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.75, s * 0.6);
  ctx.lineTo(-s * 0.75, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function seg(ctx: Canvas2D, s: GT035LineSegment): void {
  ctx.beginPath();
  ctx.moveTo(s[0], s[1]);
  ctx.lineTo(s[2], s[3]);
  ctx.stroke();
}

function drawCmd(
  ctx: Canvas2D,
  cmd: CommandType,
  cx: number,
  cy: number,
  r: number,
  col: string,
  alphaVal = 1
): void {
  ctx.save();
  ctx.globalAlpha = alphaVal;
  ctx.translate(cx, cy);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2.4, r * 0.19);
  if (cmd === "loop") {
    const lr = r * 0.6;
    for (const a0 of [-Math.PI * 0.82, Math.PI * 0.18]) {
      ctx.beginPath();
      ctx.arc(0, 0, lr, a0, a0 + Math.PI * 0.9);
      ctx.stroke();
    }
    tip(ctx, lr * 0.96, lr * 0.2, r * 0.28, Math.PI);
    tip(ctx, -lr * 0.96, -lr * 0.2, r * 0.28, 0);
    circle(ctx, -r * 0.22, 0, Math.max(2, r * 0.12), col);
    circle(ctx, r * 0.22, 0, Math.max(2, r * 0.12), col);
  } else if (cmd === "turn_left" || cmd === "turn_right") {
    ctx.scale(cmd === "turn_left" ? -1 : 1, 1);
    const ar = r * 0.56;
    ctx.beginPath();
    ctx.arc(ar * 0.3, ar * 0.25, ar, Math.PI, -Math.PI / 2);
    ctx.stroke();
    tip(ctx, ar * 0.55, -ar * 0.75, r * 0.34, Math.PI / 2);
  } else {
    ctx.rotate(ANGLES[cmd] ?? 0);
    seg(ctx, [0, r * 0.62, 0, -r * 0.35]);
    tip(ctx, 0, -r * 0.5, r * 0.38);
    if (cmd === "forward") {
      seg(ctx, [-r * 0.36, r * 0.62, r * 0.36, r * 0.62]);
    }
  }
  ctx.restore();
}

export function withGT035StageClip(
  ctx: Canvas2D,
  zone: ZoneRect,
  drawFn: () => void
): void {
  const ok = ["save", "beginPath", "rect", "clip"].every(
    (k) => typeof Reflect.get(ctx, k) === "function"
  );
  if (!ok) {
    drawFn();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(zone.x, zone.y, zone.w, zone.h);
  ctx.clip();
  drawFn();
  ctx.restore();
}

export function drawGT035MapBoard(ctx: Canvas2D, p: GT035MapBoardParams): void {
  const z = p.boardRect;
  if (p.softShadowsEnabled) {
    const sh = { x: z.x + 3, y: z.y + 4, w: z.w - 3, h: z.h - 4 };
    box(ctx, sh, 16, alpha(WOOD.woodBorder, 0.15));
  }
  box(ctx, z, 16, designTokens.colors.scene.wood.light);
  box(ctx, z, 16, WOOD.woodBorder, 2.2);
  ctx.strokeStyle = alpha(WOOD.woodBorder, 0.24);
  ctx.lineWidth = 2;
  for (const s of p.gridLines) {
    seg(ctx, s);
  }
  ctx.strokeStyle = alpha(WOOD.woodBevel, 0.55);
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (const item of p.railSegments) {
    seg(ctx, item.line);
    ctx.fillStyle = item.active ? WOOD.indigo : WOOD.woodBorder;
    tip(ctx, (item.line[0] + item.line[2]) / 2, item.line[1], 5, Math.PI / 2);
  }
}

export function drawGT035GridCell(
  ctx: Canvas2D,
  rs: RenderSystem,
  p: GT035GridCellParams
): void {
  const { slot: s, kind, asset, stageZone: z } = p;
  const r = Math.min(s.w, s.h) / 2;
  if (p.hintColor) {
    const hx = Math.max(z.x + 0.5, s.x - s.w / 2 - 2);
    const hy = Math.max(z.y + 0.5, s.y - s.h / 2 - 2);
    const hw = Math.max(1, Math.min(z.x + z.w - 0.5, s.x + s.w / 2 + 2) - hx);
    const hh = Math.max(1, Math.min(z.y + z.h - 0.5, s.y + s.h / 2 + 2) - hy);
    box(ctx, { x: hx, y: hy, w: hw, h: hh }, 10, p.hintColor, 3.5);
  }
  if (kind === "robot") {
    const item = {
      id: "robot",
      text: "",
      label: p.cellLabel,
      state: "selected" as const,
    };
    drawSlotItem(ctx, rs, s, item);
    drawStoryCharacter(ctx, "robot", s.x, s.y, r * 1.4, { glow: p.lampGlow });
    if (p.facing) {
      const a = ANGLES[p.facing] ?? 0;
      ctx.fillStyle = WOOD.indigo;
      tip(
        ctx,
        s.x + Math.sin(a) * r * 0.78,
        s.y - Math.cos(a) * r * 0.78,
        5,
        a
      );
    }
    return;
  }
  const isBroken = asset?.kind === "emoji" && asset.ref.startsWith("EMJ-");
  if (kind !== "empty" && asset && !isBroken) {
    if (kind === "goal") {
      circle(ctx, s.x, s.y, r * 0.86, alpha(WOOD.amberLight, 0.7));
    }
    drawSlotItem(ctx, rs, s, { id: kind, asset, state: "idle" });
    return;
  }
  const c = getColorsForState("idle");
  rs.drawClayBody(ctx, s.x, s.y, r, c.fill, c.border, "square");
  if (kind === "empty" && p.isWalked) {
    drawRobotTrail(ctx, s);
  } else if (kind !== "empty") {
    const col = kind === "obstacle" ? WOOD.woodBorder : WOOD.amber;
    const hr = r * 0.4;
    box(ctx, { x: s.x - hr, y: s.y - hr, w: hr * 2, h: hr * 2 }, 8, col);
  }
}

function clampR(x: number, y: number, r: number, z: ZoneRect): number {
  const dx = Math.min(x - z.x, z.x + z.w - x);
  const dy = Math.min(y - z.y, z.y + z.h - y);
  return Math.max(4, Math.min(r, dx - 0.5, dy - 0.5));
}

export function drawGT035CommandCard(
  ctx: Canvas2D,
  rs: RenderSystem,
  p: GT035CommandCardParams
): void {
  const { slot: s, command, ghostCommand, stageZone: z } = p;
  const r = Math.min(s.w, s.h) / 2;
  const y = Math.max(
    z.y + r + 0.5,
    Math.min(z.y + z.h - r - 0.5, s.y + p.liftY)
  );
  rs.drawClayBody(ctx, s.x, y, r, p.fill, p.border, "circle");
  if (p.ringColor) {
    circle(ctx, s.x, y, clampR(s.x, y, r + 1.5, z), p.ringColor, 3.5);
  }
  if (p.hintColor) {
    ctx.setLineDash(p.hintDashed ? [6, 4] : []);
    circle(ctx, s.x, s.y, clampR(s.x, s.y, r + 5, z), p.hintColor, 3.5);
    ctx.setLineDash([]);
  }
  if (command) {
    drawCmd(ctx, command, s.x, y, r * 0.62, INK);
    return;
  }
  if (ghostCommand) {
    drawCmd(ctx, ghostCommand, s.x, s.y, r * 0.56, WOOD.indigo, 0.48);
    return;
  }
  ctx.save();
  applyCanvasFontAtSize(ctx, p.fontPx, "heading", "bold");
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${p.index + 1}`, s.x, s.y);
  ctx.restore();
}
