/**
 * Level mẫu cho ca âm của `check:narration-coverage` (Task #274 S5). Hình dạng
 * lấy theo level thật do `buildLevelsForSkill` sinh — cùng thứ seeder đổ vào
 * `game_level_rounds` — không tự bịa định dạng.
 */

interface FixtureRound {
  readonly instruction: string;
  readonly instruction_audio_path?: string;
  readonly content_pack: FixturePack;
}

interface FixturePack {
  readonly prompt: string;
  readonly target_item?: FixtureItem;
  readonly options?: readonly (FixtureItem & {
    readonly is_correct: boolean;
  })[];
}

interface FixtureItem {
  readonly item_id: string;
  readonly asset:
    | {
        readonly kind: "emoji";
        readonly ref: string;
        readonly audio_path?: string;
      }
    | {
        readonly kind: "text";
        readonly text: string;
        readonly audio_path?: string;
      };
}

export interface FixtureLevel {
  readonly header: { readonly code: string; readonly template_code: string };
  readonly content_pack: FixturePack;
  readonly rounds?: readonly FixtureRound[];
}

const APPLE_PACK: FixturePack = {
  prompt: "Quả nào màu đỏ?",
  target_item: { item_id: "apple", asset: { kind: "emoji", ref: "🍎" } },
  options: [
    { item_id: "apple", asset: { kind: "emoji", ref: "🍎" }, is_correct: true },
    {
      item_id: "banana",
      asset: { kind: "emoji", ref: "🍌" },
      is_correct: false,
    },
  ],
};

/** Hai vòng GT-001: vòng đầu có mp3 câu dẫn, vòng sau không. */
export const LEVEL_ONE_ROUND_WITH_MP3: FixtureLevel = {
  header: { code: "GL-FIX-MP3", template_code: "GT-001" },
  content_pack: APPLE_PACK,
  rounds: [
    {
      instruction: "Quả nào màu đỏ?",
      instruction_audio_path: "/audio/voice/fixture/qua-nao-mau-do.mp3",
      content_pack: APPLE_PACK,
    },
    { instruction: "Quả nào màu đỏ?", content_pack: APPLE_PACK },
  ],
};

/** Cùng level nhưng vòng đầu đã mất mp3 — độ phủ đi lùi. */
export const LEVEL_MP3_LOST: FixtureLevel = {
  header: { code: "GL-FIX-MP3", template_code: "GT-001" },
  content_pack: APPLE_PACK,
  rounds: [
    { instruction: "Quả nào màu đỏ?", content_pack: APPLE_PACK },
    { instruction: "Quả nào màu đỏ?", content_pack: APPLE_PACK },
  ],
};

/** Level không khai `rounds`: seeder ghi đúng một vòng, không mp3. */
export const LEVEL_WITHOUT_ROUNDS: FixtureLevel = {
  header: { code: "GL-FIX-NOROUNDS", template_code: "GT-002" },
  content_pack: APPLE_PACK,
};

/** Từ khoá có mp3 riêng trên asset. */
export const LEVEL_KEYWORD_WITH_MP3: FixtureLevel = {
  header: { code: "GL-FIX-KEYWORD", template_code: "GT-001" },
  content_pack: APPLE_PACK,
  rounds: [
    {
      instruction: "Số nào là số năm?",
      content_pack: {
        prompt: "Số nào là số năm?",
        options: [
          {
            item_id: "n5",
            asset: {
              kind: "text",
              text: "5",
              audio_path: "/audio/voice/common/numbers/5.mp3",
            },
            is_correct: true,
          },
        ],
      },
    },
  ],
};

/** Glyph không có tên tiếng Việt trong `@mindkid/emoji` — TTS sẽ đọc glyph thô. */
export const LEVEL_UNNAMED_GLYPH: FixtureLevel = {
  header: { code: "GL-FIX-GLYPH", template_code: "GT-001" },
  content_pack: APPLE_PACK,
  rounds: [
    {
      instruction: "Hình nào giống?",
      content_pack: {
        prompt: "Hình nào giống?",
        target_item: { item_id: "alch", asset: { kind: "emoji", ref: "🜁" } },
      },
    },
  ],
};
