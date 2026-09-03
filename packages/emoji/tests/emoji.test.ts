import { describe, expect, it } from "vitest";
import type { EmojiCategory } from "#src/index";
import {
  ALL_CATEGORIES,
  ALL_EMOJIS,
  EMOJI_CATEGORIES,
  getAllCategories,
  getByGlyph,
  getEmojisByCategory,
  getEmojisByCurriculumTheme,
  getEmojisByGroup,
  getRandomEmojis,
  getTotalEmojiCount,
  isInCatalog,
  searchEmoji,
} from "#src/index";

describe("@mindkid/emoji", () => {
  // ── Category size validation ──
  describe("Category size validation", () => {
    const categories = getAllCategories();

    it("should have exactly 32 categories", () => {
      expect(categories).toHaveLength(32);
    });

    for (const category of ALL_CATEGORIES) {
      it(`category "${category}" should have at least 10 emoji entries`, () => {
        const entries = getEmojisByCategory(category);
        expect(entries.length).toBeGreaterThanOrEqual(10);
      });
    }
  });

  // ── Search functionality ──
  describe("Search functionality", () => {
    it('searchEmoji("táo") should return 🍎', () => {
      const results = searchEmoji("táo");
      const emojis = results.map((r) => r.emoji);
      expect(emojis).toContain("🍎");
    });

    it('searchEmoji("chó") should return 🐶 and 🐕', () => {
      const results = searchEmoji("chó");
      const emojis = results.map((r) => r.emoji);
      expect(emojis).toContain("🐶");
      expect(emojis).toContain("🐕");
    });

    it('searchEmoji("gà") should return chicken emojis 🐔🐓🐣🐤', () => {
      const results = searchEmoji("gà");
      const emojis = results.map((r) => r.emoji);
      expect(emojis).toContain("🐔");
      expect(emojis).toContain("🐓");
      expect(emojis).toContain("🐣");
      expect(emojis).toContain("🐤");
    });

    it('searchEmoji("thầy giáo") and searchEmoji("cô giáo") both return 🧑‍🏫', () => {
      const teachers = searchEmoji("thầy giáo").map((r) => r.emoji);
      const femaleTeachers = searchEmoji("cô giáo").map((r) => r.emoji);
      expect(teachers).toContain("🧑‍🏫");
      expect(femaleTeachers).toContain("🧑‍🏫");
    });

    it("should be case-insensitive", () => {
      const lower = searchEmoji("chuối");
      const upper = searchEmoji("Chuối");
      expect(lower.map((r) => r.emoji)).toEqual(upper.map((r) => r.emoji));
    });

    it("should be diacritics-tolerant (search without dấu)", () => {
      const withDiacritics = searchEmoji("chuối");
      const withoutDiacritics = searchEmoji("chuoi");
      expect(withDiacritics.map((r) => r.emoji)).toContain("🍌");
      expect(withoutDiacritics.map((r) => r.emoji)).toContain("🍌");
    });

    it("should search English keywords", () => {
      const results = searchEmoji("apple");
      const emojis = results.map((r) => r.emoji);
      expect(emojis).toContain("🍎");
    });

    it("should return empty for empty query", () => {
      expect(searchEmoji("")).toEqual([]);
      expect(searchEmoji("  ")).toEqual([]);
    });

    it("should respect limit parameter", () => {
      const results = searchEmoji("a", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  // ── Glyph lookup & catalog membership (D-EH, D-EI) ──
  describe("Glyph lookup & catalog membership", () => {
    it("getByGlyph returns entry by exact NFC glyph", () => {
      const entry = getByGlyph("🍎");
      expect(entry).not.toBeNull();
      expect(entry?.name).toBe("Táo đỏ");
    });

    it("getByGlyph matches both with and without VS16 (U+FE0F)", () => {
      const withVS16 = getByGlyph("🕊️");
      const withoutVS16 = getByGlyph("🕊");
      expect(withVS16).not.toBeNull();
      expect(withoutVS16).not.toBeNull();
      expect(withVS16?.emoji).toBe(withoutVS16?.emoji);
    });

    it("isInCatalog returns true for catalog emojis, false otherwise", () => {
      expect(isInCatalog("🍎")).toBe(true);
      expect(isInCatalog("🪙")).toBe(true);
      expect(isInCatalog("🧶")).toBe(true);
      expect(isInCatalog("🔞")).toBe(false);
      expect(isInCatalog("🚬")).toBe(false);
      expect(isInCatalog("🔫")).toBe(false);
    });
  });

  // ── Curriculum theme mapping ──
  describe("Curriculum theme mapping", () => {
    it('getEmojisByCurriculumTheme("dong_vat") should return emojis from animal categories', () => {
      const results = getEmojisByCurriculumTheme("dong_vat");
      const allCategories = new Set(results.flatMap((r) => r.categories));
      expect(allCategories.has("animal-farm")).toBe(true);
      expect(allCategories.has("animal-wild")).toBe(true);
      expect(allCategories.has("animal-water")).toBe(true);
      expect(allCategories.has("animal-bird")).toBe(true);
      expect(allCategories.has("animal-insect")).toBe(true);
    });

    it('getEmojisByCurriculumTheme("phuong_tien") should return transport emojis', () => {
      const results = getEmojisByCurriculumTheme("phuong_tien");
      const allCategories = new Set(results.flatMap((r) => r.categories));
      expect(allCategories.has("vehicle-road")).toBe(true);
      expect(allCategories.has("vehicle-rail")).toBe(true);
      expect(allCategories.has("vehicle-water")).toBe(true);
      expect(allCategories.has("vehicle-air")).toBe(true);
    });

    it('getEmojisByCurriculumTheme("thuc_vat") should return plant emojis', () => {
      const results = getEmojisByCurriculumTheme("thuc_vat");
      const allCategories = new Set(results.flatMap((r) => r.categories));
      expect(allCategories.has("fruit")).toBe(true);
      expect(allCategories.has("vegetable")).toBe(true);
      expect(allCategories.has("flower-tree")).toBe(true);
    });
  });

  // ── Random emoji selection ──
  describe("Random emoji selection", () => {
    it('getRandomEmojis("fruit", 5) should return 5 unique emojis', () => {
      const results = getRandomEmojis("fruit", 5);
      expect(results).toHaveLength(5);
      const emojis = results.map((r) => r.emoji);
      const uniqueEmojis = new Set(emojis);
      expect(uniqueEmojis.size).toBe(5);
    });

    it("all returned emojis should belong to the requested category", () => {
      const results = getRandomEmojis("fruit", 5);
      for (const entry of results) {
        expect(entry.categories).toContain("fruit");
      }
    });

    it('getRandomEmojis("animal-farm", 8) should return 8 different emojis', () => {
      const results = getRandomEmojis("animal-farm", 8);
      expect(results).toHaveLength(8);
      const uniqueEmojis = new Set(results.map((r) => r.emoji));
      expect(uniqueEmojis.size).toBe(8);
    });

    it("should return all emojis if count exceeds pool size", () => {
      const allFruit = getEmojisByCategory("fruit");
      const results = getRandomEmojis("fruit", 999);
      expect(results).toHaveLength(allFruit.length);
    });

    it("should return empty for undefined category", () => {
      const results = getRandomEmojis("nonexistent" as EmojiCategory, 5);
      expect(results).toEqual([]);
    });

    it("should return from all emojis when category is undefined", () => {
      const results = getRandomEmojis(undefined, 10);
      expect(results).toHaveLength(10);
    });
  });

  // ── Total emoji count ──
  describe("Total emoji count", () => {
    it("should have at least 750 total distinct emoji entries", () => {
      expect(getTotalEmojiCount()).toBeGreaterThanOrEqual(750);
    });

    it("ALL_EMOJIS.length should match getTotalEmojiCount()", () => {
      expect(ALL_EMOJIS.length).toBe(getTotalEmojiCount());
    });
  });

  // ── Data integrity tests ──
  describe("Data integrity", () => {
    it("every entry should have required fields", () => {
      for (const entry of ALL_EMOJIS) {
        expect(entry.emoji).toBeTruthy();
        expect(entry.name).toBeTruthy();
        expect(entry.categories.length).toBeGreaterThanOrEqual(1);
        expect(entry.keywords.length).toBeGreaterThanOrEqual(2);
        expect(entry.curriculum_themes.length).toBeGreaterThanOrEqual(1);
        expect(entry.age_min).toBeGreaterThanOrEqual(3);
        expect(entry.age_min).toBeLessThanOrEqual(6);
      }
    });

    it("every entry category list should include its key in EMOJI_CATEGORIES", () => {
      for (const [category, entries] of Object.entries(EMOJI_CATEGORIES)) {
        for (const entry of entries) {
          expect(entry.categories).toContain(category);
        }
      }
    });
  });

  // ── Group query tests ──
  describe("Group queries", () => {
    it('getEmojisByGroup("dong_vat") should include all animal categories', () => {
      const results = getEmojisByGroup("dong_vat");
      expect(results.length).toBeGreaterThan(0);
      const allCategories = new Set(results.flatMap((r) => r.categories));
      expect(allCategories.has("animal-farm")).toBe(true);
      expect(allCategories.has("animal-wild")).toBe(true);
    });

    it('getEmojisByGroup("phuong_tien") should include all vehicle categories', () => {
      const results = getEmojisByGroup("phuong_tien");
      const allCategories = new Set(results.flatMap((r) => r.categories));
      expect(allCategories.has("vehicle-road")).toBe(true);
      expect(allCategories.has("vehicle-rail")).toBe(true);
      expect(allCategories.has("vehicle-water")).toBe(true);
      expect(allCategories.has("vehicle-air")).toBe(true);
    });
  });
});
