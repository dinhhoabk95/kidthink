import type {
  GT034Content,
  GT034Difficulty,
  GT034Instrument,
} from "#src/templates/GT-034/template";
import { VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const INSTRUMENT_POOLS: Record<
  string,
  { id: string; name_vi: string; assetRef: string; freq: number }[]
> = {
  school: [
    { id: "bell", name_vi: "Chuông học", assetRef: "🔔", freq: 520 },
    { id: "drum", name_vi: "Trống trường", assetRef: "🥁", freq: 260 },
    { id: "flute", name_vi: "Sáo trúc", assetRef: "🪈", freq: 980 },
  ],
  art: [
    {
      id: "guitar",
      name_vi: "Đàn guitar",
      assetRef: "🎸",
      freq: 440,
    },
    { id: "drum", name_vi: "Trống nhạc", assetRef: "🥁", freq: 260 },
    {
      id: "piano",
      name_vi: "Đàn piano",
      assetRef: "🎹",
      freq: 660,
    },
  ],
  nature: [
    { id: "flute", name_vi: "Sáo tre", assetRef: "🪈", freq: 440 },
    { id: "drum", name_vi: "Trống gỗ", assetRef: "🥁", freq: 330 },
    { id: "bell", name_vi: "Chuông gió", assetRef: "🔔", freq: 750 },
  ],
  animal: [
    { id: "drum", name_vi: "Trống gấu", assetRef: "🥁", freq: 240 },
    {
      id: "flute",
      name_vi: "Sáo chim",
      assetRef: "🪈",
      freq: 920,
    },
    { id: "trumpet", name_vi: "Kèn voi", assetRef: "🎺", freq: 360 },
  ],
  home: [
    { id: "piano", name_vi: "Đàn piano", assetRef: "🎹", freq: 700 },
    {
      id: "guitar",
      name_vi: "Đàn guitar",
      assetRef: "🎸",
      freq: 850,
    },
    { id: "radio", name_vi: "Đài radio", assetRef: "📻", freq: 200 },
  ],
  festival: [
    {
      id: "festival_drum",
      name_vi: "Trống hội",
      assetRef: "🥁",
      freq: 220,
    },
    { id: "trumpet", name_vi: "Kèn hội", assetRef: "🎺", freq: 680 },
    {
      id: "maracas",
      name_vi: "Xúc xắc hội",
      assetRef: "🪇",
      freq: 480,
    },
  ],
  space: [
    {
      id: "laser_pulse",
      name_vi: "Tín hiệu sao",
      assetRef: "⭐",
      freq: 880,
    },
    {
      id: "deep_radar",
      name_vi: "Radar vũ trụ",
      assetRef: "🛰️",
      freq: 280,
    },
    {
      id: "spark_chime",
      name_vi: "Bụi ngân hà",
      assetRef: "✨",
      freq: 1050,
    },
  ],
  food: [
    {
      id: "drum",
      name_vi: "Trống vui",
      assetRef: "🥁",
      freq: 410,
    },
    { id: "flute", name_vi: "Sáo vui", assetRef: "🪈", freq: 820 },
    {
      id: "maracas",
      name_vi: "Xúc xắc vui",
      assetRef: "🪇",
      freq: 260,
    },
  ],
};

export const GT034Generator: LevelGenerator = {
  engine: "GT-034",
  axes: {
    age_band: ["5-6"],
    what: ["sound", "pattern", "time", "sequence"],
    theme: [...VALID_GENERATOR_THEMES],
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
