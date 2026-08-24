import { describe, expect, it } from "vitest";
import {
  canMove,
  countDeadEnds,
  findPath,
  findRouteThrough,
  isDeadEnd,
  isJunction,
  isValidRoute,
  type MazeGrid,
  MazePathTracker,
  nearestJunctionIndex,
  openNeighbors,
  reachableCells,
} from "#src/systems/maze-system";

/**
 * `BR-MTB-15` — bộ test của `mazeSystem` **độc lập với khuôn**. File này chỉ nhập
 * từ `systems/maze-system.js`; nó không biết `GT-013` tồn tại. Lưới dùng ở đây là
 * lưới của riêng test, không phải fixture của khuôn.
 */

/** Hành lang một đường, không ngã rẽ: (0,0)→(1,0)→(2,0)→(2,1)→(2,2). */
const CORRIDOR: MazeGrid = {
  rows: 3,
  cols: 3,
  walls: [
    { row: 0, col: 0, side: "e" },
    { row: 1, col: 0, side: "e" },
    { row: 2, col: 1, side: "n" },
    { row: 2, col: 2, side: "n" },
  ],
  start: { row: 0, col: 0 },
  goal: { row: 2, col: 2 },
};

/** Một ngã ba ở (0,1) và một ngõ cụt bẫy ở (2,1). */
const TRAP: MazeGrid = {
  rows: 3,
  cols: 3,
  walls: [
    { row: 0, col: 0, side: "s" },
    { row: 0, col: 2, side: "s" },
    { row: 1, col: 0, side: "e" },
    { row: 1, col: 1, side: "e" },
    { row: 2, col: 0, side: "e" },
    { row: 2, col: 1, side: "e" },
    { row: 1, col: 0, side: "s" },
    { row: 1, col: 2, side: "s" },
  ],
  start: { row: 0, col: 0 },
  goal: { row: 0, col: 2 },
};

/** Mê cung phủ kín 4×4 — cây bao trùm, năm ngõ cụt. */
const SPANNING: MazeGrid = {
  rows: 4,
  cols: 4,
  walls: [
    { row: 1, col: 0, side: "e" },
    { row: 1, col: 1, side: "e" },
    { row: 0, col: 0, side: "s" },
    { row: 0, col: 3, side: "s" },
    { row: 1, col: 2, side: "s" },
    { row: 1, col: 3, side: "s" },
    { row: 2, col: 0, side: "s" },
    { row: 2, col: 1, side: "s" },
    { row: 2, col: 3, side: "s" },
  ],
  start: { row: 0, col: 0 },
  goal: { row: 3, col: 3 },
};

describe("mazeSystem — tường và nước đi (mục 7.4 spec khuôn)", () => {
  it("tường đối xứng: khai một phía chặn cả hai chiều", () => {
    expect(canMove(CORRIDOR, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(
      false
    );
    expect(canMove(CORRIDOR, { row: 0, col: 1 }, { row: 0, col: 0 })).toBe(
      false
    );
  });

  it("đi được sang ô kề khi không có tường", () => {
    expect(canMove(CORRIDOR, { row: 0, col: 0 }, { row: 1, col: 0 })).toBe(
      true
    );
  });

  it("từ chối ô ngoài lưới, ô không kề, và đường chéo", () => {
    expect(canMove(CORRIDOR, { row: 0, col: 0 }, { row: -1, col: 0 })).toBe(
      false
    );
    expect(canMove(CORRIDOR, { row: 0, col: 0 }, { row: 2, col: 0 })).toBe(
      false
    );
    expect(canMove(CORRIDOR, { row: 0, col: 0 }, { row: 1, col: 1 })).toBe(
      false
    );
    expect(canMove(CORRIDOR, { row: 0, col: 0 }, { row: 0, col: 0 })).toBe(
      false
    );
  });

  it("openNeighbors chỉ trả ô đi được", () => {
    expect(openNeighbors(CORRIDOR, { row: 0, col: 0 })).toEqual([
      { row: 1, col: 0 },
    ]);
    expect(openNeighbors(TRAP, { row: 0, col: 1 })).toHaveLength(3);
  });

  it("không hàm nào sửa lưới đầu vào", () => {
    const before = JSON.stringify(SPANNING);
    countDeadEnds(SPANNING);
    findPath(SPANNING, SPANNING.start, SPANNING.goal);
    openNeighbors(SPANNING, { row: 0, col: 1 });
    expect(JSON.stringify(SPANNING)).toBe(before);
  });
});

describe("mazeSystem — tìm đường", () => {
  it("hành lang một đường cho đúng năm ô từ đầu tới đích", () => {
    expect(findPath(CORRIDOR, CORRIDOR.start, CORRIDOR.goal)).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]);
  });

  it("trả null khi đích nằm trong vùng bị bịt kín", () => {
    expect(findPath(TRAP, TRAP.start, { row: 2, col: 2 })).toBeNull();
  });

  it("findRouteThrough đi qua đủ mọi ô bắt buộc", () => {
    const route = findRouteThrough(SPANNING, [
      { row: 2, col: 2 },
      { row: 1, col: 1 },
    ]);
    expect(route).not.toBeNull();
    const keys = (route ?? []).map((c) => `${c.row},${c.col}`);
    expect(keys).toContain("1,1");
    expect(keys).toContain("2,2");
    expect(keys.at(0)).toBe("0,0");
    expect(keys.at(-1)).toBe("3,3");
  });

  it("findRouteThrough trả null khi một ô bắt buộc không tới được", () => {
    expect(findRouteThrough(TRAP, [{ row: 2, col: 2 }])).toBeNull();
  });

  it("isValidRoute từ chối đường xuyên tường và đường không tới đích", () => {
    const good = findRouteThrough(CORRIDOR, []) ?? [];
    expect(isValidRoute(CORRIDOR, good, [])).toBe(true);
    expect(isValidRoute(CORRIDOR, good.slice(0, 3), [])).toBe(false);
    expect(
      isValidRoute(
        CORRIDOR,
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 1, col: 2 },
          { row: 2, col: 2 },
        ],
        []
      )
    ).toBe(false);
  });

  it("isValidRoute từ chối đường bỏ sót ô bắt buộc", () => {
    const route = findRouteThrough(SPANNING, []) ?? [];
    expect(isValidRoute(SPANNING, route, [{ row: 0, col: 3 }])).toBe(false);
  });
});

describe("mazeSystem — ngõ cụt và ngã ba", () => {
  it("hành lang không ngã rẽ có 0 ngõ cụt", () => {
    expect(countDeadEnds(CORRIDOR)).toBe(0);
    expect(isJunction(CORRIDOR, { row: 1, col: 0 })).toBe(false);
  });

  it("đếm ngõ cụt chỉ trên ô tới được, không tính vùng bị bịt", () => {
    expect(reachableCells(TRAP)).toHaveLength(5);
    expect(countDeadEnds(TRAP)).toBe(1);
    expect(isDeadEnd(TRAP, { row: 2, col: 1 })).toBe(true);
  });

  it("ô đầu và ô đích không tính là ngõ cụt dù chỉ có một lối", () => {
    expect(isDeadEnd(TRAP, TRAP.start)).toBe(false);
    expect(isDeadEnd(TRAP, TRAP.goal)).toBe(false);
  });

  it("mê cung phủ kín 4×4 có năm ngõ cụt", () => {
    expect(reachableCells(SPANNING)).toHaveLength(16);
    expect(countDeadEnds(SPANNING)).toBe(5);
  });

  it("ngã ba là ô có từ ba lối trở lên", () => {
    expect(isJunction(TRAP, { row: 0, col: 1 })).toBe(true);
    expect(isJunction(TRAP, { row: 1, col: 1 })).toBe(false);
  });

  it("nearestJunctionIndex lùi về ngã ba gần nhất trên chính nét vẽ", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ];
    expect(nearestJunctionIndex(TRAP, path)).toBe(1);
  });

  it("không ngã ba nào trên nét vẽ thì lùi về ô đầu", () => {
    const path = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ];
    expect(nearestJunctionIndex(CORRIDOR, path)).toBe(0);
  });
});

describe("mazeSystem — MazePathTracker, kiểm soát lỗi tự thân", () => {
  it("bắt đầu ở ô đầu và đi được một bước hợp lệ", () => {
    const tracker = new MazePathTracker(CORRIDOR);
    expect(tracker.getPath()).toEqual([{ row: 0, col: 0 }]);
    const res = tracker.step({ row: 1, col: 0 });
    expect(res.status).toBe("moved");
    expect(tracker.getPath()).toHaveLength(2);
  });

  it("nét vẽ dừng ở tường: đường không dài thêm, không phạt", () => {
    const tracker = new MazePathTracker(CORRIDOR);
    const res = tracker.step({ row: 0, col: 1 });
    expect(res.status).toBe("blocked");
    expect(res.blocked_reason).toBe("wall");
    expect(tracker.getPath()).toEqual([{ row: 0, col: 0 }]);
  });

  it("ô ngoài lưới và ô không kề bị chặn với đúng lý do", () => {
    const tracker = new MazePathTracker(CORRIDOR);
    expect(tracker.step({ row: -1, col: 0 }).blocked_reason).toBe("outside");
    expect(tracker.step({ row: 2, col: 2 }).blocked_reason).toBe(
      "not_adjacent"
    );
  });

  it("ngõ cụt tự nói nó là ngõ cụt: đâm tường trong ngõ cụt thì lùi về ngã ba", () => {
    const tracker = new MazePathTracker(TRAP);
    tracker.step({ row: 0, col: 1 });
    tracker.step({ row: 1, col: 1 });
    tracker.step({ row: 2, col: 1 });
    const res = tracker.step({ row: 2, col: 2 });
    expect(res.status).toBe("blocked");
    expect(res.retreated_to).toEqual({ row: 0, col: 1 });
    expect(tracker.getPath()).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it("đâm tường ngoài ngõ cụt thì không lùi", () => {
    const tracker = new MazePathTracker(TRAP);
    tracker.step({ row: 0, col: 1 });
    tracker.step({ row: 1, col: 1 });
    const res = tracker.step({ row: 1, col: 2 });
    expect(res.status).toBe("blocked");
    expect(res.retreated_to).toBeUndefined();
    expect(tracker.getPath()).toHaveLength(3);
  });

  it("vẽ ngược lại ô trước đó thì gỡ một bước, không thành bước mới", () => {
    const tracker = new MazePathTracker(CORRIDOR);
    tracker.step({ row: 1, col: 0 });
    const res = tracker.step({ row: 0, col: 0 });
    expect(res.status).toBe("rewound");
    expect(tracker.getPath()).toEqual([{ row: 0, col: 0 }]);
  });

  it("isComplete chỉ đúng khi tới đích và qua đủ ô bắt buộc", () => {
    const tracker = new MazePathTracker(SPANNING);
    for (const cell of [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
    ]) {
      tracker.step(cell);
    }
    expect(tracker.isComplete([])).toBe(false);
    tracker.step({ row: 3, col: 3 });
    expect(tracker.isComplete([])).toBe(true);
    expect(tracker.isComplete([{ row: 1, col: 1 }])).toBe(true);
    expect(tracker.isComplete([{ row: 0, col: 3 }])).toBe(false);
  });

  it("reset đưa nét vẽ về đúng ô đầu", () => {
    const tracker = new MazePathTracker(CORRIDOR);
    tracker.step({ row: 1, col: 0 });
    tracker.reset();
    expect(tracker.getPath()).toEqual([{ row: 0, col: 0 }]);
  });
});
