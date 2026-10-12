const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const cache = new Map<string, string>();

function expandHex(hex: string): string {
  if (hex.length !== 4) {
    return hex;
  }
  const [, r = "", g = "", b = ""] = hex;
  return `#${r}${r}${g}${g}${b}${b}`;
}

/**
 * Chuyển token hex (`#rgb` / `#rrggbb`) sang chuỗi `rgba()` với độ mờ `opacity`.
 * Kết quả được nhớ lại theo cặp (hex, opacity) vì nền cảnh vẽ lại mỗi frame.
 */
export function alpha(hex: string, opacity: number): string {
  if (!HEX_RE.test(hex)) {
    throw new Error(`alpha(): "${hex}" không phải mã hex #rgb hoặc #rrggbb`);
  }
  const clamped = Math.min(1, Math.max(0, opacity));
  const key = `${hex}|${clamped}`;
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  const full = expandHex(hex);
  const r = Number.parseInt(full.slice(1, 3), 16);
  const g = Number.parseInt(full.slice(3, 5), 16);
  const b = Number.parseInt(full.slice(5, 7), 16);
  const value = `rgba(${r}, ${g}, ${b}, ${clamped})`;
  cache.set(key, value);
  return value;
}
