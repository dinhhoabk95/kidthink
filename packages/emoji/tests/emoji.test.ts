import { describe, expect, it } from "vitest";
import type { EmojiCategory } from "../src/index";
import {
  ALL_CATEGORIES,
  ALL_EMOJIS,
  EMOJI_CATEGORIES,
  getAllCategories,
  getEmojisByCategory,
  getEmojisByCurriculumTheme,
  getEmojisByGroup,
  getRandomEmojis,
  getTotalEmojiCount,
  searchEmoji,
} from "../src/index";

describe("@kidthink/emoji", () => {
  // ── Subtask 8.1: Test mỗi category có ít nhất 10 emoji entries ──
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

  // ── Subtask 8.2: Test search ──
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

    it("should be case-insensitive", () => {
      const lower = searchEmoji("chuối");
      const upper = searchEmoji("Chuối");
      expect(lower.map((r) => r.emoji)).toEqual(upper.map((r) => r.emoji));
    });

    it("should be diacritics-tolerant (search without dấu)", () => {
      const withDiacritics = searchEmoji("chuối");
      const withoutDiacritics = searchEmoji("chuoi");
      // Both should find banana
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

  // ── Subtask 8.3: Test curriculum mapping ──
  describe("Curriculum theme mapping", () => {
    it('getEmojisByCurriculumTheme("dong_vat") should return emojis from all animal categories', () => {
      const results = getEmojisByCurriculumTheme("dong_vat");
      const categories = new Set(results.map((r) => r.category));
      expect(categories.has("animal-farm")).toBe(true);
      expect(categories.has("animal-wild")).toBe(true);
      expect(categories.has("animal-water")).toBe(true);
      expect(categories.has("animal-bird")).toBe(true);
      expect(categories.has("animal-insect")).toBe(true);
    });

    it('getEmojisByCurriculumTheme("phuong_tien") should return all transport emojis', () => {
      const results = getEmojisByCurriculumTheme("phuong_tien");
      const categories = new Set(results.map((r) => r.category));
      expect(categories.has("vehicle-road")).toBe(true);
      expect(categories.has("vehicle-rail")).toBe(true);
      expect(categories.has("vehicle-water")).toBe(true);
      expect(categories.has("vehicle-air")).toBe(true);
    });

    it('getEmojisByCurriculumTheme("thuc_vat") should return plant emojis', () => {
      const results = getEmojisByCurriculumTheme("thuc_vat");
      const categories = new Set(results.map((r) => r.category));
      expect(categories.has("fruit")).toBe(true);
      expect(categories.has("vegetable")).toBe(true);
      expect(categories.has("flower-tree")).toBe(true);
    });
  });

  // ── Subtask 8.4: Test getRandomEmojis ──
  describe("Random emoji selection", () => {
    it('getRandomEmojis("fruit", 5) should return 5 unique emojis', () => {
      const results = getRandomEmojis("fruit", 5);
      expect(results).toHaveLength(5);
      const emojis = results.map((r) => r.emoji);
      const uniqueEmojis = new Set(emojis);
      expect(uniqueEmojis.size).toBe(5);
    });

    it("all returned emojis should be from the requested category", () => {
      const results = getRandomEmojis("fruit", 5);
      for (const entry of results) {
        expect(entry.category).toBe("fruit");
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

  // ── Subtask 8.5: Test tổng emoji count ≥ 800 ──
  describe("Total emoji count", () => {
    it("should have at least 800 total emoji entries", () => {
      expect(getTotalEmojiCount()).toBeGreaterThanOrEqual(800);
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
        expect(entry.name_vi).toBeTruthy();
        expect(entry.category).toBeTruthy();
        expect(entry.keywords_vi.length).toBeGreaterThanOrEqual(2);
        expect(entry.keywords_en.length).toBeGreaterThanOrEqual(1);
        expect(entry.curriculum_themes.length).toBeGreaterThanOrEqual(1);
        expect(entry.age_min).toBeGreaterThanOrEqual(3);
        expect(entry.age_min).toBeLessThanOrEqual(6);
      }
    });

    it("every entry category should match its source file category", () => {
      for (const [category, entries] of Object.entries(EMOJI_CATEGORIES)) {
        for (const entry of entries) {
          expect(entry.category).toBe(category);
        }
      }
    });
  });

  // ── Group query tests ──
  describe("Group queries", () => {
    it('getEmojisByGroup("dong_vat") should include all animal categories', () => {
      const results = getEmojisByGroup("dong_vat");
      expect(results.length).toBeGreaterThan(0);
      const categories = new Set(results.map((r) => r.category));
      expect(categories.has("animal-farm")).toBe(true);
      expect(categories.has("animal-wild")).toBe(true);
    });

    it('getEmojisByGroup("phuong_tien") should include all vehicle categories', () => {
      const results = getEmojisByGroup("phuong_tien");
      const categories = new Set(results.map((r) => r.category));
      expect(categories.has("vehicle-road")).toBe(true);
      expect(categories.has("vehicle-rail")).toBe(true);
      expect(categories.has("vehicle-water")).toBe(true);
      expect(categories.has("vehicle-air")).toBe(true);
    });
  });
});
