import { describe, expect, it } from "vitest";
import { countDeadEnds } from "#src/systems/maze-system";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import { GT013Session } from "#src/templates/GT-013/session";
import GT013Template, {
  defaultInputModeForBand,
  GT013BaseSchema,
  GT013ContentSchema,
  GT013DifficultySchema,
} from "#src/templates/GT-013/template";

function getFixture<T>(fixtures: readonly T[], index: number): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Fixture at index ${index} not found`);
  }
  return item;
}

const CORRIDOR = getFixture(GT013_FIXTURES, 0);
const TRAP = getFixture(GT013_FIXTURES, 1);

function newSession(index = 0): GT013Session {
  const fixture = GT013_FIXTURES[index] ?? CORRIDOR;
  const session = new GT013Session(fixture.content, fixture.difficulty);
  session.setupEntities();
  return session;
}

describe("GT-013 — contract tìm đường mê cung (BR-MTB-06, BR-GTC-03)", () => {
  it("ba level mẫu parse được bằng cả hai contract", () => {
    for (const fixture of GT013_FIXTURES) {
      expect(GT013ContentSchema.safeParse(fixture.content).success).toBe(true);
      expect(GT013DifficultySchema.safeParse(fixture.difficulty).success).toBe(
        true
      );
    }
  });

  it("ca âm: không đường nào tới đích thì refine chặn", () => {
    const sealed = {
      ...CORRIDOR.content,
      grid: {
        ...CORRIDOR.content.grid,
        walls: [
          ...CORRIDOR.content.grid.walls,
          { row: 0, col: 0, side: "s" as const },
        ],
      },
    };
    expect(GT013BaseSchema.safeParse(sealed).success).toBe(true);
    expect(GT013ContentSchema.safeParse(sealed).success).toBe(false);
  });

  it("ca âm: ô bắt buộc nằm ngoài mọi đường hợp lệ thì refine chặn", () => {
    const unreachable = {
      ...TRAP.content,
      required_cells: [{ row: 2, col: 2 }],
    };
    expect(GT013BaseSchema.safeParse(unreachable).success).toBe(true);
    expect(GT013ContentSchema.safeParse(unreachable).success).toBe(false);
  });

  it("ca âm: ô đầu trùng ô đích thì refine chặn", () => {
    const degenerate = {
      ...CORRIDOR.content,
      grid: { ...CORRIDOR.content.grid, goal: { row: 0, col: 0 } },
    };
    expect(GT013ContentSchema.safeParse(degenerate).success).toBe(false);
  });

  it("ca âm: ô đích nằm ngoài lưới thì refine chặn", () => {
    const outside = {
      ...CORRIDOR.content,
      grid: { ...CORRIDOR.content.grid, goal: { row: 5, col: 5 } },
    };
    expect(GT013ContentSchema.safeParse(outside).success).toBe(false);
  });

  it("ca âm: input_mode lạ bị enum từ chối", () => {
    expect(
      GT013BaseSchema.safeParse({ ...CORRIDOR.content, input_mode: "swipe" })
        .success
    ).toBe(false);
  });

  it("BR-GTC-03: không key độ khó nào nằm trong content_contract", () => {
    const keys = Object.keys(GT013BaseSchema.shape);
    for (const forbidden of [
      "dead_end_count",
      "required_cell_count",
      "hint_after_ms",
      "allow_retry",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("khai đúng band, layout registry, và fallback tap", () => {
    expect(GT013Template.age_min).toBe(4);
    expect(GT013Template.age_max).toBe(6);
    expect(GT013Template.layouts).toEqual(["grid"]);
    expect(GT013Template.requires_tap_fallback).toBe(true);
    expect(GT013Template.mechanic).toBe("maze-route");
    expect(GT013Template.engine_session).toBe("MazeRouteSession");
  });

  it("giữ cả hai input_mode; mặc định draw cho 4-5 và arrows cho 5-6 (câu hỏi mở số 7)", () => {
    expect(defaultInputModeForBand("4-5")).toBe("draw");
    expect(defaultInputModeForBand("5-6")).toBe("arrows");
    expect(defaultInputModeForBand("3-4")).toBe("draw");
    expect(new Set(GT013_FIXTURES.map((f) => f.content.input_mode))).toEqual(
      new Set(["draw", "arrows"])
    );
  });

  it("dead_end_count của mỗi level mẫu khớp số ngõ cụt đo được trên chính lưới đó", () => {
    for (const fixture of GT013_FIXTURES) {
      expect(countDeadEnds(fixture.content.grid)).toBe(
        fixture.difficulty.dead_end_count
      );
      expect(fixture.content.required_cells).toHaveLength(
        fixture.difficulty.required_cell_count
      );
    }
  });
});

describe("GT-013 — kiểm soát lỗi tự thân (BR-MTB-14)", () => {
  it("nét vẽ dừng ở tường và không bị phạt", () => {
    const session = newSession(0);
    const result = session.validateAction({
      type: "draw_step",
      data: { row: 0, col: 1 },
    });
    expect(result.valid).toBe(false);
    expect(result.feedback).toBe("none");
    session.onPathStep({ row: 0, col: 1 });
    expect(session.getPath()).toEqual([{ row: 0, col: 0 }]);
  });

  it("đâm tường phát path_blocked, không phát event đúng-sai nào", () => {
    const session = newSession(0);
    session.onPathStep({ row: 0, col: 1 });
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).toEqual(["path_blocked"]);
  });

  it("kẹt trong ngõ cụt thì nét vẽ tự lùi về ngã ba, trẻ sửa trước khi hệ thống báo", () => {
    const session = newSession(1);
    session.onPathStep({ row: 0, col: 1 });
    session.onPathStep({ row: 1, col: 1 });
    session.onPathStep({ row: 2, col: 1 });
    const blocked = session.onPathStep({ row: 2, col: 2 });
    expect(blocked.retreated_to).toEqual({ row: 0, col: 1 });
    expect(session.getPath()).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names.filter((n) => n === "path_submitted")).toHaveLength(0);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("vẽ ngược lại ô trước đó gỡ một bước và không phát event mới", () => {
    const session = newSession(0);
    session.onPathStep({ row: 1, col: 0 });
    const before = session.getTelemetry().events.length;
    const result = session.onPathStep({ row: 0, col: 0 });
    expect(result.status).toBe("rewound");
    expect(session.getPath()).toHaveLength(1);
    expect(session.getTelemetry().events).toHaveLength(before);
  });

  it("nộp đường chưa tới đích thì nhắc nhẹ, không kết phiên", () => {
    const session = newSession(0);
    session.onPathStep({ row: 1, col: 0 });
    const result = session.validateAction({ type: "submit_path", data: {} });
    expect(result.feedback).toBe("amber_soft");
    session.onPathSubmitted();
    expect(session.checkWinCondition()).toBe(false);
  });
});

describe("GT-013 — journey một phiên đầy đủ (điều kiện nghiệm thu 5, 6, 13)", () => {
  it("vẽ hết hành lang rồi nộp thì thắng", () => {
    const session = newSession(0);
    for (const cell of [
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]) {
      expect(session.onPathStep(cell).status).toBe("moved");
    }
    expect(session.onPathSubmitted()).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).toEqual([
      "path_step",
      "path_step",
      "path_step",
      "path_step",
      "path_submitted",
      "game_completed",
    ]);
  });

  it("đường chạm-chạm thật: tap_cell đi đúng đường như draw_step (BR-MTB-05)", () => {
    const session = newSession(0);
    for (const cell of [
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]) {
      expect(
        session.validateAction({ type: "tap_cell", data: cell }).valid
      ).toBe(true);
      session.onPathStep(cell);
    }
    expect(session.onPathSubmitted()).toBe(true);
  });

  it("chế độ mũi tên đi từng bước theo hướng, ra ngoài lưới thì dừng", () => {
    const session = newSession(2);
    expect(session.getInputMode()).toBe("arrows");
    expect(session.onArrowPressed("s").blocked_reason).toBe("wall");
    expect(session.onArrowPressed("n").blocked_reason).toBe("outside");
    expect(session.onArrowPressed("e").status).toBe("moved");
  });

  it("level mẫu thu thập vật phẩm chỉ thắng khi qua đủ hai ô bắt buộc", () => {
    const session = newSession(2);
    for (const cell of [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ]) {
      session.onPathStep(cell);
    }
    expect(session.onPathSubmitted()).toBe(false);
    session.setupEntities();
    for (const cell of [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ]) {
      session.onPathStep(cell);
    }
    expect(session.onPathSubmitted()).toBe(true);
  });

  it("BR-GTC-09: checkWinCondition thuần — gọi 100 lần cho cùng kết quả", () => {
    const session = newSession(0);
    session.onPathStep({ row: 1, col: 0 });
    const first = session.checkWinCondition();
    for (let i = 0; i < 100; i++) {
      expect(session.checkWinCondition()).toBe(first);
    }
    expect(session.getPath()).toHaveLength(2);
  });

  it("setupEntities dựng lại phiên sạch", () => {
    const session = newSession(0);
    session.onPathStep({ row: 1, col: 0 });
    session.setupEntities();
    expect(session.getPath()).toEqual([{ row: 0, col: 0 }]);
    expect(session.getPathSequence()).toEqual(["0,0"]);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("hành động lạ bị bỏ qua, không sinh phản hồi", () => {
    const session = newSession(0);
    const result = session.validateAction({ type: "shake_device", data: {} });
    expect(result.valid).toBe(false);
    expect(result.feedback).toBe("none");
  });
});

describe("GT-013 — ba bậc gợi ý (điều kiện nghiệm thu 15)", () => {
  it("L1 chỉ trỏ đúng một ô kế tiếp trên đường còn lại", () => {
    const hint = newSession(0).getScaffoldHint(1);
    expect(hint?.cells).toEqual([{ row: 1, col: 0 }]);
    expect(hint?.ghost_hand).toBe(false);
  });

  it("L2 vẽ ghost hand hai bước đầu", () => {
    const hint = newSession(0).getScaffoldHint(2);
    expect(hint?.cells).toEqual([
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ]);
    expect(hint?.ghost_hand).toBe(true);
    expect(hint?.slow_repeat).toBe(false);
  });

  it("L3 vẽ chậm tới ngã ba tiếp theo rồi dừng", () => {
    const session = newSession(1);
    const hint = session.getScaffoldHint(3);
    expect(hint?.slow_repeat).toBe(true);
    expect(hint?.cells.at(-1)).toEqual({ row: 0, col: 1 });
  });

  it("gợi ý tính lại từ đầu nét vẽ hiện tại, không từ ô đầu", () => {
    const session = newSession(0);
    session.onPathStep({ row: 1, col: 0 });
    expect(session.getScaffoldHint(1)?.cells).toEqual([{ row: 2, col: 0 }]);
  });

  it("đã tới đích thì không còn gợi ý nào", () => {
    const session = newSession(0);
    for (const cell of [
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]) {
      session.onPathStep(cell);
    }
    expect(session.getScaffoldHint(1)).toBeNull();
  });
});
