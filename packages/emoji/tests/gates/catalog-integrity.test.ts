import { describe, expect, it } from "vitest";
import { ALL_EMOJIS } from "#src/index";
import type { EmojiEntry } from "#src/types";
import {
  DUPLICATE_GLYPH_FIXTURE,
  GENDERED_PROFESSION_FIXTURE,
  NFD_GLYPH_FIXTURE,
  SKIN_TONE_FIXTURE,
} from "./fixtures/invalid-entries";

const SKIN_TONE_REGEX = /[\u{1F3FB}-\u{1F3FF}]/u;
const GENDERED_PROFESSION_GLYPHS = new Set([
  "👨‍⚕️",
  "👩‍⚕️",
  "👨‍🏫",
  "👩‍🏫",
  "👨‍🍳",
  "👩‍🍳",
  "👨‍🌾",
  "👩‍🌾",
]);

function checkUniqueGlyphs(entries: EmojiEntry[]): {
  valid: boolean;
  duplicates: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const entry of entries) {
    if (seen.has(entry.emoji)) {
      duplicates.push(entry.emoji);
    }
    seen.add(entry.emoji);
  }
  return { valid: duplicates.length === 0, duplicates };
}

function checkNfcNormalization(entries: EmojiEntry[]): {
  valid: boolean;
  nonNfc: string[];
} {
  const nonNfc: string[] = [];
  for (const entry of entries) {
    if (entry.emoji !== entry.emoji.normalize("NFC")) {
      nonNfc.push(entry.emoji);
    }
  }
  return { valid: nonNfc.length === 0, nonNfc };
}

function checkNoSkinToneModifiers(entries: EmojiEntry[]): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  for (const entry of entries) {
    if (SKIN_TONE_REGEX.test(entry.emoji)) {
      violations.push(entry.emoji);
    }
  }
  return { valid: violations.length === 0, violations };
}

function checkNoGenderedProfessions(entries: EmojiEntry[]): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  for (const entry of entries) {
    if (GENDERED_PROFESSION_GLYPHS.has(entry.emoji)) {
      violations.push(entry.emoji);
    }
  }
  return { valid: violations.length === 0, violations };
}

describe("Catalog Integrity Gate (D-EK)", () => {
  describe("Invariant 1: All catalog glyphs must be unique", () => {
    it("passes on real catalog ALL_EMOJIS", () => {
      const result = checkUniqueGlyphs(ALL_EMOJIS);
      expect(result.valid).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });

    it("Ca âm: fails on duplicate glyph fixture", () => {
      const result = checkUniqueGlyphs(DUPLICATE_GLYPH_FIXTURE);
      expect(result.valid).toBe(false);
      expect(result.duplicates).toContain("🍎");
    });
  });

  describe("Invariant 2: All catalog glyphs must be NFC normalized", () => {
    it("passes on real catalog ALL_EMOJIS", () => {
      const result = checkNfcNormalization(ALL_EMOJIS);
      expect(result.valid).toBe(true);
      expect(result.nonNfc).toHaveLength(0);
    });

    it("Ca âm: fails on NFD glyph fixture", () => {
      const result = checkNfcNormalization(NFD_GLYPH_FIXTURE);
      expect(result.valid).toBe(false);
      expect(result.nonNfc).toHaveLength(1);
    });
  });

  describe("Invariant 3: No skin tone modifiers (BR-EMJ-09)", () => {
    it("passes on real catalog ALL_EMOJIS", () => {
      const result = checkNoSkinToneModifiers(ALL_EMOJIS);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("Ca âm: fails on skin tone modifier fixture", () => {
      const result = checkNoSkinToneModifiers(SKIN_TONE_FIXTURE);
      expect(result.valid).toBe(false);
      expect(result.violations).toContain("👍🏽");
    });
  });

  describe("Invariant 4: Neutral professions only, no gendered professions (BR-EMJ-10, D-EG)", () => {
    it("passes on real catalog ALL_EMOJIS", () => {
      const result = checkNoGenderedProfessions(ALL_EMOJIS);
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("Ca âm: fails on gendered profession fixture", () => {
      const result = checkNoGenderedProfessions(GENDERED_PROFESSION_FIXTURE);
      expect(result.valid).toBe(false);
      expect(result.violations).toContain("👩‍⚕️");
    });
  });
});
