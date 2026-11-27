// Ca âm cho cổng verb-declaration (BR-EIC-08): session đọc `drop` mà template không khai.
interface DropLike {
  readonly type: string;
}

export function toAction(g: DropLike): string | null {
  if (g.type === "drop") {
    return "place";
  }
  return null;
}
