import { applyCanvasFontAtSize } from "#src/render/type-scale";

/** Fixture vi phạm: family không hợp lệ phải bị TypeScript từ chối. */
export function applyBadFamily(ctx: { font: string }): void {
  // @ts-expect-error "display" không thuộc CanvasFontFamily
  applyCanvasFontAtSize(ctx, 26, "display", 700);
}
