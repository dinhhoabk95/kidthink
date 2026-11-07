import { describe, expect, it } from "vitest";
import { SFX_RECIPES, type SFXType } from "#src/systems/sfx-engine";

/** Cue đặc trưng từng trò (Task #313 Phase 5A). */
const SIGNATURE_CUES: readonly SFXType[] = [
  "wood_tap",
  "drop_thud",
  "card_flip",
  "sparkle_find",
  "go_chime",
  "stop_hum",
  "star_collect",
];

describe("SFX_RECIPES — cue đặc trưng (BR-FBK-10, BR-ENG-16)", () => {
  for (const cue of SIGNATURE_CUES) {
    it(`${cue}: có nốt, thả ≥40ms, âm lượng dưới trần, dài vừa phải`, () => {
      const notes = SFX_RECIPES[cue];

      expect(notes.length).toBeGreaterThan(0);
      for (const note of notes) {
        expect(note.rampOutSec).toBeGreaterThanOrEqual(0.04);
        expect(note.volume).toBeLessThanOrEqual(0.2);
        expect(note.durationSec).toBeGreaterThanOrEqual(0.05);
        expect(note.delaySec + note.durationSec).toBeLessThanOrEqual(0.6);
      }
    });
  }

  it("đèn xanh đi lên, đèn đỏ trầm hơn hẳn — phân biệt được bằng tai", () => {
    const go = SFX_RECIPES.go_chime[0];
    const stop = SFX_RECIPES.stop_hum[0];

    expect(go?.glideTo?.freq).toBeGreaterThan(go?.freq ?? 0);
    expect(stop?.freq).toBeLessThan(go?.freq ?? 0);
  });

  it("star_collect đi lên theo từng nốt", () => {
    const freqs = SFX_RECIPES.star_collect.map((n) => n.freq);

    expect(freqs).toEqual([...freqs].sort((a, b) => a - b));
  });
});
