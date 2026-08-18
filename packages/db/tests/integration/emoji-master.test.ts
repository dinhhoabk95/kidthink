import { isValidRef, searchEmoji } from "@mindkid/emoji";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/client.ts";
import {
  hasSkinToneModifier,
  seedEmojiMasterData,
} from "../../src/seed-master/emoji.ts";

describe("Emoji Master Seeder & Invariants (BR-EMJ-01..10)", () => {
  it("Ca âm BR-EMJ-09: hasSkinToneModifier detects skin tone glyphs", () => {
    expect(hasSkinToneModifier("👍🏿")).toBe(true);
    expect(hasSkinToneModifier("👋🏼")).toBe(true);
    expect(hasSkinToneModifier("🍎")).toBe(false);
    expect(hasSkinToneModifier("🐱")).toBe(false);
  });

  it("BR-EMJ-04: searchEmoji is accent-insensitive and case-insensitive", () => {
    const resultsWithAccent = searchEmoji("táo");
    const resultsWithoutAccent = searchEmoji("tao");

    expect(resultsWithAccent.length).toBeGreaterThan(0);
    expect(resultsWithoutAccent.length).toBeGreaterThan(0);

    const codesWith = resultsWithAccent.map((e) => e.name);
    const codesWithout = resultsWithoutAccent.map((e) => e.name);

    expect(codesWith).toContain("Táo đỏ");
    expect(codesWithout).toContain("Táo đỏ");
  });

  it("isValidRef returns true for valid registry emoji codes", () => {
    expect(isValidRef("EMJ-red-apple")).toBe(true);
    expect(isValidRef("EMJ-nonexistent-xyz-123")).toBe(false);
  });

  it("seeds emoji_registry database table idempotently", async () => {
    const db = getOwnerDb();
    const stats1 = await seedEmojiMasterData(db);
    expect(stats1.emojiCount).toBeGreaterThan(800);

    // Idempotent re-run
    const stats2 = await seedEmojiMasterData(db);
    expect(stats2.emojiCount).toBe(stats1.emojiCount);
  }, 30_000);
});
