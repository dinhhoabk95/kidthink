const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const cache = new Map<string, Map<number, string>>();
const luminanceCache = new Map<string, number>();

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
  const clamped = Math.min(1, Math.max(0, opacity));
  const quantized = Math.round(clamped * 1000) / 1000;
  let byOpacity = cache.get(hex);
  if (byOpacity === undefined) {
    if (!HEX_RE.test(hex)) {
      throw new Error(`alpha(): "${hex}" không phải mã hex #rgb hoặc #rrggbb`);
    }
    byOpacity = new Map<number, string>();
    cache.set(hex, byOpacity);
  } else {
    const hit = byOpacity.get(quantized);
    if (hit !== undefined) {
      return hit;
    }
  }
  const full = expandHex(hex);
  const r = Number.parseInt(full.slice(1, 3), 16);
  const g = Number.parseInt(full.slice(3, 5), 16);
  const b = Number.parseInt(full.slice(5, 7), 16);
  const value = `rgba(${r}, ${g}, ${b}, ${quantized})`;
  byOpacity.set(quantized, value);
  return value;
}

function relativeLuminance(hex: string): number {
  const hit = luminanceCache.get(hex);
  if (hit !== undefined) {
    return hit;
  }
  if (!HEX_RE.test(hex)) {
    throw new Error("readableTextOn(): cần mã hex #rgb hoặc #rrggbb");
  }
  const full = expandHex(hex);
  const channel = (i: number): number => {
    const v = Number.parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.039_28 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  luminanceCache.set(hex, lum);
  return lum;
}

/**
 * Màu chữ đọc được trên nền `bgHex`: chọn giữa `light` và `dark` theo tỉ lệ
 * tương phản WCAG cao hơn (`BR-A11-02`). Chữ trắng trên hổ phách chỉ ~1,6:1.
 */
export function readableTextOn(
  bgHex: string,
  light: string,
  dark: string
): string {
  const bg = relativeLuminance(bgHex);
  const lightLum = relativeLuminance(light);
  const darkLum = relativeLuminance(dark);
  const lightContrast =
    (Math.max(lightLum, bg) + 0.05) / (Math.min(lightLum, bg) + 0.05);
  const darkContrast =
    (Math.max(darkLum, bg) + 0.05) / (Math.min(darkLum, bg) + 0.05);
  return lightContrast >= darkContrast ? light : dark;
}
