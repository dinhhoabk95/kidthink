import type {
  GT036Content,
  GT036Difficulty,
  GT036PaletteItem,
} from "#src/templates/GT-036/template";
import { sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const THEME_PALETTES: Record<string, { id: string; ref: string }[]> = {
  nature: [
    { id: "flower", ref: "🌸" },
    { id: "tree", ref: "🌳" },
    { id: "leaf", ref: "🍁" },
    { id: "sun", ref: "☀️" },
  ],
  art: [
    { id: "palette", ref: "🎨" },
    { id: "crayon", ref: "🖍️" },
    { id: "pencil", ref: "✏️" },
    { id: "brush", ref: "🖌️" },
  ],
  farm: [
    { id: "apple", ref: "🍎" },
    { id: "carrot", ref: "🥕" },
    { id: "corn", ref: "🌽" },
    { id: "chick", ref: "🐤" },
  ],
  ocean: [
    { id: "fish", ref: "🐟" },
    { id: "shell", ref: "🐚" },
    { id: "anchor", ref: "⚓" },
    { id: "crab", ref: "🦀" },
  ],
  school: [
    { id: "book", ref: "📖" },
    { id: "bell", ref: "🔔" },
    { id: "backpack", ref: "🎒" },
    { id: "scissors", ref: "✂️" },
  ],
  festival: [
    { id: "balloon", ref: "🎈" },
    { id: "gift", ref: "🎁" },
    { id: "sparkles", ref: "✨" },
    { id: "party_popper", ref: "🎉" },
  ],
  space: [
    { id: "star", ref: "⭐" },
    { id: "moon", ref: "🌙" },
    { id: "comet", ref: "☄️" },
    { id: "satellite", ref: "🛰️" },
  ],
  home: [
    { id: "chair", ref: "🪑" },
    { id: "door", ref: "🚪" },
    { id: "bed", ref: "🛏️" },
    { id: "cup", ref: "🍵" },
  ],
};

const THEME_NAMES: Record<string, string> = {
  nature: "hoa lá thiên nhiên",
  art: "dụng cụ mỹ thuật",
  farm: "nông trại vui vẻ",
  ocean: "đại dương xanh",
  school: "đồ dùng học tập",
  festival: "lễ hội rực rỡ",
  space: "vũ trụ kỳ thú",
  home: "ngôi nhà thân yêu",
};

function pickStep1Config(rng: { nextInt(max: number): number }): {
  palSize: number;
  minRepetitions: number;
  actualTrackLength: number;
  strictness: GT036Difficulty["strictness"];
} {
  const palSize = 2 + rng.nextInt(2);
  const minRepetitions = 2 + rng.nextInt(2);
  const strictness: GT036Difficulty["strictness"] =
    rng.nextInt(2) === 0 ? "strict" : "relaxed";
  if (strictness === "strict") {
    const base = palSize === 2 ? [6, 8] : [6, 12];
    const strictPool = base.filter((n) => n >= minRepetitions * 2);
    const len = strictPool[rng.nextInt(strictPool.length)] ?? 6;
    return { palSize, minRepetitions, actualTrackLength: len, strictness };
  }
  const pool = palSize === 2 ? [6, 8, 9, 10] : [6, 8, 9, 10, 12];
  const candidates = pool.filter((len) => len >= minRepetitions * 2);
  const len = candidates[rng.nextInt(candidates.length)] ?? minRepetitions * 2;
  return { palSize, minRepetitions, actualTrackLength: len, strictness };
}

function pickStep2Config(rng: { nextInt(max: number): number }): {
  palSize: number;
  minRepetitions: number;
  actualTrackLength: number;
  strictness: GT036Difficulty["strictness"];
} {
  const palSize = 3 + rng.nextInt(2);
  const minRepetitions = 2 + rng.nextInt(2);
  const pool = palSize >= 4 ? [8, 9, 10, 12] : [6, 8, 9, 10, 12];
  const candidates = pool.filter((len) => len >= minRepetitions * 2);
  const len = candidates[rng.nextInt(candidates.length)] ?? 8;
  const canStrict = len === 6 || len === 12;
  const strictness: GT036Difficulty["strictness"] =
    canStrict && rng.nextInt(2) === 0 ? "strict" : "relaxed";
  return { palSize, minRepetitions, actualTrackLength: len, strictness };
}

function pickEscalatedConfig(
  rng: { nextInt(max: number): number },
  step: number
): {
  palSize: number;
  minRepetitions: number;
  actualTrackLength: number;
  strictness: GT036Difficulty["strictness"];
} {
  if (step <= 0) {
    return {
      palSize: 2,
      minRepetitions: 2,
      actualTrackLength: rng.nextInt(2) === 0 ? 6 : 8,
      strictness: "relaxed",
    };
  }
  return step === 1 ? pickStep1Config(rng) : pickStep2Config(rng);
}

export const GT036Generator: LevelGenerator = {
  engine: "GT-036",
  axes: {
    age_band: ["5-6"],
    what: ["pattern", "rule", "colour"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, theme, escalation_step }) {
    const activeTheme = theme && THEME_PALETTES[theme] ? theme : "nature";
    const availableItems = THEME_PALETTES[activeTheme] ??
      THEME_PALETTES.nature ?? [
        { id: "flower", ref: "🌸" },
        { id: "tree", ref: "🌳" },
      ];

    const themeName = THEME_NAMES[activeTheme] ?? "hình ảnh";
    const { palSize, minRepetitions, actualTrackLength, strictness } =
      pickEscalatedConfig(rng, escalation_step ?? 0);

    const chosenItems = sampleUnique(
      rng,
      availableItems,
      Math.min(palSize, availableItems.length)
    );

    const palette: GT036PaletteItem[] = chosenItems.map((item) => ({
      id: item.id,
      asset: { kind: "emoji" as const, ref: item.ref },
    }));

    const content: GT036Content = {
      prompt: `Bé tự tạo quy luật lặp lại bằng các hình ${themeName} nhé!`,
      palette,
      track_length: actualTrackLength,
      min_repetitions: minRepetitions,
    };

    const difficulty: GT036Difficulty = {
      palette_size: palette.length,
      track_length: actualTrackLength,
      min_repetitions: minRepetitions,
      strictness,
      allow_retry: true,
      hint_after_ms: 10_000,
    };

    return { content_pack: content, difficulty_params: difficulty };
  },
};
