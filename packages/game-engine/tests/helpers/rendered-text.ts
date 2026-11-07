import { vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/** Phần tối thiểu của session mà helper cần để vẽ một khung. */
interface RenderableSession {
  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs: number): void;
  prepareRound(ageBand: AgeBand): void;
}

/**
 * Vẽ một khung của session lên canvas giả và trả mọi chuỗi đi qua `fillText`.
 * Emoji cũng đi qua `fillText` nên người gọi lọc bằng `lettersOnly`.
 */
export function collectRenderedText(
  session: RenderableSession,
  timeMs = 0,
  ageBand: AgeBand = "4-5"
): string[] {
  session.prepareRound(ageBand);
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const drawn: string[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
    drawn.push(text);
  });
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), timeMs);
  return drawn;
}

const LETTER = /\p{L}/u;

/** Chuỗi có chữ cái (từ ngữ phải đọc). Chữ số và emoji không tính. */
export function lettersOnly(texts: readonly string[]): string[] {
  return texts.filter((t) => LETTER.test(t));
}
