import { ALL_EMOJIS, getEmojiCode } from "@mindkid/emoji";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { emojiRegistry } from "../schema/taxonomy.ts";

const SKIN_TONE_REGEX = /[\u{1F3FB}-\u{1F3FF}]/u;

/**
 * Checks if an emoji string contains skin tone modifiers (BR-EMJ-09).
 */
export function hasSkinToneModifier(emojiStr: string): boolean {
  return SKIN_TONE_REGEX.test(emojiStr);
}

/**
 * Seeds Master Emoji Registry from `@mindkid/emoji`.
 * Enforces BR-EMJ-09 (no skin tone modifiers allowed).
 * Idempotent according to `code`.
 */
export async function seedEmojiMasterData(
  db: NodePgDatabase<Record<string, unknown>>
): Promise<{ emojiCount: number }> {
  let insertedCount = 0;

  for (const entry of ALL_EMOJIS) {
    if (hasSkinToneModifier(entry.emoji)) {
      throw new Error(
        `BR-EMJ-09 violation: Emoji '${entry.emoji}' (${entry.name}) contains a skin tone modifier`
      );
    }

    const code = getEmojiCode(entry);

    const name = entry.name || "";
    const keywords = entry.keywords || [];

    await db
      .insert(emojiRegistry)
      .values({
        code,
        unicode: entry.emoji,
        name,
        category: entry.category,
        searchKeywords: keywords,
        ageSuitability: entry.age_min >= 4 ? "4plus" : "all",
        status: "active",
      })
      .onConflictDoNothing({ target: emojiRegistry.code });

    insertedCount++;
  }

  return { emojiCount: insertedCount };
}
