/**
 * @mindkid/emoji — Glyph normalization & lookup map helpers
 */

const VARIATION_SELECTOR_16_RE = /\uFE0F/g;

export function normalizeGlyph(value: string): string {
  return value.normalize("NFC");
}

export function stripVariationSelector(value: string): string {
  return value.replace(VARIATION_SELECTOR_16_RE, "");
}

export function buildGlyphLookupMap<T>(
  items: readonly T[],
  getEmoji: (item: T) => string
): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const nfc = normalizeGlyph(getEmoji(item));
    map.set(nfc, item);
    const stripped = stripVariationSelector(nfc);
    if (!map.has(stripped)) {
      map.set(stripped, item);
    }
  }
  return map;
}

export function resolveFromGlyphMap<T>(
  map: ReadonlyMap<string, T>,
  glyph: string
): T | null {
  if (!glyph) {
    return null;
  }
  const normalized = normalizeGlyph(glyph);
  return (
    map.get(normalized) ?? map.get(stripVariationSelector(normalized)) ?? null
  );
}
