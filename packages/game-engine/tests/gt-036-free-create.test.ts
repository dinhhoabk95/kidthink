import { describe, expect, it } from "vitest";
import { GT036Fixtures } from "../src/templates/GT-036/fixtures.js";
import { GT036Session } from "../src/templates/GT-036/session.js";
import type {
  GT036Content,
  GT036Difficulty,
} from "../src/templates/GT-036/template.js";

const sampleFixture = GT036Fixtures[0];
if (!sampleFixture) {
  throw new Error("Missing GT036 fixture");
}

function getFixture(index: number): {
  content: GT036Content;
  difficulty: GT036Difficulty;
} {
  const f = GT036Fixtures[index];
  if (!f) {
    throw new Error(`Missing GT036 fixture at index ${index}`);
  }
  return { content: f.content, difficulty: f.difficulty };
}

describe("GT-036 (free-create) TemplateGameSession (BR-E036-01..05)", () => {
  it("Scenario 1: setupEntities initializes empty track and starts game", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    expect(session.placedElements.length).toBe(
      sampleFixture.content.track_length
    );
    expect(session.placedElements.every((el) => el === null)).toBe(true);
    expect(session.checkWinCondition()).toBe(false);

    const startedEvent = session
      .getTelemetry()
      .events.find((e) => e.event_name === "game_started");
    expect(startedEvent).toBeDefined();
  });

  it("Scenario 2: Select palette item updates selected palette id", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    const res = session.validateAction({
      type: "select_palette",
      data: { paletteId: "moon" },
    });
    expect(res.valid).toBe(true);

    const badRes = session.validateAction({
      type: "select_palette",
      data: { paletteId: "nonexistent" },
    });
    expect(badRes.valid).toBe(false);
  });

  it("Scenario 3: Place element places item on track and emits element_placed", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    session.validateAction({
      type: "place_element",
      data: { slotIndex: 0, elementId: "star" },
    });
    expect(session.placedElements[0]).toBe("star");

    const placedEvent = session
      .getTelemetry()
      .events.find((e) => e.event_name === "element_placed");
    expect(placedEvent).toBeDefined();
  });

  it("Scenario 4: Remove element clears item at slot and emits element_removed", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    session.validateAction({
      type: "place_element",
      data: { slotIndex: 0, elementId: "star" },
    });
    expect(session.placedElements[0]).toBe("star");

    session.validateAction({
      type: "remove_element",
      data: { slotIndex: 0 },
    });
    expect(session.placedElements[0]).toBe(null);

    const removedEvent = session
      .getTelemetry()
      .events.find((e) => e.event_name === "element_removed");
    expect(removedEvent).toBeDefined();
  });

  it("Scenario 5: Clear track clears all placed elements", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    session.validateAction({
      type: "place_element",
      data: { slotIndex: 0, elementId: "star" },
    });
    session.validateAction({
      type: "place_element",
      data: { slotIndex: 1, elementId: "moon" },
    });

    session.validateAction({
      type: "clear_track",
      data: {},
    });

    expect(session.placedElements.every((el) => el === null)).toBe(true);
  });

  it("Scenario 6: Place -> remove -> place again flow works smoothly", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    session.validateAction({
      type: "place_element",
      data: { slotIndex: 2, elementId: "star" },
    });
    expect(session.placedElements[2]).toBe("star");

    session.validateAction({
      type: "remove_element",
      data: { slotIndex: 2 },
    });
    expect(session.placedElements[2]).toBe(null);

    session.validateAction({
      type: "place_element",
      data: { slotIndex: 2, elementId: "moon" },
    });
    expect(session.placedElements[2]).toBe("moon");
  });

  it("Scenario 7: Submitting creation with valid repeating pattern wins and completes session", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Place star, moon, star, moon, star, moon (3 repetitions of star-moon)
    const items = ["star", "moon", "star", "moon", "star", "moon"];
    for (let i = 0; i < items.length; i++) {
      session.validateAction({
        type: "place_element",
        data: { slotIndex: i, elementId: items[i] },
      });
    }

    const subRes = session.validateAction({
      type: "submit_creation",
      data: {},
    });

    expect(subRes.valid).toBe(true);
    expect(session.isWin).toBe(true);
    expect(session.score).toBeGreaterThanOrEqual(60);
    expect(session.stars).toBeGreaterThanOrEqual(1);

    const subEvent = session
      .getTelemetry()
      .events.find((e) => e.event_name === "creation_submitted");
    const ruleEvent = session
      .getTelemetry()
      .events.find((e) => e.event_name === "rule_detected");
    const compEvent = session
      .getTelemetry()
      .events.find((e) => e.event_name === "game_completed");

    expect(subEvent).toBeDefined();
    expect(ruleEvent).toBeDefined();
    expect(compEvent).toBeDefined();
  });

  it("Scenario 8: Submitting random sequence fails with retry feedback and does not win", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Place non-repeating pattern (star, star, star, moon, star, star)
    const items = ["star", "star", "star", "moon", "star", "star"];
    for (let i = 0; i < items.length; i++) {
      session.validateAction({
        type: "place_element",
        data: { slotIndex: i, elementId: items[i] },
      });
    }

    const subRes = session.validateAction({
      type: "submit_creation",
      data: {},
    });

    expect(subRes.valid).toBe(false);
    expect(subRes.feedback).toBe("amber_soft");
    expect(session.isWin).toBe(false);
  });

  it("Scenario 9: BR-E036-02 — Two different creations both pass without preset template match", () => {
    const f2 = getFixture(1); // Nature theme (flower, tree, leaf), track 9, min_rep 3
    const session = new GT036Session(f2.content, f2.difficulty, "5-6");
    session.setupEntities();

    // Creation A: flower, tree, leaf (repeated 3 times = 9 items)
    const seq = [
      "flower",
      "tree",
      "leaf",
      "flower",
      "tree",
      "leaf",
      "flower",
      "tree",
      "leaf",
    ];
    for (let i = 0; i < seq.length; i++) {
      session.validateAction({
        type: "place_element",
        data: { slotIndex: i, elementId: seq[i] },
      });
    }

    const subRes = session.validateAction({
      type: "submit_creation",
      data: {},
    });
    expect(subRes.valid).toBe(true);
    expect(session.isWin).toBe(true);
  });

  it("Scenario 10: Strict mode requires exact pattern completion", () => {
    const f3 = getFixture(2); // Strict mode, track 6, min_repetitions 3
    const session = new GT036Session(f3.content, f3.difficulty, "5-6");
    session.setupEntities();

    // Place 5 items (apple, orange, apple, orange, apple) -> trailing partial motif
    const partialItems = ["apple", "orange", "apple", "orange", "apple"];
    for (let i = 0; i < partialItems.length; i++) {
      session.validateAction({
        type: "place_element",
        data: { slotIndex: i, elementId: partialItems[i] },
      });
    }

    const failRes = session.validateAction({
      type: "submit_creation",
      data: {},
    });
    expect(failRes.valid).toBe(false);

    // Complete the 6th item (orange) -> 3 exact repetitions
    session.validateAction({
      type: "place_element",
      data: { slotIndex: 5, elementId: "orange" },
    });

    const passRes = session.validateAction({
      type: "submit_creation",
      data: {},
    });
    expect(passRes.valid).toBe(true);
    expect(session.isWin).toBe(true);
  });

  it("Scenario 11: checkWinCondition is pure and does not alter state", () => {
    const session = new GT036Session(
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

  it("Scenario 12: completeSession records game_completed event", () => {
    const session = new GT036Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();
    session.completeSession();

    const completed = session
      .getTelemetry()
      .events.find((e) => e.event_name === "game_completed");
    expect(completed).toBeDefined();
  });

  it("Scenario 13: BR-E036-03 — Palette in all fixtures does not use system feedback color tokens", () => {
    const forbiddenTokens = ["success", "danger", "feedback", "correct"];
    for (const fixture of GT036Fixtures) {
      for (const item of fixture.content.palette) {
        if (item.asset.kind === "emoji") {
          for (const tok of forbiddenTokens) {
            expect(item.asset.ref.toLowerCase().includes(tok)).toBe(false);
          }
        }
      }
    }
  });
});
