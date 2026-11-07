import { describe, expect, it } from "vitest";
import { SFX_RECIPES } from "#src/systems/sfx-engine";

/** Cue đặc trưng từng trò (Task #313 Phase 5A). */
/** Tám âm nền của bề mặt chơi — có recipe riêng, không thuộc luật cue đặc trưng. */
const BASE_CUES: ReadonlySet<string> = new Set([
  "tap",
  "pop_celebrate",
  "amber_soft",
  "level_celebrate",
  "longpress_exit",
  "start_chime",
  "whoosh_return",
  "snap_item",
]);

/** Mọi cue đặc trưng — kể cả cue thêm sau này, không phải khai tay. */
const SIGNATURE_CUES = Object.entries(SFX_RECIPES).filter(
  ([cue]) => !BASE_CUES.has(cue)
);

describe("SFX_RECIPES — cue đặc trưng (BR-FBK-10, BR-ENG-16)", () => {
  it("có đủ cue đặc trưng của các trò", () => {
    expect(SIGNATURE_CUES.length).toBeGreaterThanOrEqual(27);
  });

  for (const [cue, notes] of SIGNATURE_CUES) {
    it(`${cue}: có nốt, thả ≥40ms, âm lượng dưới trần, dài vừa phải`, () => {
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
