import { describe, expect, it } from "vitest";
import {
  CommandQueueSystem,
  executeProgram,
  expandCommands,
  findShortestSolution,
  moveForward,
  turnDirection,
} from "../src/systems/command-queue-system.js";

describe("CommandQueueSystem Unit Tests (WP188.1)", () => {
  it("Scenario 1: Correctly turns facing direction 90 degrees left and right", () => {
    expect(turnDirection("up", "turn_right")).toBe("right");
    expect(turnDirection("right", "turn_right")).toBe("down");
    expect(turnDirection("down", "turn_right")).toBe("left");
    expect(turnDirection("left", "turn_right")).toBe("up");

    expect(turnDirection("up", "turn_left")).toBe("left");
    expect(turnDirection("left", "turn_left")).toBe("down");
    expect(turnDirection("down", "turn_left")).toBe("right");
    expect(turnDirection("right", "turn_left")).toBe("up");
  });

  it("Scenario 2: Correctly computes forward coordinates", () => {
    expect(moveForward({ col: 2, row: 2, facing: "up" })).toEqual({
      col: 2,
      row: 1,
    });
    expect(moveForward({ col: 2, row: 2, facing: "down" })).toEqual({
      col: 2,
      row: 3,
    });
    expect(moveForward({ col: 2, row: 2, facing: "left" })).toEqual({
      col: 1,
      row: 2,
    });
    expect(moveForward({ col: 2, row: 2, facing: "right" })).toEqual({
      col: 3,
      row: 2,
    });
  });

  it("Scenario 3: Expands single loop correctly without nesting", () => {
    const { expanded, error } = expandCommands([
      { type: "forward" },
      { type: "loop", count: 2 },
    ]);
    expect(error).toBeUndefined();
    expect(expanded).toEqual(["forward", "forward"]);
  });

  it("Scenario 4: BR-E035-04 — Rejects consecutive or nested loop commands", () => {
    const { error: err1 } = expandCommands([
      { type: "forward" },
      { type: "loop", count: 2 },
      { type: "loop", count: 2 },
    ]);
    expect(err1).toContain("Cấm lồng");

    const { error: err2 } = expandCommands([{ type: "loop", count: 2 }]);
    expect(err2).toBeDefined();
  });

  it("Scenario 5: Executes straight valid path to goal", () => {
    const config = {
      rows: 4,
      cols: 4,
      start: { col: 0, row: 0, facing: "right" as const },
      goal: { col: 2, row: 0 },
    };

    const res = executeProgram(config, [
      { type: "forward" },
      { type: "forward" },
    ]);

    expect(res.success).toBe(true);
    expect(res.finalState).toEqual({ col: 2, row: 0, facing: "right" });
    expect(res.steps.length).toBe(2);
  });

  it("Scenario 6: Fails when robot walks out of grid bounds", () => {
    const config = {
      rows: 3,
      cols: 3,
      start: { col: 0, row: 0, facing: "up" as const },
      goal: { col: 2, row: 2 },
    };

    const res = executeProgram(config, [{ type: "forward" }]);
    expect(res.success).toBe(false);
    expect(res.failureReason).toBe("out_of_bounds");
    expect(res.failedAtStep).toBe(0);
  });

  it("Scenario 7: Fails when robot collides with an obstacle", () => {
    const config = {
      rows: 4,
      cols: 4,
      start: { col: 0, row: 0, facing: "right" as const },
      goal: { col: 3, row: 0 },
      obstacles: [{ col: 1, row: 0 }],
    };

    const res = executeProgram(config, [{ type: "forward" }]);
    expect(res.success).toBe(false);
    expect(res.failureReason).toBe("obstacle_collision");
    expect(res.failedAtStep).toBe(0);
  });

  it("Scenario 8: Requires collecting all collectibles before winning at goal", () => {
    const config = {
      rows: 3,
      cols: 3,
      start: { col: 0, row: 0, facing: "right" as const },
      goal: { col: 2, row: 0 },
      collectibles: [{ col: 1, row: 1, id: "star_1" }],
    };

    // Reaching goal directly without visiting (1, 1) fails with missing_collectibles
    const res1 = executeProgram(config, [
      { type: "forward" },
      { type: "forward" },
    ]);
    expect(res1.success).toBe(false);
    expect(res1.failureReason).toBe("missing_collectibles");

    // Path visiting star: forward -> turn_right -> forward -> turn_left -> turn_left -> forward -> turn_right -> forward
    // Or shorter: forward, turn_right, forward, turn_left, forward, turn_left, forward
    const res2 = executeProgram(config, [
      { type: "forward" },
      { type: "turn_right" },
      { type: "forward" }, // at (1, 1), collects star_1
      { type: "turn_left" },
      { type: "forward" }, // at (2, 1)
      { type: "turn_left" },
      { type: "forward" }, // at (2, 0) - goal!
    ]);
    expect(res2.success).toBe(true);
    expect(res2.collectedIds).toEqual(["star_1"]);
  });

  it("Scenario 9: CommandQueueSystem manages queue with max capacity", () => {
    const config = {
      rows: 4,
      cols: 4,
      start: { col: 0, row: 0, facing: "right" as const },
      goal: { col: 3, row: 0 },
      maxCommands: 3,
    };

    const cqs = new CommandQueueSystem(config);
    expect(cqs.addCommand({ type: "forward" })).toBe(true);
    expect(cqs.addCommand({ type: "forward" })).toBe(true);
    expect(cqs.addCommand({ type: "forward" })).toBe(true);
    expect(cqs.isFull).toBe(true);
    expect(cqs.addCommand({ type: "forward" })).toBe(false); // Max limit reached

    expect(cqs.commandCount).toBe(3);
    const removed = cqs.removeCommand(1);
    expect(removed).toEqual({ type: "forward" });
    expect(cqs.commandCount).toBe(2);
    expect(cqs.isFull).toBe(false);
  });

  it("Scenario 10: findShortestSolution resolves solvable maze grids", () => {
    const config = {
      rows: 3,
      cols: 3,
      start: { col: 0, row: 0, facing: "down" as const },
      goal: { col: 2, row: 2 },
      obstacles: [{ col: 0, row: 1 }],
      maxCommands: 8,
    };

    const solution = findShortestSolution(config);
    expect(solution).not.toBeNull();
    if (solution) {
      const res = executeProgram(config, solution);
      expect(res.success).toBe(true);
    }
  });
});
