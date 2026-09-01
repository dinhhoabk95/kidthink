import type { AgeBand } from "#src/contracts/types";
import type { NoteRecipe } from "./sfx-engine";

export interface BeatInstrument {
  readonly instrument_id: string;
  readonly freq: number;
  readonly type?: OscillatorType;
  readonly name_vi?: string;
}

export interface BeatSystemOptions {
  readonly tempo_bpm: number;
  readonly instruments: readonly BeatInstrument[];
  readonly age_band?: AgeBand;
}

/** Tolerance window in milliseconds for timing-based checks by age band */
export const BEAT_TIMING_TOLERANCE_MS: Record<AgeBand, number> = {
  "3-4": 300,
  "4-5": 220,
  "5-6": 160,
};

/**
 * Pure BeatSystem utility class.
 * Constructs sound note recipes and compares beat patterns without any Web Audio or network side effects (BR-ENG-03, BR-ENG-16).
 */
export class BeatSystem {
  private readonly bpm: number;
  private readonly instrumentMap: Map<string, BeatInstrument>;
  private readonly ageBand: AgeBand;

  constructor(options: BeatSystemOptions) {
    this.bpm = Math.max(60, Math.min(120, options.tempo_bpm));
    this.instrumentMap = new Map(
      options.instruments.map((inst) => [inst.instrument_id, inst])
    );
    this.ageBand = options.age_band ?? "5-6";
  }

  /** Duration of one beat in seconds */
  get beatDurationSec(): number {
    return 60 / this.bpm;
  }

  /**
   * Build NoteRecipe array from pattern steps.
   * Null items represent rests (silence).
   */
  buildNoteRecipes(pattern: readonly (string | null)[]): NoteRecipe[] {
    const recipes: NoteRecipe[] = [];
    const beatSec = this.beatDurationSec;

    for (let i = 0; i < pattern.length; i++) {
      const step = pattern[i];
      if (!step) {
        continue; // Rest
      }

      const inst = this.instrumentMap.get(step);
      if (!inst) {
        continue;
      }

      const durationSec = Math.min(0.3, beatSec * 0.7);
      const rampOutSec = Math.max(0.04, durationSec * 0.4);

      recipes.push({
        delaySec: i * beatSec,
        type: inst.type ?? "triangle",
        freq: inst.freq,
        volume: 0.16,
        durationSec,
        rampOutSec,
      });
    }

    return recipes;
  }

  /**
   * Compare user's tapped steps against the target pattern.
   * Returns whether sequence matches and detailed diff per step.
   */
  evaluateSequence(
    userSteps: readonly (string | null)[],
    targetPattern: readonly (string | null)[]
  ): {
    matched: boolean;
    stepMatches: boolean[];
    correctCount: number;
    totalCount: number;
  } {
    const totalCount = targetPattern.length;
    const stepMatches = targetPattern.map((target, idx) => {
      const user = userSteps[idx];
      return user === target;
    });

    const correctCount = stepMatches.filter(Boolean).length;
    const matched =
      userSteps.length === totalCount && correctCount === totalCount;

    return {
      matched,
      stepMatches,
      correctCount,
      totalCount,
    };
  }

  /** Get timing tolerance window in ms for the active age band */
  getTimingToleranceMs(): number {
    return BEAT_TIMING_TOLERANCE_MS[this.ageBand];
  }
}
