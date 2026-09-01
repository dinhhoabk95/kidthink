import { describe, expect, it } from "vitest";
import { GT034_FIXTURES } from "../src/templates/GT-034/fixtures.js";
import { GT034Session } from "../src/templates/GT-034/session.js";
import GT034Template, {
  GT034ContentSchema,
  hasRepeatingMotif,
} from "../src/templates/GT-034/template.js";

function getFixture(index: number) {
  const fixture = GT034_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture ${index} is missing`);
  }
  return fixture;
}

describe("GT-034 Gõ theo nhịp (beat-sequence) Contract & Session Tests", () => {
  const sampleFixture = getFixture(0);

  it("Scenario: Validates content schema on valid fixtures with repeating motif", () => {
    for (const fixture of GT034_FIXTURES) {
      const parsed = GT034ContentSchema.safeParse(fixture.content);
      expect(parsed.success).toBe(true);
    }
  });

  it("Scenario: hasRepeatingMotif correctly detects periodic patterns", () => {
    expect(hasRepeatingMotif(["a", "b", "a", "b"])).toBe(true);
    expect(hasRepeatingMotif(["a", "b", "c", "a", "b", "c"])).toBe(true);
    expect(hasRepeatingMotif(["a", null, "a", "a", null, "a"])).toBe(true);
    expect(hasRepeatingMotif(["a", "a", "b", "c"])).toBe(true);
  });

  it("Scenario: BR-E034-01 — Rejects purely random pattern with no repeating motif", () => {
    const invalidContent = {
      prompt: "Nghe và gõ lại nhé",
      instruments: [
        {
          instrument_id: "inst1",
          asset: { kind: "emoji" as const, ref: "EMJ-drum" },
          freq: 200,
        },
        {
          instrument_id: "inst2",
          asset: { kind: "emoji" as const, ref: "EMJ-bell" },
          freq: 400,
        },
        {
          instrument_id: "inst3",
          asset: { kind: "emoji" as const, ref: "EMJ-cymbal" },
          freq: 600,
        },
        {
          instrument_id: "inst4",
          asset: { kind: "emoji" as const, ref: "EMJ-gong" },
          freq: 800,
        },
      ],
      target_pattern: ["inst1", "inst2", "inst3", "inst4"], // all distinct!
      tempo_bpm: 80,
    };

    const parsed = GT034ContentSchema.safeParse(invalidContent);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("repeating motif");
    }
  });

  it("Scenario: BR-E034-02 — Rejects pattern referencing undeclared instrument ID", () => {
    const invalidContent = {
      prompt: "Nghe và gõ lại nhé",
      instruments: [
        {
          instrument_id: "drum",
          asset: { kind: "emoji" as const, ref: "EMJ-drum" },
          freq: 200,
        },
        {
          instrument_id: "bell",
          asset: { kind: "emoji" as const, ref: "EMJ-bell" },
          freq: 400,
        },
      ],
      target_pattern: ["drum", "bell", "ghost_inst", "drum"],
      tempo_bpm: 80,
    };

    const parsed = GT034ContentSchema.safeParse(invalidContent);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("instruments list");
    }
  });

  it("Scenario: BR-E034-05 — Template bans age bands 3-4 and 4-5", () => {
    expect(GT034Template.banned_age_bands).toContain("3-4");
    expect(GT034Template.banned_age_bands).toContain("4-5");
    expect(GT034Template.age_min).toBe(5);
    expect(GT034Template.age_max).toBe(6);
  });

  it("Scenario: Session initializes slots for track steps, instruments, and replay button", () => {
    const session = new GT034Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    const patternLen = sampleFixture.content.target_pattern.length;
    const instCount = sampleFixture.content.instruments.length;
    // pattern slots + instrument slots + 1 replay button slot
    expect(session.slots.length).toBe(patternLen + instCount + 1);
    expect(session.userSteps).toEqual([]);
    expect(session.replaysUsed).toBe(0);
    expect(session.isWin).toBe(false);
  });

  it("Scenario: Playing pattern records pattern_played and tracks replay limit", () => {
    const session = new GT034Session(
      sampleFixture.content,
      { ...sampleFixture.difficulty, replay_limit: 2 },
      "5-6"
    );
    session.setupEntities();

    // 1st replay
    const r1 = session.validateAction({ type: "play_pattern", data: {} });
    expect(r1.valid).toBe(true);
    expect(session.replaysUsed).toBe(1);

    // 2nd replay
    const r2 = session.validateAction({ type: "play_pattern", data: {} });
    expect(r2.valid).toBe(true);
    expect(session.replaysUsed).toBe(2);

    // 3rd replay (exceeds limit) -> ignored, reveals visual pattern
    const r3 = session.validateAction({ type: "play_pattern", data: {} });
    expect(r3.valid).toBe(false);
    expect(session.showVisualPattern).toBe(true);
  });

  it("Scenario: BR-E034-03 — Visual pattern mode enables play even when audio is muted", () => {
    const session = new GT034Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Trigger visual hint
    session.validateAction({ type: "show_hint", data: {} });
    expect(session.showVisualPattern).toBe(true);

    // Child taps correctly by following visual guide
    for (const step of sampleFixture.content.target_pattern) {
      session.validateAction({
        type: "tap_instrument",
        data: { instrument_id: step },
      });
    }

    expect(session.isWin).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("Scenario: Tapping beats, undoing, and completing sequence", () => {
    const session = new GT034Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Tap first step
    const r1 = session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });
    expect(r1.valid).toBe(true);
    expect(session.userSteps).toEqual(["drum"]);

    // Tap mistake
    session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });
    expect(session.userSteps).toEqual(["drum", "drum"]);

    // Undo mistake
    session.validateAction({ type: "undo_beat", data: {} });
    expect(session.userSteps).toEqual(["drum"]);

    // Tap rest of correct steps: cymbal, drum, cymbal
    session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "cymbal" },
    });
    session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });
    const lastResult = session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "cymbal" },
    });

    expect(lastResult.valid).toBe(true);
    expect(session.isWin).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("Scenario: Alternative flow: Child taps wrong sequence -> gets retry -> replays -> corrects", () => {
    const session = new GT034Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Tap 4 wrong steps
    session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });
    session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });
    session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });
    const wrongSubmit = session.validateAction({
      type: "tap_instrument",
      data: { instrument_id: "drum" },
    });

    expect(wrongSubmit.valid).toBe(false);
    expect(wrongSubmit.feedback).toBe("amber_soft");
    expect(session.isWin).toBe(false);

    // Child listens to replay
    session.validateAction({ type: "replay_pattern", data: {} });
    expect(session.replaysUsed).toBe(1);

    // Child clears sequence and taps correct pattern
    session.validateAction({ type: "clear_sequence", data: {} });
    expect(session.userSteps.length).toBe(0);

    for (const step of sampleFixture.content.target_pattern) {
      session.validateAction({
        type: "tap_instrument",
        data: { instrument_id: step },
      });
    }

    expect(session.isWin).toBe(true);
  });

  it("Scenario: checkWinCondition is pure and does not modify state", () => {
    const session = new GT034Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    expect(session.checkWinCondition()).toBe(false);
    for (let i = 0; i < 5; i++) {
      expect(session.checkWinCondition()).toBe(false);
    }
  });

  it("Scenario: Handles rests (null) in target pattern", () => {
    const restFixture = getFixture(2);
    const session = new GT034Session(
      restFixture.content,
      restFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    for (const step of restFixture.content.target_pattern) {
      if (step === null) {
        session.validateAction({ type: "tap_rest", data: {} });
      } else {
        session.validateAction({
          type: "tap_instrument",
          data: { instrument_id: step },
        });
      }
    }

    expect(session.isWin).toBe(true);
  });
});
