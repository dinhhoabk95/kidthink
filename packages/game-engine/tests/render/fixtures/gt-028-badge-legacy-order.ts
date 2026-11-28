/**
 * Fixture vi phạm: thứ tự vẽ cũ của ô số tích luỹ GT-028 (font đặt màu chữ →
 * tô nền → fillText). `fill` ghi đè `fillStyle` nên chữ cùng màu nền.
 */
export interface LegacyBadgeCtx {
  fill(): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillText(text: string, x: number, y: number): void;
}

export function drawLegacyBadge(
  g: LegacyBadgeCtx,
  textColor: string,
  bgColor: string
): void {
  g.fillStyle = textColor;
  g.fillStyle = bgColor;
  g.fill();
  g.fillText("6", 0, 0);
}
