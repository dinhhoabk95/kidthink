import type {
  GT036Content,
  GT036Difficulty,
  GT036PaletteItem,
} from "#src/templates/GT-036/template";
import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const THEME_PALETTES: Record<string, { id: string; ref: string }[]> = {
  nature: [
    { id: "flower", ref: "EMJ-flower" },
    { id: "tree", ref: "EMJ-tree" },
    { id: "leaf", ref: "EMJ-maple-leaf" },
    { id: "sun", ref: "EMJ-sun" },
  ],
  art: [
    { id: "palette", ref: "EMJ-artist-palette" },
    { id: "crayon", ref: "EMJ-crayon" },
    { id: "pencil", ref: "EMJ-pencil" },
    { id: "brush", ref: "EMJ-paintbrush" },
  ],
  farm: [
    { id: "apple", ref: "EMJ-apple" },
    { id: "carrot", ref: "EMJ-carrot" },
    { id: "corn", ref: "EMJ-ear-of-corn" },
    { id: "chick", ref: "EMJ-baby-chick" },
  ],
  ocean: [
    { id: "fish", ref: "EMJ-fish" },
    { id: "shell", ref: "EMJ-spiral-shell" },
    { id: "anchor", ref: "EMJ-anchor" },
    { id: "crab", ref: "EMJ-crab" },
  ],
  school: [
    { id: "book", ref: "EMJ-book" },
    { id: "bell", ref: "EMJ-bell" },
    { id: "backpack", ref: "EMJ-backpack" },
    { id: "scissors", ref: "EMJ-scissors" },
  ],
  festival: [
    { id: "balloon", ref: "EMJ-balloon" },
    { id: "gift", ref: "EMJ-wrapped-gift" },
    { id: "sparkles", ref: "EMJ-sparkles" },
    { id: "party_popper", ref: "EMJ-party-popper" },
  ],
  space: [
    { id: "star", ref: "EMJ-star" },
    { id: "moon", ref: "EMJ-crescent-moon" },
    { id: "comet", ref: "EMJ-comet" },
    { id: "satellite", ref: "EMJ-satellite" },
  ],
  home: [
    { id: "chair", ref: "EMJ-chair" },
    { id: "door", ref: "EMJ-door" },
    { id: "bed", ref: "EMJ-bed" },
    { id: "cup", ref: "EMJ-teacup-without-handle" },
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

export const GT036Generator: LevelGenerator = {
  engine: "GT-036",
  axes: {
    age_band: ["5-6"],
    what: ["pattern", "rule", "colour"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band: _age_band, theme }) {
    const activeTheme = theme && THEME_PALETTES[theme] ? theme : "nature";
    const availableItems = THEME_PALETTES[activeTheme] ??
      THEME_PALETTES.nature ?? [
        { id: "flower", ref: "EMJ-flower" },
        { id: "tree", ref: "EMJ-tree" },
      ];

    const themeName = THEME_NAMES[activeTheme] ?? "hình ảnh";

    // Chọn số phần tử trong bảng màu (2 hoặc 3)
    const palSize = 2 + rng.nextInt(2);
    const chosenItems = availableItems.slice(0, palSize);

    const palette: GT036PaletteItem[] = chosenItems.map((item) => ({
      id: item.id,
      asset: { kind: "emoji" as const, ref: item.ref },
    }));

    const minRepetitions = 2 + rng.nextInt(2); // 2 hoặc 3
    const trackLengths = [6, 8, 9, 10, 12];
    const trackLength =
      trackLengths[rng.nextInt(trackLengths.length)] ?? minRepetitions * 3;

    const actualTrackLength = Math.max(trackLength, minRepetitions * 2);
    const strictness =
      rng.nextInt(3) === 0 ? ("strict" as const) : ("relaxed" as const);

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
