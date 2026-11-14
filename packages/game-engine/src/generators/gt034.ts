import type { AgeBand } from "#src/contracts/types";
import type {
  GT034Content,
  GT034Difficulty,
  GT034Instrument,
} from "#src/templates/GT-034/template";
import { sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type {
  GeneratedLevel,
  GeneratorInput,
  LevelGenerator,
} from "./types.js";

interface InstrumentSpec {
  readonly id: string;
  readonly name_vi: string;
  readonly emoji: string;
  readonly freq: number;
  readonly type?: "sine" | "triangle" | "square" | "sawtooth";
}

const CORE_INSTRUMENTS: readonly InstrumentSpec[] = [
  { id: "drum", name_vi: "Trống", emoji: "🥁", freq: 240, type: "triangle" },
  { id: "clap", name_vi: "Vỗ tay", emoji: "👏", freq: 420, type: "square" },
  { id: "bell", name_vi: "Chuông", emoji: "🔔", freq: 660, type: "sine" },
  {
    id: "wood",
    name_vi: "Mõ gỗ",
    emoji: "🪵",
    freq: 520,
    type: "triangle",
  },
];

const EXTRA_INSTRUMENTS: readonly InstrumentSpec[] = [
  { id: "triangle", name_vi: "Tam giác", emoji: "🔺", freq: 880, type: "sine" },
  { id: "maraca", name_vi: "Lắc tay", emoji: "🪇", freq: 720, type: "square" },
  { id: "gong", name_vi: "Chiêng", emoji: "🪘", freq: 196, type: "triangle" },
  {
    id: "bamboo",
    name_vi: "Phách tre",
    emoji: "🎋",
    freq: 580,
    type: "triangle",
  },
];

interface AgePreset {
  readonly instCount: number;
  readonly minLen: number;
  readonly maxLen: number;
  readonly baseTempo: number;
  readonly hintAfterMs: number;
  readonly replayLimit: number;
  readonly allowRest: boolean;
}

const AGE_PRESETS: Record<AgeBand, AgePreset> = {
  "3-4": {
    instCount: 2,
    minLen: 4,
    maxLen: 4,
    baseTempo: 80,
    hintAfterMs: 6000,
    replayLimit: 3,
    allowRest: false,
  },
  "4-5": {
    instCount: 2,
    minLen: 4,
    maxLen: 6,
    baseTempo: 90,
    hintAfterMs: 5500,
    replayLimit: 2,
    allowRest: true,
  },
  "5-6": {
    instCount: 3,
    minLen: 6,
    maxLen: 8,
    baseTempo: 100,
    hintAfterMs: 5000,
    replayLimit: 2,
    allowRest: true,
  },
};

function toInstrument(spec: InstrumentSpec): GT034Instrument {
  return {
    instrument_id: spec.id,
    name_vi: spec.name_vi,
    asset: { kind: "emoji", ref: spec.emoji },
    freq: spec.freq,
    type: spec.type,
  };
}

function pickMotifItem(
  instIds: readonly string[],
  motif: readonly (string | null)[],
  pos: number,
  includeRest: boolean,
  motifLen: number,
  rng: GeneratorInput["rng"]
): string | null {
  if (includeRest && pos === motifLen - 1 && motifLen >= 2) {
    return null;
  }
  const idx = (pos + rng.nextInt(instIds.length)) % instIds.length;
  const chosen = instIds[idx] ?? instIds[0] ?? "drum";
  if (pos > 0 && chosen === motif[pos - 1] && instIds.length > 1) {
    return instIds[(idx + 1) % instIds.length] ?? chosen;
  }
  return chosen;
}

function buildRepeatingPattern(
  instIds: readonly string[],
  patternLen: number,
  includeRest: boolean,
  rng: GeneratorInput["rng"]
): (string | null)[] {
  const motifLen =
    patternLen % 3 === 0 && instIds.length >= 2 && rng.next() > 0.45 ? 3 : 2;
  const motif: (string | null)[] = [];
  for (let i = 0; i < motifLen; i++) {
    motif.push(pickMotifItem(instIds, motif, i, includeRest, motifLen, rng));
  }
  return Array.from(
    { length: patternLen },
    (_, i) => motif[i % motif.length] ?? null
  );
}

function resolveInstCount(
  ageBand: AgeBand,
  step: number,
  fallback: number
): number {
  if (ageBand !== "5-6") {
    return fallback;
  }
  if (step <= 0) {
    return 2;
  }
  return step >= 3 ? 4 : 3;
}

function resolvePatternLen(
  ageBand: AgeBand,
  step: number,
  fallback: number,
  rng: GeneratorInput["rng"]
): number {
  let raw = fallback;
  if (ageBand === "5-6") {
    if (step <= 0) {
      raw = 4;
    } else if (step === 1) {
      raw = 6;
    } else {
      raw = step >= 3 || rng.next() > 0.5 ? 8 : 6;
    }
  }
  return Math.max(4, raw % 2 === 0 ? raw : raw + 1);
}

export const GT034Generator: LevelGenerator<GT034Content, GT034Difficulty> = {
  engine: "GT-034",
  axes: {
    age_band: ["5-6"],
    what: ["rhythm_pattern", "beat_imitation", "rest_beat"],
    theme: [...VALID_GENERATOR_THEMES],
  },

  generate(
    input: GeneratorInput
  ): GeneratedLevel<GT034Content, GT034Difficulty> {
    const preset = AGE_PRESETS[input.age_band];
    const step = Math.max(0, input.escalation_step ?? 0);
    const instCount = resolveInstCount(input.age_band, step, preset.instCount);

    const pool = [...CORE_INSTRUMENTS, ...EXTRA_INSTRUMENTS];
    const chosenSpecs = sampleUnique(input.rng, pool, instCount);
    const instruments = chosenSpecs.map(toInstrument);
    const instIds = instruments.map((inst) => inst.instrument_id);

    const lenSpan = Math.max(0, preset.maxLen - preset.minLen);
    const fallbackLen =
      preset.minLen + (lenSpan > 0 ? input.rng.nextInt(lenSpan + 1) : 0);
    const patternLen = resolvePatternLen(
      input.age_band,
      step,
      fallbackLen,
      input.rng
    );

    const steppedTempo = Math.max(60, preset.baseTempo - step * 4);
    const maxSafeTempo = Math.floor(720 / patternLen);
    const tempoBpm = Math.min(steppedTempo, maxSafeTempo);

    const includeRest =
      preset.allowRest &&
      (input.what === "rest_beat" || input.rng.next() > 0.65);

    const targetPattern = buildRepeatingPattern(
      instIds,
      patternLen,
      includeRest,
      input.rng
    );

    const replayLimit = Math.min(4, preset.replayLimit + (step >= 2 ? 1 : 0));
    const hintAfterMs = Math.min(10_000, preset.hintAfterMs + step * 500);

    const prompt = includeRest
      ? "Nghe nhịp có chỗ nghỉ rồi gõ lại theo đúng điệu nhé!"
      : "Nghe dế mèn gõ nhịp rồi gõ lại cho giống nhé!";

    return {
      content_pack: {
        prompt,
        instruments,
        target_pattern: targetPattern,
        tempo_bpm: tempoBpm,
      },
      difficulty_params: {
        item_count: instruments.length,
        hint_after_ms: hintAfterMs,
        allow_replay: true,
        tempo_bpm: tempoBpm,
        pattern_length: patternLen,
        instrument_count: instruments.length,
        replay_limit: replayLimit,
      },
    };
  },
};
