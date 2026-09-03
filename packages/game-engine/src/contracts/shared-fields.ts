import { z } from "zod";

/**
 * Task #202 (D-EB, D-EC): Emoji reference is real UTF-8 glyph, e.g. "🍎".
 * No code lookup, no regex pattern. Data is plain text `z.string().min(1)`.
 */
export const EmojiRef = z.string().min(1);

/**
 * Asset reference shared by every template's content contract.
 *
 * Returns a FRESH schema per call on purpose: `zod-to-json-schema` dedupes by
 * object identity, so a single shared const would turn repeated occurrences
 * (e.g. GT-005 left/right) into `$ref`s and change the published JSON Schema.
 */
export const assetSchema = () =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("emoji"), ref: EmojiRef }),
    z.object({ kind: z.literal("image"), path: z.string() }),
    z.object({ kind: z.literal("text"), text: z.string().min(1) }),
  ]);

/** `prompt` + `prompt_audio_ref`, present on every template content contract. */
export const promptFields = () => ({
  prompt: z.string().min(4).max(80),
  prompt_audio_ref: z.string().optional(),
});
