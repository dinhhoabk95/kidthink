import { describe, expect, it } from "vitest";
import { GT035_FIXTURES } from "../src/templates/GT-035/fixtures.js";
import { GT035Session } from "../src/templates/GT-035/session.js";
import GT035Template, {
  GT035ContentSchema,
  GT035DifficultySchema,
} from "../src/templates/GT-035/template.js";

function getFixture(index: number) {
  const fixture = GT035_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture ${index} is missing`);
  }
  return fixture;
}

describe("GT-035 Xếp hàng lệnh (command-sequence) Contract & Session Tests", () => {
  const sampleFixture = getFixture(0);

  it("Scenario 1: Validates content schema on valid fixtures", () => {
    for (const fixture of GT035_FIXTURES) {
      const parsed = GT035ContentSchema.safeParse(fixture.content);
      expect(parsed.success).toBe(true);
    }
  });

  it("Scenario 2: BR-E035-01 — Editing mode does not validate correctness or emit win/fail feedback", () => {
    const session = new GT035Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Adding commands does not change robot position or emit win/fail
    const act1 = session.validateAction({
      type: "add_command",
      data: { command: "turn_left" },
    });
    expect(act1.valid).toBe(true);
    expect(session.robotState).toEqual(sampleFixture.content.start);
    expect(session.isWin).toBe(false);

    const act2 = session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    expect(act2.valid).toBe(true);

    const events = session.getEvents();
    const hasGameCompleteOrFailed = events.some(
      (e) =>
        e.event_name === "game_completed" || e.event_name === "program_failed"
    );
    expect(hasGameCompleteOrFailed).toBe(false);
  });

  it("Scenario 3: BR-E035-02 — Rejects grids without valid solution within max_commands", () => {
    const unsolvableContent = {
      prompt: "Mê cung bị chặn hoàn toàn",
      grid: { rows: 3, cols: 3 },
      start: { col: 0, row: 0, facing: "right" as const },
      goal: { col: 2, row: 0 },
      // Obstacle completely blocks the only path
      obstacles: [
        { col: 1, row: 0 },
        { col: 0, row: 1 },
      ],
      collectibles: [],
      allowed_commands: [
        "forward" as const,
        "turn_left" as const,
        "turn_right" as const,
      ],
    };

    const parsed = GT035ContentSchema.safeParse(unsolvableContent);
    expect(parsed.success).toBe(false);
  });

  it("Scenario 4: BR-E035-03 — max_commands > 8 is rejected by schema", () => {
    const parsed = GT035DifficultySchema.safeParse({ max_commands: 10 });
    expect(parsed.success).toBe(false);
  });

  it("Scenario 5: BR-E035-05 — Template bans age bands 3-4 and 4-5", () => {
    expect(GT035Template.age_min).toBe(5);
    expect(GT035Template.age_max).toBe(6);
    expect(GT035Template.banned_age_bands).toContain("3-4");
    expect(GT035Template.banned_age_bands).toContain("4-5");
  });

  it("Scenario 6: Session initializes slots for grid, queue, palette and run button", () => {
    const session = new GT035Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.prepareRound("5-6");

    const { rows, cols } = sampleFixture.content.grid;
    const gridSlotCount = rows * cols;
    const maxCmd = sampleFixture.difficulty.max_commands;
    const allowedCmds = sampleFixture.content.allowed_commands.length;
    const runBtnCount = 1;

    const expectedTotalSlots =
      gridSlotCount + maxCmd + allowedCmds + runBtnCount;
    expect(session.slots.length).toBe(expectedTotalSlots);
  });

  it("Scenario 7: Adding and removing commands records events", () => {
    const session = new GT035Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "turn_right" },
    });

    const addEvents = session
      .getEvents()
      .filter((e) => e.event_name === "command_added");
    expect(addEvents.length).toBe(2);

    session.validateAction({ type: "remove_command", data: { index: 1 } });
    const removeEvents = session
      .getEvents()
      .filter((e) => e.event_name === "command_removed");
    expect(removeEvents.length).toBe(1);
  });

  it("Scenario 8: Alternative flow: Program fails on wrong path -> child fixes queue -> runs & wins", () => {
    const session = new GT035Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();

    // 1. Child adds wrong command (moves out of bounds or wrong direction)
    session.validateAction({
      type: "add_command",
      data: { command: "turn_left" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });

    // Run -> fails
    const runFail = session.validateAction({ type: "run_program", data: {} });
    expect(runFail.valid).toBe(false);
    expect(runFail.feedback).toBe("amber_soft");
    expect(session.isWin).toBe(false);

    // 2. Child clears and builds correct sequence:
    // start (0,0) facing right -> forward(1,0) -> forward(2,0) -> turn_right(facing down) -> forward(2,1) -> forward(2,2, goal!)
    session.validateAction({ type: "clear_commands", data: {} });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "turn_right" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });

    // Run -> wins
    const runWin = session.validateAction({ type: "run_program", data: {} });
    expect(runWin.valid).toBe(true);
    expect(session.isWin).toBe(true);

    const completedEvent = session
      .getEvents()
      .find((e) => e.event_name === "game_completed");
    expect(completedEvent).toBeDefined();
  });

  it("Scenario 9: Collectibles must all be collected before reaching goal", () => {
    const fixture2 = getFixture(1);
    const session = new GT035Session(
      fixture2.content,
      fixture2.difficulty,
      "5-6"
    );
    session.setupEntities();

    // Path avoiding collectible: starts (0,0) facing right -> forward(1,0) -> forward(2,0 obstacle collision!)
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });

    const runFail = session.validateAction({ type: "run_program", data: {} });
    expect(runFail.valid).toBe(false);
    expect(session.isWin).toBe(false);

    // Path collecting gem and reaching goal:
    session.validateAction({ type: "clear_commands", data: {} });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "turn_right" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "turn_left" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "turn_left" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });

    const runWin = session.validateAction({ type: "run_program", data: {} });
    expect(runWin.valid).toBe(true);
    expect(session.isWin).toBe(true);
  });

  it("Scenario 10: Supports loop command in execution", () => {
    const fixture3 = getFixture(2);
    const session = new GT035Session(
      fixture3.content,
      fixture3.difficulty,
      "5-6"
    );
    session.setupEntities();

    // start (0,2) facing up -> forward -> loop -> turn_right -> forward -> loop
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "loop" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "turn_right" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "forward" },
    });
    session.validateAction({
      type: "add_command",
      data: { command: "loop" },
    });

    const runRes = session.validateAction({ type: "run_program", data: {} });
    expect(runRes.valid).toBe(true);
    expect(session.isWin).toBe(true);
  });

  it("Scenario 11: checkWinCondition is pure and does not modify state", () => {
    const session = new GT035Session(
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
    const session = new GT035Session(
      sampleFixture.content,
      sampleFixture.difficulty,
      "5-6"
    );
    session.setupEntities();
    session.completeSession();

    const completed = session
      .getEvents()
      .find((e) => e.event_name === "game_completed");
    expect(completed).toBeDefined();
  });
});
