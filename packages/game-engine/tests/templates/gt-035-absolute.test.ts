import { describe, expect, it } from "vitest";
import { GT035Generator } from "#src/generators/gt035";
import { createRng } from "#src/rng/mulberry32";
import {
  executeProgram,
  findShortestSolution,
} from "#src/systems/command-queue-system";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035_STEP_MS, GT035Session } from "#src/templates/GT-035/session";
import {
  GT035ContentSchema,
  GT035DifficultySchema,
  isSolvableWithinMaxCommands,
} from "#src/templates/GT-035/template";

/**
 * Task #313 Phase 5 — GT-035: lệnh tuyệt đối ↑→↓← theo màn hình (`BR-E035-15`).
 */
const ABSOLUTE = ["go_up", "go_right", "go_down", "go_left"] as const;
const ABS_SET: ReadonlySet<string> = new Set(ABSOLUTE);

const absoluteFixtures = GT035_FIXTURES.filter((f) =>
  f.content.allowed_commands.some((c) => ABS_SET.has(c))
);

const ARROW_GLYPHS = ["⬆️", "➡️", "⬇️", "⬅️"];

const GRID = {
  rows: 3,
  cols: 3,
  goal: { col: 2, row: 2 },
  maxCommands: 8,
};

describe("GT-035 — trình chạy lệnh tuyệt đối (BR-E035-15)", () => {
  it("đi theo màn hình dù robot đang nhìn hướng khác", () => {
    for (const facing of ["up", "right", "down", "left"] as const) {
      const result = executeProgram(
        { ...GRID, start: { col: 0, row: 0, facing } },
        [{ type: "go_right" }, { type: "go_down" }]
      );
      expect(result.finalState).toMatchObject({
        col: 1,
        row: 1,
        facing: "down",
      });
    }
  });

  it("đi lên trái vào tường là hụt out_of_bounds", () => {
    const result = executeProgram(
      { ...GRID, start: { col: 0, row: 0, facing: "right" } },
      [{ type: "go_up" }]
    );
    expect(result.success).toBe(false);
    expect(result.failureReason).toBe("out_of_bounds");
  });

  it("bộ giải tìm được lời giải toàn lệnh tuyệt đối", () => {
    const solution = findShortestSolution(
      {
        ...GRID,
        start: { col: 0, row: 0, facing: "up" },
      },
      ABSOLUTE
    );
    expect(solution).not.toBeNull();
    expect(solution?.length).toBe(4);
    expect(solution?.every((c) => ABS_SET.has(c.type))).toBe(true);
  });
});

describe("GT-035 — contract không trộn hai hệ lệnh (BR-E035-15)", () => {
  const base = {
    prompt: "x",
    grid: { rows: 3, cols: 3 },
    start: { col: 0, row: 0, facing: "up" },
    goal: { col: 2, row: 2 },
  };

  it("chỉ lệnh tuyệt đối thì parse được", () => {
    expect(
      GT035ContentSchema.safeParse({
        ...base,
        allowed_commands: [...ABSOLUTE],
      }).success
    ).toBe(true);
  });

  it("trộn go_right với turn_left thì đỏ", () => {
    expect(
      GT035ContentSchema.safeParse({
        ...base,
        allowed_commands: ["go_right", "go_down", "turn_left"],
      }).success
    ).toBe(false);
  });

  it("lệnh tuyệt đối đi cùng loop thì đỏ (bậc dễ không có lặp)", () => {
    expect(
      GT035ContentSchema.safeParse({
        ...base,
        allowed_commands: [...ABSOLUTE, "loop"],
      }).success
    ).toBe(false);
  });
});

describe("GT-035 — fixture tuyệt đối", () => {
  it("có ít nhất hai fixture tuyệt đối", () => {
    expect(absoluteFixtures.length).toBeGreaterThanOrEqual(2);
  });

  it("mọi fixture tuyệt đối giải được trong max_commands và phải đổi hướng", () => {
    for (const f of absoluteFixtures) {
      expect(
        isSolvableWithinMaxCommands(f.content, f.difficulty.max_commands)
      ).toBe(true);
      const solution = findShortestSolution(
        {
          rows: f.content.grid.rows,
          cols: f.content.grid.cols,
          start: f.content.start,
          goal: f.content.goal,
          obstacles: f.content.obstacles,
          collectibles: f.content.collectibles,
          maxCommands: f.difficulty.max_commands,
        },
        f.content.allowed_commands
      );
      const dirs = new Set(
        (solution ?? []).map((c) => c.type).filter((t) => ABS_SET.has(t))
      );
      expect(dirs.size).toBeGreaterThanOrEqual(2);
    }
  });
});

function build(): GT035Session {
  const fixture = absoluteFixtures[0];
  if (!fixture) {
    throw new Error("Thiếu fixture tuyệt đối");
  }
  const session = new GT035Session(fixture.content, fixture.difficulty);
  session.prepareRound("5-6");
  return session;
}

describe("GT-035 — session lệnh tuyệt đối", () => {
  it("khay chỉ có mũi tên, tên chỉ đọc, hướng nhân vật theo thẻ cuối", () => {
    const session = build();
    const palette = session
      .getView()
      .entities.filter((e) => e.id.startsWith("pal_go_"));
    expect(palette.length).toBe(4);
    for (const e of palette) {
      expect(e.label).toBeUndefined();
      expect(ARROW_GLYPHS).toContain(e.glyph);
      expect(e.spokenLabel?.startsWith("Lệnh Đi ")).toBe(true);
    }
    session.commit({ type: "add_command", data: { command: "go_left" } });
    expect(session.getDisplayFacing()).toBe("left");
  });

  it("thẻ xoay vẽ mũi tên cong, không trùng hình mũi tên thẳng của go_*", () => {
    const fixture = GT035_FIXTURES.find(
      (f) => !f.content.allowed_commands.some((c) => ABS_SET.has(c))
    );
    if (!fixture) {
      throw new Error("Thiếu fixture tương đối");
    }
    const session = new GT035Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6");
    const entities = session.getView().entities;
    const turnGlyphs = ["pal_turn_left", "pal_turn_right"].map(
      (id) => entities.find((e) => e.id === id)?.glyph
    );
    expect(turnGlyphs).toEqual(["↩️", "↪️"]);
    for (const glyph of turnGlyphs) {
      expect(ARROW_GLYPHS).not.toContain(glyph);
    }
  });

  it("chạy từng nhịp tới đích rồi thắng ở update()", () => {
    const session = build();
    for (const command of ["go_right", "go_right", "go_down", "go_down"]) {
      session.commit({ type: "add_command", data: { command } });
    }
    session.dispatch({ type: "commit", timeMs: 1 });
    session.update(GT035_STEP_MS);
    expect(session.robotState).toMatchObject({ col: 1, row: 0 });
    for (let i = 0; i < 10 && !session.checkWinCondition(); i++) {
      session.update(GT035_STEP_MS);
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("gợi ý L1/L2 trỏ vào thẻ tuyệt đối có trong khay", () => {
    const session = build();
    const l2 = session.getHintTargetForLevel(2);
    expect(l2?.kind).toBe("slot");
  });
});

describe("GT-035 — bộ sinh chọn hệ lệnh theo bậc (BR-E035-15)", () => {
  function generate(seed: number, escalationStep: number) {
    const out = GT035Generator.generate({
      rng: createRng(seed),
      age_band: "5-6",
      theme: "space",
      vocabulary: { theme: "space", nouns: [] },
      escalation_step: escalationStep,
    });
    return {
      content: GT035ContentSchema.parse(out.content_pack),
      difficulty: GT035DifficultySchema.parse(out.difficulty_params),
    };
  }

  it("vòng đầu (bậc dễ) luôn tuyệt đối: giải được, không loop, đổi hướng", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { content, difficulty } = generate(seed, 0);
      const commands = content.allowed_commands;
      expect(commands.every((c) => ABS_SET.has(c))).toBe(true);
      expect(difficulty.allow_loop).toBe(false);
      expect(
        isSolvableWithinMaxCommands(content, difficulty.max_commands)
      ).toBe(true);
      const solution = findShortestSolution(
        {
          rows: content.grid.rows,
          cols: content.grid.cols,
          start: content.start,
          goal: content.goal,
          obstacles: content.obstacles,
          collectibles: content.collectibles,
          maxCommands: difficulty.max_commands,
        },
        commands
      );
      expect(
        new Set((solution ?? []).map((c) => c.type)).size
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("vòng leo thang (bậc khó) giữ lệnh tương đối", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { content } = generate(seed, 1);
      expect(content.allowed_commands.some((c) => ABS_SET.has(c))).toBe(false);
      expect(content.allowed_commands).toContain("turn_left");
    }
  });
});
