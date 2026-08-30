// Fixture vi phạm: file phụ cạnh session.ts chứa lời gọi ctx thô.
// Đây chính là cách BR-ERC-05 từng bị đi vòng — dời ctx.* sang file bên cạnh.
export function drawThing(ctx: CanvasRenderingContext2D): void {
  ctx.fillRect(0, 0, 960, 540);
}
