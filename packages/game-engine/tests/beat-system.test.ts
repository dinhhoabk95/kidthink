import { describe, expect, it } from "vitest";
import { type BeatInstrument, BeatSystem } from "#src/systems/beat-system";

describe("BeatSystem (Unit & Timing Tests)", () => {
  const sampleInstruments: BeatInstrument[] = [
    {
      instrument_id: "drum_low",
      freq: 220,
      type: "sine",
      name_vi: "Trống trầm",
    },
    {
      instrument_id: "drum_high",
      freq: 440,
      type: "triangle",
      name_vi: "Trống bổng",
    },
    { instrument_id: "cymbal", freq: 880, type: "triangle", name_vi: "Xèng" },
  ];

  it("initializes standalone without GameEngine context", () => {
    const system = new BeatSystem({
      tempo_bpm: 80,
      instruments: sampleInstruments,
    });
    expect(system).toBeDefined();
    expect(system.beatDurationSec).toBeCloseTo(60 / 80, 4);
  });

  it("clamps BPM safely between 60 and 120", () => {
    const lowBpm = new BeatSystem({
      tempo_bpm: 40,
      instruments: sampleInstruments,
    });
    expect(lowBpm.beatDurationSec).toBeCloseTo(60 / 60, 4);

    const highBpm = new BeatSystem({
      tempo_bpm: 180,
      instruments: sampleInstruments,
    });
    expect(highBpm.beatDurationSec).toBeCloseTo(60 / 120, 4);
  });

  it("computes delaySec precisely matching BPM and step index", () => {
    const system = new BeatSystem({
      tempo_bpm: 60, // 1 beat = 1.0s
      instruments: sampleInstruments,
    });

    const pattern = ["drum_low", "drum_high", "drum_low"];
    const recipes = system.buildNoteRecipes(pattern);

    expect(recipes.length).toBe(3);
    expect(recipes[0]?.delaySec).toBeCloseTo(0.0, 4);
    expect(recipes[1]?.delaySec).toBeCloseTo(1.0, 4);
    expect(recipes[2]?.delaySec).toBeCloseTo(2.0, 4);
  });

  it("skips rests (null steps) in note recipe generation", () => {
    const system = new BeatSystem({
      tempo_bpm: 60,
      instruments: sampleInstruments,
    });

    const pattern = ["drum_low", null, "drum_high"];
    const recipes = system.buildNoteRecipes(pattern);

    expect(recipes.length).toBe(2);
    expect(recipes[0]?.freq).toBe(220);
    expect(recipes[0]?.delaySec).toBeCloseTo(0.0, 4);
    expect(recipes[1]?.freq).toBe(440);
    expect(recipes[1]?.delaySec).toBeCloseTo(2.0, 4);
  });

  it("enforces BR-ENG-16 rampOutSec >= 40ms on all generated note recipes", () => {
    const system = new BeatSystem({
      tempo_bpm: 120, // fast tempo
      instruments: sampleInstruments,
    });

    const pattern = ["drum_low", "drum_high", "cymbal"];
    const recipes = system.buildNoteRecipes(pattern);

    for (const recipe of recipes) {
      expect(recipe.rampOutSec).toBeGreaterThanOrEqual(0.04);
      expect(recipe.volume).toBeLessThanOrEqual(0.2);
    }
  });

  it("evaluates matching sequence accurately", () => {
    const system = new BeatSystem({
      tempo_bpm: 80,
      instruments: sampleInstruments,
    });

    const target = ["drum_low", "drum_high", "drum_low", "drum_high"];
    const user = ["drum_low", "drum_high", "drum_low", "drum_high"];

    const evalResult = system.evaluateSequence(user, target);
    expect(evalResult.matched).toBe(true);
    expect(evalResult.correctCount).toBe(4);
    expect(evalResult.totalCount).toBe(4);
    expect(evalResult.stepMatches.every(Boolean)).toBe(true);
  });

  it("evaluates mismatching or incomplete sequence properly", () => {
    const system = new BeatSystem({
      tempo_bpm: 80,
      instruments: sampleInstruments,
    });

    const target = ["drum_low", "drum_high", "drum_low", "drum_high"];
    const wrongUser = ["drum_low", "cymbal", "drum_low", "drum_high"];

    const evalResult = system.evaluateSequence(wrongUser, target);
    expect(evalResult.matched).toBe(false);
    expect(evalResult.stepMatches[1]).toBe(false);
    expect(evalResult.correctCount).toBe(3);

    const partialUser = ["drum_low", "drum_high"];
    const partialResult = system.evaluateSequence(partialUser, target);
    expect(partialResult.matched).toBe(false);
  });

  it("provides adaptive timing tolerance window based on age band", () => {
    const system34 = new BeatSystem({
      tempo_bpm: 80,
      instruments: sampleInstruments,
      age_band: "3-4",
    });
    const system45 = new BeatSystem({
      tempo_bpm: 80,
      instruments: sampleInstruments,
      age_band: "4-5",
    });
    const system56 = new BeatSystem({
      tempo_bpm: 80,
      instruments: sampleInstruments,
      age_band: "5-6",
    });

    expect(system34.getTimingToleranceMs()).toBe(300);
    expect(system45.getTimingToleranceMs()).toBe(220);
    expect(system56.getTimingToleranceMs()).toBe(160);
  });
});
