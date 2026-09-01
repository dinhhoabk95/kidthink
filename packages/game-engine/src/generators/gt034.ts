import type {
  GT034Content,
  GT034Difficulty,
  GT034Instrument,
} from "#src/templates/GT-034/template";
import type { LevelGenerator } from "./types.js";

const DEFAULT_THEMES = [
  "school",
  "art",
  "nature",
  "animal",
  "home",
  "festival",
  "space",
  "food",
];

const INSTRUMENT_POOLS: Record<
  string,
  { id: string; name_vi: string; assetRef: string; freq: number }[]
> = {
  school: [
    { id: "bell", name_vi: "Chuông học", assetRef: "EMJ-bell", freq: 520 },
    { id: "drum", name_vi: "Trống trường", assetRef: "EMJ-drum", freq: 260 },
    { id: "whistle", name_vi: "Còi", assetRef: "EMJ-whistle", freq: 980 },
  ],
  art: [
    {
      id: "triangle_inst",
      name_vi: "Kẻng tam giác",
      assetRef: "EMJ-triangle-inst",
      freq: 880,
    },
    { id: "drum", name_vi: "Trống nhạc", assetRef: "EMJ-drum", freq: 260 },
    {
      id: "xylophone",
      name_vi: "Đàn mộc cầm",
      assetRef: "EMJ-xylophone",
      freq: 660,
    },
  ],
  nature: [
    { id: "woodblock", name_vi: "Mõ gỗ", assetRef: "EMJ-woodblock", freq: 440 },
    { id: "rainstick", name_vi: "Ống tre", assetRef: "EMJ-bamboo", freq: 330 },
    { id: "stone_chime", name_vi: "Khánh đá", assetRef: "EMJ-rock", freq: 750 },
  ],
  animal: [
    { id: "frog_guiro", name_vi: "Cóc gỗ", assetRef: "EMJ-frog", freq: 360 },
    {
      id: "bird_whistle",
      name_vi: "Còi chim",
      assetRef: "EMJ-bird",
      freq: 920,
    },
    { id: "paw_drum", name_vi: "Trống gấu", assetRef: "EMJ-bear", freq: 240 },
  ],
  home: [
    { id: "pot_lid", name_vi: "Nắp nồi", assetRef: "EMJ-pot", freq: 700 },
    {
      id: "spoon_tap",
      name_vi: "Muỗng inox",
      assetRef: "EMJ-spoon",
      freq: 850,
    },
    { id: "box_drum", name_vi: "Thùng carton", assetRef: "EMJ-box", freq: 200 },
  ],
  festival: [
    {
      id: "festival_drum",
      name_vi: "Trống hội",
      assetRef: "EMJ-drum",
      freq: 220,
    },
    { id: "cymbal", name_vi: "Thanh la", assetRef: "EMJ-cymbal", freq: 680 },
    { id: "gong", name_vi: "Chiêng đồng", assetRef: "EMJ-gong", freq: 480 },
  ],
  space: [
    {
      id: "laser_pulse",
      name_vi: "Tín hiệu sao",
      assetRef: "EMJ-star",
      freq: 880,
    },
    {
      id: "deep_radar",
      name_vi: "Radar vũ trụ",
      assetRef: "EMJ-satellite",
      freq: 280,
    },
    {
      id: "spark_chime",
      name_vi: "Bụi ngân hà",
      assetRef: "EMJ-sparkles",
      freq: 1050,
    },
  ],
  food: [
    {
      id: "coconut_tap",
      name_vi: "Gáo dừa",
      assetRef: "EMJ-coconut",
      freq: 410,
    },
    { id: "tea_cup", name_vi: "Tách sứ", assetRef: "EMJ-teacup", freq: 820 },
    {
      id: "melon_drum",
      name_vi: "Trống dưa",
      assetRef: "EMJ-melon",
      freq: 260,
    },
  ],
};

export const GT034Generator: LevelGenerator = {
  engine: "GT-034",
  axes: {
    age_band: ["5-6"],
    what: ["sound", "pattern", "time", "sequence"],
    theme: DEFAULT_THEMES,
  },
  generate({ rng, age_band: _age_band, theme }) {
    const activeTheme = theme && INSTRUMENT_POOLS[theme] ? theme : "school";
    const pool = INSTRUMENT_POOLS[activeTheme] ?? INSTRUMENT_POOLS.school ?? [];

    // Pick 2 or 3 instruments
    const instCount = 2 + rng.nextInt(2); // 2 or 3
    const chosenPool = pool.slice(0, instCount);

    const instruments: GT034Instrument[] = chosenPool.map((p) => ({
      instrument_id: p.id,
      asset: { kind: "emoji", ref: p.assetRef },
      freq: p.freq,
      type: "triangle",
      name_vi: p.name_vi,
    }));

    const instIds = instruments.map((i) => i.instrument_id);

    // Generate motif: length 2 (e.g. [A, B]) or length 3 (e.g. [A, B, C] or [A, null, B])
    const motifLen = instCount === 2 ? 2 : 3;
    const motif: (string | null)[] = [];

    for (let m = 0; m < motifLen; m++) {
      // 15% chance of rest on 2nd element for 3-step motif
      if (m === 1 && motifLen === 3 && rng.nextInt(6) === 0) {
        motif.push(null);
      } else {
        const id = instIds[m % instIds.length];
        motif.push(id ?? instIds[0] ?? "drum");
      }
    }

    // Repeat motif 2 or 3 times
    const repeats = 2 + (motifLen === 2 ? rng.nextInt(2) : 0); // 2 or 3 repeats for len 2, 2 repeats for len 3
    const targetPattern: (string | null)[] = [];
    for (let r = 0; r < repeats; r++) {
      targetPattern.push(...motif);
    }

    const tempo = 75 + rng.nextInt(25); // 75 to 99 bpm

    const content: GT034Content = {
      prompt: "Bé lắng nghe nhịp điệu và gõ lại đúng thứ tự các nhạc cụ nhé!",
      instruments,
      target_pattern: targetPattern,
      tempo_bpm: tempo,
    };

    const difficulty: GT034Difficulty = {
      pattern_length: targetPattern.length,
      instrument_count: instruments.length,
      tempo_bpm: tempo,
      allow_replay: true,
      replay_limit: 3,
      hint_after_ms: 8000,
    };

    return { content_pack: content, difficulty_params: difficulty };
  },
};
