import { describe, expect, it } from "vitest";
import { GT011Session } from "#src/index";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures.js";
import { colMatches, rowMatches } from "#src/templates/GT-011/matrix-rule";
import GT011Template, {
  GT011ContentSchema,
  GT011DifficultySchema,
} from "#src/templates/GT-011/template";

function getFixture<T>(fixtures: readonly T[], index: number): T {
  const item = fixtures[index];
  if (!item) {
    throw new Error(`Fixture at index ${index} not found`);
  }
  return item;
}

const LATIN_3X3 = getFixture(GT011_FIXTURES, 0);
const GRID_2X2 = getFixture(GT011_FIXTURES, 1);
const ROTATION = getFixture(GT011_FIXTURES, 2);

function newSession(index = 0): GT011Session {
  const fixture = GT011_FIXTURES[index] ?? LATIN_3X3;
  const session = new GT011Session(fixture.content, fixture.difficulty);
  session.setupEntities();
  return session;
}

describe("GT-011 — contract ma trận chọn hình (BR-MTB-06, BR-GTC-03)", () => {
  it("ba level mẫu parse được: 3×3 Latin, 2×2, biến thể xoay", () => {
    for (const fixture of GT011_FIXTURES) {
      expect(GT011ContentSchema.safeParse(fixture.content).success).toBe(true);
      expect(GT011DifficultySchema.safeParse(fixture.difficulty).success).toBe(
        true
      );
    }
    expect(GT011_FIXTURES.length).toBeGreaterThanOrEqual(3);
    expect(ROTATION.content.matrix.rows).toBe(3);
  });

  it("ca âm: hai ô trống thì refine chặn", () => {
    const cells = GRID_2X2.content.matrix.cells.map((cell, i) =>
      i === 0 ? { ...cell, asset: null } : cell
    );
    const result = GT011ContentSchema.safeParse({
      ...GRID_2X2.content,
      matrix: { ...GRID_2X2.content.matrix, cells },
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("đúng một ô trống");
  });

  it("ca âm: hai option đánh dấu đúng thì refine chặn", () => {
    const result = GT011ContentSchema.safeParse({
      ...GRID_2X2.content,
      options: GRID_2X2.content.options.map((o) => ({
        ...o,
        is_correct: true,
      })),
    });

    expect(result.success).toBe(false);
  });

  it("ca âm: nhãn is_correct không khớp quy luật thật thì refine chặn", () => {
    const result = GT011ContentSchema.safeParse({
      ...GRID_2X2.content,
      options: [
        {
          option_id: "o1",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: false,
        },
        {
          option_id: "o2",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: true,
        },
        {
          option_id: "o3",
          asset: { kind: "emoji", ref: "🍇" },
          is_correct: false,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toContain("không chỉ sai theo nhãn");
  });

  it("ca âm: số ô không bằng rows × cols thì refine chặn", () => {
    const result = GT011ContentSchema.safeParse({
      ...GRID_2X2.content,
      matrix: {
        ...GRID_2X2.content.matrix,
        cells: GRID_2X2.content.matrix.cells.slice(0, 3),
      },
    });

    expect(result.success).toBe(false);
  });

  it("khai đúng band, layout, mechanic và không fallback tap", () => {
    expect(GT011Template.age_min).toBe(5);
    expect(GT011Template.age_max).toBe(6);
    expect(GT011Template.layouts).toEqual(["matrix-3x3", "matrix-slot-grid"]);
    expect(GT011Template.requires_tap_fallback).toBe(false);
    expect(GT011Template.mechanic).toBe("matrix-choice");
  });
});

describe("GT-011 — kiểm soát lỗi tự thân (BR-MTB-14)", () => {
  it("đặt thử option đúng làm sáng cả hàng lẫn cột", () => {
    const session = newSession(0);

    const preview = session.onOptionPreviewed("o1");

    expect(preview?.row_matches).toBe(true);
    expect(preview?.col_matches).toBe(true);
    expect(session.getBlankCell()).toEqual({ row: 2, col: 2 });
  });

  it("đặt thử option sai thì hàng và cột tắt, phiên chưa thắng", () => {
    const session = newSession(0);

    const preview = session.onOptionPreviewed("o2");

    expect(preview?.row_matches).toBe(false);
    expect(preview?.col_matches).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("đặt thử không phát event đúng-sai nào — chỉ option_previewed", () => {
    const session = newSession(0);

    session.onOptionPreviewed("o2");
    session.onOptionPreviewed("o3");
    session.onOptionPreviewed("o1");

    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(new Set(names)).toEqual(new Set(["option_previewed"]));
  });

  it("quy luật tính từ dữ liệu ma trận, không từ nhãn is_correct", () => {
    const arrow = { kind: "emoji" as const, ref: "➡️" };
    const wrong = { kind: "emoji" as const, ref: "⬅️" };

    expect(rowMatches(ROTATION.content.matrix, arrow)).toBe(true);
    expect(colMatches(ROTATION.content.matrix, arrow)).toBe(true);
    expect(rowMatches(ROTATION.content.matrix, wrong)).toBe(false);
  });

  it("option lạ không tạo preview và không đổi trạng thái", () => {
    const session = newSession(0);

    expect(session.onOptionPreviewed("khong-ton-tai")).toBeNull();
    expect(session.getPreview()).toBeNull();
    expect(session.getTelemetry().events).toHaveLength(0);
  });
});

describe("GT-011 — journey một phiên đầy đủ (điều kiện nghiệm thu 6, 7, 13)", () => {
  it("thử hai option sai, tự thấy hàng cột không sáng, rồi chọn đúng và thắng", () => {
    const session = newSession(2);

    expect(session.onOptionPreviewed("o2")?.row_matches).toBe(false);
    expect(session.onOptionPreviewed("o4")?.col_matches).toBe(false);
    expect(session.onOptionPreviewed("o1")?.row_matches).toBe(true);

    session.onOptionSelected("o1");

    expect(session.checkWinCondition()).toBe(true);
    const names = session.getTelemetry().events.map((e) => e.event_name);
    expect(names).toContain("option_previewed");
    expect(names).toContain("option_selected");
    expect(names).toContain("game_completed");
  });

  it("BR-GTC-09: checkWinCondition thuần — gọi 100 lần cho cùng kết quả", () => {
    const session = newSession(1);
    session.onOptionPreviewed("o2");
    const previewBefore = session.getPreview();

    for (let i = 0; i < 100; i++) {
      expect(session.checkWinCondition()).toBe(false);
    }
    expect(session.getPreview()).toEqual(previewBefore);
  });

  it("setupEntities dựng lại phiên sạch", () => {
    const session = newSession(1);
    session.onOptionPreviewed("o1");
    session.onOptionSelected("o1");

    session.setupEntities();

    expect(session.getPreview()).toBeNull();
    expect(session.checkWinCondition()).toBe(false);
  });

  it("ma trận 2×2 của WB15 chơi hết bằng đúng một lượt chọn", () => {
    const session = new GT011Session(GRID_2X2.content, GRID_2X2.difficulty);
    session.setupEntities();

    session.onOptionSelected("o1");

    expect(session.checkWinCondition()).toBe(true);
    expect(LATIN_3X3.content.matrix.cols).toBe(3);
  });
});
